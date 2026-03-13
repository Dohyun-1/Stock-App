from agents.service import generate_agent_theses
from backtesting.service import run_backtest
from core.models import Allocation, CommitteeDecision, RunRequest
from data.service import MarketRecord
from debate.service import run_debate
from portfolio.service import build_portfolio_actions
from risk.service import assess_risk


def make_committee_decision(request: RunRequest, snapshot: list[MarketRecord]) -> CommitteeDecision:
    theses = generate_agent_theses(snapshot, request.investor_philosophies)
    debate_scores = run_debate(theses)
    risk_reports = assess_risk(debate_scores)
    backtest_results = run_backtest(risk_reports)
    actions = build_portfolio_actions(backtest_results)

    allocations = [Allocation(ticker=a["ticker"], target_weight=float(a["target_weight"])) for a in actions]
    approved = len(allocations) > 0
    confidence = 0.75 if approved else 0.35
    rationale = "Approved diversified candidates after debate/risk/backtest checks." if approved else "No candidates passed policy."
    conditions = ["max_single_position<=20%", "rebalance_weekly"] if approved else ["hold_cash"]

    return CommitteeDecision(
        approved=approved,
        allocations=allocations,
        confidence=confidence,
        rationale=rationale,
        conditions=conditions,
    )


def run_committee_pipeline(request: RunRequest, snapshot: list[MarketRecord]) -> dict:
    theses = generate_agent_theses(snapshot, request.investor_philosophies)
    debate_scores = run_debate(theses)
    risk_reports = assess_risk(debate_scores)
    backtest_results = run_backtest(risk_reports)
    actions = build_portfolio_actions(backtest_results)
    decision = make_committee_decision(request, snapshot)
    return {
        "theses": theses,
        "debate_scores": debate_scores,
        "risk_reports": risk_reports,
        "backtest_results": backtest_results,
        "portfolio_actions": actions,
        "decision": decision,
    }
