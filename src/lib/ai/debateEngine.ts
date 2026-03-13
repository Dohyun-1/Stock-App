import { AgentOpinion, DebateResult } from "@/lib/ai/types";

function confidenceAvg(opinions: AgentOpinion[]): number {
  if (opinions.length === 0) return 0;
  return opinions.reduce((a, b) => a + b.confidence, 0) / opinions.length;
}

export function runDebate(opinions: AgentOpinion[]): DebateResult {
  const critiques: { from: string; to: string; symbol: string; challenge: string }[] = [];
  const defenses: { agent: string; symbol: string; defense: string }[] = [];

  for (const current of opinions) {
    const opponents = opinions.filter(
      (o) => o.symbol === current.symbol && o.agentName !== current.agentName && o.action !== current.action
    );
    for (const opp of opponents.slice(0, 1)) {
      critiques.push({
        from: current.agentName,
        to: opp.agentName,
        symbol: current.symbol,
        challenge: `${opp.action} 의견은 단기 노이즈에 과민할 수 있습니다. 리스크 대비 기대수익 재검토가 필요합니다.`,
      });
      defenses.push({
        agent: opp.agentName,
        symbol: opp.symbol,
        defense: `해당 종목의 현재 신호(${opp.action})는 제 전략 기준과 과거 패턴에 부합합니다.`,
      });
    }
  }

  const finalRecommendations = opinions.map((o) => {
    const support = opinions.filter((x) => x.symbol === o.symbol && x.action === o.action).length;
    const revisedConfidence = Math.min(95, o.confidence + support * 2);
    return { ...o, confidence: revisedConfidence };
  });

  const consensusScore = Math.round(Math.min(100, confidenceAvg(finalRecommendations)));

  return {
    initialOpinions: opinions,
    critiques,
    defenses,
    finalRecommendations,
    consensusScore,
  };
}
