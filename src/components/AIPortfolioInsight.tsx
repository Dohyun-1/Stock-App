"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, BarChart3, Brain,
  ChevronDown, ChevronRight, DollarSign, ExternalLink, Globe, Loader2,
  PieChart, RefreshCcw, Scale, Shield, Sparkles, Target,
  TrendingDown, TrendingUp, X, Zap,
} from "lucide-react";

/* ── Types (mirrors API) ── */
type AnalysisTag = "Macro" | "Fundamental" | "Technical" | "Industry Trend" | "Competitor Shift" | "Market Share" | "Quant" | "Risk";
type TaggedInsight = { tag: AnalysisTag; text: string };
type WeightEntry = {
  factor: string;
  tag: AnalysisTag;
  weight: number;
  rawValue: string;
  contribution: number;
  description: string;
};
type TailRiskItem = {
  category: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
};
type AdvancedMetrics = {
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
type PeerComparison = {
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
type IndustryAnalysis = {
  peers: PeerComparison[];
  marketPosition: string;
  competitiveAdvantageScore: number;
  industryCycleStage: string;
  sectorETF: string;
  relativeSectorStrength: number | null;
};
type StockScores = {
  momentum: number;
  risk: number;
  dividendAttractiveness: number;
  macroAlignment: number;
  valuationScore: number;
};
type StockAnalysis = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  signal: "BUY" | "SELL" | "HOLD";
  signalConfidence: number;
  aiConfidence: number;
  bullCase: TaggedInsight[];
  bearCase: TaggedInsight[];
  scores: StockScores;
  weightingTable: WeightEntry[];
  advanced: AdvancedMetrics;
  industry: IndustryAnalysis;
  tailRisks?: TailRiskItem[];
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
  nativeCurrency?: string;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", KRW: "₩", JPY: "¥", EUR: "€", GBP: "£",
  CNY: "¥", HKD: "HK$", AUD: "A$", CAD: "C$",
};

function fmtPrice(v: number, currency?: string): string {
  const sym = CURRENCY_SYMBOLS[currency ?? "USD"] ?? "$";
  if (currency === "KRW" || currency === "JPY") {
    return `${sym}${Math.round(v).toLocaleString()}`;
  }
  return `${sym}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtAbsolute(v: number, currency?: string): string {
  const sym = CURRENCY_SYMBOLS[currency ?? "USD"] ?? "$";
  if (Math.abs(v) >= 1e12) return `${sym}${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `${sym}${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${sym}${(v / 1e6).toFixed(0)}M`;
  return `${sym}${v.toLocaleString()}`;
}

type MacroSnapshot = {
  treasuryYield10Y: number;
  dollarIndex: number;
  vix: number;
  goldPrice: number;
  oilPrice: number;
  sp500Change: number;
  regime: "RISK_ON" | "RISK_OFF" | "NEUTRAL";
  rateEnvironment: "HAWKISH" | "DOVISH" | "NEUTRAL";
};
type InsightData = {
  macro: MacroSnapshot;
  portfolioScore: number;
  riskScore: number;
  dividendScore: number;
  momentumScore: number;
  diversificationScore: number;
  overallSignal: "BULLISH" | "BEARISH" | "NEUTRAL";
  aiConfidence: number;
  summary: string;
  stocks: StockAnalysis[];
  sectorDistribution: Record<string, number>;
  countryDistribution: Record<string, number>;
  generatedAt: string;
};

/* ── Design Tokens ── */
const SIGNAL_STYLES = {
  BUY: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", label: "매수" },
  SELL: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", label: "매도" },
  HOLD: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", label: "보유" },
};
const OVERALL_STYLES = {
  BULLISH: { bg: "from-emerald-500/10 to-emerald-600/5", text: "text-emerald-400", icon: TrendingUp, label: "강세" },
  BEARISH: { bg: "from-red-500/10 to-red-600/5", text: "text-red-400", icon: TrendingDown, label: "약세" },
  NEUTRAL: { bg: "from-amber-500/10 to-amber-600/5", text: "text-amber-400", icon: Activity, label: "중립" },
};

const REGIME_LABEL: Record<string, string> = { RISK_ON: "위험선호", RISK_OFF: "위험회피", NEUTRAL: "중립" };
const RATE_LABEL: Record<string, string> = { HAWKISH: "긴축", DOVISH: "완화", NEUTRAL: "중립" };

/* ── Helpers ── */
function scoreColor(v: number, max: number, invert = false) {
  const p = invert ? 1 - v / max : v / max;
  if (p >= 0.7) return "text-emerald-400";
  if (p >= 0.4) return "text-amber-400";
  return "text-red-400";
}

function fmtNum(v: number | null | undefined, dec = 1): string {
  if (v == null || !Number.isFinite(v)) return "N/A";
  return v.toFixed(dec);
}

/* ── Score Ring SVG ── */
function ScoreRing({ value, max, label, icon: Icon, invert, sub }: {
  value: number; max: number; label: string; icon: React.ElementType; invert?: boolean; sub?: string;
}) {
  const pct = Math.min(value / max, 1);
  const circ = 2 * Math.PI * 28;
  const offset = circ * (1 - pct);
  const color = invert
    ? pct > 0.7 ? "#ef4444" : pct > 0.4 ? "#f59e0b" : "#22c55e"
    : pct > 0.7 ? "#22c55e" : pct > 0.4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-[80px] w-[80px]">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#334155" strokeWidth="3.5" />
          <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className={`text-lg font-bold tabular-nums ${scoreColor(value, max, invert)}`}>
        {Number.isInteger(value) ? value : value.toFixed(1)}{sub ?? ""}
      </p>
      <p className="text-[13px] font-semibold text-white text-center leading-tight">{label}</p>
    </div>
  );
}

/* ── Grouped Insights (deduplicate consecutive tags) ── */
function GroupedInsights({ items }: { items: TaggedInsight[] }) {
  const grouped: { tag: AnalysisTag; texts: string[] }[] = [];
  for (const item of items) {
    const last = grouped[grouped.length - 1];
    if (last && last.tag === item.tag) {
      last.texts.push(item.text);
    } else {
      grouped.push({ tag: item.tag, texts: [item.text] });
    }
  }
  return (
    <div className="space-y-4">
      {grouped.map((g, i) => (
        <div key={i}>
          <p className="text-[15px] font-bold text-white mb-2">[{g.tag}]</p>
          <div className="space-y-2 pl-1">
            {g.texts.map((t, j) => (
              <p key={j} className="text-sm leading-relaxed text-white">{t}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Skeleton ── */
function InsightSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 rounded bg-slate-700" />
        <div className="h-4 w-56 rounded bg-slate-700" />
      </div>
      <div className="h-16 rounded-xl bg-slate-700/40" />
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-[68px] w-[68px] rounded-full bg-slate-700/50" />
            <div className="h-3 w-10 rounded bg-slate-700" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-700/30" />
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-white">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
        실시간 매크로 데이터 수집 및 종목 분석 중...
      </div>
    </div>
  );
}

/* ── Macro Dashboard ── */
function MacroDashboard({ macro }: { macro: MacroSnapshot }) {
  const items = [
    { label: "10Y 금리", value: `${macro.treasuryYield10Y.toFixed(2)}%`, sub: RATE_LABEL[macro.rateEnvironment] },
    { label: "달러 인덱스", value: macro.dollarIndex.toFixed(1), sub: "" },
    { label: "VIX", value: macro.vix.toFixed(1), sub: REGIME_LABEL[macro.regime] },
    { label: "Gold", value: `$${macro.goldPrice.toFixed(0)}`, sub: "" },
    { label: "WTI", value: `$${macro.oilPrice.toFixed(2)}`, sub: "" },
    { label: "S&P500", value: `${macro.sp500Change >= 0 ? "+" : ""}${macro.sp500Change.toFixed(2)}%`, sub: "" },
  ];
  return (
    <div className="rounded-xl border border-white/20 bg-slate-800/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Globe className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-bold text-blue-400">매크로 환경</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-[13px] font-medium text-white">{item.label}</p>
            <p className="text-base font-bold tabular-nums text-white">{item.value}</p>
            {item.sub && <p className="text-[12px] font-bold text-cyan-400">{item.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Weighting Table ── */
function WeightingTable({ entries }: { entries: WeightEntry[] }) {
  const total = entries.reduce((s, e) => s + e.contribution, 0);
  return (
    <div className="rounded-xl border border-white/15 bg-slate-900/40 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/15 px-4 py-2.5">
        <Scale className="h-4 w-4 text-white" />
        <span className="text-[13px] font-bold text-white">가중 배분표</span>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-white/10 text-white">
            <th className="px-4 py-2 text-left font-semibold">팩터</th>
            <th className="px-3 py-2 text-center font-semibold">태그</th>
            <th className="px-3 py-2 text-center font-semibold">비중</th>
            <th className="px-3 py-2 text-center font-semibold">원점수</th>
            <th className="px-3 py-2 text-center font-semibold">기여도</th>
            <th className="px-4 py-2 text-left font-semibold">근거</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i} className="border-b border-white/10 hover:bg-slate-800/30">
              <td className="px-4 py-2 font-semibold text-white">{e.factor}</td>
              <td className="px-3 py-2 text-center text-[13px] font-bold text-white">[{e.tag}]</td>
              <td className="px-3 py-2 text-center tabular-nums text-white">{e.weight}%</td>
              <td className="px-3 py-2 text-center tabular-nums text-white">{e.rawValue}</td>
              <td className="px-3 py-2 text-center">
                <span className={`font-bold tabular-nums ${e.contribution >= 15 ? "text-emerald-400" : e.contribution >= 8 ? "text-amber-400" : "text-red-400"}`}>
                  {e.contribution}
                </span>
              </td>
              <td className="px-4 py-2 text-white max-w-[240px] truncate" title={e.description}>{e.description}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-800/40">
            <td className="px-4 py-2 font-bold text-white">합계</td>
            <td></td>
            <td className="px-3 py-2 text-center tabular-nums font-bold text-white">100%</td>
            <td></td>
            <td className="px-3 py-2 text-center font-bold tabular-nums text-cyan-400">{total}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ── Advanced Metrics Card (Korean) ── */
function AdvancedMetricsCard({ adv }: { adv: AdvancedMetrics }) {
  const metrics = [
    { label: "샤프 비율", value: fmtNum(adv.sharpeRatio, 2), good: (adv.sharpeRatio ?? 0) > 1 },
    { label: "최대낙폭 (MDD)", value: adv.maxDrawdown != null ? `${adv.maxDrawdown.toFixed(1)}%` : "N/A", good: (adv.maxDrawdown ?? 100) < 20 },
    { label: "연환산 수익률", value: adv.annualizedReturn != null ? `${adv.annualizedReturn.toFixed(1)}%` : "N/A", good: (adv.annualizedReturn ?? 0) > 0 },
    { label: "연환산 변동성", value: adv.annualizedVolatility != null ? `${adv.annualizedVolatility.toFixed(1)}%` : "N/A", good: (adv.annualizedVolatility ?? 100) < 25 },
    { label: "기관 보유율", value: adv.institutionalHolding != null ? `${adv.institutionalHolding.toFixed(1)}%` : "N/A", good: (adv.institutionalHolding ?? 0) > 60 },
    { label: "공매도 비율", value: adv.shortRatio != null ? `${adv.shortRatio.toFixed(1)}일` : "N/A", good: (adv.shortRatio ?? 10) < 5 },
    { label: "마이어 배수", value: fmtNum(adv.mayerMultiple, 3), good: (adv.mayerMultiple ?? 1) < 1.4 && (adv.mayerMultiple ?? 0) > 0.6 },
    { label: "EV/EBITDA", value: fmtNum(adv.evToEbitda, 1), good: (adv.evToEbitda ?? 50) < 15 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-cyan-400" />
        <span className="text-base font-bold text-white">정량적 지표</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg bg-slate-800/60 border border-white/15 px-4 py-3">
            <p className="text-sm font-medium text-white">{m.label}</p>
            <p className={`text-xl font-bold tabular-nums mt-0.5 ${m.good ? "text-emerald-400" : "text-red-400"}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Industry Cycle Badge ── */
const CYCLE_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  INTRODUCTION: { label: "도입기", color: "text-blue-400", step: 1 },
  GROWTH: { label: "성장기", color: "text-emerald-400", step: 2 },
  MATURITY: { label: "성숙기", color: "text-amber-400", step: 3 },
  DECLINE: { label: "쇠퇴기", color: "text-red-400", step: 4 },
};

function IndustryCycleBadge({ stage }: { stage: string }) {
  const cfg = CYCLE_CONFIG[stage] ?? CYCLE_CONFIG.MATURITY;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`h-2 w-6 rounded-full ${n <= cfg.step ? (n <= 2 ? "bg-emerald-500" : n === 3 ? "bg-amber-500" : "bg-red-500") : "bg-slate-700"}`} />
        ))}
      </div>
      <span className={`text-[13px] font-bold ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}

/* ── Market Position Badge ── */
const POSITION_STYLES: Record<string, { bg: string; text: string }> = {
  "Market Leader": { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  Challenger: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  Specialist: { bg: "bg-violet-500/15", text: "text-violet-400" },
  Follower: { bg: "bg-slate-500/20", text: "text-white" },
};

/* ── Competitor Comparison Table ── */
function CompetitorTable({ peers, targetSymbol }: { peers: PeerComparison[]; targetSymbol: string }) {
  if (peers.length < 2) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-cyan-400" />
        <span className="text-base font-bold text-white">경쟁사 비교</span>
      </div>
      <div className="rounded-xl border border-white/15 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white">
                <th className="px-4 py-3 text-left font-semibold">종목</th>
                <th className="px-3 py-3 text-right font-semibold">가격</th>
                <th className="px-3 py-3 text-right font-semibold">등락</th>
                <th className="px-3 py-3 text-right font-semibold">시가총액</th>
                <th className="px-3 py-3 text-right font-semibold">P/E</th>
                <th className="px-3 py-3 text-right font-semibold">Beta</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((p) => {
                const isTarget = p.symbol === targetSymbol;
                const up = p.change >= 0;
                return (
                  <tr key={p.symbol} className={`border-b border-white/10 ${isTarget ? "bg-cyan-500/10" : "hover:bg-slate-800/30"}`}>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${isTarget ? "text-cyan-400" : "text-white"}`}>{p.symbol}</span>
                      {isTarget && <span className="ml-1.5 text-[11px] font-bold text-cyan-400">TARGET</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-white">
                      {p.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-3 py-3 text-right tabular-nums font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                      {up ? "+" : ""}{p.change.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-white">{fmtAbsolute(p.marketCap)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-white">{p.pe ? p.pe.toFixed(1) : "N/A"}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-white">{p.beta.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Tail Risk Panel ── */
const SEVERITY_STYLES = {
  HIGH: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", label: "높음" },
  MEDIUM: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", label: "보통" },
  LOW: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", label: "낮음" },
};

function TailRiskPanel({ risks }: { risks: TailRiskItem[] }) {
  if (!risks || risks.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-rose-400" />
        <span className="text-base font-bold text-white">꼬리 위험 평가</span>
      </div>
      <div className="space-y-2.5">
        {risks.map((r, i) => {
          const sev = SEVERITY_STYLES[r.severity];
          return (
            <div key={i} className={`rounded-lg border ${sev.border} ${sev.bg} p-4`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[12px] font-bold ${sev.text} uppercase`}>{sev.label}</span>
                <span className="text-sm font-bold text-white">{r.category}</span>
              </div>
              <p className="text-sm leading-relaxed text-white">{r.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Stock Detail Modal (Full Screen)
   ═══════════════════════════════════════ */
function StockDetailModal({ stock, macro, onClose }: { stock: StockAnalysis; macro: MacroSnapshot; onClose: () => void }) {
  const style = SIGNAL_STYLES[stock.signal];
  const isUp = stock.change >= 0;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl mx-4 my-8 rounded-2xl bg-slate-900 border border-white/20 shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-slate-900 border-b border-white/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
              {stock.signal === "BUY" ? <ArrowUp className={`h-5 w-5 ${style.text}`} /> :
               stock.signal === "SELL" ? <ArrowDown className={`h-5 w-5 ${style.text}`} /> :
               <Target className={`h-5 w-5 ${style.text}`} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{stock.symbol}</span>
                <span className={`rounded-md px-2 py-0.5 text-sm font-bold ${style.bg} ${style.text}`}>
                  {style.label} {stock.signalConfidence}%
                </span>
              </div>
              <p className="text-sm text-white">{stock.name} · {stock.sector}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums text-white">{fmtPrice(stock.price, stock.nativeCurrency)}</p>
              <p className={`text-sm font-bold tabular-nums ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                {isUp ? "+" : ""}{stock.change.toFixed(2)}%
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-700/50 transition">
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="space-y-6 p-6">
          {/* ── Macro Dashboard ── */}
          <MacroDashboard macro={macro} />

          {/* ── Bull Case (Full) ── */}
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span className="text-lg font-bold text-emerald-400">상승 시나리오</span>
            </div>
            <GroupedInsights items={stock.bullCase} />
          </div>

          {/* ── Bear Case (Full) ── */}
          <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              <span className="text-lg font-bold text-red-400">하락 리스크</span>
            </div>
            <GroupedInsights items={stock.bearCase} />
          </div>

          {/* ── Quantitative Metrics (Korean) ── */}
          <AdvancedMetricsCard adv={stock.advanced} />

          {/* ── Competitor Comparison ── */}
          {stock.industry?.peers && <CompetitorTable peers={stock.industry.peers} targetSymbol={stock.symbol} />}

          {/* ── Weighting Table ── */}
          <WeightingTable entries={stock.weightingTable} />

          {/* ── Tail Risk ── */}
          {stock.tailRisks && stock.tailRisks.length > 0 && (
            <TailRiskPanel risks={stock.tailRisks} />
          )}

          {/* ── Go to Company Analysis ── */}
          <Link
            href={`/market/${encodeURIComponent(stock.symbol)}`}
            onClick={() => { document.body.style.overflow = ""; }}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4 text-base font-bold text-cyan-400 transition hover:bg-cyan-500/20"
          >
            <ExternalLink className="h-5 w-5" />
            {stock.name} 기업 분석 상세 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Stock Card (Compact)
   ═══════════════════════════════════════ */
function StockInsightCard({ stock, macro }: { stock: StockAnalysis; macro: MacroSnapshot }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const style = SIGNAL_STYLES[stock.signal];
  const isUp = stock.change >= 0;

  const bullPreview = stock.bullCase[0]?.text ?? "";
  const bearPreview = stock.bearCase[0]?.text ?? "";
  const truncate = (s: string, len: number) => s.length > len ? s.slice(0, len) + "..." : s;

  return (
    <>
      <div className={`overflow-hidden rounded-xl border ${style.border} bg-slate-800/60 transition-all`}>
        {/* Header Row */}
        <button onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-700/20">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
            {stock.signal === "BUY" ? <ArrowUp className={`h-5 w-5 ${style.text}`} /> :
             stock.signal === "SELL" ? <ArrowDown className={`h-5 w-5 ${style.text}`} /> :
             <Target className={`h-5 w-5 ${style.text}`} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold text-white">{stock.symbol}</span>
              <span className={`rounded-md px-2 py-0.5 text-[13px] font-bold ${style.bg} ${style.text}`}>
                {style.label} {stock.signalConfidence}%
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-white">
              {stock.name} · {stock.sector}
              {stock.industry?.marketPosition && (
                <span className="ml-1.5 text-[12px] text-cyan-400">({stock.industry.marketPosition})</span>
              )}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-bold tabular-nums text-white">
              {fmtPrice(stock.price, stock.nativeCurrency)}
            </p>
            <p className={`text-sm font-bold tabular-nums ${isUp ? "text-emerald-400" : "text-red-400"}`}>
              {isUp ? "+" : ""}{stock.change.toFixed(2)}%
            </p>
          </div>
          {expanded ? <ChevronDown className="h-5 w-5 shrink-0 text-white" /> : <ChevronRight className="h-5 w-5 shrink-0 text-white" />}
        </button>

        {/* Expanded Detail (Compact) */}
        {expanded && (
          <div className="space-y-3 border-t border-white/20 px-4 pb-4 pt-3">
            {/* Quick Scores */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { l: "모멘텀", v: stock.scores.momentum, m: 10 },
                { l: "위험도", v: stock.scores.risk, m: 10, inv: true },
                { l: "배당매력", v: stock.scores.dividendAttractiveness, m: 100 },
                { l: "매크로정합", v: stock.scores.macroAlignment, m: 100 },
                { l: "밸류에이션", v: stock.scores.valuationScore, m: 100 },
              ].map((s) => (
                <div key={s.l} className="rounded-lg bg-slate-900/50 p-2.5 text-center">
                  <p className="text-[12px] font-semibold text-white">{s.l}</p>
                  <p className={`text-base font-bold tabular-nums ${scoreColor(s.v, s.m, s.inv)}`}>
                    {s.v}{s.m === 10 ? "/10" : ""}
                  </p>
                </div>
              ))}
            </div>

            {/* Fundamental Row */}
            <div className="grid grid-cols-4 gap-2 text-[13px]">
              {[
                { l: "P/E", v: fmtNum(stock.pe) },
                { l: "Fwd P/E", v: fmtNum(stock.forwardPE) },
                { l: "PEG", v: fmtNum(stock.pegRatio, 2) },
                { l: "Beta", v: fmtNum(stock.beta, 2) },
                { l: "배당률", v: `${(stock.dividendYield * 100).toFixed(2)}%` },
                { l: "D/E", v: fmtNum(stock.debtToEquity, 0) },
                { l: "영업이익률", v: stock.operatingMargins != null ? `${(stock.operatingMargins * 100).toFixed(1)}%` : "N/A" },
                { l: "매출성장률", v: stock.revenueGrowth != null ? `${(stock.revenueGrowth * 100).toFixed(1)}%` : "N/A" },
                { l: "FCF", v: stock.freeCashflow ? fmtAbsolute(stock.freeCashflow, stock.nativeCurrency) : "N/A" },
                { l: "EV/EBITDA", v: fmtNum(stock.advanced?.evToEbitda, 1) },
                { l: "마이어 배수", v: fmtNum(stock.advanced?.mayerMultiple, 3) },
                { l: "시가총액", v: fmtAbsolute(stock.marketCap, stock.nativeCurrency) },
              ].map((item) => (
                <div key={item.l} className="rounded-lg bg-slate-900/40 px-3 py-2">
                  <span className="text-white">{item.l}</span>
                  <span className="ml-1.5 font-bold text-white">{item.v}</span>
                </div>
              ))}
            </div>

            {/* Industry Position & Cycle */}
            {stock.industry && (
              <div className="rounded-xl border border-white/15 bg-slate-800/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13px] font-bold text-white">산업 내 위치</span>
                    {(() => {
                      const ps = POSITION_STYLES[stock.industry.marketPosition] ?? POSITION_STYLES.Follower;
                      return <span className={`rounded-md px-2 py-0.5 text-[13px] font-bold ${ps.bg} ${ps.text}`}>{stock.industry.marketPosition}</span>;
                    })()}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13px] font-semibold text-white">산업 주기</span>
                    <IndustryCycleBadge stage={stock.industry.industryCycleStage} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-slate-900/50 p-2.5 text-center">
                    <p className="text-[12px] font-semibold text-white">경쟁 우위</p>
                    <p className={`text-base font-bold tabular-nums ${stock.industry.competitiveAdvantageScore >= 60 ? "text-emerald-400" : stock.industry.competitiveAdvantageScore >= 40 ? "text-amber-400" : "text-red-400"}`}>
                      {stock.industry.competitiveAdvantageScore}/100
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-2.5 text-center">
                    <p className="text-[12px] font-semibold text-white">섹터 대비 RS</p>
                    <p className={`text-base font-bold tabular-nums ${(stock.industry.relativeSectorStrength ?? 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {stock.industry.relativeSectorStrength != null ? `${stock.industry.relativeSectorStrength > 0 ? "+" : ""}${stock.industry.relativeSectorStrength.toFixed(1)}%p` : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-2.5 text-center">
                    <p className="text-[12px] font-semibold text-white">벤치마크</p>
                    <p className="text-base font-bold tabular-nums text-cyan-400">{stock.industry.sectorETF}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Moving Averages */}
            {(stock.fiftyDayMA || stock.twoHundredDayMA) && (
              <div className="flex gap-2.5 text-[13px]">
                {stock.fiftyDayMA && (
                  <div className={`rounded-lg px-3 py-1.5 font-semibold ${stock.price > stock.fiftyDayMA ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    50일선 {stock.fiftyDayMA.toFixed(2)} {stock.price > stock.fiftyDayMA ? "▲ 상위" : "▼ 하회"}
                  </div>
                )}
                {stock.twoHundredDayMA && (
                  <div className={`rounded-lg px-3 py-1.5 font-semibold ${stock.price > stock.twoHundredDayMA ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    200일선 {stock.twoHundredDayMA.toFixed(2)} {stock.price > stock.twoHundredDayMA ? "▲ 상위" : "▼ 하회"}
                  </div>
                )}
              </div>
            )}

            {/* Bull/Bear Preview (Compact) */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">상승 시나리오</span>
                </div>
                {stock.bullCase[0] && (
                  <div>
                    <p className="text-[13px] font-bold text-white mb-1">[{stock.bullCase[0].tag}]</p>
                    <p className="text-[13px] leading-relaxed text-white line-clamp-2">{truncate(bullPreview, 100)}</p>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingDown className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-bold text-red-400">하락 리스크</span>
                </div>
                {stock.bearCase[0] && (
                  <div>
                    <p className="text-[13px] font-bold text-white mb-1">[{stock.bearCase[0].tag}]</p>
                    <p className="text-[13px] leading-relaxed text-white line-clamp-2">{truncate(bearPreview, 100)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detail Button */}
            <button
              onClick={() => setShowDetail(true)}
              className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-3 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500/20"
            >
              상세 분석 보기 →
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && <StockDetailModal stock={stock} macro={macro} onClose={() => setShowDetail(false)} />}
    </>
  );
}

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */
export default function AIPortfolioInsight({ watchlist }: { watchlist: string[] }) {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchInsight = useCallback(async () => {
    if (watchlist.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/portfolio-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: watchlist }),
      });
      if (!res.ok) throw new Error("분석 실패");
      setData(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    if (watchlist.length > 0) fetchInsight();
  }, [watchlist.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (watchlist.length === 0) return null;

  const overallStyle = data ? OVERALL_STYLES[data.overallSignal] : null;
  const OverallIcon = overallStyle?.icon ?? Activity;

  return (
    <div className="space-y-0">
      {/* Collapsed Header (always visible) */}
      <button
        onClick={() => { if (!data && !loading) fetchInsight(); setOpen((p) => !p); }}
        className="flex w-full items-center justify-between rounded-2xl border border-white/25 bg-gradient-to-r from-slate-800/90 to-slate-800/70 px-6 py-4 shadow-md shadow-black/40 transition hover:border-cyan-500/30 hover:bg-slate-700/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/25 to-cyan-500/25">
            <Brain className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">AI Portfolio Insight</h3>
            <p className="text-[13px] text-white">
              {loading ? "분석 중..." : data ? `${data.stocks.length}개 종목 분석 완료` : "매크로 적응형 정량 분석"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data && overallStyle && !open && (
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${overallStyle.text} bg-slate-700/60`}>
              {overallStyle.label}
            </span>
          )}
          {loading && <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />}
          {open ? <ChevronDown className="h-5 w-5 text-white" /> : <ChevronRight className="h-5 w-5 text-white" />}
        </div>
      </button>

      {/* Expanded Content */}
      {open && (
        <div className="mt-3 space-y-4">
          {/* Refresh button */}
          <div className="flex justify-end">
            <button onClick={fetchInsight} disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-slate-700/60 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-slate-600/60 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              {loading ? "분석 중..." : "새로고침"}
            </button>
          </div>

          {loading && !data && <InsightSkeleton />}

          {error && !data && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              분석 중 오류가 발생했습니다. 다시 시도해 주세요.
            </div>
          )}

          {data && (
            <div className="space-y-3">
              {/* Overall Signal */}
              <div className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${overallStyle?.bg} border border-white/20 px-5 py-4`}>
                <OverallIcon className={`h-6 w-6 ${overallStyle?.text}`} />
                <div className="flex-1">
                  <span className={`text-base font-bold ${overallStyle?.text}`}>
                    전체 신호: {overallStyle?.label}
                  </span>
                  <p className="mt-1 text-sm text-white">{data.summary}</p>
                </div>
              </div>

              {/* Score Rings */}
              <div className="rounded-xl border border-white/20 bg-slate-800/40 p-4">
                <div className="grid grid-cols-5 gap-2">
                  <ScoreRing value={data.portfolioScore} max={100} label="포트폴리오 건강도" icon={BarChart3} />
                  <ScoreRing value={data.riskScore} max={10} label="위험도" icon={Shield} invert />
                  <ScoreRing value={data.dividendScore} max={100} label="배당 매력" icon={DollarSign} />
                  <ScoreRing value={data.momentumScore} max={10} label="모멘텀" icon={Zap} />
                  <ScoreRing value={data.diversificationScore} max={100} label="분산투자" icon={PieChart} />
                </div>
              </div>

              {/* Distribution Charts */}
              {(Object.keys(data.sectorDistribution).length > 1 || Object.keys(data.countryDistribution).length > 1) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/20 bg-slate-800/40 p-4">
                    <p className="mb-3 text-[13px] font-bold text-white">섹터 분포 (상관관계 편중 점검)</p>
                    <div className="space-y-2">
                      {Object.entries(data.sectorDistribution).sort((a, b) => b[1] - a[1]).map(([sector, count]) => {
                        const pct = (count / data.stocks.length) * 100;
                        return (
                          <div key={sector}>
                            <div className="flex justify-between text-[13px]">
                              <span className="text-white">{sector}</span>
                              <span className={`font-mono font-bold ${pct > 50 ? "text-red-400" : "text-white"}`}>{pct.toFixed(0)}%</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/60">
                              <div className={`h-full rounded-full transition-all duration-700 ${pct > 50 ? "bg-red-500/70" : "bg-cyan-500/70"}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-slate-800/40 p-4">
                    <p className="mb-3 text-[13px] font-bold text-white">국가 분포</p>
                    <div className="space-y-2">
                      {Object.entries(data.countryDistribution).sort((a, b) => b[1] - a[1]).map(([country, count]) => {
                        const pct = (count / data.stocks.length) * 100;
                        const flags: Record<string, string> = { US: "🇺🇸", KR: "🇰🇷", JP: "🇯🇵", UK: "🇬🇧", DE: "🇩🇪", CN: "🇨🇳", HK: "🇭🇰", FR: "🇫🇷", AU: "🇦🇺", CA: "🇨🇦" };
                        return (
                          <div key={country}>
                            <div className="flex justify-between text-[13px]">
                              <span className="text-white">{flags[country] ?? "🌐"} {country}</span>
                              <span className="font-mono font-bold text-white">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/60">
                              <div className="h-full rounded-full bg-violet-500/70 transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Cards */}
              <div>
                <p className="mb-2.5 flex items-center gap-2 text-sm font-bold text-white">
                  <Target className="h-4 w-4" />
                  종목별 분석 (클릭하여 펼치기)
                </p>
                <div className="space-y-2">
                  {data.stocks.map((s) => (
                    <StockInsightCard key={s.symbol} stock={s} macro={data.macro} />
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="space-y-1.5 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <p className="text-[12px] text-white">
                  분석 시각: {new Date(data.generatedAt).toLocaleString("ko-KR")} | 데이터: Yahoo Finance Real-time API | 엔진: Macro-Adaptive Quant Engine v2
                </p>
                <p className="text-[12px] leading-relaxed text-white">
                  본 보고서는 AI 기반 정량적 데이터 분석(매크로·기본적·기술적·산업 경쟁 팩터 통합 연산) 결과이며,
                  최종 투자 결정 및 그에 따른 손익의 책임은 전적으로 투자자 본인에게 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
