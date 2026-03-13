def run_debate(theses: list[dict]) -> list[dict]:
    # Placeholder scoring: aggregate by ticker.
    by_ticker: dict[str, list[dict]] = {}
    for thesis in theses:
        by_ticker.setdefault(thesis["ticker"], []).append(thesis)

    scored: list[dict] = []
    for ticker, tlist in by_ticker.items():
        avg_score = sum(float(t["score"]) for t in tlist) / max(len(tlist), 1)
        scored.append(
            {
                "ticker": ticker,
                "consensus_score": round(avg_score, 4),
                "disagreements": [],
                "messages": [f"Debate complete for {ticker}"],
            }
        )
    return scored
