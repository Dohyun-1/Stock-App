def assess_risk(debate_scores: list[dict]) -> list[dict]:
    reports: list[dict] = []
    for idea in debate_scores:
        var_95 = 0.03 + (1.0 - float(idea["consensus_score"])) * 0.04
        reports.append(
            {
                "idea_id": idea["ticker"],
                "var_95": round(var_95, 4),
                "cvar_95": round(var_95 * 1.3, 4),
                "max_drawdown_est": round(var_95 * 4.0, 4),
                "limit_pass": var_95 < 0.08,
                "violations": [] if var_95 < 0.08 else ["var_limit"],
            }
        )
    return reports
