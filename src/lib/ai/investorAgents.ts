import { AgentOpinion, EconomicEventInput, MarketSnapshot, PortfolioAnalysis, PortfolioInput } from "@/lib/ai/types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hasHighImpactMacro(events: EconomicEventInput[]): boolean {
  return events.some((e) => e.importance === "high");
}

export function generateAgentOpinions(
  market: MarketSnapshot[],
  portfolio: PortfolioInput,
  analysis: PortfolioAnalysis,
  events: EconomicEventInput[]
): AgentOpinion[] {
  const sortedHoldings = [...portfolio.holdings].sort((a, b) => b.weight - a.weight);
  const symbols = sortedHoldings.map((h) => h.symbol);
  const macroSensitive = hasHighImpactMacro(events);
  const opinions: AgentOpinion[] = [];

  for (const symbol of symbols) {
    const m = market.find((x) => x.symbol === symbol);
    if (!m) continue;

    const valueAction = m.momentum < -3 ? "buy" : m.marketCap > 200_000_000_000 ? "hold" : "buy";
    opinions.push({
      agentName: "Value Investor",
      symbol,
      action: valueAction,
      confidence: clamp(58 + (valueAction === "buy" ? 12 : 4), 45, 90),
      rationale: "밸류 투자 관점에서 과도한 단기 하락 또는 대형주 안전성을 반영했습니다.",
    });

    const macroAction = macroSensitive && analysis.volatilityRisk > 50 ? "sell" : "hold";
    opinions.push({
      agentName: "Macro Investor",
      symbol,
      action: macroAction,
      confidence: clamp(55 + (macroSensitive ? 15 : 5), 45, 88),
      rationale: "고중요도 경제 이벤트와 포트폴리오 변동성 노출을 반영했습니다.",
    });

    const growthAction = m.momentum > 1.5 ? "buy" : "hold";
    opinions.push({
      agentName: "Growth Investor",
      symbol,
      action: growthAction,
      confidence: clamp(52 + (growthAction === "buy" ? 18 : 6), 45, 92),
      rationale: "성장/모멘텀 지속 가능성 점수를 기준으로 추천했습니다.",
    });

    const momentumAction = m.momentum > 3 ? "buy" : m.momentum < -3 ? "sell" : "hold";
    opinions.push({
      agentName: "Momentum Trader",
      symbol,
      action: momentumAction,
      confidence: clamp(50 + Math.abs(m.momentum) * 6, 40, 95),
      rationale: "단기 추세 강도 기반의 전술적 시그널입니다.",
    });

    const riskAction = analysis.riskConcentration > 30 ? "sell" : "hold";
    opinions.push({
      agentName: "Risk Manager",
      symbol,
      action: riskAction,
      confidence: clamp(60 + (riskAction === "sell" ? 20 : 4), 50, 95),
      rationale: "집중도, 섹터 편향, 변동성 리스크를 기준으로 포지션 조정을 권고합니다.",
    });
  }

  return opinions;
}
