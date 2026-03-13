from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class SchemaBase(BaseModel):
    schema_version: str = Field(default="1.0.0", description="Schema version.")
    id: str = Field(default_factory=lambda: str(uuid4()), description="Unique object identifier.")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Object timestamp in ISO-8601 UTC.",
    )


class MessageEnvelope(BaseModel):
    type: str
    version: str = "1.0.0"
    producer: str
    run_id: str
    trace_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload: dict[str, Any]


class RunRequest(BaseModel):
    universe: list[str]
    objective: str = "risk_adjusted_return"
    horizon_days: int = 90
    constraints: dict[str, Any] = Field(default_factory=dict)
    investor_philosophies: list[str] = Field(default_factory=lambda: ["value", "growth", "macro", "quant"])


class RunStatus(BaseModel):
    run_id: str
    state: Literal["pending", "running", "completed", "failed"]
    stage: str
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    detail: dict[str, Any] = Field(default_factory=dict)


class Allocation(BaseModel):
    ticker: str
    target_weight: float


class CommitteeDecision(BaseModel):
    approved: bool
    allocations: list[Allocation]
    confidence: float
    rationale: str
    conditions: list[str] = Field(default_factory=list)


class MarketData(SchemaBase):
    symbol: str = Field(description="Canonical asset symbol.")
    asset_type: Literal["equity", "etf", "fx", "index", "commodity", "bond", "crypto"] = Field(
        description="Asset class type."
    )
    price: float = Field(description="Latest traded/mark price.")
    trend: Literal["strong_down", "down", "flat", "up", "strong_up"] = Field(description="Trend regime.")
    volatility: float = Field(description="Annualized volatility (decimal).")
    momentum: float = Field(description="Normalized momentum score.")
    liquidity: float = Field(description="Normalized liquidity score (0-1).")
    volume_1d: float = Field(default=0.0, description="1-day traded volume.")
    currency: str = Field(default="USD", description="Quote currency code.")


class Asset(SchemaBase):
    symbol: str = Field(description="Canonical trading symbol.")
    name: str = Field(description="Display asset name.")
    asset_type: Literal["equity", "etf", "fx", "index", "commodity", "bond", "crypto"] = Field(
        description="Asset class."
    )
    currency: str = Field(description="Trading currency code.")
    country: str = Field(description="Country of listing/risk.")
    sector: str = Field(description="Sector classification.")
    exchange: str = Field(default="", description="Primary exchange code.")
    is_tradable: bool = Field(default=True, description="Whether currently tradable.")
    market_cap: float = Field(default=0.0, description="Market capitalization in USD.")


class PortfolioHolding(BaseModel):
    symbol: str = Field(description="Holding symbol.")
    quantity: float = Field(description="Position quantity.")
    market_value: float = Field(description="Market value in base currency.")
    weight: float = Field(description="Position weight in portfolio (decimal).")


class Portfolio(SchemaBase):
    base_currency: str = Field(default="USD", description="Portfolio base currency.")
    aum: float = Field(description="Assets under management in base currency.")
    holdings: list[PortfolioHolding] = Field(default_factory=list, description="Portfolio holdings.")
    weights: dict[str, float] = Field(default_factory=dict, description="Symbol to weight map.")
    sector_exposure: dict[str, float] = Field(default_factory=dict, description="Sector exposure map.")
    risk_score: float = Field(default=0.0, description="Composite risk score (0-1).")


class EconomicEvent(SchemaBase):
    event_type: str = Field(description="Event type, e.g., CPI/FOMC/NFP.")
    country: str = Field(description="Country/region tag.")
    scheduled_at: str = Field(description="Scheduled datetime (ISO-8601 UTC).")
    importance: Literal["low", "medium", "high", "critical"] = Field(description="Event importance level.")
    actual: Optional[float] = Field(default=None, description="Actual released value.")
    forecast: Optional[float] = Field(default=None, description="Consensus forecast value.")
    previous: Optional[float] = Field(default=None, description="Previous released value.")
    surprise: Optional[float] = Field(default=None, description="Standardized surprise score.")


class AgentOpinion(SchemaBase):
    run_id: str = Field(description="Pipeline run identifier.")
    agent_id: str = Field(description="Agent identifier.")
    philosophy: Literal["value", "growth", "macro", "quant", "event_driven", "sentiment"] = Field(
        description="Investment philosophy."
    )
    target_symbol: str = Field(description="Target symbol.")
    stance: Literal["strong_buy", "buy", "hold", "sell", "strong_sell"] = Field(description="Agent stance.")
    confidence: float = Field(description="Confidence score 0-1.")
    horizon_days: int = Field(description="Holding horizon in days.")
    thesis: list[str] = Field(default_factory=list, description="Key claims.")
    risk_flags: list[str] = Field(default_factory=list, description="Risk flags.")


class RiskReport(SchemaBase):
    run_id: str = Field(description="Pipeline run identifier.")
    portfolio_id: str = Field(description="Portfolio identifier.")
    var_95: float = Field(description="VaR at 95% in base currency.")
    cvar_95: float = Field(description="CVaR at 95% in base currency.")
    max_drawdown_estimate: float = Field(description="Estimated max drawdown (decimal).")
    risk_score: float = Field(description="Composite normalized risk score.")
    limit_pass: bool = Field(description="Whether all limits pass.")
    violations: list[str] = Field(default_factory=list, description="Risk limit violations.")


class BacktestResult(SchemaBase):
    strategy_id: str = Field(description="Strategy identifier.")
    run_id: str = Field(description="Pipeline run identifier.")
    start_date: str = Field(description="Backtest start date (YYYY-MM-DD).")
    end_date: str = Field(description="Backtest end date (YYYY-MM-DD).")
    cagr: float = Field(description="Compound annual growth rate.")
    sharpe: float = Field(description="Sharpe ratio.")
    max_drawdown: float = Field(description="Maximum drawdown.")
    total_return: float = Field(description="Total return over period.")
    turnover: float = Field(default=0.0, description="Average turnover.")


class TradeLeg(BaseModel):
    symbol: str = Field(description="Trade symbol.")
    action: Literal["buy", "sell", "hold", "rebalance"] = Field(description="Trade action.")
    target_weight: float = Field(description="Target portfolio weight.")
    reason: str = Field(default="", description="Trade rationale.")


class TradeDecision(SchemaBase):
    run_id: str = Field(description="Pipeline run identifier.")
    portfolio_id: str = Field(description="Portfolio identifier.")
    approved: bool = Field(description="Decision approved flag.")
    confidence: float = Field(description="Decision confidence 0-1.")
    rationale: str = Field(description="Decision-level rationale.")
    decisions: list[TradeLeg] = Field(default_factory=list, description="Symbol-level trade actions.")
