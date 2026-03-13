import { PortfolioAnalysis, PortfolioInput } from "@/lib/ai/types";

export function analyzePortfolio(input: PortfolioInput): PortfolioAnalysis {
  const total = input.holdings.reduce((sum, h) => sum + Math.max(0, h.value), 0) || 1;
  const normalized = input.holdings.map((h) => ({
    ...h,
    weight: Math.max(0, h.value / total),
  }));

  const sectorExposure: Record<string, number> = {};
  for (const h of normalized) {
    sectorExposure[h.sector] = (sectorExposure[h.sector] || 0) + h.weight;
  }

  const hhi = normalized.reduce((sum, h) => sum + h.weight * h.weight, 0);
  const diversification = Math.max(0, Math.min(100, Math.round((1 - hhi) * 120)));
  const riskConcentration = Math.round(hhi * 100);

  const techExposure = sectorExposure["Technology"] || 0;
  const volatilityRisk = Math.round(Math.min(100, riskConcentration * 0.6 + techExposure * 45));
  const portfolioScore = Math.max(
    0,
    Math.min(100, Math.round(100 - riskConcentration * 0.5 - volatilityRisk * 0.35 + diversification * 0.25))
  );

  const riskWarnings: string[] = [];
  const improvementSuggestions: string[] = [];

  if (riskConcentration > 30) {
    riskWarnings.push("보유 자산 집중도가 높습니다. 단일 종목 변동성이 전체 수익률에 크게 반영될 수 있습니다.");
    improvementSuggestions.push("상위 비중 종목 일부를 줄이고 방어적 섹터를 추가하세요.");
  }
  if (Object.keys(sectorExposure).length <= 2) {
    riskWarnings.push("섹터 분산이 부족합니다.");
    improvementSuggestions.push("기술주 외 헬스케어, 필수소비재, 금융 섹터를 균형 있게 편입하세요.");
  }
  if (volatilityRisk > 55) {
    riskWarnings.push("예상 변동성 리스크가 높습니다.");
    improvementSuggestions.push("현금성 자산 또는 저변동 ETF(예: 배당/가치주) 비중을 일부 추가하세요.");
  }

  return {
    diversification,
    riskConcentration,
    sectorExposure,
    volatilityRisk,
    portfolioScore,
    riskWarnings,
    improvementSuggestions,
  };
}
