import { QuoteResult } from "@/lib/yahoo";

export type FundamentalSummary = {
  marketCap?: number | null;
  pe?: number | null;
  eps?: number | null;
  beta?: number | null;
  freeCashflow?: number | null;
  debtToEquity?: number | null;
  operatingMargins?: number | null;
  revenueGrowth?: number | null;
};

export type DeepAnalysisResult = {
  decision: "buy" | "sell" | "hold";
  totalScore: number;
  buffettScore: number;
  lynchScore: number;
  reasons: {
    buffett: string[];
    lynch: string[];
    risk: string[];
  };
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function analyzeWithBuffettLynch(
  symbol: string,
  quote: QuoteResult | null,
  summary: FundamentalSummary | null,
  reliabilityScore: number
): DeepAnalysisResult {
  const buffettReasons: string[] = [];
  const lynchReasons: string[] = [];
  const riskReasons: string[] = [];

  const pe = typeof summary?.pe === "number" ? summary.pe : null;
  const eps = typeof summary?.eps === "number" ? summary.eps : null;
  const beta = typeof summary?.beta === "number" ? summary.beta : null;
  const marketCap = typeof summary?.marketCap === "number" ? summary.marketCap : null;
  const fcf = typeof summary?.freeCashflow === "number" ? summary.freeCashflow : null;
  const debtToEquity = typeof summary?.debtToEquity === "number" ? summary.debtToEquity : null;
  const operatingMargins = typeof summary?.operatingMargins === "number" ? summary.operatingMargins : null;
  const revenueGrowth = typeof summary?.revenueGrowth === "number" ? summary.revenueGrowth : null;
  const momentum = quote?.regularMarketChangePercent ?? 0;

  let buffettScore = 25;
  if (marketCap != null && marketCap > 50_000_000_000) {
    buffettScore += 7;
    buffettReasons.push("대형주 규모로 경기 변동 국면에서도 사업 지속성이 상대적으로 높습니다.");
  } else {
    buffettScore -= 3;
    buffettReasons.push("시가총액이 크지 않아 사업 안정성 검증이 더 필요합니다.");
  }
  if (pe != null && pe >= 8 && pe <= 25) {
    buffettScore += 8;
    buffettReasons.push(`PER ${pe.toFixed(2)}는 내재가치 대비 과열 가능성이 상대적으로 낮은 구간입니다.`);
  } else if (pe != null && pe > 45) {
    buffettScore -= 8;
    buffettReasons.push(`PER ${pe.toFixed(2)}로 가치 대비 가격 부담이 큽니다.`);
  }
  if (eps != null && eps > 0) {
    buffettScore += 5;
    buffettReasons.push(`EPS ${eps.toFixed(2)}로 이익 창출 능력이 확인됩니다.`);
  } else {
    buffettScore -= 6;
    buffettReasons.push("EPS가 약하거나 음수여서 안전마진 관점에서 불리합니다.");
  }
  if (fcf != null && fcf > 0) {
    buffettScore += 6;
    buffettReasons.push("잉여현금흐름(FCF)이 양수여서 사업의 현금 창출력이 양호합니다.");
  } else {
    buffettScore -= 3;
    buffettReasons.push("FCF 정보가 약하거나 부족해 현금 창출 안정성 확인이 제한됩니다.");
  }
  if (beta != null && beta < 1.2) {
    buffettScore += 4;
    buffettReasons.push(`베타 ${beta.toFixed(2)}로 변동성이 과도하지 않습니다.`);
  } else if (beta != null && beta > 1.7) {
    buffettScore -= 5;
    buffettReasons.push(`베타 ${beta.toFixed(2)}로 시장 급변동에 민감합니다.`);
  }
  if (debtToEquity != null && debtToEquity > 150) {
    buffettScore -= 4;
    buffettReasons.push(`부채비율 성격 지표(debtToEquity ${debtToEquity.toFixed(1)})가 높아 금리 민감도가 큽니다.`);
  }
  buffettScore = clamp(buffettScore, 0, 50);

  let lynchScore = 25;
  if (revenueGrowth != null) {
    if (revenueGrowth > 0.15) {
      lynchScore += 10;
      lynchReasons.push(`매출 성장률 ${Math.round(revenueGrowth * 100)}%로 고성장 구간입니다.`);
    } else if (revenueGrowth > 0.05) {
      lynchScore += 5;
      lynchReasons.push(`매출 성장률 ${Math.round(revenueGrowth * 100)}%로 완만한 성장입니다.`);
    } else {
      lynchScore -= 4;
      lynchReasons.push(`매출 성장률 ${Math.round(revenueGrowth * 100)}%로 성장 모멘텀이 약합니다.`);
    }
  } else {
    lynchReasons.push("매출 성장률 데이터가 제한되어 Lynch식 성장 검증 강도가 낮습니다.");
  }
  if (operatingMargins != null && operatingMargins > 0.15) {
    lynchScore += 6;
    lynchReasons.push(`영업이익률 ${Math.round(operatingMargins * 100)}%로 수익성의 질이 양호합니다.`);
  } else if (operatingMargins != null && operatingMargins < 0.06) {
    lynchScore -= 4;
    lynchReasons.push(`영업이익률 ${Math.round(operatingMargins * 100)}%로 이익 안정성이 약합니다.`);
  }
  if (pe != null && revenueGrowth != null && revenueGrowth > 0) {
    const peg = pe / (revenueGrowth * 100);
    if (peg < 1) {
      lynchScore += 8;
      lynchReasons.push(`PEG ${peg.toFixed(2)}로 성장 대비 가격이 매력적인 구간입니다.`);
    } else if (peg < 1.5) {
      lynchScore += 3;
      lynchReasons.push(`PEG ${peg.toFixed(2)}로 성장 대비 가격이 중립 구간입니다.`);
    } else {
      lynchScore -= 5;
      lynchReasons.push(`PEG ${peg.toFixed(2)}로 성장 대비 가격이 비싼 편입니다.`);
    }
  }
  if (momentum > 2.5) {
    lynchScore += 3;
    lynchReasons.push(`단기 추세가 +${momentum.toFixed(2)}%로 우상향입니다.`);
  } else if (momentum < -3.0) {
    lynchScore -= 4;
    lynchReasons.push(`단기 추세가 ${momentum.toFixed(2)}%로 약화되어 실적 확인 전 보수적 접근이 필요합니다.`);
  }
  lynchScore = clamp(lynchScore, 0, 50);

  if (beta != null && beta > 1.5) {
    riskReasons.push("변동성 고위험(beta>1.5) 구간입니다.");
  }
  if (debtToEquity != null && debtToEquity > 200) {
    riskReasons.push("레버리지 부담이 높아 금리 상승 국면에서 취약할 수 있습니다.");
  }
  if (Math.abs(momentum) > 7) {
    riskReasons.push("단기 급등락 구간이라 평균회귀 리스크가 있습니다.");
  }
  if (riskReasons.length === 0) {
    riskReasons.push("현재 확인된 핵심 리스크는 관리 가능한 범위로 평가됩니다.");
  }

  const baseTotal = buffettScore + lynchScore;
  const reliabilityAdj = Math.round((reliabilityScore - 60) * 0.15);
  const totalScore = clamp(baseTotal + reliabilityAdj, 0, 100);

  let decision: "buy" | "sell" | "hold" = "hold";
  if (totalScore >= 70) decision = "buy";
  else if (totalScore <= 50) decision = "sell";
  else decision = "hold";

  // Ensure not everything collapses into HOLD.
  if (decision === "hold") {
    if (momentum >= 4 && totalScore >= 65) decision = "buy";
    if (momentum <= -5 && totalScore <= 58) decision = "sell";
  }

  return {
    decision,
    totalScore,
    buffettScore,
    lynchScore,
    reasons: {
      buffett: buffettReasons,
      lynch: lynchReasons,
      risk: riskReasons,
    },
  };
}
