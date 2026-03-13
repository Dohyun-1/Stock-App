def build_portfolio_actions(backtest_results: list[dict]) -> list[dict]:
    if not backtest_results:
        return []
    positive = [r for r in backtest_results if r["sharpe"] >= 0.7]
    if not positive:
        positive = sorted(backtest_results, key=lambda x: x["sharpe"], reverse=True)[:1]
    weight = round(1.0 / len(positive), 4)
    return [
        {
            "ticker": r["strategy_id"],
            "target_weight": weight,
            "action": "buy",
            "urgency": "normal",
            "reason": "risk-adjusted candidate",
        }
        for r in positive
    ]
