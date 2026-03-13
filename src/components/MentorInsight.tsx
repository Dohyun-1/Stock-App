"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Brain, ChevronDown, ChevronRight,
  Shield, Zap, BookOpen, MessageCircle, Target, Users,
  CheckCircle2, XCircle, MinusCircle, FileText, BarChart3,
} from "lucide-react";
import { MENTOR_PROFILES, type MentorProfile } from "@/lib/mentors/mentorProfiles";
import {
  evaluateStockAllMentors,
  type StockMetrics,
  type MentorVerdict,
} from "@/lib/mentors/mentorEngine";

const STORAGE_KEY = "stockpro_selected_mentor";

const SIGNAL_STYLE: Record<string, { bg: string; text: string; label: string; short: string }> = {
  STRONG_BUY: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "강력 매수", short: "강매수" },
  BUY: { bg: "bg-green-500/15", text: "text-green-400", label: "매수", short: "매수" },
  HOLD: { bg: "bg-amber-500/15", text: "text-amber-400", label: "관망", short: "관망" },
  SELL: { bg: "bg-orange-500/15", text: "text-orange-400", label: "매도", short: "매도" },
  STRONG_SELL: { bg: "bg-red-500/20", text: "text-red-400", label: "강력 매도", short: "강매도" },
};

export interface StockInsightData {
  symbol: string;
  name: string;
  price: number;
  score: number;
  pe: number;
  dividendYield: number;
  beta: number;
  forwardPE?: number | null;
  pegRatio?: number | null;
  debtToEquity?: number | null;
  operatingMargins?: number | null;
  revenueGrowth?: number | null;
  freeCashflow?: number | null;
  marketCap?: number;
  advanced?: {
    sharpeRatio?: number;
    maxDrawdown?: number;
    volatility30d?: number;
    currentRatio?: number;
    annualizedVolatility?: number;
    evToEbitda?: number;
  };
  nativeCurrency?: string;
}

function toStockMetrics(s: StockInsightData): StockMetrics {
  const fcfYield = s.freeCashflow != null && s.marketCap && s.marketCap > 0
    ? s.freeCashflow / s.marketCap : null;
  return {
    symbol: s.symbol, name: s.name, price: s.price,
    pe: s.pe > 0 ? s.pe : null, pb: null,
    roe: null,
    debtToEquity: s.debtToEquity ?? null,
    fcfYield,
    operatingMargin: s.operatingMargins ?? null,
    dividendYield: s.dividendYield > 0 ? s.dividendYield : null,
    revenueGrowth: s.revenueGrowth ?? null,
    earningsGrowth: null,
    beta: s.beta > 0 ? s.beta : null,
    sharpeRatio: s.advanced?.sharpeRatio ?? null,
    momentum: s.score > 0 ? s.score / 10 : null,
    maxDrawdown: s.advanced?.maxDrawdown ?? null,
    grossMargin: null,
    volatility: s.advanced?.annualizedVolatility ?? s.advanced?.volatility30d ?? null,
    currentRatio: s.advanced?.currentRatio ?? null,
  };
}

const MENTOR_EMOJI: Record<string, string> = {
  buffett: "🏛️", lynch: "🛒", wood: "🚀", dalio: "⚖️", simons: "🔢",
  minervini: "📈", soros: "🌊", fisher: "🔍", graham: "🛡️", taleb: "🦢",
};

function MentorChip({
  mentor, selected, onClick,
}: { mentor: MentorProfile; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl px-5 py-3 text-base font-bold transition-all whitespace-nowrap ${
        selected
          ? "bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/50"
          : "bg-slate-700/50 text-white hover:bg-slate-600/60 hover:brightness-110"
      }`}
    >
      <span className="text-xl">{MENTOR_EMOJI[mentor.id] ?? "👤"}</span>
      {mentor.nameKo}
    </button>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5 w-14">
      <div className="h-1 flex-1 rounded-full bg-slate-700/60 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-bold text-white tabular-nums">{score}</span>
    </div>
  );
}

/* ── Compact Summary Table (clickable rows for rationale) ── */
function CompactVerdictTable({ selectedVerdicts, stocks, mentorProfile, activeSymbol, onRowClick }: {
  selectedVerdicts: Record<string, MentorVerdict>;
  stocks: StockInsightData[];
  mentorProfile: MentorProfile;
  activeSymbol: string | null;
  onRowClick: (symbol: string) => void;
}) {
  const sorted = Object.entries(selectedVerdicts).sort((a, b) => b[1].score - a[1].score);
  return (
    <div className="overflow-hidden rounded-xl border border-white/20 max-w-md">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-800/80 border-b border-white/20">
            <th className="text-left px-3 py-2 text-xs font-bold text-slate-300">종목</th>
            <th className="text-center px-3 py-2 text-xs font-bold text-slate-300 whitespace-nowrap">신호</th>
            <th className="text-center px-2 py-2 text-xs font-bold text-slate-300 w-10">점수</th>
            <th className="text-center px-2 py-2 text-xs font-bold text-slate-300 w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {sorted.map(([sym, verdict]) => {
            const stockName = stocks.find((s) => s.symbol === sym)?.name ?? sym;
            const style = SIGNAL_STYLE[verdict.signal];
            const isActive = activeSymbol === sym;
            return (
              <tr
                key={sym}
                onClick={() => onRowClick(sym)}
                className={`cursor-pointer transition ${isActive ? "bg-cyan-500/10 ring-1 ring-inset ring-cyan-500/30" : "bg-slate-800/30 hover:bg-slate-700/40"}`}
              >
                <td className="px-3 py-1.5"><span className="text-sm font-bold text-white">{stockName}</span></td>
                <td className="px-3 py-1.5 text-center whitespace-nowrap">
                  <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>{style.label}</span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`text-sm font-bold tabular-nums ${verdict.score >= 70 ? "text-emerald-400" : verdict.score >= 40 ? "text-amber-400" : "text-red-400"}`}>{verdict.score}</span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <BookOpen size={13} className={`${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="bg-slate-800/60 px-3 py-1.5 border-t border-white/15">
        <p className="text-[11px] text-slate-500 text-center">종목을 클릭하면 상세 근거를 확인할 수 있습니다</p>
      </div>
    </div>
  );
}

/* ── Detailed Rationale Panel ── */
function RationalePanel({ verdict, stockName, symbol, mentorProfile }: {
  verdict: MentorVerdict;
  stockName: string;
  symbol: string;
  mentorProfile: MentorProfile;
}) {
  const style = SIGNAL_STYLE[verdict.signal];
  const positives = verdict.keyFactors.filter(f => f.assessment === "positive");
  const neutrals = verdict.keyFactors.filter(f => f.assessment === "neutral");
  const negatives = verdict.keyFactors.filter(f => f.assessment === "negative");

  return (
    <div className="rounded-2xl border border-white/25 bg-slate-800/80 overflow-hidden shadow-md shadow-black/40">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-800/90 border-b border-white/20">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xl">{MENTOR_EMOJI[verdict.mentorId]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-black text-white">{stockName}</span>
              <span className="text-sm text-slate-400">{symbol}</span>
              <span className={`rounded-lg px-3 py-1 text-sm font-bold ${style.bg} ${style.text}`}>{style.label}</span>
              <span className={`text-lg font-black tabular-nums ${verdict.score >= 70 ? "text-emerald-400" : verdict.score >= 40 ? "text-amber-400" : "text-red-400"}`}>{verdict.score}점</span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">{verdict.mentorNameKo} ({mentorProfile.style})</p>
          </div>
        </div>
      </div>

      {/* Thesis */}
      <div className="px-5 py-4 border-b border-white/15">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={16} className="text-cyan-400 shrink-0" />
          <span className="text-base font-bold text-white">투자 분석 의견</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-200">{verdict.thesis}</p>
      </div>

      {/* Key Factors */}
      <div className="px-5 py-4 border-b border-white/15">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-violet-400 shrink-0" />
          <span className="text-base font-bold text-white">핵심 지표 분석</span>
          <span className="text-xs text-slate-400 ml-auto">
            {positives.length > 0 && <span className="text-emerald-400 font-bold mr-2">긍정 {positives.length}</span>}
            {neutrals.length > 0 && <span className="text-amber-400 font-bold mr-2">중립 {neutrals.length}</span>}
            {negatives.length > 0 && <span className="text-red-400 font-bold">부정 {negatives.length}</span>}
          </span>
        </div>

        <div className="space-y-2">
          {verdict.keyFactors.map((f, i) => {
            const Icon = f.assessment === "positive" ? CheckCircle2 : f.assessment === "negative" ? XCircle : MinusCircle;
            const iconColor = f.assessment === "positive" ? "text-emerald-400" : f.assessment === "negative" ? "text-red-400" : "text-amber-400";
            const bgColor = f.assessment === "positive" ? "bg-emerald-500/5 border-emerald-500/20" : f.assessment === "negative" ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20";
            const metricColor = f.assessment === "positive" ? "text-emerald-300" : f.assessment === "negative" ? "text-red-300" : "text-amber-300";

            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${bgColor}`}>
                <Icon size={16} className={`mt-0.5 shrink-0 ${iconColor}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${metricColor}`}>{f.metric}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      f.assessment === "positive" ? "bg-emerald-500/20 text-emerald-400" :
                      f.assessment === "negative" ? "bg-red-500/20 text-red-400" :
                      "bg-amber-500/20 text-amber-400"
                    }`}>
                      {f.assessment === "positive" ? "충족" : f.assessment === "negative" ? "미달" : "중립"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{f.value}</p>
                  {mentorProfile.metrics.find(m => m.label === f.metric)?.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {mentorProfile.metrics.find(m => m.label === f.metric)?.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Warning + Action */}
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-amber-400" />
            <span className="text-sm font-bold text-amber-400">리스크 경고</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{verdict.riskWarning}</p>
        </div>
        <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400">행동 조건</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{verdict.actionAdvice}</p>
        </div>
      </div>

      {/* 해당 기업 분석 바로가기 */}
      <div className="px-5 pb-4">
        <Link
          href={`/market/${encodeURIComponent(symbol)}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500/20"
        >
          <BarChart3 className="h-4 w-4" />
          {stockName} 기업 분석 보기
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main MentorInsight Component
   ══════════════════════════════════════════ */
export default function MentorInsight({ stocks }: { stocks: StockInsightData[] }) {
  const [selectedId, setSelectedId] = useState("buffett");
  const [open, setOpen] = useState(false);
  const [verdicts, setVerdicts] = useState<Record<string, MentorVerdict[]>>({});
  const [activeCell, setActiveCell] = useState<{ symbol: string; mentorId: string } | null>(null);
  const [compactActiveSymbol, setCompactActiveSymbol] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && MENTOR_PROFILES.some((m) => m.id === stored)) setSelectedId(stored);
    } catch {}
  }, []);

  const selectMentor = useCallback((id: string) => {
    setSelectedId(id);
    setCompactActiveSymbol(null);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  }, []);

  const handleCompactRowClick = useCallback((sym: string) => {
    setCompactActiveSymbol(prev => prev === sym ? null : sym);
  }, []);

  useEffect(() => {
    if (stocks.length === 0) return;
    const results: Record<string, MentorVerdict[]> = {};
    for (const s of stocks) {
      const metrics = toStockMetrics(s);
      results[s.symbol] = evaluateStockAllMentors(metrics);
    }
    setVerdicts(results);
  }, [stocks]);

  const mentor = useMemo(() => MENTOR_PROFILES.find((m) => m.id === selectedId) ?? MENTOR_PROFILES[0], [selectedId]);

  const selectedVerdicts = useMemo(() => {
    const map: Record<string, MentorVerdict> = {};
    for (const [sym, vs] of Object.entries(verdicts)) {
      const found = vs.find((v) => v.mentorId === selectedId);
      if (found) map[sym] = found;
    }
    return map;
  }, [verdicts, selectedId]);

  const compactVerdict = useMemo(() => {
    if (!compactActiveSymbol) return null;
    return selectedVerdicts[compactActiveSymbol] ?? null;
  }, [compactActiveSymbol, selectedVerdicts]);

  const activeVerdict = useMemo(() => {
    if (!activeCell) return null;
    const vs = verdicts[activeCell.symbol];
    if (!vs) return null;
    return vs.find(v => v.mentorId === activeCell.mentorId) ?? null;
  }, [activeCell, verdicts]);

  const activeMentorProfile = useMemo(() => {
    if (!activeCell) return null;
    return MENTOR_PROFILES.find(m => m.id === activeCell.mentorId) ?? null;
  }, [activeCell]);

  const hasStocks = stocks.length > 0;

  const buyCount = Object.values(selectedVerdicts).filter((v) => v.signal === "BUY" || v.signal === "STRONG_BUY").length;
  const holdCount = Object.values(selectedVerdicts).filter((v) => v.signal === "HOLD").length;
  const sellCount = Object.values(selectedVerdicts).filter((v) => v.signal === "SELL" || v.signal === "STRONG_SELL").length;

  const handleCellClick = (symbol: string, mentorId: string) => {
    if (activeCell?.symbol === symbol && activeCell?.mentorId === mentorId) {
      setActiveCell(null);
    } else {
      setActiveCell({ symbol, mentorId });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + Mentor Selector — Always Visible */}
      <div className="rounded-2xl border border-white/25 bg-gradient-to-r from-slate-800/90 to-slate-800/70 px-6 py-5 shadow-md shadow-black/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/25 to-amber-500/25">
            <Users className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">투자 거장 멘토 분석</h3>
            <p className="text-sm text-slate-300">{hasStocks ? "멘토를 선택하여 포트폴리오를 분석하세요" : "멘토를 선택하여 투자 철학을 살펴보세요"}</p>
          </div>
          {hasStocks && Object.keys(selectedVerdicts).length > 0 && (
            <div className="flex gap-2 ml-auto">
              {buyCount > 0 && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-400">{buyCount}개 매수</span>}
              {holdCount > 0 && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-400">{holdCount}개 관망</span>}
              {sellCount > 0 && <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm font-bold text-red-400">{sellCount}개 매도</span>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {MENTOR_PROFILES.map((m) => (
            <MentorChip key={m.id} mentor={m} selected={m.id === selectedId} onClick={() => { selectMentor(m.id); setOpen(true); }} />
          ))}
        </div>
      </div>

      {/* Expandable Detail Section */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-slate-800/40 px-5 py-3 transition hover:bg-slate-700/40"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{MENTOR_EMOJI[selectedId]}</span>
          <span className="text-base font-bold text-white">{mentor.nameKo}</span>
          <span className="text-sm text-slate-400">상세 분석</span>
        </div>
        {open ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
      </button>

      {open && (
        <div className="space-y-4">
          {/* Philosophy (left) + Verdict Table (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-stretch">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{MENTOR_EMOJI[selectedId]}</span>
                <div>
                  <p className="text-base font-bold text-white">{mentor.name}</p>
                  <p className="text-sm text-violet-400">{mentor.title} · {mentor.style}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-200 flex-1">{mentor.philosophy}</p>
              <p className="text-sm text-slate-400 mt-3 italic">&ldquo;{mentor.signatureQuotes[0]}&rdquo;</p>
              {mentor.signatureQuotes[1] && (
                <p className="text-sm text-slate-400 mt-1 italic">&ldquo;{mentor.signatureQuotes[1]}&rdquo;</p>
              )}
            </div>

            {hasStocks && Object.keys(selectedVerdicts).length > 0 && (
              <div className="flex flex-col">
                <p className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  종목별 판단
                </p>
                <CompactVerdictTable
                  selectedVerdicts={selectedVerdicts}
                  stocks={stocks}
                  mentorProfile={mentor}
                  activeSymbol={compactActiveSymbol}
                  onRowClick={handleCompactRowClick}
                />
              </div>
            )}
            {!hasStocks && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 p-6 text-center">
                <p className="text-sm text-slate-400">홈에서 My Portfolio에 종목을 추가하면</p>
                <p className="text-sm text-slate-400">종목별 멘토 분석을 이용할 수 있습니다</p>
              </div>
            )}
          </div>

          {/* Compact Verdict Rationale Panel */}
          {compactVerdict && compactActiveSymbol && (
            <RationalePanel
              verdict={compactVerdict}
              stockName={stocks.find(s => s.symbol === compactActiveSymbol)?.name ?? compactActiveSymbol}
              symbol={compactActiveSymbol}
              mentorProfile={mentor}
            />
          )}

          {/* Market Condition Guide */}
          <div className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
            <p className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-400" />
              {mentor.nameKo}의 시장 심리 가이드
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                <p className="text-sm font-bold text-red-400 mb-1">폭락 시 조언</p>
                <p className="text-sm text-slate-200">{mentor.panicGuide.mindset}</p>
                <p className="text-sm text-slate-300 mt-1"><span className="text-red-400 font-bold">행동:</span> {mentor.panicGuide.action}</p>
                <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{mentor.panicGuide.quote}&rdquo;</p>
              </div>
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                <p className="text-sm font-bold text-emerald-400 mb-1">급등 시 조언</p>
                <p className="text-sm text-slate-200">{mentor.rallyGuide.mindset}</p>
                <p className="text-sm text-slate-300 mt-1"><span className="text-emerald-400 font-bold">행동:</span> {mentor.rallyGuide.action}</p>
                <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{mentor.rallyGuide.quote}&rdquo;</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 10인 거장 종합 의견 — Only with stocks */}
      {hasStocks && Object.keys(verdicts).length > 0 && (
        <div className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
          <p className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-400" />
            10인 거장 종합 의견
          </p>
          <p className="text-xs text-slate-400 mb-4">셀을 클릭하면 해당 투자자의 상세 분석 근거를 확인할 수 있습니다</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2 px-2 text-sm font-bold text-slate-300">종목</th>
                  {MENTOR_PROFILES.map((m) => (
                    <th key={m.id} className="text-center py-2 px-1.5">
                      <div className="text-sm font-bold text-white leading-tight">{m.nameKo}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(verdicts).map(([sym, vs]) => {
                  const stockName = stocks.find((s) => s.symbol === sym)?.name ?? sym;
                  return (
                    <tr key={sym} className="border-b border-white/10">
                      <td className="py-2.5 px-2">
                        <span className="text-sm font-bold text-white">{stockName}</span>
                      </td>
                      {MENTOR_PROFILES.map((m) => {
                        const v = vs.find((x) => x.mentorId === m.id);
                        if (!v) return <td key={m.id} className="text-center py-2 px-1 text-slate-500">-</td>;
                        const st = SIGNAL_STYLE[v.signal];
                        const isActive = activeCell?.symbol === sym && activeCell?.mentorId === m.id;
                        return (
                          <td key={m.id} className="text-center py-2 px-1">
                            <button
                              onClick={() => handleCellClick(sym, m.id)}
                              className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold transition-all cursor-pointer ${st.bg} ${st.text} ${
                                isActive ? "ring-2 ring-white/60 scale-110" : "hover:ring-1 hover:ring-white/30 hover:scale-105"
                              }`}
                            >
                              {st.short}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            {Object.entries(SIGNAL_STYLE).map(([key, st]) => (
              <span key={key} className={`${st.text} font-medium`}>● {st.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Active Rationale Detail — Always Visible */}
      {activeVerdict && activeMentorProfile && activeCell && (
        <RationalePanel
          verdict={activeVerdict}
          stockName={stocks.find(s => s.symbol === activeCell.symbol)?.name ?? activeCell.symbol}
          symbol={activeCell.symbol}
          mentorProfile={activeMentorProfile}
        />
      )}
    </div>
  );
}
