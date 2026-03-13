import { InvestorProfile } from "@/lib/ai/investorProfiles";
import { QuoteResult } from "@/lib/yahoo";

export type HoldingInput = {
  symbol: string;
  company_name: string;
  shares: number;
  average_price: number;
};

export type SourceEvidence = {
  name: string;
  url: string;
  reliability: "high" | "medium";
  note: string;
};

export type SymbolEvaluation = {
  symbol: string;
  company_name: string;
  decision: "buy" | "sell" | "hold";
  confidence: number;
  rationale: string;
  sources: SourceEvidence[];
  reliability_score: number;
};

export type PortfolioContext = {
  total_value: number;
  weights: Record<string, number>;
};

const THEME_BY_SYMBOL: Record<string, "core_index" | "growth_index" | "dividend" | "leveraged" | "tech" | "semiconductor" | "defensive" | "bond" | "gold" | "healthcare" | "reits" | "crypto" | "quality"> = {
  SPY: "core_index",
  VOO: "core_index",
  IVV: "core_index",
  QQQ: "growth_index",
  SCHD: "dividend",
  VYM: "dividend",
  HDV: "dividend",
  TQQQ: "leveraged",
  AAPL: "tech",
  MSFT: "tech",
  GOOGL: "tech",
  AMZN: "tech",
  META: "tech",
  NVDA: "semiconductor",
  SMH: "semiconductor",
  SOXX: "semiconductor",
  "BRK-B": "quality",
  "BRK.B": "quality",
  JPM: "quality",
  KO: "quality",
  TLT: "bond",
  IEF: "bond",
  BIL: "bond",
  IAU: "gold",
  GLD: "gold",
  XLV: "healthcare",
  JNJ: "healthcare",
  UNH: "healthcare",
  VNQ: "reits",
  O: "reits",
  "BTC-USD": "crypto",
  IBIT: "crypto",
};

function classify(symbol: string) {
  return THEME_BY_SYMBOL[symbol.toUpperCase()] || "quality";
}

export function evaluateByInvestor(
  investor: InvestorProfile,
  holding: HoldingInput,
  quote: QuoteResult | null,
  summary: {
    pe?: number | null;
    eps?: number | null;
    beta?: number | null;
    marketCap?: number | null;
  } | null,
  filings: SourceEvidence[],
  context?: PortfolioContext
): SymbolEvaluation {
  const pe = typeof summary?.pe === "number" ? summary.pe : null;
  const eps = typeof summary?.eps === "number" ? summary.eps : null;
  const beta = typeof summary?.beta === "number" ? summary.beta : null;
  const marketCap = typeof summary?.marketCap === "number" ? summary.marketCap : null;
  const momentum = quote?.regularMarketChangePercent ?? 0;

  let score = 0;
  const reasons: string[] = [];
  const symbol = holding.symbol.toUpperCase();
  const theme = classify(symbol);
  const weight = context?.weights?.[symbol] || 0;
  const spyWeight = context?.weights?.SPY || 0;
  const qqqWeight = context?.weights?.QQQ || 0;
  const schdWeight = context?.weights?.SCHD || 0;
  const btcWeight = context?.weights?.["BTC-USD"] || context?.weights?.IBIT || 0;

  if (investor.style === "value") {
    if (pe != null && pe < 25) { score += 2; reasons.push(`PER ${pe.toFixed(2)}로 가치 기준에 비교적 부합합니다.`); }
    if (pe != null && pe > 45) { score -= 2; reasons.push(`PER ${pe.toFixed(2)}로 고평가 구간 가능성이 큽니다.`); }
    if (eps != null && eps > 0) { score += 1; reasons.push(`EPS가 양수(${eps.toFixed(2)})로 수익성은 유지됩니다.`); }
    if (eps != null && eps <= 0) { score -= 2; reasons.push(`EPS가 음수(${eps.toFixed(2)})로 안전마진이 약합니다.`); }
    if (beta != null && beta < 1.2) { score += 1; reasons.push(`베타 ${beta.toFixed(2)}로 변동성 부담이 과도하지 않습니다.`); }
    if (marketCap != null && marketCap > 50_000_000_000) { score += 1; reasons.push("대형주 규모로 재무/사업 안정성이 상대적으로 높습니다."); }
  }

  if (investor.style === "growth") {
    if (momentum > 1.5) { score += 2; reasons.push(`최근 모멘텀(${momentum.toFixed(2)}%)이 성장 추세를 지지합니다.`); }
    if (momentum < -4) { score -= 2; reasons.push(`최근 모멘텀(${momentum.toFixed(2)}%) 약화가 뚜렷합니다.`); }
    if (pe != null && pe < 50) { score += 1; reasons.push(`성장주 치고 PER ${pe.toFixed(2)}는 과열 수준은 아닙니다.`); }
    if (pe != null && pe > 80) { score -= 2; reasons.push(`PER ${pe.toFixed(2)}로 멀티플 부담이 큽니다.`); }
    if (eps != null && eps > 0) { score += 1; reasons.push("이익이 실제로 발생하고 있어 성장 신뢰성이 높습니다."); }
  }

  if (investor.style === "macro") {
    if (beta != null && beta < 1.1) { score += 1; reasons.push(`베타 ${beta.toFixed(2)}로 거시 충격 방어력이 상대적으로 양호합니다.`); }
    if (beta != null && beta > 1.6) { score -= 2; reasons.push(`베타 ${beta.toFixed(2)}로 거시 환경 변동에 민감합니다.`); }
    if (Math.abs(momentum) <= 4) { score += 1; reasons.push("단기 변동 폭이 극단적이지 않아 포트폴리오 안정성에 유리합니다."); }
    if (Math.abs(momentum) > 8) { score -= 1; reasons.push("단기 변동 폭이 커서 리스크 관리 관점에서 보수적 접근이 필요합니다."); }
    if (marketCap != null && marketCap > 100_000_000_000) { score += 1; reasons.push("유동성과 규모 측면에서 스트레스 구간 대응력이 상대적으로 높습니다."); }
  }

  if (investor.style === "quality") {
    if (eps != null && eps > 0) { score += 2; reasons.push("지속 가능한 이익창출(양의 EPS)이 확인됩니다."); }
    if (beta != null && beta < 1.1) { score += 1; reasons.push("품질주 기준에서 변동성 수준이 안정적입니다."); }
    if (pe != null && pe > 55) { score -= 1; reasons.push("품질 대비 밸류에이션이 다소 부담됩니다."); }
  }

  // User strategy integration: SPY:QQQ:SCHD ~= 2:5:3, BTC ~5%, and defensive hedges.
  if (theme === "core_index" || theme === "growth_index" || theme === "dividend") {
    const modelTotal = spyWeight + qqqWeight + schdWeight;
    if (modelTotal > 0.05) {
      const spyTarget = 0.2 * modelTotal;
      const qqqTarget = 0.5 * modelTotal;
      const schdTarget = 0.3 * modelTotal;
      if (symbol === "SPY") {
        const d = weight - spyTarget;
        if (d < -0.03) { score += 1; reasons.push("SPY 비중이 모델(2:5:3) 대비 낮아 분산 관점에서 보강 여지가 있습니다."); }
        if (d > 0.05) { score -= 1; reasons.push("SPY 비중이 모델 대비 과도해 성장/배당 축과 균형이 약화될 수 있습니다."); }
      }
      if (symbol === "QQQ") {
        const d = weight - qqqTarget;
        if (d < -0.04) { score += 1; reasons.push("QQQ 비중이 모델 대비 낮아 성장 축이 약한 상태입니다."); }
        if (d > 0.07) { score -= 1; reasons.push("QQQ 비중이 모델 대비 높아 변동성 노출이 커졌습니다."); }
      }
      if (symbol === "SCHD") {
        const d = weight - schdTarget;
        if (d < -0.03) { score += 1; reasons.push("SCHD 비중이 모델 대비 낮아 배당/방어 버퍼가 약합니다."); }
        if (d > 0.06) { score -= 1; reasons.push("SCHD 비중이 모델 대비 높아 성장 탄력이 제한될 수 있습니다."); }
      }
    }
  }

  if (theme === "crypto") {
    if (btcWeight < 0.02) { score += 1; reasons.push("비트코인 비중이 5% 가이드보다 낮아 대체자산 분산 효과가 제한적입니다."); }
    if (btcWeight > 0.08) { score -= 2; reasons.push("비트코인 비중이 5% 권장 범위를 초과해 변동성 리스크가 과도합니다."); }
  }

  if (theme === "bond" || theme === "gold" || theme === "healthcare") {
    if (Math.abs(momentum) < 2.5) score += 1;
    reasons.push("방어/헷지 축 자산은 급락 구간 완충 역할을 기대할 수 있습니다.");
  }

  if (theme === "leveraged") {
    score -= 2;
    reasons.push("레버리지 ETF는 변동성 손실 누적 위험이 커서 비중을 보수적으로 관리해야 합니다.");
  }

  const officialSourceCount = filings.filter((s) => s.reliability === "high").length;
  const reliabilityScore = Math.max(30, Math.min(100, 45 + officialSourceCount * 20 + (quote ? 10 : 0) + (summary ? 10 : 0)));
  if (officialSourceCount === 0) {
    reasons.push("공식 공시(EDGAR/DART) 근거가 제한적이므로 보수적으로 해석해야 합니다.");
  }

  let decision: "buy" | "sell" | "hold" = "hold";
  if (score >= 1) decision = "buy";
  if (score <= -1) decision = "sell";
  // Tie-break to avoid all-hold output in neutral score zones.
  if (score === 0) {
    if (momentum >= 2.5) decision = "buy";
    else if (momentum <= -2.5) decision = "sell";
  }
  const confidence = Math.max(45, Math.min(95, 55 + Math.abs(score) * 8 + Math.round((reliabilityScore - 50) * 0.2)));

  const rationale = [
    `${investor.displayNameKo} 철학 기준으로 ${holding.symbol}을 평가했습니다.`,
    ...reasons,
    `최종 판단: ${decision.toUpperCase()} (신뢰도 ${confidence}/100).`,
  ].join(" ");

  return {
    symbol: holding.symbol,
    company_name: holding.company_name,
    decision,
    confidence,
    rationale,
    sources: filings,
    reliability_score: reliabilityScore,
  };
}
