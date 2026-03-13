/**
 * Quantitative Analysis Engine
 * Hedge-fund grade scoring with macro-adaptive weighting,
 * Sharpe ratio, max drawdown, and institutional flow estimation.
 */

import { quoteRaw, quoteSummaryRaw, fetchWithTimeout } from "./yahoo";

const BASE = "https://query1.finance.yahoo.com";

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */

export type MacroSnapshot = {
  treasuryYield10Y: number;      // ^TNX
  dollarIndex: number;           // DX-Y.NYB
  vix: number;                   // ^VIX
  goldPrice: number;             // GC=F
  oilPrice: number;              // CL=F
  sp500Change: number;           // ^GSPC 1-day %
  regime: "RISK_ON" | "RISK_OFF" | "NEUTRAL";
  rateEnvironment: "HAWKISH" | "DOVISH" | "NEUTRAL";
  timestamp: string;
};

export type AdvancedMetrics = {
  sharpeRatio: number | null;
  maxDrawdown: number | null;
  annualizedReturn: number | null;
  annualizedVolatility: number | null;
  institutionalHolding: number | null;
  shortRatio: number | null;
  relativeSectorStrength: number | null;
  mayerMultiple: number | null;
  evToEbitda: number | null;
};

export type IndustryCycleStage = "INTRODUCTION" | "GROWTH" | "MATURITY" | "DECLINE";
export type MarketPosition = "Market Leader" | "Challenger" | "Specialist" | "Follower";

export type PeerComparison = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  marketCap: number;
  pe: number | null;
  revenueGrowth: number | null;
  operatingMargins: number | null;
  beta: number;
  isTarget: boolean;
};

export type IndustryAnalysis = {
  peers: PeerComparison[];
  marketPosition: MarketPosition;
  competitiveAdvantageScore: number;
  industryCycleStage: IndustryCycleStage;
  sectorETF: string;
  relativeSectorStrength: number | null;
};

export type WeightEntry = {
  factor: string;
  tag: AnalysisTag;
  weight: number;
  rawValue: string;
  contribution: number;
  description: string;
};

export type AnalysisTag = "Macro" | "Fundamental" | "Technical" | "Industry Trend" | "Competitor Shift" | "Market Share" | "Quant" | "Risk";

export type ConfidenceBreakdown = {
  factor: string;
  available: boolean;
  impact: number;
  note: string;
};

export type TailRiskItem = {
  category: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
};

export type TaggedInsight = {
  tag: AnalysisTag;
  text: string;
};

export type DeepStockAnalysis = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  signal: "BUY" | "SELL" | "HOLD";
  signalConfidence: number;
  aiConfidence: number;

  bullCase: TaggedInsight[];
  bearCase: TaggedInsight[];

  scores: {
    momentum: number;
    risk: number;
    dividendAttractiveness: number;
    macroAlignment: number;
    valuationScore: number;
  };

  weightingTable: WeightEntry[];
  advanced: AdvancedMetrics;
  industry: IndustryAnalysis;
  confidenceBreakdown: ConfidenceBreakdown[];
  tailRisks: TailRiskItem[];

  sector: string;
  country: string;
  beta: number;
  pe: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  dividendYield: number;
  volume: number;
  avgVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number;
  debtToEquity: number | null;
  operatingMargins: number | null;
  revenueGrowth: number | null;
  freeCashflow: number | null;
  fiftyDayMA: number | null;
  twoHundredDayMA: number | null;
  nativeCurrency: string;
};

export type PortfolioInsightResponse = {
  macro: MacroSnapshot;
  portfolioScore: number;
  riskScore: number;
  dividendScore: number;
  momentumScore: number;
  diversificationScore: number;
  overallSignal: "BULLISH" | "BEARISH" | "NEUTRAL";
  aiConfidence: number;
  summary: string;
  stocks: DeepStockAnalysis[];
  sectorDistribution: Record<string, number>;
  countryDistribution: Record<string, number>;
  generatedAt: string;
};

/* ═══════════════════════════════════════════════
   1. Macro Data Fetcher
   ═══════════════════════════════════════════════ */

const MACRO_SYMBOLS = ["^TNX", "DX-Y.NYB", "^VIX", "GC=F", "CL=F", "^GSPC"];

export async function fetchMacroSnapshot(): Promise<MacroSnapshot> {
  const url = `${BASE}/v7/finance/quote?symbols=${encodeURIComponent(MACRO_SYMBOLS.join(","))}`;
  const defaults: MacroSnapshot = {
    treasuryYield10Y: 4.25,
    dollarIndex: 104,
    vix: 18,
    goldPrice: 2000,
    oilPrice: 75,
    sp500Change: 0,
    regime: "NEUTRAL",
    rateEnvironment: "NEUTRAL",
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return defaults;
    const json = await res.json();
    const results: Record<string, unknown>[] = json?.quoteResponse?.result ?? [];

    const get = (sym: string, field: string): number => {
      const item = results.find((r) => r.symbol === sym);
      return Number(item?.[field] ?? 0) || 0;
    };

    const tnx = get("^TNX", "regularMarketPrice") || defaults.treasuryYield10Y;
    const dx = get("DX-Y.NYB", "regularMarketPrice") || defaults.dollarIndex;
    const vix = get("^VIX", "regularMarketPrice") || defaults.vix;
    const gold = get("GC=F", "regularMarketPrice") || defaults.goldPrice;
    const oil = get("CL=F", "regularMarketPrice") || defaults.oilPrice;
    const spChange = get("^GSPC", "regularMarketChangePercent") || 0;

    const regime: MacroSnapshot["regime"] =
      vix > 25 || spChange < -1.5 ? "RISK_OFF" :
      vix < 15 && spChange > 0.5 ? "RISK_ON" : "NEUTRAL";

    const rateEnvironment: MacroSnapshot["rateEnvironment"] =
      tnx > 4.5 ? "HAWKISH" : tnx < 3.5 ? "DOVISH" : "NEUTRAL";

    return {
      treasuryYield10Y: tnx,
      dollarIndex: dx,
      vix,
      goldPrice: gold,
      oilPrice: oil,
      sp500Change: spChange,
      regime,
      rateEnvironment,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return defaults;
  }
}

/* ═══════════════════════════════════════════════
   2. Historical Data → Sharpe & Drawdown
   ═══════════════════════════════════════════════ */

async function fetchDailyCloses(symbol: string, days = 252): Promise<number[]> {
  const now = Math.floor(Date.now() / 1000);
  const ago = now - days * 24 * 60 * 60;
  const url = `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${ago}&period2=${now}`;
  try {
    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return [];
    const json = await res.json();
    const closes: (number | null)[] = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    return closes.filter((c): c is number => c != null && Number.isFinite(c));
  } catch {
    return [];
  }
}

export function computeSharpeRatio(closes: number[], riskFreeRate: number): { sharpe: number | null; annReturn: number | null; annVol: number | null } {
  if (closes.length < 30) return { sharpe: null, annReturn: null, annVol: null };

  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  if (returns.length < 20) return { sharpe: null, annReturn: null, annVol: null };

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  const annReturn = meanReturn * 252;
  const annVol = stdDev * Math.sqrt(252);
  const dailyRf = riskFreeRate / 252;
  const sharpe = annVol > 0 ? ((meanReturn - dailyRf) * Math.sqrt(252)) / (stdDev) : null;

  return {
    sharpe: sharpe != null ? Math.round(sharpe * 100) / 100 : null,
    annReturn: Math.round(annReturn * 10000) / 100,
    annVol: Math.round(annVol * 10000) / 100,
  };
}

export function computeMaxDrawdown(closes: number[]): number | null {
  if (closes.length < 5) return null;
  let peak = closes[0];
  let maxDD = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const dd = (peak - c) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return Math.round(maxDD * 10000) / 100;
}

/* ═══════════════════════════════════════════════
   3. Sector / Country Inference
   ═══════════════════════════════════════════════ */

function extractRaw(obj: unknown): number | null {
  if (obj == null) return null;
  if (typeof obj === "number") return obj;
  if (typeof obj === "object" && "raw" in (obj as Record<string, unknown>)) {
    const v = (obj as { raw?: unknown }).raw;
    return typeof v === "number" ? v : null;
  }
  return null;
}

function inferSector(summary: Record<string, unknown> | null, symbol: string): string {
  if (summary) {
    const ap = summary.assetProfile as Record<string, unknown> | undefined;
    if (ap?.sector) return String(ap.sector);
  }
  const s = symbol.toUpperCase();
  if (["AAPL","MSFT","GOOGL","GOOG","META","NVDA","AMD","INTC","TSM","AVGO","QCOM","CRM","ADBE","ORCL","NOW","SNOW"].includes(s)) return "Technology";
  if (["AMZN","TSLA","NKE","SBUX","MCD","HD","LOW","TJX","BKNG"].includes(s)) return "Consumer Cyclical";
  if (["JNJ","UNH","PFE","ABBV","MRK","LLY","TMO","ABT","ISRG"].includes(s)) return "Healthcare";
  if (["JPM","BAC","GS","MS","V","MA","BRK-B","AXP","C","WFC"].includes(s)) return "Financial Services";
  if (["XOM","CVX","COP","SLB","EOG"].includes(s)) return "Energy";
  if (["PG","KO","PEP","WMT","COST","PM","CL"].includes(s)) return "Consumer Defensive";
  if (["NEE","DUK","SO","D","AEP"].includes(s)) return "Utilities";
  if (["AMT","PLD","CCI","SPG","EQIX"].includes(s)) return "Real Estate";
  if (["LMT","RTX","GD","NOC","BA"].includes(s)) return "Industrials";
  if (["LIN","APD","DD","SHW","ECL"].includes(s)) return "Basic Materials";
  if (s.endsWith(".KS") || s.endsWith(".KQ")) return "Korean Equity";
  return "Other";
}

function inferCurrency(symbol: string): string {
  if (symbol.endsWith(".KS") || symbol.endsWith(".KQ")) return "KRW";
  if (symbol.endsWith(".T")) return "JPY";
  if (symbol.endsWith(".L")) return "GBP";
  if (symbol.endsWith(".DE") || symbol.endsWith(".PA")) return "EUR";
  if (symbol.endsWith(".HK")) return "HKD";
  if (symbol.endsWith(".SS") || symbol.endsWith(".SZ")) return "CNY";
  if (symbol.endsWith(".AX")) return "AUD";
  if (symbol.endsWith(".TO")) return "CAD";
  return "USD";
}

function inferCountry(symbol: string): string {
  if (symbol.endsWith(".KS") || symbol.endsWith(".KQ")) return "KR";
  if (symbol.endsWith(".T")) return "JP";
  if (symbol.endsWith(".L")) return "UK";
  if (symbol.endsWith(".DE")) return "DE";
  if (symbol.endsWith(".PA")) return "FR";
  if (symbol.endsWith(".HK")) return "HK";
  if (symbol.endsWith(".SS") || symbol.endsWith(".SZ")) return "CN";
  if (symbol.endsWith(".AX")) return "AU";
  if (symbol.endsWith(".TO")) return "CA";
  return "US";
}

/* ═══════════════════════════════════════════════
   3b. Peer Group Mapping & Industry Analysis
   ═══════════════════════════════════════════════ */

const PEER_GROUPS: Record<string, { peers: string[]; etf: string }> = {
  AAPL: { peers: ["MSFT", "GOOGL", "SAMSUNG"], etf: "XLK" },
  MSFT: { peers: ["AAPL", "GOOGL", "ORCL"], etf: "XLK" },
  GOOGL: { peers: ["META", "MSFT", "AMZN"], etf: "XLC" },
  GOOG: { peers: ["META", "MSFT", "AMZN"], etf: "XLC" },
  META: { peers: ["GOOGL", "SNAP", "PINS"], etf: "XLC" },
  AMZN: { peers: ["WMT", "SHOP", "BABA"], etf: "XLY" },
  NVDA: { peers: ["AMD", "INTC", "AVGO"], etf: "SMH" },
  AMD: { peers: ["NVDA", "INTC", "QCOM"], etf: "SMH" },
  INTC: { peers: ["AMD", "NVDA", "TSM"], etf: "SMH" },
  TSM: { peers: ["INTC", "ASML", "AVGO"], etf: "SMH" },
  AVGO: { peers: ["QCOM", "TXN", "NVDA"], etf: "SMH" },
  QCOM: { peers: ["AVGO", "MRVL", "AMD"], etf: "SMH" },
  TSLA: { peers: ["GM", "F", "RIVN"], etf: "XLY" },
  JPM: { peers: ["BAC", "GS", "MS"], etf: "XLF" },
  BAC: { peers: ["JPM", "WFC", "C"], etf: "XLF" },
  GS: { peers: ["MS", "JPM", "SCHW"], etf: "XLF" },
  MS: { peers: ["GS", "JPM", "SCHW"], etf: "XLF" },
  V: { peers: ["MA", "PYPL", "SQ"], etf: "XLF" },
  MA: { peers: ["V", "PYPL", "AXP"], etf: "XLF" },
  JNJ: { peers: ["PFE", "MRK", "ABBV"], etf: "XLV" },
  UNH: { peers: ["CVS", "CI", "HUM"], etf: "XLV" },
  PFE: { peers: ["MRK", "ABBV", "LLY"], etf: "XLV" },
  ABBV: { peers: ["PFE", "MRK", "BMY"], etf: "XLV" },
  MRK: { peers: ["PFE", "ABBV", "LLY"], etf: "XLV" },
  LLY: { peers: ["NVO", "MRK", "ABBV"], etf: "XLV" },
  XOM: { peers: ["CVX", "COP", "SLB"], etf: "XLE" },
  CVX: { peers: ["XOM", "COP", "EOG"], etf: "XLE" },
  COP: { peers: ["XOM", "CVX", "EOG"], etf: "XLE" },
  PG: { peers: ["KO", "PEP", "CL"], etf: "XLP" },
  KO: { peers: ["PEP", "PG", "MDLZ"], etf: "XLP" },
  PEP: { peers: ["KO", "PG", "MDLZ"], etf: "XLP" },
  WMT: { peers: ["COST", "TGT", "AMZN"], etf: "XLP" },
  COST: { peers: ["WMT", "TGT", "BJ"], etf: "XLP" },
  NKE: { peers: ["ADIDAS", "LULU", "UAA"], etf: "XLY" },
  CRM: { peers: ["NOW", "ORCL", "ADBE"], etf: "XLK" },
  ADBE: { peers: ["CRM", "NOW", "INTU"], etf: "XLK" },
  ORCL: { peers: ["MSFT", "CRM", "SAP"], etf: "XLK" },
  NEE: { peers: ["DUK", "SO", "AEP"], etf: "XLU" },
  LMT: { peers: ["RTX", "GD", "NOC"], etf: "XLI" },
  BA: { peers: ["LMT", "RTX", "GD"], etf: "XLI" },
  DIS: { peers: ["CMCSA", "NFLX", "WBD"], etf: "XLC" },
  NFLX: { peers: ["DIS", "CMCSA", "WBD"], etf: "XLC" },
};

const SECTOR_ETF_MAP: Record<string, string> = {
  Technology: "XLK", "Consumer Cyclical": "XLY", Healthcare: "XLV",
  "Financial Services": "XLF", Energy: "XLE", "Consumer Defensive": "XLP",
  Utilities: "XLU", "Real Estate": "XLRE", Industrials: "XLI",
  "Basic Materials": "XLB", "Korean Equity": "EWY", Other: "SPY",
};

const SECTOR_CYCLE: Record<string, IndustryCycleStage> = {
  Technology: "GROWTH",
  "Consumer Cyclical": "GROWTH",
  Healthcare: "GROWTH",
  "Financial Services": "MATURITY",
  Energy: "MATURITY",
  "Consumer Defensive": "MATURITY",
  Utilities: "MATURITY",
  "Real Estate": "MATURITY",
  Industrials: "MATURITY",
  "Basic Materials": "MATURITY",
  "Korean Equity": "GROWTH",
  Other: "MATURITY",
};

function getPeerSymbols(symbol: string, sector: string): { peers: string[]; etf: string } {
  const upper = symbol.toUpperCase();
  if (PEER_GROUPS[upper]) return PEER_GROUPS[upper];
  const etf = SECTOR_ETF_MAP[sector] ?? "SPY";
  const sectorStocks: Record<string, string[]> = {
    Technology: ["AAPL", "MSFT", "GOOGL"],
    "Consumer Cyclical": ["AMZN", "TSLA", "NKE"],
    Healthcare: ["JNJ", "UNH", "LLY"],
    "Financial Services": ["JPM", "V", "MA"],
    Energy: ["XOM", "CVX", "COP"],
    "Consumer Defensive": ["PG", "KO", "WMT"],
    Utilities: ["NEE", "DUK", "SO"],
    Industrials: ["LMT", "RTX", "BA"],
  };
  const fallback = (sectorStocks[sector] ?? ["SPY", "QQQ", "DIA"]).filter((s) => s !== upper);
  return { peers: fallback.slice(0, 3), etf };
}

async function fetchPeerData(symbols: string[]): Promise<PeerComparison[]> {
  if (symbols.length === 0) return [];
  const url = `${BASE}/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
  try {
    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return [];
    const json = await res.json();
    const results: Record<string, unknown>[] = json?.quoteResponse?.result ?? [];
    return results.map((r) => ({
      symbol: String(r.symbol ?? ""),
      name: String(r.shortName ?? r.longName ?? r.symbol ?? ""),
      price: Number(r.regularMarketPrice ?? 0),
      change: Number(r.regularMarketChangePercent ?? 0),
      marketCap: Number(r.marketCap ?? 0),
      pe: r.trailingPE ? Number(r.trailingPE) : null,
      revenueGrowth: null,
      operatingMargins: null,
      beta: Number(r.beta ?? 1.0),
      isTarget: false,
    })).filter((p) => p.symbol && p.price > 0);
  } catch {
    return [];
  }
}

async function fetchRelativeSectorStrength(symbol: string, sectorETF: string): Promise<number | null> {
  const now = Math.floor(Date.now() / 1000);
  const ago90d = now - 90 * 24 * 60 * 60;
  try {
    const [stockRes, etfRes] = await Promise.all([
      fetchWithTimeout(`${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${ago90d}&period2=${now}`, {}, 8000),
      fetchWithTimeout(`${BASE}/v8/finance/chart/${encodeURIComponent(sectorETF)}?interval=1d&period1=${ago90d}&period2=${now}`, {}, 8000),
    ]);
    if (!stockRes.ok || !etfRes.ok) return null;
    const [sJson, eJson] = await Promise.all([stockRes.json(), etfRes.json()]);
    const sCloses: (number | null)[] = sJson?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const eCloses: (number | null)[] = eJson?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const sArr = sCloses.filter((c): c is number => c != null);
    const eArr = eCloses.filter((c): c is number => c != null);
    if (sArr.length < 10 || eArr.length < 10) return null;
    const sReturn = ((sArr[sArr.length - 1] - sArr[0]) / sArr[0]) * 100;
    const eReturn = ((eArr[eArr.length - 1] - eArr[0]) / eArr[0]) * 100;
    return Math.round((sReturn - eReturn) * 100) / 100;
  } catch {
    return null;
  }
}

function determineMarketPosition(
  targetMcap: number, peerMcaps: number[],
  targetRevGrowth: number | null, peerRevGrowths: (number | null)[],
  targetOpMargin: number | null
): MarketPosition {
  const allMcaps = [...peerMcaps, targetMcap].filter((m) => m > 0);
  if (allMcaps.length === 0) return "Follower";
  const maxMcap = Math.max(...allMcaps);

  if (targetMcap >= maxMcap * 0.8) {
    return "Market Leader";
  }

  const validGrowths = peerRevGrowths.filter((g): g is number => g != null);
  const avgPeerGrowth = validGrowths.length > 0 ? validGrowths.reduce((a, b) => a + b, 0) / validGrowths.length : 0;

  if (targetRevGrowth != null && targetRevGrowth > avgPeerGrowth * 1.3) {
    return "Challenger";
  }

  if (targetOpMargin != null && targetOpMargin > 0.2 && targetMcap < maxMcap * 0.3) {
    return "Specialist";
  }

  return "Follower";
}

function computeCompetitiveAdvantage(
  targetRevGrowth: number | null, peerRevGrowths: (number | null)[],
  targetOpMargin: number | null, peerOpMargins: (number | null)[],
  position: MarketPosition, relativeSectorStrength: number | null
): number {
  let score = 50;

  const validPeerGrowths = peerRevGrowths.filter((g): g is number => g != null);
  if (targetRevGrowth != null && validPeerGrowths.length > 0) {
    const avgPeer = validPeerGrowths.reduce((a, b) => a + b, 0) / validPeerGrowths.length;
    const diff = targetRevGrowth - avgPeer;
    score += Math.max(-20, Math.min(20, diff * 100));
  }

  const validPeerMargins = peerOpMargins.filter((m): m is number => m != null);
  if (targetOpMargin != null && validPeerMargins.length > 0) {
    const avgPeer = validPeerMargins.reduce((a, b) => a + b, 0) / validPeerMargins.length;
    if (targetOpMargin > avgPeer * 1.2) score += 10;
    else if (targetOpMargin < avgPeer * 0.8) score -= 10;
  }

  if (position === "Market Leader") score += 15;
  else if (position === "Challenger") score += 5;
  else if (position === "Follower") score -= 5;

  if (relativeSectorStrength != null) {
    if (relativeSectorStrength > 10) score += 10;
    else if (relativeSectorStrength > 0) score += 5;
    else if (relativeSectorStrength < -10) score -= 10;
    else if (relativeSectorStrength < 0) score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function inferIndustryCycle(sector: string, revenueGrowth: number | null): IndustryCycleStage {
  const base = SECTOR_CYCLE[sector] ?? "MATURITY";
  if (revenueGrowth == null) return base;
  if (revenueGrowth > 0.25) return "GROWTH";
  if (revenueGrowth > 0.10) return base === "MATURITY" ? "GROWTH" : base;
  if (revenueGrowth < -0.05) return "DECLINE";
  return base;
}

/* ═══════════════════════════════════════════════
   4. Rate Sensitivity by Sector
   ═══════════════════════════════════════════════ */

const RATE_SENSITIVITY: Record<string, number> = {
  Technology: 0.8,
  "Real Estate": 0.9,
  Utilities: 0.7,
  "Consumer Cyclical": 0.5,
  "Financial Services": -0.6,
  Healthcare: 0.2,
  "Consumer Defensive": 0.1,
  Energy: 0.3,
  Industrials: 0.4,
  "Basic Materials": 0.3,
  "Korean Equity": 0.5,
  Other: 0.3,
};

/* ═══════════════════════════════════════════════
   5. Scoring Functions (Macro-Adaptive)
   ═══════════════════════════════════════════════ */

function computeMomentum(
  changePercent: number, volumeRatio: number, distFromHigh: number,
  fiftyDayMA: number | null, twoHundredDayMA: number | null, price: number
): number {
  let s = 5;
  if (changePercent > 3) s += 2;
  else if (changePercent > 1) s += 1;
  else if (changePercent < -3) s -= 2;
  else if (changePercent < -1) s -= 1;

  if (volumeRatio > 1.5) s += 1;
  else if (volumeRatio < 0.5) s -= 1;

  if (distFromHigh < 5) s += 1;
  else if (distFromHigh > 30) s -= 1;

  if (fiftyDayMA && twoHundredDayMA) {
    if (fiftyDayMA > twoHundredDayMA) s += 1;
    else s -= 1;
  }

  if (fiftyDayMA && price > fiftyDayMA) s += 0.5;
  else if (fiftyDayMA && price < fiftyDayMA * 0.95) s -= 0.5;

  return Math.max(1, Math.min(10, Math.round(s * 10) / 10));
}

function computeRisk(
  beta: number, changePercent: number, distFromHigh: number,
  maxDrawdown: number | null, vix: number
): number {
  let s = 5;
  if (beta > 1.8) s += 3;
  else if (beta > 1.5) s += 2;
  else if (beta > 1.2) s += 1;
  else if (beta < 0.6) s -= 2;
  else if (beta < 0.8) s -= 1;

  if (Math.abs(changePercent) > 5) s += 1;
  if (distFromHigh > 30) s += 1;
  else if (distFromHigh < 10) s -= 1;

  if (maxDrawdown != null) {
    if (maxDrawdown > 30) s += 1;
    else if (maxDrawdown < 10) s -= 1;
  }

  if (vix > 30) s += 1;
  else if (vix < 14) s -= 1;

  return Math.max(1, Math.min(10, Math.round(s * 10) / 10));
}

function computeDividendScore(divYield: number): number {
  if (!divYield || divYield <= 0) return 10;
  if (divYield > 0.06) return 90;
  if (divYield > 0.04) return 75;
  if (divYield > 0.025) return 60;
  if (divYield > 0.015) return 40;
  if (divYield > 0.005) return 25;
  return 15;
}

function computeMacroAlignment(sector: string, macro: MacroSnapshot): number {
  const sensitivity = RATE_SENSITIVITY[sector] ?? 0.3;
  let s = 50;

  if (macro.rateEnvironment === "HAWKISH") {
    s -= sensitivity * 30;
  } else if (macro.rateEnvironment === "DOVISH") {
    s += sensitivity * 25;
  }

  if (macro.regime === "RISK_ON") {
    s += sensitivity > 0.5 ? 10 : 5;
  } else if (macro.regime === "RISK_OFF") {
    s -= sensitivity > 0.5 ? 15 : 5;
    if (sector === "Consumer Defensive" || sector === "Utilities") s += 15;
  }

  if (macro.vix > 30) s -= 10;
  else if (macro.vix < 14) s += 10;

  return Math.max(0, Math.min(100, Math.round(s)));
}

function computeValuation(pe: number | null, forwardPE: number | null, pegRatio: number | null, debtToEquity: number | null): number {
  let s = 50;

  if (pe != null && pe > 0) {
    if (pe < 12) s += 20;
    else if (pe < 18) s += 10;
    else if (pe > 50) s -= 20;
    else if (pe > 35) s -= 10;
  }

  if (forwardPE != null && pe != null && forwardPE > 0 && pe > 0) {
    if (forwardPE < pe * 0.8) s += 10;
    else if (forwardPE > pe * 1.2) s -= 10;
  }

  if (pegRatio != null) {
    if (pegRatio > 0 && pegRatio < 1) s += 15;
    else if (pegRatio > 2.5) s -= 10;
  }

  if (debtToEquity != null) {
    if (debtToEquity > 200) s -= 10;
    else if (debtToEquity < 30) s += 5;
  }

  return Math.max(0, Math.min(100, s));
}

/* ═══════════════════════════════════════════════
   6. Signal Determination (Multi-Factor)
   ═══════════════════════════════════════════════ */

function determineSignal(
  momentum: number, risk: number, valuation: number, macroAlign: number,
  pe: number | null, changePercent: number, distFromHigh: number,
  fiftyDayMA: number | null, twoHundredDayMA: number | null, price: number
): { signal: "BUY" | "SELL" | "HOLD"; confidence: number; aiConfidence: number; buyPts: number; sellPts: number } {
  let buyPts = 0;
  let sellPts = 0;
  let dataQuality = 60;

  if (momentum >= 7) buyPts += 2;
  else if (momentum <= 3) sellPts += 2;

  if (risk >= 8) sellPts += 2;
  else if (risk >= 6) sellPts += 1;
  else if (risk <= 3) buyPts += 1;

  if (valuation >= 70) buyPts += 2;
  else if (valuation <= 30) sellPts += 2;

  if (macroAlign >= 65) buyPts += 1;
  else if (macroAlign <= 35) sellPts += 1;

  if (pe != null && pe > 0) {
    dataQuality += 5;
    if (pe < 15) buyPts += 1;
    else if (pe > 40) sellPts += 1;
  }

  if (fiftyDayMA && twoHundredDayMA) {
    dataQuality += 10;
    if (fiftyDayMA > twoHundredDayMA && price > fiftyDayMA) buyPts += 1;
    else if (fiftyDayMA < twoHundredDayMA && price < fiftyDayMA) sellPts += 1;
  }

  if (distFromHigh > 35) buyPts += 1;
  if (distFromHigh < 3 && momentum < 7) sellPts += 1;

  if (changePercent > 3) buyPts += 1;
  else if (changePercent < -5) sellPts += 1;

  const diff = buyPts - sellPts;
  const signal: "BUY" | "SELL" | "HOLD" =
    diff >= 3 ? "BUY" : diff <= -3 ? "SELL" : "HOLD";
  const confidence = Math.min(95, 50 + Math.abs(diff) * 8);
  const aiConfidence = Math.min(95, Math.max(20, dataQuality + Math.abs(diff) * 3));

  return { signal, confidence, aiConfidence, buyPts, sellPts };
}

/* ═══════════════════════════════════════════════
   7. Bull / Bear Case Generators (Tagged)
   ═══════════════════════════════════════════════ */

function generateBullCase(
  stock: Partial<DeepStockAnalysis>, macro: MacroSnapshot
): TaggedInsight[] {
  const out: TaggedInsight[] = [];
  const { scores, sector, advanced, pe, forwardPE, revenueGrowth, operatingMargins,
    fiftyDayMA, twoHundredDayMA, price, freeCashflow, marketCap, debtToEquity } = stock;
  const distFromHigh = stock.fiftyTwoWeekHigh && stock.price
    ? ((stock.fiftyTwoWeekHigh - stock.price) / stock.fiftyTwoWeekHigh) * 100 : 0;
  const rateSens = RATE_SENSITIVITY[sector ?? ""] ?? 0.3;

  if (macro.rateEnvironment === "DOVISH") {
    out.push({ tag: "Macro", text: `현재 10Y 금리 ${macro.treasuryYield10Y.toFixed(2)}%로 완화적 통화정책 환경이 형성되어 있다. 이 금리 수준은 ${sector} 섹터(금리 민감도 ${(rateSens * 100).toFixed(0)}%)의 미래 현금흐름 할인율을 낮추어, DCF 기반 적정 가치가 확장될 여지를 제공한다. 특히 성장주의 경우, 할인율 50bp 하락은 이론적으로 밸류에이션 5~10% 확대 효과를 가져온다. VIX ${macro.vix.toFixed(1)} 수준의 낮은 변동성과 결합하여, 자금의 위험자산 유입이 가속화될 확률이 높다.` });
  } else if (macro.rateEnvironment === "NEUTRAL" && sector === "Financial Services") {
    out.push({ tag: "Macro", text: `10Y 금리 ${macro.treasuryYield10Y.toFixed(2)}%의 중립 구간은 은행·보험 섹터에 구조적으로 유리한 환경이다. 이 금리대에서 예대마진(NIM)이 유지되면서, 동시에 신용 스프레드가 확대되지 않아 대손비용(Provision)이 안정적으로 관리된다. 금리 인상기의 채권 평가손실 우려도 제한적이어서, 이익의 질(Quality of Earnings)이 개선되는 구간이다.` });
  }

  if (macro.regime === "RISK_ON") {
    out.push({ tag: "Macro", text: `VIX ${macro.vix.toFixed(1)}로 시장 변동성이 낮고, S&P500이 ${macro.sp500Change >= 0 ? "+" : ""}${macro.sp500Change.toFixed(2)}% 상승세를 보이는 리스크 선호(Risk-On) 국면이다. 이 환경에서는 기관 투자자의 위험자산 배분 비중이 확대되며, 특히 Beta가 높은 성장 섹터로의 자금 이동(Rotation)이 강화된다. 달러 인덱스 ${macro.dollarIndex.toFixed(1)} 수준은 글로벌 유동성 경색 우려를 완화시켜, 이머징 시장을 포함한 광범위한 자산군에 긍정적 환경을 조성한다.` });
  }

  if (forwardPE && pe && forwardPE < pe * 0.85) {
    const epsImpliedGrowth = ((pe / forwardPE) - 1) * 100;
    out.push({ tag: "Fundamental", text: `Forward P/E(${forwardPE.toFixed(1)}x)가 Trailing P/E(${pe.toFixed(1)}x) 대비 ${((1 - forwardPE / pe) * 100).toFixed(0)}% 할인 상태로, 이는 애널리스트 컨센서스가 향후 12개월 EPS ${epsImpliedGrowth.toFixed(0)}% 성장을 반영하고 있음을 의미한다. Earnings Revision이 상향 방향인 경우, 이 밸류에이션 갭은 주가 상승의 강력한 촉매제가 된다. 현재 가격대에서의 매수는 실적 성장의 수혜를 디스카운트된 가격에 확보하는 기회로 판단된다.` });
  }

  if (revenueGrowth && revenueGrowth > 0.15) {
    out.push({ tag: "Fundamental", text: `매출 성장률 ${(revenueGrowth * 100).toFixed(1)}%는 해당 섹터 평균을 상회하는 수준으로, TAM(Total Addressable Market) 내 침투율 확대 또는 시장 점유율 확대가 실적에 직접적으로 반영되고 있음을 보여준다. ${operatingMargins != null ? `영업이익률 ${(operatingMargins * 100).toFixed(1)}%와 결합하면, 이 기업은 '성장과 수익성의 동시 달성' 단계에 있으며, 이는 Operating Leverage 효과가 발현되는 신호이다.` : "매출 성장이 비용 구조 개선으로 이어질 경우, 영업 레버리지(Operating Leverage)에 의한 이익률 개선이 기대된다."}` });
  }

  if (freeCashflow && freeCashflow > 0 && marketCap && marketCap > 0) {
    const fcfYield = (freeCashflow / marketCap) * 100;
    const fcfStr = Math.abs(freeCashflow) >= 1e12
      ? `${(freeCashflow / 1e12).toFixed(2)}T`
      : Math.abs(freeCashflow) >= 1e9
        ? `${(freeCashflow / 1e9).toFixed(2)}B`
        : `${(freeCashflow / 1e6).toFixed(0)}M`;
    out.push({ tag: "Fundamental", text: `잉여현금흐름(FCF) ${fcfStr}으로 FCF Yield ${fcfYield.toFixed(2)}%를 기록 중이다. 이는 기업이 설비 투자(CapEx) 후에도 충분한 현금을 창출하고 있음을 의미하며, 자사주 매입·배당 확대·M&A 등 주주 가치 환원의 재무적 여력이 확보된 상태이다.${debtToEquity != null && debtToEquity < 100 ? ` 부채비율(D/E) ${debtToEquity.toFixed(0)}%로 재무 건전성도 양호하여, 경기 하강 국면에서도 배당 유지가 가능한 구조이다.` : ""}` });
  }

  if (advanced?.sharpeRatio != null && advanced.sharpeRatio > 1.0) {
    out.push({ tag: "Quant", text: `Sharpe Ratio ${advanced.sharpeRatio.toFixed(2)}로 위험 조정 수익률이 우수하다. 이는 동일한 변동성 수준의 자산 대비 초과 수익(Alpha)을 창출하고 있음을 정량적으로 증명한다.${advanced.annualizedReturn != null ? ` 연환산 수익률 ${advanced.annualizedReturn.toFixed(1)}% 대비 연환산 변동성 ${advanced.annualizedVolatility?.toFixed(1) ?? "N/A"}%로, 리스크-리턴 프로파일이 기관 투자자의 배분 기준(Sharpe > 0.8)을 충족한다.` : ""}` });
  }

  if (advanced?.mayerMultiple != null && advanced.mayerMultiple < 1.0) {
    out.push({ tag: "Quant", text: `Mayer Multiple(현재가/200일 이동평균) ${advanced.mayerMultiple.toFixed(3)}로 1.0 하회 — 역사적으로 이 수준에서의 매수는 12개월 기대수익률이 평균 대비 우위에 있는 것으로 검증되었다. 이는 기술적 과매도 영역에서의 평균 회귀(Mean Reversion) 기회를 시사한다.` });
  }

  if (fiftyDayMA && twoHundredDayMA && price && fiftyDayMA > twoHundredDayMA && price > fiftyDayMA) {
    out.push({ tag: "Technical", text: `50일선(${fiftyDayMA.toFixed(2)}) > 200일선(${twoHundredDayMA.toFixed(2)}) 골든크로스 상태이며, 현재가가 50일선 위에 위치한다. 기술적 분석에서 이 시그널은 중기 상승 추세의 확인으로 해석되며, 기관 투자자의 시스템적 매수(Trend-Following)를 유인하는 패턴이다. 거래량 동반 여부와 결합 시 추세의 지속성에 대한 신뢰도가 상승한다.` });
  }

  if (advanced?.institutionalHolding != null && advanced.institutionalHolding > 70) {
    out.push({ tag: "Quant", text: `기관 보유 비율 ${advanced.institutionalHolding.toFixed(1)}%로, 스마트머니(Smart Money)의 확신(Conviction)이 강하게 반영된 포지션 구조이다. 높은 기관 보유율은 유동성 프리미엄 축소, 정보 비대칭 완화, 그리고 이익 발표 시 긍정적 반응 확률 증가와 연관된다.${advanced.shortRatio != null && advanced.shortRatio < 3 ? ` 공매도 비율 ${advanced.shortRatio.toFixed(1)}일로 낮아, 하방 베팅 압력이 제한적이라는 점도 긍정적이다.` : ""}` });
  }

  if (stock.industry) {
    const ind = stock.industry;
    if (ind.marketPosition === "Market Leader") {
      out.push({ tag: "Market Share", text: `시가총액 기준 산업 내 Market Leader로서, 규모의 경제(Scale Advantage)가 원가 구조의 구조적 우위를 제공한다. 이러한 해자(Economic Moat)는 경쟁사의 가격 공세에 대한 방어막으로 작용하며, 높은 진입 장벽(Barriers to Entry)과 결합하여 장기적 ROIC(투하자본수익률) 우위가 유지될 가능성이 높다. 시장 지배력에 기반한 Pricing Power는 인플레이션 환경에서 비용 전가 능력을 의미하므로, 매크로 역풍 시에도 마진 방어가 가능하다.` });
    }
    if (ind.competitiveAdvantageScore >= 70) {
      out.push({ tag: "Competitor Shift", text: `경쟁 우위 점수 ${ind.competitiveAdvantageScore}/100으로, Peer Group 대비 매출 성장률과 영업이익률 양면에서 우위를 보이고 있다. 이는 단순한 시장 성장의 수혜가 아닌, 경쟁사로부터의 점유율 탈취(Market Share Gain)를 동반한 성장임을 시사한다.` });
    }
    if (ind.industryCycleStage === "GROWTH") {
      out.push({ tag: "Industry Trend", text: `해당 산업은 현재 '성장기(Growth Stage)' 국면에 있으며, TAM이 확대되는 환경에서 Market Leader 또는 Challenger의 수혜가 극대화되는 시기이다. 이 단계에서는 선제적 R&D 투자와 고객 기반 확대가 장기 경쟁력의 핵심 변수이며, 이를 보유한 기업은 산업 성숙기 진입 시 구조적 독점 이익을 확보하게 된다.` });
    }
    if (ind.relativeSectorStrength != null && ind.relativeSectorStrength > 5) {
      out.push({ tag: "Industry Trend", text: `섹터 대비 상대 강도(RS) +${ind.relativeSectorStrength.toFixed(1)}%p (90일 기준)로, 동일 섹터 내에서 해당 종목으로의 자금 집중이 확인된다. 이는 섹터 로테이션(Sector Rotation) 국면에서 해당 기업이 '셀렉티브 빈(Selective Win)' 포지션에 있음을 의미하며, 기관의 종목 선별(Stock Picking) 흐름이 긍정적으로 작용하고 있다.` });
    }
  }

  if (out.length === 0) {
    out.push({ tag: "Macro", text: `현재 매크로 환경(VIX ${macro.vix.toFixed(1)}, 10Y 금리 ${macro.treasuryYield10Y.toFixed(2)}%, 달러 인덱스 ${macro.dollarIndex.toFixed(1)})은 중립적 조건을 형성하고 있다. 극단적 리스크 이벤트가 부재한 환경에서 해당 종목은 자체 펀더멘털에 기반한 개별 요인(Idiosyncratic Factor)에 의해 주가가 결정될 확률이 높다.` });
  }

  return out;
}

function generateBearCase(
  stock: Partial<DeepStockAnalysis>, macro: MacroSnapshot
): TaggedInsight[] {
  const out: TaggedInsight[] = [];
  const { scores, sector, advanced, pe, forwardPE, beta, debtToEquity,
    fiftyDayMA, twoHundredDayMA, price, operatingMargins, revenueGrowth, marketCap } = stock;
  const distFromHigh = stock.fiftyTwoWeekHigh && stock.price
    ? ((stock.fiftyTwoWeekHigh - stock.price) / stock.fiftyTwoWeekHigh) * 100 : 0;
  const rateSens = RATE_SENSITIVITY[sector ?? ""] ?? 0.3;

  if (macro.rateEnvironment === "HAWKISH" && rateSens > 0.4) {
    out.push({ tag: "Macro", text: `10Y 금리 ${macro.treasuryYield10Y.toFixed(2)}%의 긴축적 환경에서 ${sector} 섹터는 금리 민감도 ${(rateSens * 100).toFixed(0)}%로, WACC(가중평균자본비용) 상승에 의한 DCF 적정가치 하락 압력을 직접적으로 받는다. 금리 100bp 추가 인상 시나리오에서, 해당 종목의 이론적 밸류에이션 압축은 10~18% 수준으로 추정된다. 특히 이 섹터는 듀레이션(Duration)이 긴 현금흐름 구조를 가지므로, 금리 상승의 충격이 비선형적으로 증폭될 수 있다.` });
  }

  if (macro.regime === "RISK_OFF") {
    out.push({ tag: "Macro", text: `VIX ${macro.vix.toFixed(1)}로 시장 공포 지수가 높은 구간이며, 달러 인덱스 ${macro.dollarIndex.toFixed(1)} 강세와 결합하여 위험자산 전반에서 자금 이탈(De-risking) 압력이 강화되고 있다. 이 환경에서는 기관 투자자의 포지션 축소(Deleveraging)가 유동성이 낮은 종목부터 시작되며, 매수-매도 스프레드 확대에 따른 슬리피지(Slippage) 비용도 증가한다.${macro.sp500Change < -1 ? ` S&P500 ${macro.sp500Change.toFixed(2)}% 하락으로 시장 전반의 하방 모멘텀이 강화되는 시점이다.` : ""}` });
  }

  if (pe != null && pe > 35) {
    out.push({ tag: "Fundamental", text: `P/E ${pe.toFixed(1)}x로 역사적 S&P500 평균(~20x) 대비 현저한 고평가 구간에 위치해 있다. 이 수준의 밸류에이션은 향후 ${((pe / 20 - 1) * 100).toFixed(0)}% 이상의 이익 성장이 이미 주가에 선반영(Priced-in)되어 있음을 의미한다. 실적 발표 시 컨센서스를 1~2% 미달(Earnings Miss)하는 것만으로도 5~15% 급락이 발생할 수 있으며, 이는 "기대치의 함정(Expectation Trap)"으로 정의된다.${forwardPE && forwardPE > 30 ? ` Forward P/E ${forwardPE.toFixed(1)}x 역시 고평가 영역에 있어, 밸류에이션 수정(Multiple Contraction) 위험이 이중으로 존재한다.` : ""}` });
  }

  if (beta != null && beta > 1.5) {
    out.push({ tag: "Risk", text: `Beta ${beta.toFixed(2)}로 시장 변동성의 증폭기(Amplifier) 역할을 하는 종목이다. 시장 1% 하락 시 이론적으로 ${beta.toFixed(2)}%의 하락 에너지를 보유하며, 이는 VIX 상승 국면에서 포트폴리오 전체의 위험 기여도(Risk Contribution)를 비선형적으로 증가시킨다.${advanced?.maxDrawdown != null ? ` 실제 최근 1년 최대 낙폭(MDD) ${advanced.maxDrawdown.toFixed(1)}%는 이 높은 Beta가 실제 손실로 전환되는 과정을 역사적으로 증명하고 있다.` : ""}` });
  } else if (advanced?.maxDrawdown != null && advanced.maxDrawdown > 25) {
    out.push({ tag: "Risk", text: `최근 1년 최대 낙폭(MDD) ${advanced.maxDrawdown.toFixed(1)}%로, 이는 하방 충격에 대한 역사적 취약성(Tail Vulnerability)이 데이터상 확인됨을 의미한다. MDD는 과거 최악의 경우를 반영하므로, 유사한 매크로 스트레스(금리 인상, 신용 수축 등) 재발 시 동등한 수준의 하락이 반복될 확률이 존재한다.` });
  }

  if (debtToEquity != null && debtToEquity > 150) {
    out.push({ tag: "Risk", text: `부채비율(D/E) ${debtToEquity.toFixed(0)}%로 재무 레버리지가 과도한 수준이다. 현재 금리 환경(10Y ${macro.treasuryYield10Y.toFixed(2)}%)에서 이자 보상 배율(Interest Coverage Ratio)의 악화가 우려되며, 재융자(Refinancing) 시 금리 부담 증가로 현금흐름이 구조적으로 압박받을 수 있다. 신용 등급 하향 조정(Downgrade) 시, 추가 자금 조달 비용 상승의 악순환이 트리거될 위험이 있다.` });
  }

  if (fiftyDayMA && twoHundredDayMA && price && fiftyDayMA < twoHundredDayMA) {
    out.push({ tag: "Technical", text: `50일선(${fiftyDayMA.toFixed(2)}) < 200일선(${twoHundredDayMA.toFixed(2)}) 데드크로스가 형성되어 중기 하락 추세가 기술적으로 확인된다. 이 패턴은 기관의 시스템적 매도(Trend-Following 알고리즘)를 유인하여 매도 압력이 자기 강화(Self-reinforcing)되는 특성이 있다.${price < twoHundredDayMA ? ` 현재가가 200일 이동평균(${twoHundredDayMA.toFixed(2)})을 ${((twoHundredDayMA - price) / twoHundredDayMA * 100).toFixed(1)}% 하회하고 있어, 주요 지지선 이탈에 따른 추가 하방 모멘텀이 존재한다.` : ""}` });
  }

  if (operatingMargins != null && operatingMargins < 0.05 && operatingMargins > -1) {
    out.push({ tag: "Fundamental", text: `영업이익률 ${(operatingMargins * 100).toFixed(1)}%로 수익성이 구조적으로 취약한 상태이다. 이 마진 수준에서는 매출 5~10% 감소만으로도 영업손실 전환이 발생하며, 특히 인플레이션 환경에서 원가 상승을 가격에 전가하기 어려운 구조(Low Pricing Power)임을 시사한다.${revenueGrowth != null && revenueGrowth < 0.05 ? ` 매출 성장률 ${(revenueGrowth * 100).toFixed(1)}%가 낮아, 비용 절감이 아닌 매출 성장을 통한 마진 개선 가능성도 제한적이다.` : ""}` });
  }

  if (advanced?.mayerMultiple != null && advanced.mayerMultiple > 1.8) {
    out.push({ tag: "Quant", text: `Mayer Multiple ${advanced.mayerMultiple.toFixed(3)}으로, 200일 이동평균 대비 ${((advanced.mayerMultiple - 1) * 100).toFixed(0)}% 프리미엄 상태이다. 역사적 데이터상, Mayer Multiple 1.8 이상에서의 매수는 12개월 기대수익률이 현저히 낮아지는 구간이며, 기술적 과매수 신호로 해석된다. 평균 회귀(Mean Reversion) 압력이 점진적으로 증가하는 구간이다.` });
  }

  if (distFromHigh < 3 && (scores?.momentum ?? 5) < 7) {
    out.push({ tag: "Technical", text: `52주 고점 대비 ${distFromHigh.toFixed(1)}% 이내에서 모멘텀 점수가 ${scores?.momentum ?? 5}/10으로 둔화되고 있다. 이는 차익 실현 매물 출회와 한계 매수세 약화가 결합하여 기술적 저항(Resistance)이 형성되는 구간이다. 돌파에 실패할 경우, 이중 천장(Double Top) 패턴으로 전환될 위험이 있다.` });
  }

  if (advanced?.shortRatio != null && advanced.shortRatio > 5) {
    out.push({ tag: "Quant", text: `공매도 비율(Short Ratio) ${advanced.shortRatio.toFixed(1)}일로, 시장 참여자 중 상당수가 하락에 베팅하고 있다. 이는 해당 종목에 대한 네거티브 센티먼트가 높음을 의미하며, 숏 커버링에 의한 단기 반등 가능성이 있지만, 근본적으로 펀더멘털 우려가 존재함을 반영한다.` });
  }

  if (stock.industry) {
    const ind = stock.industry;
    if (ind.competitiveAdvantageScore < 40) {
      out.push({ tag: "Competitor Shift", text: `경쟁 우위 점수 ${ind.competitiveAdvantageScore}/100으로 Peer Group 대비 매출 성장률과 마진 양면에서 열위에 있다. 이는 경쟁사의 공격적 가격 전략 또는 기술 혁신에 의해 점유율이 잠식(Market Share Erosion)되고 있을 가능성을 시사한다. 산업 내 경쟁 심화(Intensified Competition) 국면에서는 수익성 하방 압력이 구조적으로 지속된다.` });
    }
    if (ind.marketPosition === "Follower") {
      out.push({ tag: "Market Share", text: `산업 내 Follower 포지션으로, 시가총액과 시장 지배력 기준에서 열세에 있다. 경기 둔화 시 Follower 기업은 Market Leader 대비 주문 감소 폭이 크고, 고정비 레버리지가 역으로 작용하여 이익 감소 폭이 비선형적으로 확대된다. 산업 구조조정 국면에서 인수 대상이 되거나 시장 퇴출 위험도 상대적으로 높다.` });
    }
    if (ind.industryCycleStage === "DECLINE") {
      out.push({ tag: "Industry Trend", text: `해당 산업은 '쇠퇴기(Decline Stage)' 국면에 있으며, 구조적 수요 둔화(Secular Demand Decline)로 인해 매출 하방 압력이 지속적으로 존재한다. 이 단계에서는 기업 간 합종연횡(M&A)이 활발해지지만, 이는 성장이 아닌 생존을 위한 행동이므로 주주 가치 훼손 위험이 동반된다.` });
    }
    if (ind.industryCycleStage === "MATURITY" && ind.peers.length > 0) {
      out.push({ tag: "Industry Trend", text: `산업이 '성숙기(Maturity Stage)'에 진입하여 TAM 성장률이 둔화되고 있다. 이 국면에서는 신규 진입자 위협은 제한적이나, 기존 경쟁사 간 제로섬(Zero-Sum) 점유율 경쟁이 심화되어 가격 경쟁(Price War) 또는 마케팅비 증가로 이익률 압박이 발생하는 구조이다.` });
    }
    if (ind.relativeSectorStrength != null && ind.relativeSectorStrength < -5) {
      out.push({ tag: "Competitor Shift", text: `섹터 대비 상대 강도(RS) ${ind.relativeSectorStrength.toFixed(1)}%p (90일 기준)로, 동일 산업 내 기관 자금이 경쟁사로 이동하는 패턴이 데이터상 확인된다. 이는 해당 종목에 대한 기관의 Underweight 신호로 해석되며, 이러한 자금 흐름 역전은 단기에 복원되기 어려운 구조적 특성을 보인다.` });
    }
  }

  if (out.length === 0) {
    out.push({ tag: "Macro", text: `거시경제 불확실성(10Y 금리 ${macro.treasuryYield10Y.toFixed(2)}%, VIX ${macro.vix.toFixed(1)}, 달러 인덱스 ${macro.dollarIndex.toFixed(1)})에 따른 전반적 시장 조정 위험이 존재한다. 이러한 매크로 환경에서는 개별 종목의 펀더멘털과 무관한 시스템적 리스크(Systematic Risk)에 의한 동반 하락 가능성을 항상 고려해야 한다.` });
  }

  return out;
}

/* ═══════════════════════════════════════════════
   8a. Tail Risk Assessment
   ═══════════════════════════════════════════════ */

function computeTailRisks(
  stock: Partial<DeepStockAnalysis>, macro: MacroSnapshot
): TailRiskItem[] {
  const risks: TailRiskItem[] = [];

  if (stock.debtToEquity != null && stock.debtToEquity > 200) {
    risks.push({
      category: "재무 레버리지",
      severity: "HIGH",
      description: `D/E ${stock.debtToEquity.toFixed(0)}% — 금리 ${macro.treasuryYield10Y.toFixed(2)}% 환경에서 과도한 부채는 이자비용 급증과 신용등급 하향 리스크를 동반하며, 재융자 실패 시 유동성 위기로 전이 가능`,
    });
  } else if (stock.debtToEquity != null && stock.debtToEquity > 100) {
    risks.push({
      category: "재무 레버리지",
      severity: "MEDIUM",
      description: `D/E ${stock.debtToEquity.toFixed(0)}% — 적정 범위 상단으로, 금리 추가 인상 시 이자비용 부담이 현금흐름 대비 10~15% 수준으로 확대될 수 있음`,
    });
  }

  if (stock.beta != null && stock.beta > 1.8) {
    risks.push({
      category: "시장 변동성 노출",
      severity: "HIGH",
      description: `Beta ${stock.beta.toFixed(2)} — 극단적 시장 이벤트(Black Swan) 발생 시 시장 하락 폭의 ${stock.beta.toFixed(1)}배 손실이 예상되며, 유동성 고갈 시 NAV 대비 할인이 심화될 위험`,
    });
  }

  if (stock.advanced?.maxDrawdown != null && stock.advanced.maxDrawdown > 35) {
    risks.push({
      category: "낙폭 위험",
      severity: "HIGH",
      description: `MDD ${stock.advanced.maxDrawdown.toFixed(1)}% — 동일 수준의 낙폭 재발 시, 원금 회복에 필요한 수익률은 ${((1 / (1 - stock.advanced.maxDrawdown / 100) - 1) * 100).toFixed(0)}%로 기하급수적 증가`,
    });
  }

  if (stock.operatingMargins != null && stock.operatingMargins < 0) {
    risks.push({
      category: "수익성 위험",
      severity: "HIGH",
      description: `영업이익률 ${(stock.operatingMargins * 100).toFixed(1)}% — 지속적 영업손실로 현금 소진(Cash Burn)이 가속화되며, 추가 자본 조달(유상증자) 시 기존 주주가치 희석 가능`,
    });
  } else if (stock.operatingMargins != null && stock.operatingMargins < 0.05) {
    risks.push({
      category: "수익성 위험",
      severity: "MEDIUM",
      description: `영업이익률 ${(stock.operatingMargins * 100).toFixed(1)}% — 손익분기점에 근접하여, 매출 5% 감소만으로 적자 전환 가능성 존재`,
    });
  }

  if (stock.advanced?.shortRatio != null && stock.advanced.shortRatio > 8) {
    risks.push({
      category: "공매도 집중",
      severity: "HIGH",
      description: `Short Ratio ${stock.advanced.shortRatio.toFixed(1)}일 — 높은 공매도 잔고는 시장 참여자들이 펀더멘털 훼손 가능성에 베팅 중임을 시사하며, 부정적 뉴스 발생 시 하락 폭 증폭 가능`,
    });
  }

  if (stock.industry?.marketPosition === "Follower" && stock.industry.industryCycleStage === "DECLINE") {
    risks.push({
      category: "산업 구조적 위험",
      severity: "HIGH",
      description: `산업 쇠퇴기의 Follower 포지션 — 구조조정·인수합병·시장 퇴출 위험이 Leader 대비 3~5배 높은 것으로 역사적 데이터가 보여줌`,
    });
  }

  if (macro.vix > 30 && (stock.beta ?? 1) > 1.3) {
    risks.push({
      category: "지정학적/시스템 위험",
      severity: "MEDIUM",
      description: `VIX ${macro.vix.toFixed(1)} 환경에서 Beta ${(stock.beta ?? 1).toFixed(2)} 종목은 시스템적 위험(Systematic Risk)에 대한 노출도가 극대화된 상태`,
    });
  }

  if (risks.length === 0) {
    risks.push({
      category: "전반적 리스크",
      severity: "LOW",
      description: `현재 식별된 극단적 꼬리 위험(Tail Risk)은 제한적이나, 예측 불가능한 외부 충격(지정학, 규제, 유동성) 가능성은 항시 존재`,
    });
  }

  return risks;
}

/* ═══════════════════════════════════════════════
   8b. AI Confidence Breakdown
   ═══════════════════════════════════════════════ */

function buildConfidenceBreakdown(
  stock: Partial<DeepStockAnalysis>,
  peerData: PeerComparison[],
  relativeSectorStrength: number | null,
  closes: number[]
): ConfidenceBreakdown[] {
  const items: ConfidenceBreakdown[] = [];

  items.push({
    factor: "기본 시세 데이터 (가격/변동/시총)",
    available: stock.price != null && stock.price > 0,
    impact: 15,
    note: stock.price ? `현재가 ${stock.price.toLocaleString()} 확보` : "시세 데이터 미확보 — 분석 신뢰도 크게 저하",
  });

  items.push({
    factor: "밸류에이션 지표 (P/E, Forward P/E, PEG)",
    available: stock.pe != null,
    impact: 15,
    note: stock.pe ? `P/E ${stock.pe.toFixed(1)}x 확보` : "P/E 미확보 — 밸류에이션 분석 정확도 감소",
  });

  items.push({
    factor: "재무제표 (영업이익률, FCF, D/E)",
    available: stock.operatingMargins != null || stock.freeCashflow != null,
    impact: 15,
    note: stock.operatingMargins != null
      ? `영업이익률 ${(stock.operatingMargins * 100).toFixed(1)}% 확보`
      : "재무제표 데이터 부분 미확보 — 펀더멘털 분석 제한적",
  });

  items.push({
    factor: "기술적 지표 (50일/200일 이동평균)",
    available: stock.fiftyDayMA != null && stock.twoHundredDayMA != null,
    impact: 10,
    note: stock.fiftyDayMA ? `50일선 ${stock.fiftyDayMA.toFixed(2)} / 200일선 ${stock.twoHundredDayMA?.toFixed(2) ?? "N/A"} 확보` : "이동평균 데이터 미확보",
  });

  items.push({
    factor: "리스크 메트릭 (Sharpe, MDD)",
    available: stock.advanced?.sharpeRatio != null,
    impact: 10,
    note: stock.advanced?.sharpeRatio != null
      ? `Sharpe ${stock.advanced.sharpeRatio.toFixed(2)}, MDD ${stock.advanced.maxDrawdown?.toFixed(1) ?? "N/A"}%`
      : "과거 수익률 데이터 부족으로 Sharpe/MDD 계산 불가",
  });

  items.push({
    factor: "일별 종가 히스토리 (252일)",
    available: closes.length >= 200,
    impact: 10,
    note: `${closes.length}일 데이터 확보${closes.length < 200 ? " — 252일 미만으로 연환산 통계의 신뢰도 저하" : ""}`,
  });

  items.push({
    factor: "기관 보유/공매도 데이터",
    available: stock.advanced?.institutionalHolding != null || stock.advanced?.shortRatio != null,
    impact: 8,
    note: stock.advanced?.institutionalHolding != null
      ? `기관 보유 ${stock.advanced.institutionalHolding.toFixed(1)}%`
      : "기관 보유/공매도 데이터 미확보",
  });

  items.push({
    factor: "Peer Group 비교 데이터",
    available: peerData.length >= 2,
    impact: 10,
    note: peerData.length >= 2
      ? `${peerData.length}개 Peer 비교 가능`
      : `Peer 데이터 ${peerData.length}개 — 산업 비교 분석 제한`,
  });

  items.push({
    factor: "섹터 상대강도 (90일)",
    available: relativeSectorStrength != null,
    impact: 7,
    note: relativeSectorStrength != null
      ? `RS ${relativeSectorStrength.toFixed(1)}%p 확보`
      : "상대강도 계산 불가 — 섹터 ETF 데이터 미확보",
  });

  return items;
}

/* ═══════════════════════════════════════════════
   8c. Weighting Table Builder
   ═══════════════════════════════════════════════ */

function buildWeightingTable(
  stock: Partial<DeepStockAnalysis>, macro: MacroSnapshot
): WeightEntry[] {
  const s = stock.scores!;
  const entries: WeightEntry[] = [];

  entries.push({
    factor: "매크로 & 정책 정합성",
    tag: "Macro",
    weight: 15,
    rawValue: `${s.macroAlignment}/100`,
    contribution: Math.round(s.macroAlignment * 0.15),
    description: `금리 ${macro.treasuryYield10Y.toFixed(2)}% · VIX ${macro.vix.toFixed(1)} · 달러 ${macro.dollarIndex.toFixed(1)} · 레짐: ${macro.regime}`,
  });

  entries.push({
    factor: "밸류에이션 (DCF/EV)",
    tag: "Fundamental",
    weight: 20,
    rawValue: `${s.valuationScore}/100`,
    contribution: Math.round(s.valuationScore * 0.2),
    description: `P/E ${stock.pe?.toFixed(1) ?? "N/A"}x · Fwd P/E ${stock.forwardPE?.toFixed(1) ?? "N/A"}x · PEG ${stock.pegRatio?.toFixed(2) ?? "N/A"} · EV/EBITDA ${stock.advanced?.evToEbitda?.toFixed(1) ?? "N/A"}x`,
  });

  entries.push({
    factor: "모멘텀 & 기술적",
    tag: "Technical",
    weight: 20,
    rawValue: `${s.momentum}/10`,
    contribution: Math.round((s.momentum / 10) * 100 * 0.20),
    description: `등락 ${stock.change?.toFixed(2) ?? 0}% · 거래량비 ${stock.volume && stock.avgVolume ? (stock.volume / stock.avgVolume).toFixed(2) : "N/A"}x · Mayer ${stock.advanced?.mayerMultiple?.toFixed(3) ?? "N/A"}`,
  });

  entries.push({
    factor: "정량적 리스크 (역수)",
    tag: "Quant",
    weight: 15,
    rawValue: `${s.risk}/10`,
    contribution: Math.round(((10 - s.risk) / 10) * 100 * 0.15),
    description: `Beta ${stock.beta?.toFixed(2) ?? "N/A"} · Sharpe ${stock.advanced?.sharpeRatio?.toFixed(2) ?? "N/A"} · MDD ${stock.advanced?.maxDrawdown?.toFixed(1) ?? "N/A"}%`,
  });

  entries.push({
    factor: "배당 & 현금흐름",
    tag: "Fundamental",
    weight: 10,
    rawValue: `${s.dividendAttractiveness}/100`,
    contribution: Math.round(s.dividendAttractiveness * 0.10),
    description: `배당률 ${stock.dividendYield ? (stock.dividendYield * 100).toFixed(2) : "0.00"}% · FCF ${stock.freeCashflow ? (Math.abs(stock.freeCashflow) >= 1e12 ? `${(stock.freeCashflow / 1e12).toFixed(2)}T` : `${(stock.freeCashflow / 1e9).toFixed(2)}B`) : "N/A"}`,
  });

  const indScore = stock.industry?.competitiveAdvantageScore ?? 50;
  entries.push({
    factor: "산업 경쟁력 & Moat",
    tag: "Industry Trend",
    weight: 15,
    rawValue: `${indScore}/100`,
    contribution: Math.round(indScore * 0.15),
    description: `${stock.industry?.marketPosition ?? "N/A"} · ${stock.industry?.industryCycleStage ?? "N/A"} · RS ${stock.industry?.relativeSectorStrength?.toFixed(1) ?? "N/A"}%p`,
  });

  entries.push({
    factor: "꼬리 위험 (Tail Risk)",
    tag: "Risk",
    weight: 5,
    rawValue: `D/E ${stock.debtToEquity?.toFixed(0) ?? "N/A"}%`,
    contribution: Math.round(
      (stock.debtToEquity != null && stock.debtToEquity < 100 ? 80 :
       stock.debtToEquity != null && stock.debtToEquity < 200 ? 50 : 20) * 0.05
    ),
    description: `D/E ${stock.debtToEquity?.toFixed(0) ?? "N/A"}% · 영업이익률 ${stock.operatingMargins != null ? (stock.operatingMargins * 100).toFixed(1) + "%" : "N/A"} · Short ${stock.advanced?.shortRatio?.toFixed(1) ?? "N/A"}일`,
  });

  return entries;
}

/* ═══════════════════════════════════════════════
   9. Main: Analyze Single Stock
   ═══════════════════════════════════════════════ */

export async function analyzeStock(
  sym: string, macro: MacroSnapshot
): Promise<DeepStockAnalysis | null> {
  const [rawQuote, summaryData, closes] = await Promise.all([
    quoteRaw(sym).catch(() => null),
    quoteSummaryRaw(sym).catch(() => null),
    fetchDailyCloses(sym, 252).catch(() => [] as number[]),
  ]);

  if (!rawQuote) return null;

  const price = Number(rawQuote.regularMarketPrice ?? 0);
  const changePercent = Number(rawQuote.regularMarketChangePercent ?? 0);
  const name = String(rawQuote.shortName ?? rawQuote.longName ?? sym);
  const volume = Number(rawQuote.regularMarketVolume ?? 0);
  const avgVolume = Number(rawQuote.averageDailyVolume3Month ?? rawQuote.averageDailyVolume10Day ?? volume);
  const high52 = Number(rawQuote.fiftyTwoWeekHigh ?? price);
  const low52 = Number(rawQuote.fiftyTwoWeekLow ?? price);
  const marketCap = Number(rawQuote.marketCap ?? 0);
  const fiftyDayMA = Number(rawQuote.fiftyDayAverage ?? 0) || null;
  const twoHundredDayMA = Number(rawQuote.twoHundredDayAverage ?? 0) || null;

  const beta = Number(rawQuote.beta ?? 1.0);
  const pe = rawQuote.trailingPE ? Number(rawQuote.trailingPE) : null;
  const forwardPE = rawQuote.forwardPE ? Number(rawQuote.forwardPE) : null;
  // Yahoo returns trailingAnnualDividendYield as decimal (0.0178 = 1.78%).
  // dividendYield may be decimal OR percentage depending on market/stock.
  // Prefer trailingAnnualDividendYield; normalize if value > 1 (already %).
  let divYield = Number(rawQuote.trailingAnnualDividendYield ?? rawQuote.dividendYield ?? 0);
  if (!Number.isFinite(divYield) || divYield < 0) divYield = 0;
  if (divYield > 1) divYield = divYield / 100;

  // Also try summaryDetail.dividendYield for better accuracy
  if (divYield === 0 && summaryData) {
    const sd = summaryData.summaryDetail as Record<string, unknown> | undefined;
    const sdYield = extractRaw(sd?.dividendYield) ?? extractRaw(sd?.trailingAnnualDividendYield);
    if (sdYield != null && sdYield > 0) {
      divYield = sdYield > 1 ? sdYield / 100 : sdYield;
    }
  }

  let pegRatio: number | null = null;
  let debtToEquity: number | null = null;
  let operatingMargins: number | null = null;
  let revenueGrowth: number | null = null;
  let freeCashflow: number | null = null;
  let institutionalHolding: number | null = null;
  let shortRatio: number | null = null;

  if (summaryData) {
    const stats = summaryData.defaultKeyStatistics as Record<string, unknown> | undefined;
    const fin = summaryData.financialData as Record<string, unknown> | undefined;

    pegRatio = extractRaw(stats?.pegRatio);
    debtToEquity = extractRaw(fin?.debtToEquity);
    operatingMargins = extractRaw(fin?.operatingMargins);
    revenueGrowth = extractRaw(fin?.revenueGrowth);
    freeCashflow = extractRaw(fin?.freeCashflow);
    institutionalHolding = extractRaw(stats?.heldPercentInstitutions) != null
      ? (extractRaw(stats?.heldPercentInstitutions)! * 100) : null;
    shortRatio = extractRaw(stats?.shortRatio);
  }

  const distFromHigh = high52 > 0 ? ((high52 - price) / high52) * 100 : 0;
  const volumeRatio = avgVolume > 0 ? volume / avgVolume : 1;

  const sector = inferSector(summaryData, sym);
  const country = inferCountry(sym);
  const nativeCurrency = inferCurrency(sym);

  const riskFreeRate = macro.treasuryYield10Y / 100;
  const { sharpe, annReturn, annVol } = computeSharpeRatio(closes, riskFreeRate);
  const maxDrawdown = computeMaxDrawdown(closes);

  const mayerMultiple = twoHundredDayMA && twoHundredDayMA > 0 ? Math.round((price / twoHundredDayMA) * 1000) / 1000 : null;

  let evToEbitda: number | null = null;
  if (summaryData) {
    const stats = summaryData.defaultKeyStatistics as Record<string, unknown> | undefined;
    evToEbitda = extractRaw(stats?.enterpriseToEbitda);
  }

  const { peers: peerSymbols, etf: sectorETF } = getPeerSymbols(sym, sector);
  const [peerData, relativeSectorStrength] = await Promise.all([
    fetchPeerData(peerSymbols).catch(() => [] as PeerComparison[]),
    fetchRelativeSectorStrength(sym, sectorETF).catch(() => null),
  ]);

  const targetPeer: PeerComparison = {
    symbol: sym, name, price, change: changePercent, marketCap,
    pe, revenueGrowth, operatingMargins, beta, isTarget: true,
  };
  const allPeers = [targetPeer, ...peerData.map((p) => ({ ...p, isTarget: false }))];

  const marketPosition = determineMarketPosition(
    marketCap, peerData.map((p) => p.marketCap),
    revenueGrowth, peerData.map((p) => p.revenueGrowth),
    operatingMargins
  );

  const competitiveAdvantageScore = computeCompetitiveAdvantage(
    revenueGrowth, peerData.map((p) => p.revenueGrowth),
    operatingMargins, peerData.map((p) => p.operatingMargins),
    marketPosition, relativeSectorStrength
  );

  const industryCycleStage = inferIndustryCycle(sector, revenueGrowth);

  const industryAnalysis: IndustryAnalysis = {
    peers: allPeers,
    marketPosition,
    competitiveAdvantageScore,
    industryCycleStage,
    sectorETF,
    relativeSectorStrength,
  };

  const momentum = computeMomentum(changePercent, volumeRatio, distFromHigh, fiftyDayMA, twoHundredDayMA, price);
  const risk = computeRisk(beta, changePercent, distFromHigh, maxDrawdown, macro.vix);
  const dividendAttractiveness = computeDividendScore(divYield);
  const macroAlignment = computeMacroAlignment(sector, macro);
  const valuationScore = computeValuation(pe, forwardPE, pegRatio, debtToEquity);

  const { signal, confidence, aiConfidence, buyPts, sellPts } = determineSignal(
    momentum, risk, valuationScore, macroAlignment,
    pe, changePercent, distFromHigh, fiftyDayMA, twoHundredDayMA, price
  );

  const partial: Partial<DeepStockAnalysis> = {
    symbol: sym, name, price, change: changePercent, sector, country, nativeCurrency,
    beta, pe, forwardPE, pegRatio, dividendYield: divYield,
    volume, avgVolume, fiftyTwoWeekHigh: high52, fiftyTwoWeekLow: low52,
    marketCap, debtToEquity, operatingMargins, revenueGrowth, freeCashflow,
    fiftyDayMA, twoHundredDayMA,
    scores: { momentum, risk, dividendAttractiveness, macroAlignment, valuationScore },
    advanced: {
      sharpeRatio: sharpe, maxDrawdown, annualizedReturn: annReturn, annualizedVolatility: annVol,
      institutionalHolding, shortRatio, relativeSectorStrength,
      mayerMultiple, evToEbitda,
    },
    industry: industryAnalysis,
  };

  const bullCase = generateBullCase(partial, macro);
  const bearCase = generateBearCase(partial, macro);
  const weightingTable = buildWeightingTable(partial, macro);
  const tailRisks = computeTailRisks(partial, macro);
  const confidenceBreakdown = buildConfidenceBreakdown(partial, peerData, relativeSectorStrength, closes);

  let adjustedConfidence = aiConfidence;
  const availableFactors = confidenceBreakdown.filter((c) => c.available).length;
  const totalFactors = confidenceBreakdown.length;
  adjustedConfidence = Math.min(95, Math.max(15, Math.round(
    (availableFactors / totalFactors) * 70 + Math.abs(buyPts - sellPts) * 3 + 10
  )));
  if (peerData.length > 0) adjustedConfidence = Math.min(95, adjustedConfidence + 3);
  if (relativeSectorStrength != null) adjustedConfidence = Math.min(95, adjustedConfidence + 2);

  return {
    ...partial,
    signal,
    signalConfidence: confidence,
    aiConfidence: adjustedConfidence,
    bullCase,
    bearCase,
    weightingTable,
    tailRisks,
    confidenceBreakdown,
  } as DeepStockAnalysis;
}
