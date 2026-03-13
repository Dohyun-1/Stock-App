"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BarChart3,
  Target,
  ShieldCheck,
  Brain,
  Loader2,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Layers,
  Briefcase,
  CheckCircle2,
  XCircle,
  PieChart as PieChartIcon,
  Building2,
  Library,
  Quote,
  Star,
} from "lucide-react";
import { MENTOR_PROFILES, type MentorProfile } from "@/lib/mentors/mentorProfiles";
import type { MentorPortfolioResult, PortfolioItem } from "@/lib/mentors/mentorPortfolio";

/* ── Mentor Meta: one-line summaries, colors, representative companies ── */

const MENTOR_META: Record<string, {
  emoji: string;
  tagline: string;
  gradient: string;
  border: string;
  activeBg: string;
  textColor: string;
  repCompanies: string[];
}> = {
  buffett: {
    emoji: "\u{1F9D3}",
    tagline: "해자가 깊은 우량기업을 적정가에 사서 영원히 보유",
    gradient: "from-amber-600 to-orange-500",
    border: "border-amber-500/40",
    activeBg: "bg-gradient-to-br from-amber-600 to-orange-600",
    textColor: "text-amber-400",
    repCompanies: ["Apple", "Coca-Cola", "Visa"],
  },
  lynch: {
    emoji: "\u{1F50D}",
    tagline: "일상에서 찾는 텐배거, 성장 대비 합리적 가격 추구",
    gradient: "from-green-600 to-emerald-500",
    border: "border-green-500/40",
    activeBg: "bg-gradient-to-br from-green-600 to-emerald-600",
    textColor: "text-green-400",
    repCompanies: ["Starbucks", "Costco", "Chipotle"],
  },
  wood: {
    emoji: "\u{1F680}",
    tagline: "5년 후 세상을 바꿀 파괴적 혁신 기술에 집중 투자",
    gradient: "from-pink-600 to-rose-500",
    border: "border-pink-500/40",
    activeBg: "bg-gradient-to-br from-pink-600 to-rose-600",
    textColor: "text-pink-400",
    repCompanies: ["Tesla", "Palantir", "Coinbase"],
  },
  dalio: {
    emoji: "\u{1F30D}",
    tagline: "사계절 리스크 패리티로 어떤 경제 환경에서도 수익 추구",
    gradient: "from-blue-600 to-cyan-500",
    border: "border-blue-500/40",
    activeBg: "bg-gradient-to-br from-blue-600 to-cyan-600",
    textColor: "text-blue-400",
    repCompanies: ["S&P 500 ETF", "Gold ETF", "Treasury"],
  },
  simons: {
    emoji: "\u{1F9EE}",
    tagline: "감정 배제, 수학적 모델과 통계 패턴으로만 의사결정",
    gradient: "from-violet-600 to-purple-500",
    border: "border-violet-500/40",
    activeBg: "bg-gradient-to-br from-violet-600 to-purple-600",
    textColor: "text-violet-400",
    repCompanies: ["NVIDIA", "Meta", "AMD"],
  },
  minervini: {
    emoji: "\u26A1",
    tagline: "Stage 2 상승 추세 진입, 빠른 손절과 느린 수익 실현",
    gradient: "from-yellow-500 to-amber-500",
    border: "border-yellow-500/40",
    activeBg: "bg-gradient-to-br from-yellow-500 to-amber-500",
    textColor: "text-yellow-400",
    repCompanies: ["Eli Lilly", "Broadcom", "Palo Alto"],
  },
  soros: {
    emoji: "\u{1F30A}",
    tagline: "시장 편견과 펀더멘털 괴리를 포착해 대규모 베팅",
    gradient: "from-red-600 to-orange-500",
    border: "border-red-500/40",
    activeBg: "bg-gradient-to-br from-red-600 to-orange-600",
    textColor: "text-red-400",
    repCompanies: ["Gold", "EM Markets", "Uranium"],
  },
  fisher: {
    emoji: "\u{1F52C}",
    tagline: "탁월한 경영진의 소수 R&D 강자 기업을 평생 보유",
    gradient: "from-teal-600 to-cyan-500",
    border: "border-teal-500/40",
    activeBg: "bg-gradient-to-br from-teal-600 to-cyan-600",
    textColor: "text-teal-400",
    repCompanies: ["Microsoft", "Alphabet", "ASML"],
  },
  graham: {
    emoji: "\u{1F4DA}",
    tagline: "안전마진 확보된 저평가 자산 매수, Mr. Market 역이용",
    gradient: "from-slate-500 to-zinc-500",
    border: "border-white/20",
    activeBg: "bg-gradient-to-br from-slate-500 to-zinc-600",
    textColor: "text-slate-300",
    repCompanies: ["Intel", "Verizon", "AT&T"],
  },
  taleb: {
    emoji: "\u{1F0CF}",
    tagline: "85% 초안전 자산 + 15% 극단적 옵션, 블랙스완 대비",
    gradient: "from-fuchsia-600 to-purple-500",
    border: "border-fuchsia-500/40",
    activeBg: "bg-gradient-to-br from-fuchsia-600 to-purple-600",
    textColor: "text-fuchsia-400",
    repCompanies: ["T-Bills", "Bitcoin", "Gold"],
  },
};

const SIGNAL_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  STRONG_BUY: { bg: "bg-emerald-500/20", text: "text-emerald-300", label: "강력 매수" },
  BUY: { bg: "bg-green-500/15", text: "text-green-300", label: "매수" },
  HOLD: { bg: "bg-yellow-500/15", text: "text-yellow-300", label: "관망" },
  SELL: { bg: "bg-orange-500/15", text: "text-orange-300", label: "매도" },
  STRONG_SELL: { bg: "bg-red-500/20", text: "text-red-300", label: "강력 매도" },
};

const SAVED_MENTOR_KEY = "stockpro_mentor_portfolio_id";

/* ── SVG Donut Chart ── */

function DonutChart({ data }: { data: { sector: string; weight: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.weight, 0);
  if (total === 0) return null;

  const R = 80;
  const STROKE = 28;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg width="200" height="200" viewBox="0 0 200 200" className="shrink-0">
        {data.map((d, i) => {
          const pct = d.weight / total;
          const len = pct * C;
          const gap = 2;
          const el = (
            <circle
              key={i}
              cx="100" cy="100" r={R}
              fill="none"
              stroke={d.color}
              strokeWidth={STROKE}
              strokeDasharray={`${Math.max(0, len - gap)} ${C - Math.max(0, len - gap)}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="transition-all duration-500"
            />
          );
          offset += len;
          return el;
        })}
        <text x="100" y="95" textAnchor="middle" className="fill-white text-3xl font-black">{data.length}</text>
        <text x="100" y="118" textAnchor="middle" className="fill-slate-400 text-sm">섹터</text>
      </svg>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-slate-300">{d.sector}</span>
            <span className="text-sm font-bold text-white">{d.weight}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mentor Card (always visible, grid layout) ── */

function MentorCard({ profile, meta, active, onClick }: {
  profile: MentorProfile;
  meta: typeof MENTOR_META[string];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start gap-2 rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 w-full bg-slate-800/80 border border-white/20 hover:bg-slate-700/90 hover:border-white/25 hover:brightness-110 ${
        active ? "ring-2 ring-cyan-500/40" : ""
      }`}
    >
      <div className="flex items-center gap-3 w-full">
        <span className="text-3xl">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-black leading-tight text-white">
            {profile.nameKo}
          </div>
          <div className="text-sm font-bold leading-tight text-white/80">
            {profile.name}
          </div>
        </div>
      </div>
      <p className="text-sm leading-snug text-slate-300">
        {meta.tagline}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {meta.repCompanies.map(c => (
          <span key={c} className="rounded-md px-2 py-0.5 text-xs font-semibold bg-slate-700/80 text-slate-300">
            {c}
          </span>
        ))}
      </div>
      <div className="mt-1 text-xs font-medium text-slate-500">
        {profile.style}
      </div>
    </button>
  );
}

/* ── Detailed Philosophy Panel ── */

function DetailedPhilosophy({ profile, meta }: { profile: MentorProfile; meta: typeof MENTOR_META[string] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-white/25 bg-slate-800/70 overflow-hidden shadow-md shadow-black/40">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="text-2xl">{meta.emoji}</span>
        <div className="flex-1">
          <span className="text-lg font-black text-white">{profile.nameKo}의 투자 철학</span>
          <span className="ml-2 text-sm text-slate-400">({profile.era})</span>
        </div>
        {open ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-white/20 px-5 py-5 space-y-5">
          {/* Philosophy */}
          <div>
            <p className="text-base leading-relaxed text-slate-200">{profile.philosophy}</p>
          </div>

          {/* Books & Era */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-900/60 border border-white/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Library size={18} className="text-white" />
                <span className="text-base font-bold text-white">대표 저서</span>
              </div>
              <ul className="space-y-2">
                {profile.keyBooks.map((book, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <BookOpen size={14} className="mt-1 shrink-0 text-slate-400" />
                    <span className="text-sm text-slate-200">{book}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-slate-900/60 border border-white/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={18} className="text-white" />
                <span className="text-base font-bold text-white">대표 종목</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {meta.repCompanies.map(c => (
                  <span key={c} className="rounded-lg px-3 py-1.5 text-sm font-bold bg-slate-700 text-white">
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <span className="text-sm text-slate-400">투자 스타일: </span>
                <span className="text-sm font-semibold text-slate-200">{profile.style}</span>
              </div>
            </div>
          </div>

          {/* Key Terminology */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-white" />
              <span className="text-base font-bold text-white">핵심 용어</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.speechPatterns.terminology.map(t => (
                <span key={t} className="rounded-lg border border-white/20 bg-slate-900/50 px-3 py-1 text-sm font-bold text-white">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Signature Quotes */}
          <div className="space-y-2">
            {profile.signatureQuotes.map((q, i) => (
              <blockquote key={i} className="flex items-start gap-3 rounded-xl bg-slate-900/40 border border-white/20 p-4">
                <Quote size={18} className="shrink-0 mt-0.5 text-white/60" />
                <p className="text-sm leading-relaxed text-slate-200 italic">&ldquo;{q}&rdquo;</p>
              </blockquote>
            ))}
          </div>

          {/* Panic & Rally Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
              <div className="mb-2 text-base font-bold text-red-400">📉 폭락 시 가이드</div>
              <p className="text-sm text-slate-200 leading-relaxed">{profile.panicGuide.mindset}</p>
              <p className="mt-2 text-sm text-slate-300">{profile.panicGuide.action}</p>
              <p className="mt-2 text-xs italic text-red-400/80">&ldquo;{profile.panicGuide.quote}&rdquo;</p>
            </div>
            <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
              <div className="mb-2 text-base font-bold text-green-400">📈 랠리 시 가이드</div>
              <p className="text-sm text-slate-200 leading-relaxed">{profile.rallyGuide.mindset}</p>
              <p className="mt-2 text-sm text-slate-300">{profile.rallyGuide.action}</p>
              <p className="mt-2 text-xs italic text-green-400/80">&ldquo;{profile.rallyGuide.quote}&rdquo;</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-Components ── */

function ConvictionBar({ value }: { value: number }) {
  const color = value >= 80 ? "from-emerald-500 to-green-400" : value >= 60 ? "from-cyan-500 to-blue-400" : value >= 40 ? "from-yellow-500 to-amber-400" : "from-orange-500 to-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-700/50">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-sm font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}

function ChecklistBadge({ score }: { score: string }) {
  const [p, t] = score.split("/").map(Number);
  const ratio = t > 0 ? p / t : 0;
  const bg = ratio >= 0.8 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : ratio >= 0.6 ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" : ratio >= 0.4 ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" : "bg-red-500/15 text-red-300 border-red-500/30";
  return (
    <span className={`rounded-lg border px-2.5 py-1 text-sm font-bold tabular-nums ${bg}`}>
      {score}
    </span>
  );
}

function ChecklistPanel({ items }: { items: { label: string; passed: boolean; detail: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${item.passed ? "bg-emerald-500/8" : "bg-red-500/8"}`}>
          {item.passed ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-red-400/60" />}
          <div>
            <span className={`text-sm font-semibold ${item.passed ? "text-emerald-200" : "text-red-300/70"}`}>{item.label}</span>
            <span className="ml-1.5 text-sm text-slate-400">{item.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StockCard({ item, mentorName, mentorMeta, expanded, onToggle }: {
  item: PortfolioItem;
  mentorName: string;
  mentorMeta: typeof MENTOR_META[string];
  expanded: boolean;
  onToggle: () => void;
}) {
  const sig = SIGNAL_STYLE[item.signal] || SIGNAL_STYLE.HOLD;
  const isUp = item.change >= 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-slate-800/70 transition-all hover:border-white/40">
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-5 text-left transition hover:bg-slate-750/50">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-700 shadow-lg">
          <span className="text-lg font-black text-white">{item.weight}%</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white truncate">{item.name}</span>
            <span className="shrink-0 text-sm font-semibold text-slate-400">{item.symbol}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className={`rounded-lg px-2.5 py-1 text-sm font-bold ${sig.bg} ${sig.text}`}>{sig.label}</span>
            <ChecklistBadge score={item.checklistScore} />
            <span className="text-sm text-slate-400">{item.sector}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tabular-nums text-white">${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className={`text-base font-bold tabular-nums ${isUp ? "text-green-400" : "text-red-400"}`}>{isUp ? "+" : ""}{item.change.toFixed(2)}%</p>
        </div>
        <div className="w-28 shrink-0 hidden sm:block">
          <div className="text-xs font-semibold text-slate-400 mb-1">확신도</div>
          <ConvictionBar value={item.conviction} />
        </div>
        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {!expanded && (
        <div className="border-t border-white/15 px-5 py-3">
          <p className="text-sm leading-relaxed text-slate-300 line-clamp-2">{item.thesisSummary}</p>
        </div>
      )}

      {expanded && (
        <div className="border-t border-white/15">
          {/* Checklist */}
          <div className="border-b border-white/15 px-5 py-4">
            <div className="mb-3 flex items-center gap-2 text-base font-bold text-white">
              <BarChart3 size={18} className="text-white" /> 체크리스트 통과 현황 <ChecklistBadge score={item.checklistScore} />
            </div>
            <ChecklistPanel items={item.checklist} />
          </div>

          {/* Thesis Summary */}
          <div className="border-b border-white/15 px-5 py-4">
            <div className="mb-2 flex items-center gap-2 text-base font-bold text-white">
              <Brain size={18} className="text-white" /> {mentorName}의 의견
            </div>
            <p className="text-sm leading-relaxed text-slate-200">{item.thesisSummary}</p>
          </div>

          {/* Macro */}
          <div className="border-b border-white/15 px-5 py-4">
            <div className="mb-2 flex items-center gap-2 text-base font-bold text-cyan-300">
              <Layers size={18} /> Macro 분석
            </div>
            <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{item.thesisDetail.macro}</p>
          </div>

          {/* Fundamental */}
          <div className="border-b border-white/15 px-5 py-4">
            <div className="mb-2 flex items-center gap-2 text-base font-bold text-emerald-300">
              <Briefcase size={18} /> Fundamental 분석
            </div>
            <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{item.thesisDetail.fundamental}</p>
          </div>

          {/* Technical */}
          <div className="px-5 py-4">
            <div className="mb-2 flex items-center gap-2 text-base font-bold text-amber-300">
              <TrendingUp size={18} /> Technical 분석
            </div>
            <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{item.thesisDetail.technical}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioSummary({ result, meta }: { result: MentorPortfolioResult; meta: typeof MENTOR_META[string] }) {
  const buys = result.portfolio.filter(p => p.signal === "STRONG_BUY" || p.signal === "BUY").length;
  const holds = result.portfolio.filter(p => p.signal === "HOLD").length;
  const sells = result.portfolio.filter(p => p.signal === "SELL" || p.signal === "STRONG_SELL").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
          <div className="text-sm font-medium text-slate-400">총 종목 수</div>
          <div className="mt-1 text-3xl font-black text-white">{result.portfolio.length}</div>
        </div>
        <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
          <div className="text-sm font-medium text-slate-400">평균 확신도</div>
          <div className="mt-1 text-3xl font-black text-white">{result.totalConviction}</div>
        </div>
        <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
          <div className="text-sm font-medium text-slate-400">신호 분포</div>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            {buys > 0 && <span className="text-base font-bold text-green-400">{buys} 매수</span>}
            {holds > 0 && <span className="text-base font-bold text-yellow-400">{holds} 관망</span>}
            {sells > 0 && <span className="text-base font-bold text-red-400">{sells} 매도</span>}
          </div>
        </div>
        <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
          <div className="text-sm font-medium text-slate-400">섹터 수</div>
          <div className="mt-1 text-3xl font-black text-white">{result.allocation.length}</div>
        </div>
      </div>

      {result.allocation.length > 0 && (
        <div className="rounded-xl border border-white/20 bg-slate-800/50 p-5">
          <div className="mb-4 flex items-center gap-2 text-base font-bold text-white">
            <PieChartIcon size={18} className="text-white" /> 자산 배분 현황
          </div>
          <DonutChart data={result.allocation} />
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */

export default function MentorPortfolio() {
  const [selectedMentor, setSelectedMentor] = useState<string>("buffett");
  const [portfolioData, setPortfolioData] = useState<Record<string, MentorPortfolioResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showPortfolio, setShowPortfolio] = useState(false);

  const profile = useMemo(() => MENTOR_PROFILES.find(m => m.id === selectedMentor), [selectedMentor]);
  const currentMeta = MENTOR_META[selectedMentor] || MENTOR_META.buffett;
  const currentResult = portfolioData[selectedMentor] ?? null;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_MENTOR_KEY);
      if (saved && MENTOR_PROFILES.some(m => m.id === saved)) setSelectedMentor(saved);
    } catch {}
  }, []);

  const fetchPortfolio = useCallback(async (mentorId: string, force = false) => {
    if (!force && portfolioData[mentorId]) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mentor-portfolio?mentorId=${mentorId}&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: MentorPortfolioResult = await res.json();
      setPortfolioData(prev => ({ ...prev, [mentorId]: data }));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [portfolioData]);

  const handleSelectMentor = useCallback((id: string) => {
    setSelectedMentor(id);
    setExpandedCards(new Set());
    setShowPortfolio(true);
    try { localStorage.setItem(SAVED_MENTOR_KEY, id); } catch {}
    fetchPortfolio(id);
  }, [fetchPortfolio]);

  const handleRefresh = useCallback(() => {
    setPortfolioData(prev => { const next = { ...prev }; delete next[selectedMentor]; return next; });
    setTimeout(() => fetchPortfolio(selectedMentor, true), 0);
  }, [selectedMentor, fetchPortfolio]);

  const toggleCard = useCallback((symbol: string) => {
    setExpandedCards(prev => { const next = new Set(prev); if (next.has(symbol)) next.delete(symbol); else next.add(symbol); return next; });
  }, []);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Target size={24} className="text-violet-400" />
        <h2 className="text-xl font-black text-white">투자 거장 포트폴리오</h2>
        <span className="rounded-lg bg-violet-500/20 px-3 py-1 text-sm font-bold text-violet-300">10 Legends</span>
      </div>
      <p className="text-base text-slate-300">10명의 전설적 투자자를 선택하여 각각의 투자 철학에 기반한 포트폴리오를 확인하세요.</p>

      {/* Mentor Grid — Always Visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {MENTOR_PROFILES.map(m => (
          <MentorCard
            key={m.id}
            profile={m}
            meta={MENTOR_META[m.id] || MENTOR_META.buffett}
            active={selectedMentor === m.id && showPortfolio}
            onClick={() => handleSelectMentor(m.id)}
          />
        ))}
      </div>

      {/* Selected Mentor Detail — Shows after clicking */}
      {showPortfolio && profile && (
        <>
          <DetailedPhilosophy profile={profile} meta={currentMeta} />

          {loading && (
            <div className="flex items-center justify-center gap-3 py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: "currentColor" }} />
              <span className="text-base text-slate-300">{profile.nameKo}의 포트폴리오를 생성하고 있습니다...</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-5 text-base text-red-300">
              <AlertTriangle size={20} />
              <span>데이터를 불러오는 중 오류가 발생했습니다.</span>
              <button onClick={handleRefresh} className="ml-auto text-red-300 hover:text-red-200"><RefreshCw size={18} /></button>
            </div>
          )}

          {currentResult && !loading && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">생성: {new Date(currentResult.generatedAt).toLocaleString("ko-KR")}</p>
                <button onClick={handleRefresh} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-violet-400 transition">
                  <RefreshCw size={14} /> 새로고침
                </button>
              </div>

              <PortfolioSummary result={currentResult} meta={currentMeta} />

              <div className="space-y-3">
                {currentResult.portfolio.map(item => (
                  <StockCard
                    key={item.symbol}
                    item={item}
                    mentorName={currentResult.mentorNameKo}
                    mentorMeta={currentMeta}
                    expanded={expandedCards.has(item.symbol)}
                    onToggle={() => toggleCard(item.symbol)}
                  />
                ))}
              </div>

              {/* Allocation Table */}
              <div className="overflow-hidden rounded-2xl border border-white/25 shadow-md shadow-black/40">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/80">
                      <th className="px-5 py-3 text-left text-sm font-bold text-slate-300">종목</th>
                      <th className="px-5 py-3 text-center text-sm font-bold text-slate-300">비중</th>
                      <th className="px-5 py-3 text-center text-sm font-bold text-slate-300">체크리스트</th>
                      <th className="px-5 py-3 text-center text-sm font-bold text-slate-300">신호</th>
                      <th className="px-5 py-3 text-right text-sm font-bold text-slate-300">현재가</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {currentResult.portfolio.map(item => {
                      const sig = SIGNAL_STYLE[item.signal] || SIGNAL_STYLE.HOLD;
                      return (
                        <tr key={item.symbol} className="bg-slate-800/40 hover:bg-slate-800/70 transition">
                          <td className="px-5 py-3">
                            <div className="text-base font-semibold text-white">{item.name}</div>
                            <div className="text-sm text-slate-400">{item.symbol}</div>
                          </td>
                          <td className="px-5 py-3 text-center"><span className="text-base font-bold text-white">{item.weight}%</span></td>
                          <td className="px-5 py-3 text-center"><ChecklistBadge score={item.checklistScore} /></td>
                          <td className="px-5 py-3 text-center"><span className={`rounded-lg px-3 py-1 text-sm font-bold ${sig.bg} ${sig.text}`}>{sig.label}</span></td>
                          <td className="px-5 py-3 text-right"><span className="text-base font-bold tabular-nums text-white">${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/15 bg-slate-900/50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400">DISCLAIMER</p>
                <p className="text-sm leading-relaxed text-slate-400">
                  본 포트폴리오는 교육 및 정보 제공 목적으로만 생성되었으며, 투자 권유 또는 자문을 구성하지 않습니다. 각 투자자의 철학을 기반으로 한 AI 분석 결과이며, 실제 투자 결정은 개인의 재무 상황, 투자 목표, 위험 감수 성향을 고려하여 본인의 책임 하에 이루어져야 합니다.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
