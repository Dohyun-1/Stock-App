from dataclasses import dataclass


@dataclass
class ModuleSpec:
    name: str
    input_schema: str
    output_schema: str
    responsibility: str


MODULE_REGISTRY: dict[str, ModuleSpec] = {
    "data": ModuleSpec("data", "market_event.schema.json", "signal.schema.json", "Ingest and normalize data"),
    "agents": ModuleSpec("agents", "signal.schema.json", "thesis.schema.json", "Generate philosophy-specific theses"),
    "debate": ModuleSpec("debate", "thesis.schema.json", "debate_message.schema.json", "Debate and score arguments"),
    "risk": ModuleSpec("risk", "debate_message.schema.json", "risk_report.schema.json", "Stress test and risk-limit checks"),
    "backtesting": ModuleSpec("backtesting", "risk_report.schema.json", "backtest_result.schema.json", "Historical simulation"),
    "portfolio": ModuleSpec("portfolio", "backtest_result.schema.json", "portfolio_action.schema.json", "Optimize allocations"),
    "committee": ModuleSpec("committee", "portfolio_action.schema.json", "committee_decision.schema.json", "Final decision"),
}
