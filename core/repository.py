from __future__ import annotations

from typing import Dict, List, TypeVar

from core.models import (
    AgentOpinion,
    Asset,
    BacktestResult,
    EconomicEvent,
    MarketData,
    Portfolio,
    RiskReport,
    TradeDecision,
)

T = TypeVar("T")


class InMemoryRepository:
    def __init__(self) -> None:
        self.market_data: Dict[str, MarketData] = {}
        self.assets: Dict[str, Asset] = {}
        self.portfolios: Dict[str, Portfolio] = {}
        self.economic_events: Dict[str, EconomicEvent] = {}
        self.agent_opinions: Dict[str, AgentOpinion] = {}
        self.risk_reports: Dict[str, RiskReport] = {}
        self.backtest_results: Dict[str, BacktestResult] = {}
        self.trade_decisions: Dict[str, TradeDecision] = {}

    @staticmethod
    def _all(store: Dict[str, T]) -> List[T]:
        return list(store.values())


repo = InMemoryRepository()
