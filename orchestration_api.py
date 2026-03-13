from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, HTTPException
from celery.result import AsyncResult

from core.models import (
    AgentOpinion,
    Asset,
    BacktestResult,
    CommitteeDecision,
    EconomicEvent,
    MarketData,
    Portfolio,
    RiskReport,
    RunRequest,
    RunStatus,
    TradeDecision,
)
from core.repository import repo
from worker import celery_app, run_pipeline

app = FastAPI(title="Multi-Agent Investment Platform", version="0.1.0")


@app.get("/healthz")
def health() -> dict:
    return {"status": "ok"}


@app.post("/runs/start", response_model=RunStatus)
def start_run(request: RunRequest) -> RunStatus:
    try:
        task = run_pipeline.delay(request.model_dump(mode="json"))
        return RunStatus(
            run_id=task.id,
            state="pending",
            stage="queued",
            detail={"task_id": task.id},
        )
    except Exception:
        # Fallback synchronous mode when Celery broker is unavailable.
        from core.orchestrator import orchestrator

        return orchestrator.start_run(request)


@app.get("/runs/{run_id}", response_model=RunStatus)
def get_run(run_id: str) -> RunStatus:
    result = AsyncResult(run_id, app=celery_app)
    if result.state == "PENDING":
        return RunStatus(run_id=run_id, state="pending", stage="queued")
    if result.state in {"RECEIVED", "STARTED", "RETRY"}:
        return RunStatus(run_id=run_id, state="running", stage="processing")
    if result.state == "FAILURE":
        return RunStatus(run_id=run_id, state="failed", stage="pipeline", detail={"error": str(result.result)})
    if result.state == "SUCCESS":
        payload = result.result or {}
        status_payload = payload.get("status")
        if isinstance(status_payload, dict):
            return RunStatus.model_validate(status_payload)
        return RunStatus(run_id=run_id, state="completed", stage="committee_decision")
    raise HTTPException(status_code=500, detail=f"unknown task state: {result.state}")


@app.get("/decision/{run_id}", response_model=CommitteeDecision)
def get_decision(run_id: str) -> CommitteeDecision:
    result = AsyncResult(run_id, app=celery_app)
    if result.state != "SUCCESS":
        raise HTTPException(status_code=409, detail=f"run not completed: {result.state}")
    payload = result.result or {}
    decision_payload = payload.get("decision")
    if not decision_payload:
        raise HTTPException(status_code=404, detail="decision not found")
    return CommitteeDecision.model_validate(decision_payload)


@app.get("/schemas")
def list_schema_examples() -> dict:
    return {
        "MarketData": MarketData.model_json_schema(),
        "Asset": Asset.model_json_schema(),
        "Portfolio": Portfolio.model_json_schema(),
        "EconomicEvent": EconomicEvent.model_json_schema(),
        "AgentOpinion": AgentOpinion.model_json_schema(),
        "RiskReport": RiskReport.model_json_schema(),
        "BacktestResult": BacktestResult.model_json_schema(),
        "TradeDecision": TradeDecision.model_json_schema(),
    }


@app.post("/market-data", response_model=MarketData)
def create_market_data(payload: MarketData) -> MarketData:
    repo.market_data[payload.id] = payload
    return payload


@app.get("/market-data", response_model=list[MarketData])
def get_market_data() -> list[MarketData]:
    return list(repo.market_data.values())


@app.post("/assets", response_model=Asset)
def create_asset(payload: Asset) -> Asset:
    repo.assets[payload.id] = payload
    return payload


@app.get("/assets", response_model=list[Asset])
def get_assets() -> list[Asset]:
    return list(repo.assets.values())


@app.post("/portfolios", response_model=Portfolio)
def create_portfolio(payload: Portfolio) -> Portfolio:
    repo.portfolios[payload.id] = payload
    return payload


@app.get("/portfolios", response_model=list[Portfolio])
def get_portfolios() -> list[Portfolio]:
    return list(repo.portfolios.values())


@app.post("/economic-events", response_model=EconomicEvent)
def create_economic_event(payload: EconomicEvent) -> EconomicEvent:
    repo.economic_events[payload.id] = payload
    return payload


@app.get("/economic-events", response_model=list[EconomicEvent])
def get_economic_events() -> list[EconomicEvent]:
    return list(repo.economic_events.values())


@app.get("/agent-opinions", response_model=list[AgentOpinion])
def get_agent_opinions(run_id: Optional[str] = None) -> list[AgentOpinion]:
    opinions = list(repo.agent_opinions.values())
    if run_id:
        opinions = [o for o in opinions if o.run_id == run_id]
    return opinions


@app.get("/risk-reports", response_model=list[RiskReport])
def get_risk_reports(run_id: Optional[str] = None) -> list[RiskReport]:
    reports = list(repo.risk_reports.values())
    if run_id:
        reports = [r for r in reports if r.run_id == run_id]
    return reports


@app.get("/backtest-results", response_model=list[BacktestResult])
def get_backtest_results(run_id: Optional[str] = None) -> list[BacktestResult]:
    results = list(repo.backtest_results.values())
    if run_id:
        results = [r for r in results if r.run_id == run_id]
    return results


@app.get("/trade-decisions", response_model=list[TradeDecision])
def get_trade_decisions(run_id: Optional[str] = None) -> list[TradeDecision]:
    decisions = list(repo.trade_decisions.values())
    if run_id:
        decisions = [d for d in decisions if d.run_id == run_id]
    return decisions
