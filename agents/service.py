from data.service import MarketRecord


def generate_agent_theses(snapshot: list[MarketRecord], philosophies: list[str]) -> list[dict]:
    theses: list[dict] = []
    for record in snapshot:
        for p in philosophies:
            direction = "long" if record.regime != "risk_off" else "neutral"
            score = 0.62 if direction == "long" else 0.5
            theses.append(
                {
                    "agent_id": f"{p}_agent",
                    "ticker": record.ticker,
                    "direction": direction,
                    "score": score,
                    "claims": [f"{p} view on {record.ticker}"],
                    "risks": ["macro shock", "earnings miss"],
                }
            )
    return theses
