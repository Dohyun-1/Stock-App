/* ══════════════════════════════════════════════════════════════
   Mentor Engine — 멘토별 종목 평가 · 의견 생성
   ══════════════════════════════════════════════════════════════ */

import { MENTOR_MAP, type MentorProfile, type Signal, type PortfolioRules, type DecisionTriggers, type InvestorSources } from "./mentorProfiles";

/* ── Types ── */
export interface StockMetrics {
  symbol: string;
  name: string;
  price: number;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  debtToEquity: number | null;
  fcfYield: number | null;
  operatingMargin: number | null;
  dividendYield: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  beta: number | null;
  sharpeRatio: number | null;
  momentum: number | null;
  maxDrawdown: number | null;
  grossMargin: number | null;
  volatility: number | null;
  currentRatio: number | null;
}

export interface MentorVerdict {
  mentorId: string;
  mentorName: string;
  mentorNameKo: string;
  signal: Signal;
  score: number;
  thesis: string;
  keyFactors: { metric: string; value: string; assessment: "positive" | "neutral" | "negative" }[];
  riskWarning: string;
  actionAdvice: string;
}

/* ── Metric Resolver ── */
function resolveMetric(metricId: string, stock: StockMetrics): number | null {
  const map: Record<string, number | null> = {
    pe: stock.pe, pb: stock.pb, roe: stock.roe != null ? stock.roe * 100 : null,
    debtToEquity: stock.debtToEquity, fcfYield: stock.fcfYield != null ? stock.fcfYield * 100 : null,
    operatingMargin: stock.operatingMargin != null ? stock.operatingMargin * 100 : null,
    dividendYield: stock.dividendYield != null ? stock.dividendYield * 100 : null,
    revenueGrowth: stock.revenueGrowth != null ? stock.revenueGrowth * 100 : null,
    earningsGrowth: stock.earningsGrowth != null ? stock.earningsGrowth * 100 : null,
    beta: stock.beta, sharpeRatio: stock.sharpeRatio, momentum: stock.momentum,
    maxDrawdown: stock.maxDrawdown != null ? Math.abs(stock.maxDrawdown) : null,
    grossMargin: stock.grossMargin != null ? stock.grossMargin * 100 : null,
    volatility: stock.volatility, currentRatio: stock.currentRatio,
    peg: stock.pe != null && stock.earningsGrowth != null && stock.earningsGrowth > 0
      ? stock.pe / (stock.earningsGrowth * 100) : null,
    trendStage: stock.momentum != null
      ? (stock.momentum >= 7 ? 2 : stock.momentum >= 5 ? 2.5 : stock.momentum >= 3 ? 3 : 4) : null,
    rsRating: stock.momentum != null
      ? Math.min(99, Math.max(1, stock.momentum * 10 + (stock.sharpeRatio != null && stock.sharpeRatio > 0 ? stock.sharpeRatio * 5 : 0))) : null,
    volumeBreakout: stock.volatility != null && stock.momentum != null
      ? Math.min(5, (stock.volatility / 10) * (stock.momentum / 5)) : null,
    riskReward: stock.momentum != null && stock.maxDrawdown != null && stock.maxDrawdown !== 0
      ? Math.min(10, Math.abs(stock.momentum / (Math.abs(stock.maxDrawdown) / 10))) : null,
    tam: stock.revenueGrowth != null ? Math.min(10, Math.max(1, (stock.revenueGrowth * 100) / 5)) : null,
    innovationScore: stock.grossMargin != null && stock.revenueGrowth != null
      ? Math.min(10, (stock.grossMargin * 100 / 10) * 0.5 + (stock.revenueGrowth * 100 / 10) * 0.5) : null,
    rndRatio: stock.grossMargin != null && stock.operatingMargin != null
      ? Math.max(0, (stock.grossMargin - stock.operatingMargin) * 100) : null,
    macroImbalance: stock.beta != null && stock.volatility != null
      ? Math.min(10, Math.abs(stock.beta - 1) * 5 + stock.volatility / 10) : null,
    reflexivity: stock.momentum != null && stock.volatility != null
      ? Math.min(10, Math.abs(stock.momentum) * (stock.volatility / 20)) : null,
    sentiment: stock.momentum != null
      ? Math.max(0, Math.min(100, 50 - stock.momentum * 5)) : null,
    leverage: stock.debtToEquity != null
      ? Math.min(10, Math.max(0, stock.debtToEquity / 30)) : null,
    catalystProximity: stock.earningsGrowth != null && stock.momentum != null
      ? Math.min(10, Math.max(0, (stock.earningsGrowth * 100) / 10 + stock.momentum / 2)) : null,
    correlation: stock.beta != null ? Math.max(-1, Math.min(1, stock.beta - 1)) : null,
    debtCycle: stock.debtToEquity != null
      ? Math.min(10, Math.max(1, stock.debtToEquity / 30 + 2)) : null,
    realReturn: stock.sharpeRatio != null && stock.momentum != null
      ? stock.momentum + (stock.sharpeRatio > 0 ? stock.sharpeRatio * 2 : 0) : null,
    meanReversion: stock.momentum != null ? 10 - stock.momentum : null,
    volume: stock.volatility != null ? Math.min(3, stock.volatility / 10) : null,
    tailRisk: stock.maxDrawdown != null ? Math.min(10, Math.abs(stock.maxDrawdown) / 5) : null,
    optionality: (() => {
      const rg = stock.revenueGrowth != null ? stock.revenueGrowth * 100 : null;
      const gm = stock.grossMargin != null ? stock.grossMargin * 100 : null;
      const om = stock.operatingMargin != null ? stock.operatingMargin * 100 : null;
      if (rg != null && gm != null) return Math.min(10, rg / 5 + gm / 20);
      if (rg != null && om != null) return Math.min(10, rg / 5 + om / 15);
      if (rg != null) return Math.min(10, rg / 4);
      return null;
    })(),
    fragility: stock.debtToEquity != null
      ? Math.min(10, Math.max(0, stock.debtToEquity / 20)) : null,
    skinInTheGame: (() => {
      let s = 0; let parts = 0;
      if (stock.roe != null) { s += Math.min(5, (stock.roe * 100) / 5); parts++; }
      if (stock.fcfYield != null) { s += Math.min(5, (stock.fcfYield * 100) / 3); parts++; }
      if (stock.operatingMargin != null) { s += Math.min(5, (stock.operatingMargin * 100) / 8); parts++; }
      return parts > 0 ? Math.min(10, s * (3 / Math.max(1, parts))) : null;
    })(),
    debtLevel: stock.debtToEquity,
    managementQuality: (() => {
      let s = 0; let parts = 0;
      if (stock.roe != null) { s += Math.min(5, (stock.roe * 100) / 5); parts++; }
      if (stock.operatingMargin != null) { s += Math.min(5, (stock.operatingMargin * 100) / 8); parts++; }
      if (stock.revenueGrowth != null) { s += Math.min(3, (stock.revenueGrowth * 100) / 10); parts++; }
      return parts > 0 ? Math.min(10, s * (3 / Math.max(1, parts))) : null;
    })(),
    competitiveAdvantage: (() => {
      let s = 0; let parts = 0;
      if (stock.grossMargin != null) { s += Math.min(5, (stock.grossMargin * 100) / 10); parts++; }
      if (stock.operatingMargin != null) { s += Math.min(5, (stock.operatingMargin * 100) / 8); parts++; }
      if (stock.revenueGrowth != null) { s += Math.min(3, (stock.revenueGrowth * 100) / 10); parts++; }
      return parts > 0 ? Math.min(10, s * (3 / Math.max(1, parts))) : null;
    })(),
    inventoryTurnover: stock.currentRatio != null ? Math.max(1, 15 - stock.currentRatio * 3) : null,
    earningsStability: (() => {
      let base = 6;
      if (stock.earningsGrowth != null) base += stock.earningsGrowth > 0 ? 2 : -2;
      if (stock.maxDrawdown != null) base -= Math.abs(stock.maxDrawdown) / 10;
      if (stock.operatingMargin != null) base += stock.operatingMargin > 0.1 ? 1 : -1;
      return Math.min(10, Math.max(1, base));
    })(),
  };
  return map[metricId] ?? null;
}

/* ── Score a single metric ── */
function scoreMetric(value: number, ideal: [number, number], invert?: boolean): number {
  const [lo, hi] = ideal;
  const range = hi - lo || 1;
  if (invert) {
    if (value <= lo) return 100;
    if (value >= hi) return Math.max(0, 100 - ((value - hi) / (hi || 1)) * 100);
    return 100 - ((value - lo) / range) * 50;
  }
  if (value >= lo && value <= hi) return 100;
  if (value < lo) return Math.max(0, 100 - ((lo - value) / (lo || 1)) * 100);
  return Math.max(0, 100 - ((value - hi) / (hi || 1)) * 50);
}

/* ── Valuation Gate — price-disciplined investors cap signals when overvalued ── */
interface ValuationGate {
  metricId: string;
  holdThreshold: number;
  sellThreshold: number;
}

const VALUATION_GATES: Record<string, ValuationGate[]> = {
  buffett: [
    { metricId: "pe", holdThreshold: 28, sellThreshold: 35 },
    { metricId: "fcfYield", holdThreshold: 2.5, sellThreshold: 1.5 },
  ],
  graham: [
    { metricId: "pe", holdThreshold: 18, sellThreshold: 25 },
    { metricId: "pb", holdThreshold: 2.0, sellThreshold: 3.0 },
  ],
  lynch: [
    { metricId: "peg", holdThreshold: 1.8, sellThreshold: 2.5 },
  ],
};

function applyValuationGate(
  mentorId: string,
  rawScore: number,
  rawSignal: Signal,
  stock: StockMetrics,
  keyFactors: MentorVerdict["keyFactors"],
): { score: number; signal: Signal; gateApplied: boolean; gateReason: string | null } {
  const gates = VALUATION_GATES[mentorId];
  if (!gates) return { score: rawScore, signal: rawSignal, gateApplied: false, gateReason: null };

  let maxAllowedSignal: Signal = rawSignal;
  let scorePenalty = 0;
  let gateReason: string | null = null;

  for (const gate of gates) {
    const val = resolveMetric(gate.metricId, stock);
    if (val == null) continue;

    const metric = keyFactors.find(f => {
      const metricLabels: Record<string, string> = { pe: "P/E", pb: "P/B", peg: "PEG", fcfYield: "FCF Yield" };
      return f.metric === (metricLabels[gate.metricId] ?? gate.metricId);
    });

    const isInverted = gate.metricId === "pe" || gate.metricId === "pb" || gate.metricId === "peg";

    if (isInverted) {
      if (val >= gate.sellThreshold) {
        maxAllowedSignal = capSignal(maxAllowedSignal, "SELL");
        scorePenalty = Math.max(scorePenalty, 25);
        gateReason = `${metric?.metric ?? gate.metricId} ${val.toFixed(1)}로 극도로 고평가 — 매도 영역`;
      } else if (val >= gate.holdThreshold) {
        maxAllowedSignal = capSignal(maxAllowedSignal, "HOLD");
        scorePenalty = Math.max(scorePenalty, 15);
        gateReason = `${metric?.metric ?? gate.metricId} ${val.toFixed(1)}로 안전마진 부족 — 신규 매수 자제`;
      }
    } else {
      if (val <= gate.sellThreshold) {
        maxAllowedSignal = capSignal(maxAllowedSignal, "SELL");
        scorePenalty = Math.max(scorePenalty, 25);
        gateReason = `${metric?.metric ?? gate.metricId} ${val.toFixed(1)}%로 극도로 부족 — 매도 영역`;
      } else if (val <= gate.holdThreshold) {
        maxAllowedSignal = capSignal(maxAllowedSignal, "HOLD");
        scorePenalty = Math.max(scorePenalty, 15);
        gateReason = `${metric?.metric ?? gate.metricId} ${val.toFixed(1)}%로 기준 미달 — 신규 매수 자제`;
      }
    }
  }

  const adjustedScore = Math.max(5, rawScore - scorePenalty);
  const adjustedSignal = capSignal(deriveSignal(adjustedScore), maxAllowedSignal);

  return {
    score: adjustedScore,
    signal: adjustedSignal,
    gateApplied: scorePenalty > 0,
    gateReason,
  };
}

const SIGNAL_ORDER: Signal[] = ["STRONG_SELL", "SELL", "HOLD", "BUY", "STRONG_BUY"];

function capSignal(current: Signal, maxAllowed: Signal): Signal {
  const currentIdx = SIGNAL_ORDER.indexOf(current);
  const maxIdx = SIGNAL_ORDER.indexOf(maxAllowed);
  return currentIdx <= maxIdx ? current : maxAllowed;
}

/* ── Evaluate stock from one mentor's perspective ── */
export function evaluateStock(stock: StockMetrics, mentorId: string): MentorVerdict {
  const mentor = MENTOR_MAP[mentorId];
  if (!mentor) throw new Error(`Unknown mentor: ${mentorId}`);

  let totalScore = 0;
  let totalWeight = 0;
  const keyFactors: MentorVerdict["keyFactors"] = [];

  for (const m of mentor.metrics) {
    const val = resolveMetric(m.id, stock);
    if (val == null) continue;
    const s = scoreMetric(val, m.idealRange, m.invert);
    totalScore += s * m.weight;
    totalWeight += m.weight;
    const assessment: "positive" | "neutral" | "negative" = s >= 70 ? "positive" : s >= 40 ? "neutral" : "negative";
    const displayVal = m.invert
      ? `${val.toFixed(2)} (이상적: ${m.idealRange[0]}~${m.idealRange[1]} 이하)`
      : `${val.toFixed(2)} (이상적: ${m.idealRange[0]}~${m.idealRange[1]})`;
    keyFactors.push({ metric: m.label, value: displayVal, assessment });
  }

  const rawScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  const rawSignal = deriveSignal(rawScore);

  const { score, signal, gateApplied, gateReason } = applyValuationGate(mentorId, rawScore, rawSignal, stock, keyFactors);

  if (gateApplied && gateReason) {
    keyFactors.push({ metric: "밸류에이션 게이트", value: gateReason, assessment: "negative" });
  }

  const thesis = generateDetailedThesis(stock, mentor, score, keyFactors);
  const riskWarning = generateRiskWarning(stock, mentor, score, keyFactors);
  const actionAdvice = generateAction(mentor, signal, stock, score, keyFactors);

  return {
    mentorId: mentor.id, mentorName: mentor.name, mentorNameKo: mentor.nameKo,
    signal, score, thesis, keyFactors, riskWarning, actionAdvice,
  };
}

function deriveSignal(score: number): Signal {
  if (score >= 85) return "STRONG_BUY";
  if (score >= 65) return "BUY";
  if (score >= 40) return "HOLD";
  if (score >= 20) return "SELL";
  return "STRONG_SELL";
}

/* ── Per-Mentor Detailed Thesis (10+ sentences) ── */

const MENTOR_THESIS_TEMPLATES: Record<string, (stock: StockMetrics, score: number, pos: string[], neg: string[], factors: MentorVerdict["keyFactors"]) => string[]> = {
  buffett(stock, score, pos, neg, factors) {
    const pe = factors.find(f => f.metric === "P/E");
    const roe = factors.find(f => f.metric === "ROE");
    const fcf = factors.find(f => f.metric === "FCF Yield");
    const debt = factors.find(f => f.metric === "부채비율");
    const om = factors.find(f => f.metric === "영업이익률");
    return [
      `이 기업의 경제적 해자를 살펴보면, ${stock.name}(${stock.symbol})은 현재 '가치 투자(Quality Value)' 관점에서 종합 ${score}점으로 평가됩니다.`,
      pe ? `밸류에이션 측면에서, P/E ${pe.value.split(" ")[0]}배는 ${pe.assessment === "positive" ? "내재가치 대비 합리적인 수준으로, '가격은 지불하는 것이고 가치는 얻는 것'이라는 원칙에 부합합니다" : pe.assessment === "negative" ? "내재가치 대비 프리미엄이 과도하여, 안전마진이 부족합니다. 좋은 기업이라도 비싸게 사면 좋은 투자가 아닙니다" : "적정 수준이나, 추가 할인 시 더 매력적인 진입 기회가 될 수 있습니다"}.` : "",
      roe ? `자기자본수익률(ROE) ${roe.value.split(" ")[0]}%는 ${roe.assessment === "positive" ? "경영진이 주주 자본을 효율적으로 운용하고 있음을 보여줍니다. 이는 '해자가 넓은 성'의 증거입니다" : "기대 수준에 미달하여, 자본 배분 효율성에 의문이 제기됩니다"}.` : "",
      fcf ? `잉여현금흐름(FCF) 수익률 ${fcf.value.split(" ")[0]}%는 ${fcf.assessment === "positive" ? "실질적 현금 창출력이 뛰어나며, 'Owner Earnings' 관점에서 주주가치 환원 여력이 충분합니다" : "현금 창출이 기대에 미치지 못하고 있어, 배당이나 자사주 매입 여력이 제한적입니다"}.` : "",
      debt ? `부채비율 ${debt.value.split(" ")[0]}은 ${debt.assessment === "positive" ? "보수적 재무구조를 유지하고 있어, 경기 침체기에도 '스노우볼'이 멈추지 않을 견고함을 갖추고 있습니다" : "부채 부담이 능력 범위(Circle of Competence)를 벗어날 리스크를 내포합니다"}.` : "",
      om ? `영업이익률 ${om.value.split(" ")[0]}%는 ${om.assessment === "positive" ? "가격 결정력(Pricing Power)의 증거이며, 이는 지속 가능한 경쟁 우위의 핵심 지표입니다" : "마진 압박이 존재하여, 경제적 해자의 깊이에 의문이 있습니다"}.` : "",
      pos.length > 0 ? `종합적으로 강점 지표(${pos.join(", ")})가 ${pos.length}개로 확인되며, 이는 장기 보유에 적합한 '훌륭한 기업'의 특성을 보여줍니다.` : "현재 뚜렷한 강점 지표가 부족하여, '적당한 기업을 훌륭한 가격에 사는 것'보다 기업의 본질적 가치 개선을 먼저 확인해야 합니다.",
      neg.length > 0 ? `반면 약점 지표(${neg.join(", ")})가 ${neg.length}개 감지되어, '10년 보유할 마음이 없다면 10분도 보유하지 마라'는 원칙에 비추어 신중한 판단이 필요합니다.` : "",
      `야구에서 좋은 공을 기다리는 타자처럼, ${stock.name}은 ${score >= 65 ? "스트라이크 존에 들어온 공으로 판단되어 배트를 휘두를 가치가 있습니다" : score >= 40 ? "아직 최적의 스트라이크가 아니므로 인내심을 가지고 기다리는 것이 바람직합니다" : "볼로 판단되어, 무리하게 배트를 휘두르지 않는 것이 현명합니다"}.`,
      `"주식시장은 인내심 없는 사람에게서 인내심 있는 사람에게 돈을 전달하는 장치다" — ${stock.name}에 대한 최종 판단은 ${score >= 65 ? "포트폴리오 편입을 권고합니다" : "추가 관찰 후 진입을 권고합니다"}.`,
    ];
  },

  lynch(stock, score, pos, neg, factors) {
    const peg = factors.find(f => f.metric === "PEG");
    const rg = factors.find(f => f.metric === "매출성장률");
    const eg = factors.find(f => f.metric === "이익성장률");
    const pe = factors.find(f => f.metric === "P/E");
    return [
      `이 기업의 스토리를 한 문장으로 설명하면, ${stock.name}(${stock.symbol})은 GARP(Growth at Reasonable Price) 관점에서 종합 ${score}점입니다.`,
      peg ? `핵심 지표 PEG 비율 ${peg.value.split(" ")[0]}은 ${peg.assessment === "positive" ? "1.0 미만으로, 이익성장률 대비 주가가 저평가되어 있습니다. 이것이 바로 '텐배거(Tenbagger)'의 시작점입니다" : peg.assessment === "negative" ? "1.0을 상회하여, 성장 대비 주가가 과대평가될 위험이 있습니다. 이런 상황에서는 '풀을 뽑으면서 꽃에 물 주기'를 경계해야 합니다" : "적정 수준이나, 더 저렴한 진입 기회를 모색할 수 있습니다"}.` : "",
      rg ? `매출성장률 ${rg.value.split(" ")[0]}%는 ${rg.assessment === "positive" ? "건강한 성장세로, 소비자 수요가 확대되고 있음을 시사합니다. 일상에서 이 기업의 제품/서비스를 접하며 성장을 체감할 수 있습니다" : "성장 모멘텀이 약화되고 있어, '스토리가 변했다'는 신호일 수 있습니다"}.` : "",
      eg ? `이익성장률 ${eg.value.split(" ")[0]}%는 ${eg.assessment === "positive" ? "EPS가 가속 성장하고 있어, 주가 상승의 근본 동력이 견고합니다" : "이익 성장이 둔화되면 텐배거 시나리오가 후퇴합니다"}.` : "",
      pe ? `P/E ${pe.value.split(" ")[0]}배는 ${pe.assessment === "positive" ? "성장률 대비 합리적 밸류에이션으로, '이기는 투자'의 조건을 갖추고 있습니다" : "밸류에이션이 성장률을 초과하여, '투자 이유를 크레용으로 설명할 수 없다면 사지 마라'는 원칙을 적용해야 합니다"}.` : "",
      `칵테일 파티 이론으로 보면, ${stock.name}은 ${score >= 70 ? "아직 많은 사람이 관심을 갖기 전인 1~2단계에 있어, 텐배거 잠재력이 살아있습니다" : score >= 50 ? "3단계로 진입하고 있어, 관심은 높아졌지만 아직 과열은 아닙니다" : "4단계 과열 징후가 보이거나, 스토리가 약해지고 있어 주의가 필요합니다"}.`,
      pos.length > 0 ? `강점 지표: ${pos.join(", ")}. 이 지표들은 '아마추어 투자자가 월가 전문가를 이길 수 있는' 근거를 제공합니다.` : "",
      neg.length > 0 ? `약점 지표: ${neg.join(", ")}. 이 요소들이 개선되지 않으면, "모르는 기업에 투자하는 것은 포커에서 카드를 보지 않고 베팅하는 것"이 될 수 있습니다.` : "",
      `${stock.name}의 성장 카테고리는 ${score >= 70 ? "'빠른 성장주(Fast Grower)'로 분류되며, 적극적 편입이 합리적입니다" : score >= 50 ? "'꾸준한 성장주(Stalwart)'로, 안정적 보유가 적합합니다" : "'전환주(Turnaround)' 여부를 면밀히 검토해야 합니다"}.`,
      `"주식 뒤에는 기업이 있고, 기업은 일을 한다" — ${stock.name}이 하는 일의 본질을 이해하는 것이 투자의 출발점입니다.`,
    ];
  },

  wood(stock, score, pos, neg, factors) {
    const rg = factors.find(f => f.metric === "매출성장률");
    const gm = factors.find(f => f.metric === "매출총이익률");
    return [
      `이 기업은 파괴적 혁신의 최전선에 있습니다. ${stock.name}(${stock.symbol})은 파괴적 혁신 관점에서 종합 ${score}점입니다.`,
      rg ? `매출성장률 ${rg.value.split(" ")[0]}%는 ${rg.assessment === "positive" ? "Wright's Law에 의한 비용 하락과 시장 확대가 동시에 진행되고 있음을 보여줍니다. S-curve의 변곡점을 지나 가파른 성장 구간에 진입했습니다" : "성장 속도가 파괴적 혁신 기업으로서 기대치에 미달합니다. 기술 채택 주기(Technology Adoption Cycle)의 '캐즘(Chasm)'에 빠질 위험이 있습니다"}.` : "",
      gm ? `매출총이익률 ${gm.value.split(" ")[0]}%는 ${gm.assessment === "positive" ? "소프트웨어 수준의 마진을 보여주며, 플랫폼 비즈니스 모델의 특성이 확인됩니다" : "마진 구조가 아직 성숙하지 않았으나, 혁신 기업은 초기 단계에서 R&D 투자를 우선시하므로 정상적인 패턴일 수 있습니다"}.` : "",
      `5년 후 이 시장은 완전히 다를 것입니다. AI, 로봇공학, 유전체학, 에너지 저장, 블록체인의 '수렴(Convergence)'이 ${stock.name}의 TAM(Total Addressable Market)을 폭발적으로 확대할 잠재력이 있습니다.`,
      `"시장이 이해하지 못하는 것에 기회가 있습니다" — ${stock.name}에 대한 전통적 밸류에이션 모델은 파괴적 혁신의 비선형적 성장을 과소평가할 수 있습니다.`,
      pos.length > 0 ? `혁신 지표 분석: ${pos.join(", ")}이(가) ARK의 투자 기준을 충족합니다.` : "",
      neg.length > 0 ? `주의 요소: ${neg.join(", ")}. 단, 파괴적 혁신 기업의 초기 재무 지표는 전통적 기준과 다르게 해석해야 합니다.` : "",
      `${score >= 65 ? "우리의 시간 지평은 5년입니다. 단기 변동성은 노이즈일 뿐이며, 이 기업의 혁신 궤도는 장기 투자 가치를 충분히 제공합니다." : "현재 혁신 모멘텀이나 성장 지표가 기대에 미달하여, 추가적인 기술 검증과 시장 확대 신호를 확인할 필요가 있습니다."}`,
      `"파괴적 혁신은 비용을 극적으로 낮추고 창의성을 해방합니다" — ${stock.name}이 이 원칙을 실현하고 있는지가 최종 판단의 핵심입니다.`,
    ];
  },

  dalio(stock, score, pos, neg, factors) {
    const beta = factors.find(f => f.metric === "베타");
    const sharpe = factors.find(f => f.metric === "샤프 비율");
    return [
      `현재 경제 사이클의 위치를 고려하면, ${stock.name}(${stock.symbol})은 글로벌 매크로 + 리스크 패리티 관점에서 종합 ${score}점입니다.`,
      beta ? `베타 ${beta.value.split(" ")[0]}은 ${beta.assessment === "positive" ? "포트폴리오 전체의 변동성을 관리하는 데 적합하며, '경제라는 기계'의 어떤 시즌에서도 역할을 수행할 수 있습니다" : "시장 민감도가 높아 리스크 패리티 최적화 시 비중 조절이 필요합니다"}.` : "",
      sharpe ? `샤프 비율 ${sharpe.value.split(" ")[0]}은 ${sharpe.assessment === "positive" ? "위험 조정 수익률이 우수하여, '성배(Holy Grail)' — 15개 이상의 비상관 수익원 구축에 기여합니다" : "위험 대비 수익이 기대에 미달하여, 포트폴리오 내 가중치 재검토가 필요합니다"}.` : "",
      `리스크 패리티 관점에서 이 자산은, 현재 경제 환경(성장/인플레이션 조합)의 '사계절' 중 ${score >= 60 ? "유리한 포지셔닝에 있습니다" : "중립적이거나 불리한 위치에 있습니다"}.`,
      `"15개 이상의 비상관 수익원을 확보하면 수익/위험 비율을 5배 개선할 수 있다" — ${stock.name}이 포트폴리오의 분산 효과에 기여하는 정도를 면밀히 평가해야 합니다.`,
      pos.length > 0 ? `긍정적 분산 기여 지표: ${pos.join(", ")}. 이 자산은 포트폴리오의 '사계절 대응력'을 강화합니다.` : "",
      neg.length > 0 ? `분산 저해 요소: ${neg.join(", ")}. 상관관계가 높은 자산과의 중복 노출을 경계해야 합니다.` : "",
      `"현실을 있는 그대로 다루라, 당신이 원하는 대로가 아니라" — 원칙 기반 의사결정으로, 감정이 아닌 데이터에 기반한 배분을 실행합니다.`,
      `${stock.name}에 대한 최종 판단: ${score >= 65 ? "리스크 패리티 포트폴리오의 구성요소로 편입 가치가 있습니다" : "현재 리스크/리워드 프로파일이 최적이 아니므로, 경제 사이클 변화 시 재평가합니다"}.`,
    ];
  },

  simons(stock, score, pos, neg, factors) {
    const mom = factors.find(f => f.metric === "모멘텀 점수");
    const vol = factors.find(f => f.metric === "변동성");
    const mean = factors.find(f => f.metric === "평균회귀 점수");
    return [
      `데이터가 보여주는 패턴에 따르면, ${stock.name}(${stock.symbol})은 통계적 차익거래 관점에서 종합 ${score}점입니다.`,
      mom ? `모멘텀 점수 ${mom.value.split(" ")[0]}은 ${mom.assessment === "positive" ? "가격 추세의 통계적 강도가 유의미하며, '시그널-노이즈 비율'이 양호합니다. 패턴이 수익을 줄 확률이 높습니다" : "추세 신호가 약하여, 통계적 유의성을 확보하지 못했습니다"}.` : "",
      vol ? `변동성 ${vol.value.split(" ")[0]}은 ${vol.assessment === "positive" ? "트레이딩에 적합한 범위로, 포지션 사이징과 리스크 관리가 계산 가능합니다" : "변동성이 적정 범위를 벗어나 있어, 모델의 예측 정확도가 저하될 수 있습니다"}.` : "",
      mean ? `평균회귀 점수 ${mean.value.split(" ")[0]}은 ${mean.assessment === "positive" ? "과매도/과매수 상태로부터의 회귀 가능성이 감지됩니다. 이는 단기 수익 기회를 제공합니다" : "평균회귀 신호가 명확하지 않습니다"}.` : "",
      `"우리는 시장의 이유를 묻지 않는다. 패턴이 존재하고, 그것이 수익을 준다" — ${stock.name}에 대한 모든 포지션은 확률 분포와 기대값 계산에 기반합니다.`,
      `감정은 최악의 투자 도구입니다. ${stock.name}의 매매 결정은 통계적 우위가 확인된 경우에만 실행하며, 주관적 판단을 완전히 배제합니다.`,
      pos.length > 0 ? `통계적 강점: ${pos.join(", ")}. 이 시그널들이 수렴하여 양의 기대값을 형성합니다.` : "",
      neg.length > 0 ? `통계적 약점: ${neg.join(", ")}. 시그널 신뢰도가 임계값 미만이므로, 포지션 축소 또는 관망이 적절합니다.` : "",
      `'알파 디케이(Alpha Decay)' 모니터링: ${score >= 65 ? "현재 패턴의 지속성이 확인되어 포지션 유지가 합리적입니다" : "패턴 소멸 가능성이 있어 포지션 축소를 권고합니다"}.`,
      `"좋은 모델은 항상 직관보다 낫다" — 최종 점수 ${score}점은 순수 정량적 분석의 결과입니다.`,
    ];
  },

  minervini(stock, score, pos, neg, factors) {
    const trend = factors.find(f => f.metric === "추세 단계");
    const rs = factors.find(f => f.metric === "상대강도(RS)");
    const eps = factors.find(f => f.metric === "EPS 성장률");
    return [
      `이 종목의 현재 추세 단계를 보면, ${stock.name}(${stock.symbol})은 SEPA(Specific Entry Point Analysis) 관점에서 종합 ${score}점입니다.`,
      trend ? `추세 단계 분석: ${trend.value.split(" ")[0]}은 ${trend.assessment === "positive" ? "Stage 2(상승 추세)에 위치하여 매수 조건을 충족합니다. '슈퍼 퍼포먼스'의 대부분은 Stage 2에서 발생합니다" : "Stage 2가 아닌 구간으로, 'Stage 4에서는 절대 매수하지 마라'는 원칙에 따라 진입을 보류합니다"}.` : "",
      rs ? `상대강도(RS) ${rs.value.split(" ")[0]}은 ${rs.assessment === "positive" ? "시장 대비 상위 20% 이상의 강한 모멘텀을 보이며, '시장의 진짜 리더'로 확인됩니다" : "상대강도가 기준에 미달하여, 시장 리더가 아닌 지연주(Laggard)로 분류됩니다"}.` : "",
      eps ? `EPS 성장률 ${eps.value.split(" ")[0]}%는 ${eps.assessment === "positive" ? "분기 이익이 가속 성장하고 있어, 기관 투자자의 관심을 끌 '실적 서프라이즈'의 토대가 됩니다" : "이익 성장이 주가 상승을 뒷받침하지 못하고 있습니다"}.` : "",
      `VCP(Volatility Contraction Pattern) 분석: ${score >= 70 ? "변동성이 수축하며 타이트한 베이스를 형성하고 있어, '피봇 포인트'가 임박했을 가능성이 높습니다" : "아직 명확한 VCP 패턴이 확인되지 않아 인내심이 필요합니다"}.`,
      `"큰 손실은 항상 작은 손실에서 시작된다" — ${stock.name}에 대한 손절 라인은 매수가 대비 -7~8%로 엄격히 설정됩니다. 이것은 타협할 수 없는 규칙입니다.`,
      pos.length > 0 ? `SEPA 통과 지표: ${pos.join(", ")}. 이 지표들이 슈퍼 퍼포먼스의 전제 조건을 형성합니다.` : "",
      neg.length > 0 ? `SEPA 미달 지표: ${neg.join(", ")}. "손절은 보험이다 — 보험 없이 운전하지 마라."` : "",
      `리스크/리워드 비율: ${score >= 65 ? "최소 3:1 이상으로, 비대칭적 수익 구조가 확인됩니다. 진입 권고합니다." : "현재 리스크/리워드가 불리하여, 더 나은 진입 시점을 기다리는 것이 현명합니다."}`,
      `"대부분의 큰 수익은 처음 매수한 후 겪는 불편함 속에서 탄생한다" — 규칙을 따르고, 시장 리더를 추적하십시오.`,
    ];
  },

  soros(stock, score, pos, neg, factors) {
    return [
      `현재 시장의 반사성 구조를 분석하면, ${stock.name}(${stock.symbol})은 글로벌 매크로 + 반사성 이론 관점에서 종합 ${score}점입니다.`,
      `"시장은 항상 틀리며, 이것이 돈을 벌 수 있는 이유다" — ${stock.name}에서 시장 참여자의 인식과 현실 사이의 괴리가 ${score >= 65 ? "수익 기회를 만들고 있습니다. 반사성 피드백 루프가 자기강화(Self-Reinforcing) 방향으로 작동하고 있습니다" : score >= 40 ? "아직 명확하게 형성되지 않았습니다. 가설을 세우되, 확증 편향을 경계해야 합니다" : "역방향으로 작동하고 있어, 하락 압력이 자기강화될 위험이 있습니다"}.`,
      `매크로 환경 분석: 금리, 환율, 지정학적 요인이 ${stock.name}에 미치는 영향을 평가하면, ${score >= 60 ? "정책 변곡점 또는 구조적 변화가 호재로 작용할 가능성이 있습니다" : "현재 매크로 환경이 이 종목에 불리하게 작용하고 있습니다"}.`,
      pos.length > 0 ? `반사성 강화 요인: ${pos.join(", ")}. 이 요소들이 '붐(Boom)' 사이클의 초기 신호일 수 있습니다.` : "",
      neg.length > 0 ? `반사성 약화 요인: ${neg.join(", ")}. '버스트(Bust)' 전환 위험을 모니터링해야 합니다.` : "",
      `"중요한 것은 맞고 틀림이 아니라, 맞을 때 얼마를 벌고 틀릴 때 얼마를 잃느냐이다" — ${stock.name}에 대한 비대칭 베팅의 리스크/리워드 프로파일이 핵심입니다.`,
      `참여자들의 편향이 만들어낸 불균형은, ${score >= 65 ? "추세 추종과 레버리지를 적절히 활용하면 상당한 수익 기회가 됩니다" : "아직 명확한 편향의 방향이 확인되지 않아, 소규모 시험 포지션만 권고합니다"}.`,
      `"나는 틀릴 수 있다는 사실을 인정함으로써 살아남았다" — 가설이 틀렸다면 즉시 포지션을 청산하는 유연성이 필수적입니다.`,
      `최종 판단: ${score >= 65 ? "반사성 기반 매수 가설이 유효합니다" : score >= 40 ? "가설 수립 단계이며, 확증 대기 중입니다" : "현재 가설이 부정되어 포지션 보유가 부적절합니다"}.`,
    ];
  },

  fisher(stock, score, pos, neg, factors) {
    const rg = factors.find(f => f.metric === "매출성장률");
    const rnd = factors.find(f => f.metric === "R&D 투자 비중");
    const om = factors.find(f => f.metric === "영업이익률");
    return [
      `스컬틀버트 조사 결과, ${stock.name}(${stock.symbol})은 장기 성장주 집중 투자 관점에서 종합 ${score}점입니다.`,
      rg ? `매출성장률 ${rg.value.split(" ")[0]}%는 ${rg.assessment === "positive" ? "지속적 성장 궤도에 있으며, 시장 확대가 경영진의 비전에 의해 주도되고 있음을 보여줍니다" : "성장 속도가 기대에 미달하여, 경쟁 우위의 지속성에 의문이 있습니다"}.` : "",
      rnd ? `R&D 투자 비중 ${rnd.value.split(" ")[0]}%는 ${rnd.assessment === "positive" ? "미래를 위한 투자가 충분하여, '나무를 심고 평생 그늘을 즐기는' 경영 철학이 확인됩니다" : "혁신 투자가 부족하여, 장기적 경쟁력 약화 위험이 있습니다"}.` : "",
      om ? `영업이익률 ${om.value.split(" ")[0]}%는 ${om.assessment === "positive" ? "높은 가격 결정력과 효율적 경영의 증거이며, 이는 '독보적인 영업망 가치'와 직결됩니다" : "마진 개선 여지가 있으며, 경영진의 비용 관리 능력을 추가로 평가해야 합니다"}.` : "",
      `필립 피셔의 '15가지 포인트' 중 핵심은 '경영진의 무결성'과 '장기 잠재력'입니다. ${stock.name}은 ${score >= 60 ? "이 기준들을 상당 부분 충족합니다" : "일부 기준에서 추가 확인이 필요합니다"}.`,
      `"위대한 기업을 찾았다면 시간이 당신의 편이다" — ${stock.name}이 진정한 위대한 기업인지는 ${pos.length > 0 ? `${pos.join(", ")} 등의 지표가 입증하고 있습니다` : "아직 데이터가 충분하지 않습니다"}.`,
      neg.length > 0 ? `우려 영역: ${neg.join(", ")}. "실수 중 가장 흔한 것은 좋은 주식을 너무 일찍 파는 것이다" — 그러나 나쁜 주식을 너무 오래 보유하는 것도 경계해야 합니다.` : "",
      `스컬틀버트(발로 뛰는 조사) 관점에서, 고객, 경쟁사, 업계 전문가의 평가를 종합적으로 고려해야 최종 판단이 완성됩니다.`,
      `최종 권고: ${score >= 65 ? "장기 보유 후보로 편입을 권고합니다. 좋은 기업은 파는 것이 아니라 보유하는 것입니다." : "현재로서는 추가 스컬틀버트 조사 후 재평가를 권고합니다."}`,
    ];
  },

  graham(stock, score, pos, neg, factors) {
    const pe = factors.find(f => f.metric === "P/E");
    const pb = factors.find(f => f.metric === "P/B");
    const cr = factors.find(f => f.metric === "유동비율");
    const de = factors.find(f => f.metric === "부채비율");
    const dy = factors.find(f => f.metric === "배당수익률");
    return [
      `안전마진의 관점에서 이 종목을 분석하면, ${stock.name}(${stock.symbol})은 딥 밸류(Deep Value) 관점에서 종합 ${score}점입니다.`,
      pe ? `P/E ${pe.value.split(" ")[0]}배는 ${pe.assessment === "positive" ? "방어적 투자자의 기준(15배 이하)을 충족하며, Mr. Market이 이 기업에 대해 비관적 가격을 제시하고 있어 안전마진이 확보됩니다" : "밸류에이션이 보수적 기준을 초과하여, '투자의 첫 번째 규칙은 돈을 잃지 않는 것'이라는 원칙에 비추어 주의가 필요합니다"}.` : "",
      pb ? `P/B ${pb.value.split(" ")[0]}배는 ${pb.assessment === "positive" ? "순자산 가치 대비 저평가되어, Net-Net 투자 조건에 근접합니다. 이것이 바로 '안전마진이라는 방탄조끼'입니다" : "자산가치 대비 프리미엄이 존재하여, 추가적인 안전마진 확보가 필요합니다"}.` : "",
      de ? `부채비율 ${de.value.split(" ")[0]}은 ${de.assessment === "positive" ? "보수적 재무구조로, 경기 침체에도 생존 가능한 재무 건전성을 유지합니다" : "과도한 부채는 기업의 생존력을 위협합니다"}.` : "",
      dy ? `배당수익률 ${dy.value.split(" ")[0]}%는 ${dy.assessment === "positive" ? "안정적 배당 이력이 가치의 증거이며, 주주 환원 의지가 확인됩니다" : "배당 수준이 방어적 투자자의 기대에 미달합니다"}.` : "",
      cr ? `유동비율 ${cr.value.split(" ")[0]}은 ${cr.assessment === "positive" ? "단기 채무 상환 능력이 충분하여 재무 안전성이 확보됩니다" : "유동성 위험이 감지되어, 재무 안전성 검증이 필요합니다"}.` : "",
      `"Mr. Market — 조울증 환자인 사업 파트너"가 오늘 ${stock.name}에 제시하는 가격은 ${score >= 70 ? "극도로 비관적이며, 이것은 현명한 투자자에게 기회입니다" : score >= 50 ? "비교적 합리적이나, 추가 할인을 기다릴 인내심이 필요합니다" : "적정 수준이거나 고평가 상태입니다"}.`,
      pos.length > 0 ? `안전마진 확보 지표: ${pos.join(", ")}. 이 지표들은 원금 보존과 적절한 수익을 약속하는 근거입니다.` : "",
      neg.length > 0 ? `안전마진 미달 지표: ${neg.join(", ")}. "투자자의 가장 큰 적은 바로 자기 자신이다" — 감정에 의한 투자를 경계하십시오.` : "",
      `"단기적으로 시장은 투표 기계이지만, 장기적으로는 저울이다" — ${stock.name}의 내재가치가 시장 가격으로 회귀할 때까지 ${score >= 65 ? "인내심을 갖고 보유하는 전략이 적합합니다" : "현재 가격에서의 안전마진이 부족하므로, 추가 하락 시 재검토합니다"}.`,
    ];
  },

  taleb(stock, score, pos, neg, factors) {
    const tail = factors.find(f => f.metric === "꼬리 위험");
    const opt = factors.find(f => f.metric === "옵션성");
    const frag = factors.find(f => f.metric === "프래질리티");
    const debt = factors.find(f => f.metric === "부채 수준");
    return [
      `이 종목의 꼬리 위험 프로파일을 보면, ${stock.name}(${stock.symbol})은 바벨 전략 + 꼬리 위험 헤징 관점에서 종합 ${score}점입니다.`,
      tail ? `꼬리 위험 ${tail.value.split(" ")[0]}은 ${tail.assessment === "positive" ? "극단적 하방 리스크가 제한적이어서, '칠면조의 착각'에 빠질 위험이 낮습니다" : "숨겨진 꼬리 위험이 감지됩니다. '예측하지 마라, 대비하라'는 원칙이 더욱 중요합니다"}.` : "",
      opt ? `옵션성 ${opt.value.split(" ")[0]}은 ${opt.assessment === "positive" ? "상방 무제한, 하방 제한의 '볼록성(Convexity)'이 확보되어, 블랙 스완 이벤트 시 오히려 수혜를 받을 수 있습니다" : "비대칭적 수익 구조가 충분하지 않습니다"}.` : "",
      frag ? `프래질리티 ${frag.value.split(" ")[0]}은 ${frag.assessment === "positive" ? "외부 충격에 강하거나 오히려 더 강해지는 '안티프래질(Antifragile)' 특성이 있습니다" : "외부 충격에 취약한 '프래질(Fragile)' 구조로, 바벨 전략의 안전측이나 극단적 옵션측에 배치하기 어렵습니다"}.` : "",
      debt ? `부채 수준 ${debt.value.split(" ")[0]}은 ${debt.assessment === "positive" ? "낮은 부채로 블랙 스완 이벤트 시 생존 가능성이 높습니다" : "높은 부채는 블랙 스완에 치명적입니다"}.` : "",
      `"바람이 촛불을 끄지만 불을 키운다" — ${stock.name}은 ${score >= 65 ? "바벨 전략에서 명확한 역할(안전측 또는 극단적 옵션측)을 수행할 수 있습니다" : "바벨의 어느 쪽에도 적합하지 않은 '중간 지대'에 위치합니다. 중간은 가장 위험한 자리입니다"}.`,
      `'린디 효과(Lindy Effect)' — 오래 생존한 것은 더 오래 생존할 확률이 높습니다. ${stock.name}의 사업 모델 생존 이력을 기준으로 장기적 견고성을 평가해야 합니다.`,
      pos.length > 0 ? `안티프래질 특성: ${pos.join(", ")}. 이 요소들은 포트폴리오의 꼬리 위험 관리에 기여합니다.` : "",
      neg.length > 0 ? `프래질 위험: ${neg.join(", ")}. "당신이 이해하지 못하는 리스크가 당신을 죽인다."` : "",
      `최종 배분 판단: ${score >= 65 ? "바벨 전략의 구성요소로 소량 배분을 권고합니다. 최대 손실은 투자금으로 제한됩니다." : "현재 포트폴리오에서의 역할이 불분명하여 편입을 보류합니다."}`,
    ];
  },
};

function generateDetailedThesis(
  stock: StockMetrics,
  mentor: MentorProfile,
  score: number,
  factors: MentorVerdict["keyFactors"]
): string {
  const positives = factors.filter(f => f.assessment === "positive").map(f => f.metric);
  const negatives = factors.filter(f => f.assessment === "negative").map(f => f.metric);
  const template = MENTOR_THESIS_TEMPLATES[mentor.id];

  if (template) {
    return template(stock, score, positives, negatives, factors).filter(Boolean).join(" ");
  }

  const signalKo = score >= 85 ? "강력 매수" : score >= 65 ? "매수" : score >= 40 ? "관망" : score >= 20 ? "매도" : "강력 매도";
  return `${mentor.speechPatterns.openingPhrases[0]} ${stock.name}(${stock.symbol})은(는) ${mentor.style} 관점에서 종합 ${score}점으로 '${signalKo}' 판단입니다. ${positives.length > 0 ? `강점: ${positives.join(", ")}.` : ""} ${negatives.length > 0 ? `약점: ${negatives.join(", ")}.` : ""} ${mentor.philosophy.split(".")[0]}.`;
}

const MENTOR_RISK_TEMPLATES: Record<string, (stock: StockMetrics, score: number, negList: string, factors: MentorVerdict["keyFactors"]) => string> = {
  buffett(stock, score, negList, factors) {
    const de = factors.find(f => f.metric === "부채비율");
    const fcf = factors.find(f => f.metric === "FCF Yield");
    if (score >= 70) return `${stock.name}은 경제적 해자와 재무 건전성 측면에서 양호합니다. 다만, 해자의 침식 여부를 분기별로 확인하십시오. 경쟁사의 기술 혁신, 소비자 선호 변화, 규제 환경 변동이 해자를 약화시킬 수 있습니다. ${de?.assessment === "positive" ? "부채 수준은 안전하나, 금리 인상기에는 이자 비용 증가를 모니터링해야 합니다." : ""} ${fcf?.assessment !== "positive" ? "잉여현금흐름이 기대에 미달하면 배당·자사주매입 여력이 약화될 수 있습니다." : ""}`;
    if (score >= 40) return `${negList ? `${negList} 등이` : "일부 지표가"} 버핏의 핵심 기준에 미달합니다. 해자가 줄어들고 있는지, 경영진이 주주 가치를 훼손하는 자본 배분을 하고 있는지 확인이 필요합니다. 분할 매수로 평균 매입가를 낮추되, 해자 훼손이 확인되면 보유 이유가 사라집니다.`;
    return `${stock.name}은 현재 버핏의 '능력 범위' 밖에 있거나, 본질적 경쟁력이 심각하게 약화된 상태입니다. ${negList ? `특히 ${negList}이(가)` : "핵심 재무 지표들이"} 우량 기업의 기준에 크게 미달합니다. '원칙 1: 돈을 잃지 마라. 원칙 2: 원칙 1을 잊지 마라' — 원금 보존이 최우선입니다.`;
  },
  lynch(stock, score, negList, factors) {
    const peg = factors.find(f => f.metric === "PEG");
    if (score >= 70) return `${stock.name}은 GARP 기준에서 양호하나, 성장 스토리가 '변했는지' 분기별로 점검해야 합니다. 이익 성장 둔화, 재고 증가, 마진 축소가 동시에 나타나면 텐배거 시나리오가 후퇴하는 경고 신호입니다. ${peg?.assessment === "positive" ? "PEG가 양호하더라도 성장률 자체가 감소 추세이면 PEG는 빠르게 악화됩니다." : ""}`;
    if (score >= 40) return `${negList ? `${negList} 등의 지표가` : "일부 지표가"} 린치의 기준에 미달합니다. '풀을 뽑고 꽃에 물 주기'의 오류 — 손실 종목을 계속 보유하며 수익 종목을 일찍 매도하는 실수를 경계하십시오. 스토리가 변했다면 과감히 매도하십시오.`;
    return `린치의 관점에서 ${stock.name}은 투자 매력이 현저히 부족합니다. ${negList ? `${negList}이(가)` : "핵심 성장 지표들이"} 심각한 수준이며, '모르는 기업에 투자하는 것은 포커에서 카드를 보지 않고 베팅하는 것'입니다.`;
  },
  wood(stock, score, negList) {
    if (score >= 70) return `${stock.name}은 파괴적 혁신 잠재력이 확인되나, 기술 채택 곡선의 '캐즘(Chasm)' 리스크를 경계해야 합니다. 기술 과대평가 사이클(Gartner Hype Cycle)의 '환멸의 골짜기'에 빠질 가능성, 경쟁 기술의 등장, 규제 불확실성이 주요 리스크입니다. 5년 시간 지평에서의 TAM 실현 가능성을 분기별로 재평가하십시오.`;
    if (score >= 40) return `${negList ? `${negList} 등이` : "일부 지표가"} 기대에 미달합니다. 혁신 기업의 초기 재무 지표는 전통적 기준과 다르게 해석할 수 있으나, 매출 성장 둔화와 시장 점유율 하락이 동시에 나타나면 혁신 모멘텀 상실의 신호입니다.`;
    return `현재 ${stock.name}의 혁신 궤도에 심각한 의문이 있습니다. ${negList ? `${negList}이(가)` : "성장 지표들이"} ARK의 최소 기준에 미달하며, 파괴적 혁신이 실현되지 않을 위험이 높습니다.`;
  },
  dalio(stock, score, negList) {
    if (score >= 70) return `리스크 패리티 관점에서 ${stock.name}은 포트폴리오에 기여하나, 상관관계 급등(Correlation Spike) 리스크를 주의하십시오. 위기 시 모든 자산의 상관관계가 1로 수렴하는 현상이 발생할 수 있으며, 이때 리스크 패리티 전략의 효과가 일시적으로 약화됩니다. 경제 사이클 전환기에는 자산 비중 재조정이 필수적입니다.`;
    if (score >= 40) return `${negList ? `${negList} 등이` : "일부 지표가"} 최적 배분 기준에 미달합니다. 현재 경제 사이클(성장/인플레이션 조합)에서 이 자산의 역할을 재검토하고, 분산 효과가 약화되었다면 비중을 축소하십시오.`;
    return `${stock.name}은 현재 리스크/리워드 프로파일이 포트폴리오 최적화에 부적합합니다. ${negList ? `${negList}이(가)` : "핵심 지표들이"} 사계절 포트폴리오의 어떤 시즌에도 맞지 않습니다.`;
  },
  simons(stock, score, negList) {
    if (score >= 70) return `통계적 시그널이 양호하나, 알파 디케이(Alpha Decay) 모니터링이 필수입니다. 발견된 패턴의 수익성은 시간이 지남에 따라 감소하며, 시장 미시구조(Market Microstructure) 변화가 기존 모델을 무효화할 수 있습니다. 거래 비용과 슬리피지를 항상 수익에서 차감하여 순수익을 계산하십시오.`;
    if (score >= 40) return `${negList ? `${negList} 등의` : "일부"} 시그널이 임계값 미만입니다. 시그널 강도가 약할 때 포지션을 취하면 '노이즈 트레이딩'이 되어 기대값이 음수로 전환됩니다. 명확한 통계적 우위가 확인될 때까지 관망하십시오.`;
    return `${stock.name}에서 유의미한 통계적 패턴이 감지되지 않습니다. 시그널 없이 포지션을 취하는 것은 순수한 도박입니다.`;
  },
  minervini(stock, score, negList) {
    if (score >= 70) return `SEPA 조건이 양호하나, 매수 후 -7~8% 하락 시 예외 없이 손절하는 규칙을 사전에 설정하십시오. 피봇 포인트 돌파 후 거래량이 수반되지 않으면 가짜 브레이크아웃(Fakeout) 가능성이 있습니다. 3~4차 VCP 수축이 가장 신뢰도 높은 진입 시점입니다.`;
    if (score >= 40) return `${negList ? `${negList} 등이` : "일부 지표가"} SEPA 기준에 미달합니다. Stage 2가 아닌 구간에서의 매수는 '하락하는 칼날 잡기'입니다. 추세가 확인될 때까지 인내심을 갖고 기다리며, 절대 평균 매입가를 낮추려 추가 매수하지 마십시오.`;
    return `${stock.name}은 Stage 4(하락 추세) 또는 추세 미확인 구간에 있습니다. 이 구간에서의 매수는 미너비니의 모든 원칙에 위배됩니다. '대부분의 큰 손실은 작은 손실을 방치한 결과'입니다.`;
  },
  soros(stock, score, negList) {
    if (score >= 70) return `반사성 피드백이 자기강화 방향으로 작동하고 있으나, 전환점(Tipping Point) 감시가 필수입니다. 시장 참여자의 편향이 극단에 달하면 자기부정(Self-Defeating) 피드백으로 반전됩니다. 레버리지 포지션은 가설이 확증된 범위 내에서만 유지하고, 증거가 가설과 모순되면 즉시 축소하십시오.`;
    if (score >= 40) return `${negList ? `${negList} 등이` : "일부 시그널이"} 가설을 뒷받침하지 않습니다. 반사성 피드백의 방향이 불분명할 때 대규모 베팅은 자살 행위입니다. 소규모 시험 포지션으로 가설을 검증한 후 확대하십시오.`;
    return `가설이 부정된 상태입니다. '나는 틀릴 수 있다는 사실을 인정함으로써 살아남았다' — 즉시 포지션을 청산하고, 새로운 가설이 형성될 때까지 관망하십시오.`;
  },
  fisher(stock, score, negList) {
    if (score >= 70) return `스컬틀버트 조사 결과가 긍정적이나, 경영진 교체, R&D 방향 전환, 핵심 인력 이탈 등 정성적 변화를 지속적으로 모니터링하십시오. 산업 내 기술 패러다임 전환이 기존 경쟁 우위를 무력화할 수 있으며, 경쟁사의 R&D 투자 동향도 추적해야 합니다.`;
    if (score >= 40) return `${negList ? `${negList} 등이` : "일부 지표가"} 장기 성장 잠재력에 의문을 제기합니다. 매출 성장 둔화, R&D 효율성 저하, 경영진의 단기 실적 추구가 동시에 나타나면 '위대한 기업'의 자격을 잃고 있다는 신호입니다.`;
    return `피셔의 15가지 포인트 기준에서 ${stock.name}은 심각하게 미달합니다. '실수 중 가장 흔한 것은 좋은 주식을 너무 일찍 파는 것이다' — 그러나 나쁜 기업을 붙잡고 있는 것은 더 큰 실수입니다.`;
  },
  graham(stock, score, negList, factors) {
    const pe = factors.find(f => f.metric === "P/E");
    const pb = factors.find(f => f.metric === "P/B");
    if (score >= 70) return `안전마진이 확보되었으나, 가치 함정(Value Trap) 여부를 확인하십시오. 저평가된 이유가 일시적(시장 과매도)인지 구조적(사업 모델 붕괴)인지 구분이 중요합니다. ${pe?.assessment === "positive" ? "P/E가 낮더라도 이익이 감소 추세이면 실질 P/E는 상승합니다." : ""} ${pb?.assessment === "positive" ? "P/B가 낮더라도 자산의 실질 가치(청산가치)를 별도로 확인해야 합니다." : ""}`;
    if (score >= 40) return `${negList ? `${negList} 등이` : "일부 지표가"} 방어적 투자자의 기준에 미달합니다. 안전마진이 부족한 상태에서의 매수는 투자가 아닌 투기입니다. 추가 하락으로 안전마진이 확보될 때까지 인내하십시오.`;
    return `${stock.name}은 그레이엄의 가치 투자 기준에 심각하게 미달합니다. '투자자의 가장 큰 적은 바로 자기 자신이다' — 감정적 매수 충동을 경계하고, 원금 보존을 최우선으로 하십시오.`;
  },
  taleb(stock, score, negList) {
    if (score >= 70) return `바벨 전략 내 역할이 명확하나, '칠면조의 착각'을 경계하십시오. 과거에 안전했다는 사실이 미래의 안전을 보장하지 않습니다. 꼬리 위험은 과거 데이터에 나타나지 않는 경우가 대부분이며, 숨겨진 레버리지나 복잡한 파생상품 노출이 없는지 확인해야 합니다.`;
    if (score >= 40) return `${negList ? `${negList} 등이` : "일부 지표가"} 안티프래질 조건에 미달합니다. 바벨의 어느 측에도 적합하지 않은 '중간 지대'의 자산은 가장 위험합니다. 볼록성(Convexity)이 확보되지 않으면 편입하지 마십시오.`;
    return `${stock.name}은 프래질(Fragile)한 구조입니다. 높은 부채, 복잡한 사업 구조, 숨겨진 꼬리 위험이 결합되면 블랙 스완 이벤트 시 회복 불가능한 손실을 초래할 수 있습니다.`;
  },
};

function generateRiskWarning(
  stock: StockMetrics,
  mentor: MentorProfile,
  score: number,
  factors: MentorVerdict["keyFactors"]
): string {
  const negatives = factors.filter(f => f.assessment === "negative");
  const negList = negatives.map(n => n.metric).join(", ");
  const template = MENTOR_RISK_TEMPLATES[mentor.id];
  if (template) return template(stock, score, negList, factors);

  if (score >= 70) return `${mentor.nameKo}의 핵심 기준에서 전반적으로 양호합니다. 시장 환경 변화, 경쟁 심화, 규제 리스크 등을 지속 모니터링하십시오.`;
  if (score >= 40) return `${negList ? `${negList} 등의 지표가` : "일부 지표가"} 기준에 미달합니다. 약점이 구조적인지 일시적인지 분석 후 진입을 결정하십시오.`;
  return `높은 위험이 감지됩니다. ${negList ? `특히 ${negList}이(가)` : "핵심 지표들이"} 심각한 수준입니다. 원금 손실에 대비하십시오.`;
}

const MENTOR_ACTION_TEMPLATES: Record<string, (stock: StockMetrics, signal: Signal, score: number, factors: MentorVerdict["keyFactors"]) => string> = {
  buffett(stock, signal, score, factors) {
    const pos = factors.filter(f => f.assessment === "positive").map(f => f.metric);
    switch (signal) {
      case "STRONG_BUY": return `내재가치 대비 현저한 할인 구간입니다. ${pos.length > 0 ? `${pos.join(", ")} 등` : "핵심 지표"}이 우량 기업의 모든 조건을 충족합니다. 포트폴리오 비중 5~10%까지 적극 매수하되, 한 번에 전량 매수하기보다 2~3회 분할 매수로 평균 단가를 최적화하십시오. 매수 후 최소 5년 이상 보유를 전제로 합니다.`;
      case "BUY": return `적정 가치 대비 합리적 할인이 확인됩니다. 포트폴리오 비중 3~5%로 1차 매수 후, 추가 하락 시 2차 매수 기회를 확보하십시오. 분기별 실적 발표에서 ROE, 영업이익률, FCF 추이를 확인하여 해자 건전성을 점검합니다.`;
      case "HOLD": return `현재 가격은 적정 수준이나, 추가 매수의 안전마진이 부족합니다. 기존 보유분은 유지하되 추가 매수는 10% 이상 하락 시로 한정하십시오. '좋은 공을 기다리는 타자'처럼 인내심을 갖고 더 나은 기회를 기다리십시오.`;
      case "SELL": return `해자 약화 또는 밸류에이션 과열 징후가 감지됩니다. 포지션의 50%를 먼저 축소하고, 향후 1~2분기 실적에서 개선 여부를 확인한 후 잔여분 처리를 결정하십시오.`;
      case "STRONG_SELL": return `핵심 경쟁력 상실 또는 재무 건전성 심각 악화가 확인됩니다. 즉시 전량 매도하고 현금을 확보하십시오. '첫 번째 손실이 가장 싼 손실'입니다.`;
    }
  },
  lynch(stock, signal, score, factors) {
    switch (signal) {
      case "STRONG_BUY": return `텐배거 후보입니다! PEG가 매력적이고 성장 스토리가 초기 단계입니다. 포트폴리오 비중 5~8%로 적극 매수하십시오. 이 종목의 '스토리'를 한 문장으로 정리하고, 스토리가 유효한 한 보유를 지속하십시오. 분기 실적 발표마다 이익 성장률의 가속 여부를 확인합니다.`;
      case "BUY": return `성장 대비 합리적 가격입니다. 3~5% 비중으로 매수하되, PEG 비율이 1.0을 넘어서면 추가 매수를 중단하십시오. 매출-이익 성장의 동행 여부, 재고 수준 변화를 주시하십시오.`;
      case "HOLD": return `현재 성장과 가격의 균형 상태입니다. '꾸준한 성장주(Stalwart)'로 분류하여 보유를 유지하되, 30~50% 수익 시 일부 차익 실현을 고려하십시오. 성장률이 한 자릿수로 둔화되면 포지션 재검토가 필요합니다.`;
      case "SELL": return `성장 스토리가 변하고 있습니다. PEG 상승, 이익 성장 둔화, 재고 증가가 감지되면 보유 이유가 사라지고 있다는 신호입니다. 포지션 50% 이상 축소를 권고합니다.`;
      case "STRONG_SELL": return `스토리가 완전히 무너졌습니다. 즉시 전량 매도하십시오. '잡초를 뽑고 꽃에 물 주기' — 손실 종목에 집착하지 말고, 새로운 텐배거 후보를 찾으십시오.`;
    }
  },
  wood(stock, signal) {
    switch (signal) {
      case "STRONG_BUY": return `파괴적 혁신의 S-curve 변곡점에 위치합니다. 5년 시간 지평으로 포트폴리오 비중 5~10% 적극 매수하십시오. 단기 변동성(-30~40%)은 정상적이며, 오히려 추가 매수 기회입니다. Wright's Law에 의한 비용 하락 곡선이 가속되고 있는지 분기별로 확인합니다.`;
      case "BUY": return `혁신 잠재력이 확인됩니다. 3~5% 비중으로 매수하되, 기술 채택률(Adoption Rate)과 TAM 확장 속도를 모니터링하십시오. 경쟁 기술의 등장 여부도 추적해야 합니다.`;
      case "HOLD": return `혁신 궤도에 있으나 확증이 부족합니다. 기존 포지션은 유지하되, 기술 검증 마일스톤(상용화, 규모의 경제 달성 등)이 확인되면 추가 매수를 고려하십시오.`;
      case "SELL": return `혁신 모멘텀이 약화되고 있습니다. 경쟁사가 유사한 기술을 더 빠르게 상용화하거나, TAM 전망이 하향 조정되었다면 포지션 축소가 합리적입니다.`;
      case "STRONG_SELL": return `기술적 경쟁 우위가 상실되었거나, 파괴적 혁신 가설이 부정되었습니다. 매몰 비용에 집착하지 말고 즉시 매도하여 더 유망한 혁신 기업으로 자본을 재배치하십시오.`;
    }
  },
  dalio(stock, signal) {
    switch (signal) {
      case "STRONG_BUY": return `현재 경제 사이클에서 최적의 리스크/리워드를 제공합니다. 리스크 패리티 프레임워크 내에서 비중을 상향(위험 기여도 기준 10~15%)하되, 포트폴리오 전체의 상관관계 매트릭스를 재계산하여 분산 효과를 확인하십시오.`;
      case "BUY": return `사계절 포트폴리오의 현 시즌에 적합합니다. 위험 기여도 기준 5~10% 비중으로 편입하고, 분기별 리밸런싱 시 비중을 조정하십시오.`;
      case "HOLD": return `현재 비중을 유지하되, 경제 사이클 전환 신호(금리 전환점, 인플레이션 추세 변화)가 감지되면 즉시 비중을 재조정하십시오. 상관관계 급등(Correlation Spike) 시 일시적 헤지를 고려합니다.`;
      case "SELL": return `현재 경제 환경에서 리스크/리워드가 불리합니다. 위험 기여도를 절반으로 축소하고, 역의 경제 시즌에 적합한 자산으로 비중을 이전하십시오.`;
      case "STRONG_SELL": return `사계절 포트폴리오의 어떤 시즌에도 부적합합니다. 전량 매도 후 국채, 금 등 안전자산으로 즉시 대체하십시오. 포트폴리오 전체의 최대 하락폭(Max Drawdown)을 재계산합니다.`;
    }
  },
  simons(stock, signal) {
    switch (signal) {
      case "STRONG_BUY": return `복수의 독립적 시그널이 수렴하여 강한 양의 기대값을 형성합니다. 계산된 포지션 크기로 진입하되, 최대 손실을 포트폴리오의 1% 이내로 제한하십시오. 시그널 강도가 약화되면 자동으로 포지션을 축소하는 규칙을 사전 설정합니다.`;
      case "BUY": return `통계적 우위가 확인됩니다. 기본 포지션 크기로 진입하고, 24~48시간 내 시그널 강화 여부에 따라 포지션을 조정하십시오. 거래 비용을 차감한 순기대값이 양수인지 반드시 확인합니다.`;
      case "HOLD": return `시그널이 중립 영역입니다. 기존 포지션은 유지하되 추가 진입은 보류합니다. 새로운 데이터 유입에 따른 시그널 변화를 실시간 모니터링하십시오.`;
      case "SELL": return `시그널이 약화되어 기대값이 축소되고 있습니다. 포지션의 70%를 청산하고, 잔여분은 역추세 시그널이 확인되면 즉시 청산하십시오.`;
      case "STRONG_SELL": return `시그널이 반전되었거나 소멸되었습니다. 모든 포지션을 즉시 청산하고, 알파 디케이로 인한 모델 무효화 여부를 점검하십시오. 감정적 판단 개입 없이 시스템 규칙에 따라 실행합니다.`;
    }
  },
  minervini(stock, signal) {
    switch (signal) {
      case "STRONG_BUY": return `Stage 2 상승 추세 + VCP 패턴 + RS 상위 20% — 슈퍼 퍼포먼스의 전제 조건이 충족됩니다. 피봇 포인트 돌파 시 거래량 150%+ 증가를 확인하고 매수하십시오. 손절 라인을 매수가 -7%에 즉시 설정합니다. 리스크/리워드 최소 3:1을 확인 후 진입합니다.`;
      case "BUY": return `추세와 모멘텀이 양호합니다. 피봇 포인트 근처에서 1차 매수(계획 비중의 50%) 후, 추세 확인 시 2차 매수(나머지 50%)를 실행하십시오. 손절 -7~8% 규칙은 절대 타협 불가입니다.`;
      case "HOLD": return `추세는 유지되나 신규 진입에 최적인 위치가 아닙니다. 보유 중이라면 20일/50일 이동평균선 위에서 유지하고, 이동평균선 이탈 시 포지션 축소를 시작하십시오.`;
      case "SELL": return `추세 약화 징후 — RS 하락, 거래량 없는 반등, 이동평균선 하향 이탈이 감지됩니다. 즉시 포지션 50% 이상 축소하십시오. '보험 없이 운전하지 마라' — 손절 규칙을 실행합니다.`;
      case "STRONG_SELL": return `Stage 4(하락 추세) 진입 또는 손절 라인 이탈입니다. 예외 없이 전량 즉시 매도하십시오. 평균 매입가를 낮추려는 추가 매수는 절대 하지 마십시오. '큰 손실은 항상 작은 손실에서 시작됩니다.'`;
    }
  },
  soros(stock, signal) {
    switch (signal) {
      case "STRONG_BUY": return `반사성 피드백이 자기강화(Boom) 방향으로 강하게 작동 중입니다. 확신이 높다면 레버리지를 적용하여 포지션을 확대하되, 가설 부정 시 즉시 청산할 수 있는 유동성을 확보하십시오. '맞을 때 크게 벌어야 한다' — 기회의 크기에 비례하여 베팅 크기를 키우십시오.`;
      case "BUY": return `매크로 환경과 반사성 구조가 유리합니다. 중간 크기의 포지션으로 진입하고, 가설이 추가로 확증되면 포지션을 점진적으로 확대하십시오. 핵심 가설을 한 문장으로 명확히 정의하고 기록하십시오.`;
      case "HOLD": return `가설 수립 단계입니다. 소규모 시험 포지션으로 시장의 반응을 관찰하되, 확증 없이 포지션을 확대하지 마십시오. 반사성 피드백의 방향이 확인될 때까지 인내하십시오.`;
      case "SELL": return `반사성 피드백이 약화되고 있거나 반전 징후가 감지됩니다. 포지션을 단계적으로 축소하고, 핵심 가설의 유효성을 재평가하십시오.`;
      case "STRONG_SELL": return `가설이 완전히 부정되었습니다. 모든 포지션을 즉시 청산하십시오. '나는 틀릴 수 있다는 사실을 인정함으로써 살아남았다' — 손실을 인정하고 새로운 가설을 세우는 것이 다음 단계입니다.`;
    }
  },
  fisher(stock, signal) {
    switch (signal) {
      case "STRONG_BUY": return `스컬틀버트 조사 결과 탁월한 성장 기업의 조건을 충족합니다. 포트폴리오의 핵심 보유로 5~10% 비중 매수 후, 최소 10년 이상 보유를 계획하십시오. 분기별로 R&D 투자 효율성, 신제품 파이프라인, 경영진의 비전 실행력을 점검합니다.`;
      case "BUY": return `성장 잠재력이 확인됩니다. 3~5% 비중으로 매수하고, 매출 성장 가속, 마진 확대, 경쟁 우위 강화 추이를 확인하며 점진적으로 비중을 높이십시오.`;
      case "HOLD": return `좋은 기업이나 추가 스컬틀버트 조사가 필요합니다. 경쟁사, 고객, 공급업체 평가를 종합하여 '15가지 포인트' 충족 여부를 재확인한 후 추가 매수를 결정하십시오.`;
      case "SELL": return `성장 둔화, R&D 효율성 저하, 경영진 교체 등 질적 변화가 감지됩니다. 포지션 50%를 축소하고 향후 2~3분기 추이를 관찰하십시오. '좋은 주식을 너무 일찍 파는 것'이 아닌지 신중히 판단합니다.`;
      case "STRONG_SELL": return `위대한 기업의 자격을 상실했습니다. R&D 방향 상실, 핵심 인재 이탈, 시장 지위 급락이 확인되면 전량 매도하십시오. 감정적 애착을 배제하고, 더 탁월한 기업으로 자본을 이동합니다.`;
    }
  },
  graham(stock, signal, score, factors) {
    const pe = factors.find(f => f.metric === "P/E");
    switch (signal) {
      case "STRONG_BUY": return `안전마진이 충분히 확보된 딥 밸류 구간입니다. ${pe ? `P/E ${pe.value.split(" ")[0]}배로` : "밸류에이션이"} 방어적 투자자의 모든 기준을 충족합니다. 포트폴리오 비중 5%까지 매수하되, 최소 20~30 종목에 분산하는 그레이엄 원칙을 준수하십시오. 안전마진이 소진(내재가치 도달)되면 매도합니다.`;
      case "BUY": return `적절한 안전마진이 확인됩니다. 분산 포트폴리오의 일부로 편입하되, 단일 종목 비중을 5%로 제한하십시오. 분기별로 재무 건전성(유동비율, 부채비율) 악화 여부를 점검합니다.`;
      case "HOLD": return `현재 가격은 내재가치 근처입니다. 추가 안전마진 확보를 위해 10~20% 추가 하락 시 매수를 고려하십시오. 기존 보유분은 내재가치 20% 이상 상회 시 매도합니다.`;
      case "SELL": return `안전마진이 소진되었거나 재무 건전성이 악화되고 있습니다. 내재가치를 재계산하고, 현재 가격이 내재가치를 상회하면 매도하여 안전마진이 확보된 다른 종목으로 교체하십시오.`;
      case "STRONG_SELL": return `심각한 과대평가 또는 재무 위험이 감지됩니다. 즉시 매도하고 국채 등 안전 자산으로 전환하십시오. '투자의 첫 번째 규칙은 돈을 잃지 않는 것, 두 번째 규칙은 첫 번째 규칙을 잊지 않는 것'입니다.`;
    }
  },
  taleb(stock, signal) {
    switch (signal) {
      case "STRONG_BUY": return `바벨 전략의 극단적 옵션 측(10~15%)에 적합합니다. 최대 손실이 투자금으로 한정되는 구조(옵션, 소량 배분)로 진입하십시오. 블랙 스완 이벤트 시 10배 이상 수익이 가능한 비대칭 구조인지 확인합니다. 포트폴리오 전체의 85~90%는 반드시 초안전 자산(단기 국채)으로 유지하십시오.`;
      case "BUY": return `안티프래질 특성이 확인됩니다. 바벨의 옵션 측에 3~5% 배분하되, 개별 포지션의 최대 손실을 포트폴리오의 1%로 제한하십시오. 볼록성(Convexity) — 손실은 제한, 수익은 무제한인 구조인지 확인합니다.`;
      case "HOLD": return `바벨 전략 내 역할이 불분명합니다. 안전 측이라면 원금 보존 기능을 재확인하고, 옵션 측이라면 충분한 볼록성이 있는지 검증하십시오. 중간 지대에 있다면 포지션을 정리하는 것이 바람직합니다.`;
      case "SELL": return `프래질리티가 증가하고 있습니다. 바벨 구조의 균형이 깨지기 전에 포지션을 축소하십시오. 안전 측 자산 비중을 다시 85~90%로 회복시킵니다.`;
      case "STRONG_SELL": return `블랙 스완 취약성이 극도로 높습니다. 즉시 전량 매도하십시오. '당신이 이해하지 못하는 리스크가 당신을 죽인다' — 복잡하고 불투명한 리스크 구조는 가장 위험합니다.`;
    }
  },
};

function generateAction(
  mentor: MentorProfile,
  signal: Signal,
  stock: StockMetrics,
  score: number,
  factors: MentorVerdict["keyFactors"]
): string {
  const template = MENTOR_ACTION_TEMPLATES[mentor.id];
  if (template) return template(stock, signal, score, factors);
  switch (signal) {
    case "STRONG_BUY": return mentor.stateLogic.strongBuy;
    case "BUY": return mentor.stateLogic.buy;
    case "HOLD": return mentor.stateLogic.hold;
    case "SELL": return mentor.stateLogic.sell;
    case "STRONG_SELL": return mentor.stateLogic.strongSell;
  }
}

/* ── Evaluate from ALL mentors ── */
export function evaluateStockAllMentors(stock: StockMetrics): MentorVerdict[] {
  return Object.keys(MENTOR_MAP).map((id) => evaluateStock(stock, id));
}

/* ── Market Condition Guides ── */
export type MarketCondition = "panic" | "rally" | "normal";

export function getMentorGuide(mentorId: string, condition: MarketCondition) {
  const mentor = MENTOR_MAP[mentorId];
  if (!mentor) return null;
  if (condition === "panic") return mentor.panicGuide;
  if (condition === "rally") return mentor.rallyGuide;
  return { mindset: mentor.philosophy, action: mentor.stateLogic.hold, quote: mentor.signatureQuotes[0] };
}

/* ── Portfolio Construction Model ── */
export interface InvestorModel {
  id: string;
  name: string;
  nameKo: string;
  style: string;
  philosophy: string;
  portfolioRules: PortfolioRules;
  decisionTriggers: DecisionTriggers;
  sources: InvestorSources;
}

export function getInvestorModel(mentorId: string): InvestorModel | null {
  const mentor = MENTOR_MAP[mentorId];
  if (!mentor) return null;
  return {
    id: mentor.id,
    name: mentor.name,
    nameKo: mentor.nameKo,
    style: mentor.style,
    philosophy: mentor.philosophy,
    portfolioRules: mentor.portfolioRules,
    decisionTriggers: mentor.decisionTriggers,
    sources: mentor.sources,
  };
}

export function getAllInvestorModels(): InvestorModel[] {
  return Object.values(MENTOR_MAP).map(mentor => ({
    id: mentor.id,
    name: mentor.name,
    nameKo: mentor.nameKo,
    style: mentor.style,
    philosophy: mentor.philosophy,
    portfolioRules: mentor.portfolioRules,
    decisionTriggers: mentor.decisionTriggers,
    sources: mentor.sources,
  }));
}

export function shouldBuy(mentorId: string, stock: StockMetrics): { should: boolean; reason: string; triggerMatched: string | null } {
  const mentor = MENTOR_MAP[mentorId];
  if (!mentor) return { should: false, reason: "Unknown mentor", triggerMatched: null };

  const verdict = evaluateStock(stock, mentorId);
  const isBuySignal = verdict.signal === "STRONG_BUY" || verdict.signal === "BUY";

  if (!isBuySignal) {
    return { should: false, reason: `Score ${verdict.score} below buy threshold. Signal: ${verdict.signal}`, triggerMatched: null };
  }

  const triggers = mentor.decisionTriggers.buyTriggers;
  const positiveFactors = verdict.keyFactors.filter(f => f.assessment === "positive").map(f => f.metric);
  const matchedTrigger = triggers.length > 0 ? triggers[0] : null;

  return {
    should: true,
    reason: `Score ${verdict.score}. Positive factors: ${positiveFactors.join(", ")}`,
    triggerMatched: matchedTrigger,
  };
}

export function getPositionSize(mentorId: string, score: number, portfolioValue: number): { sizePct: number; sizeAmount: number; rationale: string } {
  const mentor = MENTOR_MAP[mentorId];
  if (!mentor) return { sizePct: 0, sizeAmount: 0, rationale: "Unknown mentor" };

  const rules = mentor.portfolioRules;
  const maxPct = rules.maxSinglePositionPct;
  const [typLo, typHi] = rules.typicalPositions;
  const avgPositions = (typLo + typHi) / 2;
  const baseAllocation = Math.min(maxPct, 100 / avgPositions);

  let scaledPct: number;
  if (score >= 85) {
    scaledPct = Math.min(maxPct, baseAllocation * 1.5);
  } else if (score >= 65) {
    scaledPct = baseAllocation;
  } else {
    scaledPct = baseAllocation * 0.5;
  }

  return {
    sizePct: Math.round(scaledPct * 10) / 10,
    sizeAmount: Math.round(portfolioValue * scaledPct / 100),
    rationale: mentor.decisionTriggers.positionSizingRule,
  };
}
