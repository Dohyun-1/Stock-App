from datetime import datetime, timezone
from typing import Optional, Tuple
from uuid import uuid4

from committee.service import run_committee_pipeline
from core.event_bus import EventBus
from core.models import (
    AgentOpinion,
    BacktestResult,
    CommitteeDecision,
    MessageEnvelope,
    RiskReport,
    RunRequest,
    RunStatus,
    TradeDecision,
    TradeLeg,
)
from core.policy_engine import PolicyEngine
from core.repository import repo
from data.service import build_market_snapshot


class Orchestrator:
    def __init__(self) -> None:
        self._runs: dict[str, RunStatus] = {}
        self._decisions: dict[str, CommitteeDecision] = {}
        self._event_bus = EventBus()
        self._policy = PolicyEngine()

    def start_run(self, request: RunRequest) -> RunStatus:
        run_id = str(uuid4())
        status, decision = self.execute_run(request=request, run_id=run_id)
        if decision:
            self._decisions[run_id] = decision
        self._runs[run_id] = status
        return status

    def execute_run(self, request: RunRequest, run_id: str) -> Tuple[RunStatus, Optional[CommitteeDecision]]:
        self._runs[run_id] = RunStatus(run_id=run_id, state="running", stage="data_ingestion")
        snapshot = build_market_snapshot(request.universe, request.horizon_days)
        self._event_bus.publish(
            MessageEnvelope(
                type="market_snapshot",
                producer="data",
                run_id=run_id,
                payload={"universe": request.universe, "snapshot_size": len(snapshot)},
            )
        )

        pipeline = run_committee_pipeline(request, snapshot)
        decision = pipeline["decision"]
        ok, reason = self._policy.validate_decision(decision)
        if not ok:
            failed = RunStatus(
                run_id=run_id,
                state="failed",
                stage="policy_validation",
                detail={"reason": reason},
                updated_at=datetime.now(timezone.utc).isoformat(),
            )
            return failed, None

        # Persist pipeline artifacts into repositories for API interoperability.
        for thesis in pipeline["theses"]:
            opinion = AgentOpinion(
                run_id=run_id,
                agent_id=thesis["agent_id"],
                philosophy=thesis["agent_id"].replace("_agent", ""),
                target_symbol=thesis["ticker"],
                stance="buy" if thesis["direction"] == "long" else "hold",
                confidence=float(thesis["score"]),
                horizon_days=request.horizon_days,
                thesis=list(thesis["claims"]),
                risk_flags=list(thesis["risks"]),
            )
            repo.agent_opinions[opinion.id] = opinion

        for rr in pipeline["risk_reports"]:
            report = RiskReport(
                run_id=run_id,
                portfolio_id="default",
                var_95=float(rr["var_95"]),
                cvar_95=float(rr["cvar_95"]),
                max_drawdown_estimate=float(rr["max_drawdown_est"]),
                risk_score=min(1.0, float(rr["var_95"]) / 0.1),
                limit_pass=bool(rr["limit_pass"]),
                violations=list(rr["violations"]),
            )
            repo.risk_reports[report.id] = report

        for bt in pipeline["backtest_results"]:
            result = BacktestResult(
                strategy_id=bt["strategy_id"],
                run_id=run_id,
                start_date="2015-01-01",
                end_date=datetime.now(timezone.utc).date().isoformat(),
                cagr=float(bt["cagr"]),
                sharpe=float(bt["sharpe"]),
                max_drawdown=float(bt["max_drawdown"]),
                total_return=float(bt["cagr"]) * 5.0,
                turnover=float(bt["turnover"]),
            )
            repo.backtest_results[result.id] = result

        td = TradeDecision(
            run_id=run_id,
            portfolio_id="default",
            approved=decision.approved,
            confidence=decision.confidence,
            rationale=decision.rationale,
            decisions=[
                TradeLeg(
                    symbol=a.ticker,
                    action="buy",
                    target_weight=float(a.target_weight),
                    reason="committee-approved allocation",
                )
                for a in decision.allocations
            ],
        )
        repo.trade_decisions[td.id] = td

        completed = RunStatus(
            run_id=run_id,
            state="completed",
            stage="committee_decision",
            detail={"approved": decision.approved, "confidence": decision.confidence},
            updated_at=datetime.now(timezone.utc).isoformat(),
        )
        return completed, decision

    def get_run(self, run_id: str) -> Optional[RunStatus]:
        return self._runs.get(run_id)

    def get_decision(self, run_id: str) -> Optional[CommitteeDecision]:
        return self._decisions.get(run_id)

    def get_events(self, run_id: str) -> list[dict]:
        return self._event_bus.pull_run_events(run_id)


orchestrator = Orchestrator()
