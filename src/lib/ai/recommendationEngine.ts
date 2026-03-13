import { analyzePortfolio } from "@/lib/ai/portfolioAnalysis";
import { runDebate } from "@/lib/ai/debateEngine";
import { generateAgentOpinions } from "@/lib/ai/investorAgents";
import { EconomicEventInput, MarketSnapshot, PortfolioInput, RecommendationOutput } from "@/lib/ai/types";

function aggregateTrades(
  finalRecommendations: { symbol: string; action: "buy" | "sell" | "hold"; rationale: string }[]
) {
  const grouped = new Map<string, { buy: number; sell: number; hold: number; reason: string }>();
  for (const r of finalRecommendations) {
    const existing = grouped.get(r.symbol) || { buy: 0, sell: 0, hold: 0, reason: r.rationale };
    existing[r.action] += 1;
    existing.reason = r.rationale;
    grouped.set(r.symbol, existing);
  }

  return Array.from(grouped.entries()).map(([symbol, c]) => {
    const action = (["buy", "sell", "hold"] as const).reduce((best, curr) =>
      c[curr] > c[best] ? curr : best
    , "hold");
    return { symbol, action, reason: c.reason };
  });
}

function buildSymbolEvidence(
  finalRecommendations: { symbol: string; action: "buy" | "sell" | "hold"; agentName: string; confidence: number; rationale: string }[]
) {
  const bySymbol = new Map<
    string,
    { actionCount: Record<"buy" | "sell" | "hold", number>; opinions: { agent: string; action: "buy" | "sell" | "hold"; confidence: number; rationale: string }[] }
  >();

  for (const rec of finalRecommendations) {
    const current =
      bySymbol.get(rec.symbol) || {
        actionCount: { buy: 0, sell: 0, hold: 0 },
        opinions: [],
      };
    current.actionCount[rec.action] += 1;
    current.opinions.push({
      agent: rec.agentName,
      action: rec.action,
      confidence: rec.confidence,
      rationale: rec.rationale,
    });
    bySymbol.set(rec.symbol, current);
  }

  const evidence: Record<
    string,
    {
      final_action: "buy" | "sell" | "hold";
      why: string;
      agent_opinions: { agent: string; action: "buy" | "sell" | "hold"; confidence: number; rationale: string }[];
    }
  > = {};

  Array.from(bySymbol.entries()).forEach(([symbol, data]) => {
    const finalAction = (["buy", "sell", "hold"] as const).reduce((best, curr) =>
      data.actionCount[curr] > data.actionCount[best] ? curr : best
    , "hold");
    const actionCounts = Object.entries(data.actionCount)
      .filter(([, cnt]) => cnt > 0)
      .map(([action, cnt]) => `${action.toUpperCase()} ${cnt}표`)
      .join(", ");
    evidence[symbol] = {
      final_action: finalAction,
      why: `최종 액션은 ${finalAction.toUpperCase()}입니다. 에이전트 투표: ${actionCounts}.`,
      agent_opinions: data.opinions,
    };
  });

  return evidence;
}

export function buildRecommendations(
  market: MarketSnapshot[],
  portfolio: PortfolioInput,
  events: EconomicEventInput[]
): RecommendationOutput {
  const analysis = analyzePortfolio(portfolio);
  const opinions = generateAgentOpinions(market, portfolio, analysis, events);
  const debate = runDebate(opinions);
  const recommendedTrades = aggregateTrades(
    debate.finalRecommendations.map((x) => ({
      symbol: x.symbol,
      action: x.action,
      rationale: `${x.agentName}: ${x.rationale}`,
    }))
  );

  const symbolEvidence = buildSymbolEvidence(debate.finalRecommendations);

  const portfolioAdjustments: string[] = [];
  const riskAlerts = [...analysis.riskWarnings];

  if (analysis.riskConcentration > 30) {
    portfolioAdjustments.push("상위 비중 1~2개 종목의 목표 비중을 각각 3~7%p 축소하세요.");
  }
  if ((analysis.sectorExposure["Technology"] || 0) > 0.45) {
    portfolioAdjustments.push("기술 섹터 노출이 높습니다. 방어 섹터 및 배당 자산으로 분산하세요.");
  }
  if (events.some((e) => e.importance === "high")) {
    riskAlerts.push("고중요도 경제 이벤트가 임박했습니다. 신규 진입은 분할 매수 전략을 권장합니다.");
  }

  const perSymbolActions = new Map<string, Set<string>>();
  for (const rec of debate.finalRecommendations) {
    const set = perSymbolActions.get(rec.symbol) || new Set<string>();
    set.add(rec.action);
    perSymbolActions.set(rec.symbol, set);
  }
  const disagreementRatio =
    perSymbolActions.size > 0
      ? Array.from(perSymbolActions.values()).reduce((sum, s) => sum + Math.max(0, s.size - 1), 0) /
        (perSymbolActions.size * 2)
      : 0;
  const highImpactEventCount = events.filter((e) => e.importance === "high").length;
  const marketCoverage = market.length >= portfolio.holdings.length ? 1 : market.length / Math.max(1, portfolio.holdings.length);
  const avgMomentum =
    market.length > 0 ? market.reduce((sum, m) => sum + m.momentum, 0) / market.length : 0;
  const avgVolatility =
    market.length > 0 ? market.reduce((sum, m) => sum + m.volatility, 0) / market.length : 0;
  const marketQuality = Math.max(0, Math.min(100, 55 + avgMomentum * 4 - avgVolatility * 0.2));
  const portfolioScore = Math.round(
    Math.max(
      0,
      Math.min(100, analysis.portfolioScore * 0.65 + marketQuality * 0.35)
    )
  );
  const confidenceScore = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        35 +
          debate.consensusScore * 0.45 +
          (1 - disagreementRatio) * 25 +
          marketCoverage * 15 -
          highImpactEventCount * 6 -
          analysis.volatilityRisk * 0.15
      )
    )
  );
  // Ensure portfolio score and confidence score are semantically distinct.
  const separatedConfidence =
    Math.abs(confidenceScore - portfolioScore) < 4
      ? Math.max(0, Math.min(100, confidenceScore + (confidenceScore >= portfolioScore ? 4 : -4)))
      : confidenceScore;

  return {
    portfolio_score: portfolioScore,
    portfolio_score_max: 100,
    risk_warnings: analysis.riskWarnings,
    improvement_suggestions: analysis.improvementSuggestions,
    recommended_trades: recommendedTrades,
    portfolio_adjustments: portfolioAdjustments,
    risk_alerts: riskAlerts,
    confidence_score: separatedConfidence,
    confidence_score_max: 100,
    symbol_evidence: symbolEvidence,
    debate,
  };
}
