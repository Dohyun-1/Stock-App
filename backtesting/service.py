def run_backtest(risk_reports: list[dict]) -> list[dict]:
    results: list[dict] = []
    for report in risk_reports:
        penalty = report["var_95"] * 5.0
        sharpe = max(0.2, 1.2 - penalty)
        results.append(
            {
                "strategy_id": report["idea_id"],
                "cagr": round(0.08 - penalty * 0.02, 4),
                "sharpe": round(sharpe, 4),
                "sortino": round(sharpe * 1.2, 4),
                "max_drawdown": round(report["max_drawdown_est"], 4),
                "turnover": 0.25,
                "benchmark_alpha": 0.01,
            }
        )
    return results
