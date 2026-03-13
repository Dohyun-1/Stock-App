"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ClientChart from "@/components/ClientChart";
import CustomPeriodButton from "@/components/CustomPeriodButton";
import NewsSection from "@/components/NewsSection";
import { useRealtimeQuotes } from "@/hooks/useRealtimeQuotes";
import { useAppCurrency, getNativeCurrencyFromSymbol } from "@/contexts/CurrencyContext";

/* ──────────────────────────── Types ──────────────────────────── */

type MainTab = "market" | "company";
type RegionTab = "americas" | "apac" | "europe";
type BuiltinSubTab = "indices" | "macro" | "sectors" | "movers";
type MarketSubTab = string;
type MoverTab = "gainers" | "losers" | "active";
type MoverRegion = "US" | "KR" | "JP" | "EU";
type Mover = { symbol: string; name: string; price: number; change: number; changePercent: number; volume: number };
type CustomSection = { id: string; name: string; symbols: string[] };

/* ──────────────────────────── Constants ──────────────────────── */

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: "market", label: "시장 정보" },
  { key: "company", label: "기업 분석" },
];

const BUILTIN_SECTIONS: BuiltinSubTab[] = ["indices", "macro", "sectors", "movers"];
const DEFAULT_SECTION_ORDER: MarketSubTab[] = ["indices", "macro", "sectors", "movers"];
const BUILTIN_LABELS: Record<string, string> = {
  indices: "경제 지수",
  macro: "Macro",
  sectors: "Sectors",
  movers: "Top Movers",
};

const CUSTOM_SECTIONS_KEY = "market-custom-sections";

function loadCustomSections(): CustomSection[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(CUSTOM_SECTIONS_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomSections(sections: CustomSection[]) {
  try { localStorage.setItem(CUSTOM_SECTIONS_KEY, JSON.stringify(sections)); } catch {}
}

function getSectionLabel(key: string, customSections: CustomSection[]): string {
  if (BUILTIN_LABELS[key]) return BUILTIN_LABELS[key];
  const cs = customSections.find((c) => c.id === key);
  return cs?.name || key;
}

const REGION_TABS: { key: RegionTab; label: string }[] = [
  { key: "americas", label: "Americas" },
  { key: "apac", label: "APAC" },
  { key: "europe", label: "Europe" },
];

const REGION_INDICES: Record<
  RegionTab,
  { symbol: string; name: string; flag: string; label: string }[]
> = {
  americas: [
    { symbol: "^GSPC", name: "S&P 500", flag: "\u{1F1FA}\u{1F1F8}", label: "미국 대표 지수" },
    { symbol: "^IXIC", name: "NASDAQ", flag: "\u{1F1FA}\u{1F1F8}", label: "미국 기술주 지수" },
    { symbol: "^DJI", name: "Dow Jones", flag: "\u{1F1FA}\u{1F1F8}", label: "미국 우량주 지수" },
    { symbol: "^RUT", name: "Russell 2000", flag: "\u{1F1FA}\u{1F1F8}", label: "미국 소형주 지수" },
    { symbol: "^GSPTSE", name: "S&P/TSX", flag: "\u{1F1E8}\u{1F1E6}", label: "캐나다 대표 지수" },
    { symbol: "^BVSP", name: "Bovespa", flag: "\u{1F1E7}\u{1F1F7}", label: "브라질 대표 지수" },
  ],
  apac: [
    { symbol: "^N225", name: "Nikkei 225", flag: "\u{1F1EF}\u{1F1F5}", label: "일본 대표 지수" },
    { symbol: "^HSI", name: "Hang Seng", flag: "\u{1F1ED}\u{1F1F0}", label: "홍콩 대표 지수" },
    { symbol: "000300.SS", name: "CSI 300", flag: "\u{1F1E8}\u{1F1F3}", label: "상하이 선전 증시 지수" },
    { symbol: "^AXJO", name: "ASX 200", flag: "\u{1F1E6}\u{1F1FA}", label: "호주 대표 지수" },
    { symbol: "^BSESN", name: "Sensex", flag: "\u{1F1EE}\u{1F1F3}", label: "인도 대표 지수" },
    { symbol: "^KS11", name: "KOSPI", flag: "\u{1F1F0}\u{1F1F7}", label: "한국 종합 주가 지수" },
  ],
  europe: [
    { symbol: "^STOXX", name: "STOXX Europe", flag: "\u{1F1EA}\u{1F1FA}", label: "범유럽 주가 지수" },
    { symbol: "^STOXX50E", name: "Euro Stoxx 50", flag: "\u{1F1EA}\u{1F1FA}", label: "유로존 우량기업 지수" },
    { symbol: "^FTSE", name: "FTSE 100", flag: "\u{1F1EC}\u{1F1E7}", label: "영국 대표 지수" },
    { symbol: "^FCHI", name: "CAC 40", flag: "\u{1F1EB}\u{1F1F7}", label: "프랑스 대표 지수" },
    { symbol: "^GDAXI", name: "DAX", flag: "\u{1F1E9}\u{1F1EA}", label: "독일 대표 지수" },
    { symbol: "^IBEX", name: "IBEX 35", flag: "\u{1F1EA}\u{1F1F8}", label: "스페인 대표 지수" },
  ],
};

const ALL_INDEX_SYMBOLS = [
  ...REGION_INDICES.americas,
  ...REGION_INDICES.apac,
  ...REGION_INDICES.europe,
].map((i) => i.symbol);

const MACRO_INDICATORS = [
  { symbol: "^VIX", name: "VIX", label: "공포 지수", icon: "⚡" },
  { symbol: "^TNX", name: "US 10Y Yield", label: "미국 10년 국채", icon: "🏛️" },
  { symbol: "DX-Y.NYB", name: "DXY", label: "달러 인덱스", icon: "💵" },
  { symbol: "GC=F", name: "Gold", label: "금 선물", icon: "🥇" },
  { symbol: "CL=F", name: "WTI Oil", label: "WTI 원유", icon: "🛢️" },
];

const SECTOR_ETFS = [
  { symbol: "XLK", name: "Technology", icon: "💻" },
  { symbol: "XLV", name: "Healthcare", icon: "🏥" },
  { symbol: "XLF", name: "Financials", icon: "🏦" },
  { symbol: "XLE", name: "Energy", icon: "⚡" },
  { symbol: "XLY", name: "Consumer Disc.", icon: "🛍️" },
  { symbol: "XLI", name: "Industrials", icon: "🏭" },
  { symbol: "XLU", name: "Utilities", icon: "💡" },
  { symbol: "XLB", name: "Materials", icon: "🪨" },
];

const MACRO_SYMBOLS = MACRO_INDICATORS.map((m) => m.symbol);
const SECTOR_SYMBOLS = SECTOR_ETFS.map((s) => s.symbol);

const TIMEFRAMES = [
  { key: "1d", label: "1일" },
  { key: "5d", label: "5일" },
  { key: "1m", label: "1달" },
  { key: "6m", label: "6달" },
  { key: "ytd", label: "YTD" },
  { key: "1y", label: "1년" },
  { key: "5y", label: "5년" },
  { key: "max", label: "모두" },
];

const PERIOD_LABELS: Record<string, string> = {
  "1d": "1일 변동", "5d": "5일 변동", "1m": "1달 변동",
  "6m": "6달 변동", ytd: "YTD 변동", "1y": "1년 변동",
  "5y": "5년 변동", max: "전체 변동",
};


/* ──────────────────────────── Helpers ────────────────────────── */

function getPeriodLabel(p: string) {
  if (p.startsWith("custom:")) {
    const [, start, end] = p.split(":");
    return start && end ? `${start} ~ ${end}` : "기간 설정";
  }
  return PERIOD_LABELS[p] || "";
}

function safeChartId(sym: string) {
  return sym.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "chart";
}

/* ──────────────────────────── DetailChart ────────────────────── */

function DetailChart({
  symbol,
  period,
  chartHeight,
  onPeriodChange,
}: {
  symbol: string;
  period: string;
  chartHeight?: number;
  onPeriodChange?: (sym: string, changePercent: number, changeAmount: number) => void;
}) {
  const [data, setData] = useState<{ date: string; close: number }[]>([]);
  const [prevClose, setPrevClose] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const chartId = safeChartId(symbol);

  const isCustom = period.startsWith("custom:");
  const [customStart, customEnd] = isCustom ? period.replace("custom:", "").split(":") : ["", ""];
  const fetchUrl =
    isCustom && customStart && customEnd
      ? `/api/historical?symbol=${encodeURIComponent(symbol)}&start=${customStart}&end=${customEnd}`
      : `/api/historical?symbol=${encodeURIComponent(symbol)}&period=${encodeURIComponent(period)}`;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    setLoading(true);
    fetch(fetchUrl, { signal: controller.signal })
      .then((r) => r.json())
      .then(async (d) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        const pc: number | null = d?.previousClose ?? null;
        if (cancelled) return;
        setData(arr);
        setPrevClose(pc);
        if (onPeriodChange && arr.length >= 2) {
          const baseline = pc ?? arr[0].close;
          const last = arr[arr.length - 1].close;
          onPeriodChange(symbol, baseline > 0 ? ((last - baseline) / baseline) * 100 : 0, last - baseline);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setData([]); setPrevClose(null); setLoading(false); }
      })
      .finally(() => clearTimeout(timeout));
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [symbol, period, fetchUrl, onPeriodChange]);

  const baseline = prevClose ?? (data.length > 0 ? data[0].close : 0);
  const lastClose = data.length > 0 ? data[data.length - 1].close : 0;
  const isUp = lastClose >= baseline;

  if (loading)
    return <div className="flex items-center justify-center text-white" style={{ height: chartHeight || 160 }}>로딩...</div>;

  if (data.length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-1 text-white/70" style={{ height: chartHeight || 160 }}>
        <span className="text-sm">데이터를 불러오지 못했습니다.</span>
        <span className="text-xs">잠시 후 새로고침 해 주세요.</span>
      </div>
    );

  return <ClientChart data={data} period={period} isUp={isUp} chartId={chartId} height={chartHeight} baselineClose={prevClose ?? undefined} />;
}

/* ──────────────────────────── IndexDetailCard ────────────────── */

function IndexDetailCard({
  symbol, name, flag, label, period,
  quotes, periodChanges, onPeriodChange,
}: {
  symbol: string; name: string; flag: string; label: string; period: string;
  quotes: Record<string, { price: number; change: number; changeAmount: number; previousClose: number }>;
  periodChanges: Record<string, { percent: number; amount: number }>;
  onPeriodChange: (sym: string, p: number, a: number) => void;
}) {
  const pc = periodChanges[symbol];
  const q = quotes[symbol];
  const pcVal = pc?.percent ?? q?.change ?? 0;
  const isUp = pcVal >= 0;
  const price = q?.price;
  const { formatPrice: fp } = useAppCurrency();
  const native = getNativeCurrencyFromSymbol(symbol);

  return (
    <Link
      href={`/market/${encodeURIComponent(symbol)}`}
      className="group block overflow-hidden rounded-xl border border-white/20 bg-slate-800/80 transition hover:border-cyan-500/40 hover:shadow-lg"
    >
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-start justify-between">
          <p className="text-[17px] font-bold tracking-tight">{name}</p>
          <span className="shrink-0 text-[11px] font-semibold text-cyan-400 opacity-0 transition group-hover:opacity-100">상세보기 →</span>
        </div>
        <p className="mt-0.5 text-[15px] tabular-nums text-white">
          {price != null ? fp(price, native) : "-"}
        </p>
        <span className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[13px] font-bold ${
          isUp ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
        }`}>
          {isUp ? "▲" : "▼"} {pcVal >= 0 ? "+" : ""}{pcVal.toFixed(2)}%
        </span>
        <p className="mt-1 text-[10px] text-white">{getPeriodLabel(period)}</p>
      </div>
      <div className="h-[120px] px-2">
        <DetailChart symbol={symbol} period={period} chartHeight={120} onPeriodChange={onPeriodChange} />
      </div>
      <div className="flex items-center gap-1.5 border-t border-white/15 bg-slate-900/60 px-3 py-1.5">
        <span className="text-sm leading-none">{flag}</span>
        <span className="text-[11px] font-bold text-yellow-400">{label}</span>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════════
   Tab Sections
   ════════════════════════════════════════════════════════════════ */

/* ── 검색 기록 ─────────────────────────────────────────────────── */

type SearchHistoryItem = { symbol: string; name: string; timestamp: number };
const HISTORY_KEY = "company-search-history";
const MAX_HISTORY = 20;

function loadSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(HISTORY_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSearchHistory(items: SearchHistoryItem[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY))); } catch {}
}

function addToSearchHistory(symbol: string, name: string) {
  const history = loadSearchHistory().filter((h) => h.symbol !== symbol);
  history.unshift({ symbol, name, timestamp: Date.now() });
  saveSearchHistory(history);
}

function removeFromSearchHistory(symbol: string) {
  const history = loadSearchHistory().filter((h) => h.symbol !== symbol);
  saveSearchHistory(history);
}

function clearSearchHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

/* ── Sparkline (lightweight) ───────────────────────────────────── */

function Sparkline({ symbol, height = 48, period = "5d" }: { symbol: string; height?: number; period?: string }) {
  const [data, setData] = useState<{ date: string; close: number }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let c = false;
    fetch(`/api/historical?symbol=${encodeURIComponent(symbol)}&period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        if (!c) setData(arr);
      })
      .catch(() => { if (!c) setData([]); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [symbol, period]);
  if (loading) return <div style={{ height }} className="flex items-center justify-center text-[10px] text-white">···</div>;
  if (data.length < 2) return <div style={{ height }} />;
  const isUp = data[data.length - 1].close >= data[0].close;
  return <ClientChart data={data} period={period} isUp={isUp} chartId={`spark-${safeChartId(symbol)}-${period}`} height={height} />;
}

/* ── Macro Indicators Section ─────────────────────────────────── */

function MacroSection({ quotes }: { quotes: Record<string, { price: number; change: number }> }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Macro Indicators</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {MACRO_INDICATORS.map((m) => {
          const q = quotes[m.symbol];
          const isUp = (q?.change ?? 0) >= 0;
          return (
            <Link key={m.symbol} href={`/market/${encodeURIComponent(m.symbol)}`}
              className="group overflow-hidden rounded-xl border border-white/20 bg-slate-800/80 transition hover:border-cyan-500/40">
              <div className="px-3 pt-3 pb-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{m.icon}</span>
                    <span className="text-[15px] font-bold">{m.name}</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-cyan-400 opacity-0 transition group-hover:opacity-100">상세 →</span>
                </div>
                <p className="mt-1 text-[14px] font-semibold tabular-nums text-white">
                  {q ? q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "–"}
                </p>
                <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[12px] font-bold ${isUp ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(q?.change ?? 0).toFixed(2)}%
                </span>
              </div>
              <div className="h-[48px] px-1">
                <Sparkline symbol={m.symbol} />
              </div>
              <div className="border-t border-white/15 bg-slate-900/60 px-3 py-1">
                <span className="text-[10px] font-medium text-white">{m.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sector Performance Section ───────────────────────────────── */

function SectorSection({ quotes }: { quotes: Record<string, { price: number; change: number }> }) {
  const sorted = [...SECTOR_ETFS].sort((a, b) => (quotes[b.symbol]?.change ?? 0) - (quotes[a.symbol]?.change ?? 0));
  const maxAbs = Math.max(...sorted.map((s) => Math.abs(quotes[s.symbol]?.change ?? 0)), 1);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Sector Performance</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((s) => {
          const q = quotes[s.symbol];
          const ch = q?.change ?? 0;
          const isUp = ch >= 0;
          const barW = Math.min(Math.abs(ch) / maxAbs * 100, 100);
          return (
            <Link key={s.symbol} href={`/market/${encodeURIComponent(s.symbol)}`}
              className="group flex items-center gap-3 rounded-xl border border-white/20 bg-slate-800/80 p-3 transition hover:border-cyan-500/40">
              <span className="text-xl leading-none">{s.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[14px] font-semibold">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-bold tabular-nums ${isUp ? "text-green-400" : "text-red-400"}`}>
                      {isUp ? "+" : ""}{ch.toFixed(2)}%
                    </span>
                    <span className="text-[10px] font-semibold text-cyan-400 opacity-0 transition group-hover:opacity-100">상세 →</span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/60">
                  <div className={`h-full rounded-full transition-all ${isUp ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${barW}%` }} />
                </div>
              </div>
              <div className="h-10 w-20 shrink-0">
                <Sparkline symbol={s.symbol} height={40} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── Top Movers Section ───────────────────────────────────────── */

const MOVER_REGION_TABS: { key: MoverRegion; label: string; flag: string }[] = [
  { key: "US", label: "미국", flag: "🇺🇸" },
  { key: "KR", label: "한국", flag: "🇰🇷" },
  { key: "JP", label: "일본", flag: "🇯🇵" },
  { key: "EU", label: "유럽", flag: "🇪🇺" },
];

function MoverRow({ m, showVolume }: { m: Mover; showVolume: boolean }) {
  const isUp = m.changePercent >= 0;
  const { formatPrice: fp } = useAppCurrency();
  const native = getNativeCurrencyFromSymbol(m.symbol);
  return (
    <Link href={`/market/${encodeURIComponent(m.symbol)}`}
      className="group block rounded-xl border border-white/20 bg-slate-800/80 p-4 transition hover:border-cyan-500/40">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">{m.name}</p>
          <p className="text-[12px] text-white">{m.symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-bold tabular-nums text-white">
            {fp(m.price, native)}
          </p>
          <p className={`text-[13px] font-bold tabular-nums ${isUp ? "text-green-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}{m.changePercent.toFixed(2)}%
          </p>
          {showVolume && (
            <p className="text-[11px] tabular-nums text-white">
              Vol: {m.volume >= 1e6 ? `${(m.volume / 1e6).toFixed(1)}M` : m.volume.toLocaleString("en-US")}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="h-[60px] flex-1">
          <Sparkline symbol={m.symbol} height={60} period="1d" />
        </div>
        <span className="shrink-0 ml-2 text-[11px] font-semibold text-cyan-400 opacity-0 transition group-hover:opacity-100">상세보기 →</span>
      </div>
    </Link>
  );
}

function MoversSection() {
  const [region, setRegion] = useState<MoverRegion>("US");
  const [tab, setTab] = useState<MoverTab>("gainers");
  const [dataByRegion, setDataByRegion] = useState<Record<string, { gainers: Mover[]; losers: Mover[]; active: Mover[] }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dataByRegion[region]) return;
    setLoading(true);
    fetch(`/api/top-movers?region=${region}`)
      .then((r) => r.json())
      .then((d) => setDataByRegion((prev) => ({ ...prev, [region]: { gainers: d.gainers || [], losers: d.losers || [], active: d.active || [] } })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [region, dataByRegion]);

  const data = dataByRegion[region] ?? { gainers: [], losers: [], active: [] };
  const list = data[tab];
  const TABS: { key: MoverTab; label: string }[] = [
    { key: "gainers", label: "Top Gainers" },
    { key: "losers", label: "Top Losers" },
    { key: "active", label: "Most Active" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Top Movers</h3>
      <div className="flex gap-2">
        {MOVER_REGION_TABS.map((r) => (
          <button key={r.key} onClick={() => setRegion(r.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              region === r.key ? "bg-white text-slate-900 shadow" : "bg-slate-700/50 text-white hover:bg-slate-600/50"
            }`}>
            {r.flag} {r.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.key ? "bg-cyan-500/30 text-cyan-400" : "bg-slate-700/50 text-white hover:bg-slate-600"
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="py-8 text-center text-white">로딩 중...</div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-white">데이터 없음</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, 9).map((m) => (
            <MoverRow key={m.symbol} m={m} showVolume={tab === "active"} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 시장 정보 (Main) ─────────────────────────────────────────── */

function loadSectionPrefs(): { order: string[]; hidden: Set<string> } {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("market-section-prefs") : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      const order: string[] = parsed.order ?? [...DEFAULT_SECTION_ORDER];
      for (const k of DEFAULT_SECTION_ORDER) { if (!order.includes(k)) order.push(k); }
      return { order, hidden: new Set(parsed.hidden ?? []) };
    }
  } catch {}
  return { order: [...DEFAULT_SECTION_ORDER], hidden: new Set() };
}

function saveSectionPrefs(order: string[], hidden: Set<string>) {
  try { localStorage.setItem("market-section-prefs", JSON.stringify({ order, hidden: Array.from(hidden) })); } catch {}
}

function MarketSection() {
  const [regionTab, setRegionTab] = useState<RegionTab>("americas");
  const [timeframe, setTimeframe] = useState("5d");
  const [quotes, setQuotes] = useState<
    Record<string, { price: number; change: number; changeAmount: number; previousClose: number }>
  >({});
  const [periodChanges, setPeriodChanges] = useState<Record<string, { percent: number; amount: number }>>({});
  const [activeNav, setActiveNav] = useState<string>("indices");

  const [sectionOrder, setSectionOrder] = useState<string[]>([...DEFAULT_SECTION_ORDER]);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSelectedSymbols, setNewCatSelectedSymbols] = useState<{ symbol: string; name: string }[]>([]);
  const [newCatSearchQuery, setNewCatSearchQuery] = useState("");
  const [newCatSearchResults, setNewCatSearchResults] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [newCatSearching, setNewCatSearching] = useState(false);
  const [newCatHotStocks, setNewCatHotStocks] = useState<{ symbol: string; name: string; changePercent: number }[]>([]);
  const [newCatHotLoading, setNewCatHotLoading] = useState(false);
  const [newCatSearchFocused, setNewCatSearchFocused] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  useEffect(() => {
    const prefs = loadSectionPrefs();
    setSectionOrder(prefs.order);
    setHiddenSections(prefs.hidden);
    setCustomSections(loadCustomSections());
  }, []);

  const visibleSections = useMemo(
    () => sectionOrder.filter((k) => !hiddenSections.has(k)),
    [sectionOrder, hiddenSections]
  );

  const addCustomSection = useCallback(() => {
    if (!newCatName.trim() || newCatSelectedSymbols.length === 0) return;
    const id = `custom-${Date.now()}`;
    const symbols = newCatSelectedSymbols.map((s) => s.symbol);
    const cs: CustomSection = { id, name: newCatName.trim(), symbols };
    const updated = [...customSections, cs];
    setCustomSections(updated);
    saveCustomSections(updated);
    setSectionOrder((prev) => {
      const next = [...prev, id];
      saveSectionPrefs(next, hiddenSections);
      return next;
    });
    setNewCatName("");
    setNewCatSelectedSymbols([]);
    setNewCatSearchQuery("");
    setNewCatSearchResults([]);
    setShowAddModal(false);
  }, [newCatName, newCatSelectedSymbols, customSections, hiddenSections]);

  useEffect(() => {
    if (newCatSearchQuery.trim().length < 1) { setNewCatSearchResults([]); return; }
    const t = setTimeout(() => {
      setNewCatSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(newCatSearchQuery.trim())}&region=all`)
        .then((r) => r.json())
        .then((d) => setNewCatSearchResults(Array.isArray(d?.results) ? d.results.slice(0, 12) : []))
        .catch(() => setNewCatSearchResults([]))
        .finally(() => setNewCatSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [newCatSearchQuery]);

  useEffect(() => {
    if (!showAddModal || newCatHotStocks.length > 0) return;
    setNewCatHotLoading(true);
    fetch("/api/top-movers?region=US")
      .then((r) => r.json())
      .then((d) => {
        const active = Array.isArray(d?.active) ? d.active : [];
        setNewCatHotStocks(active.slice(0, 12).map((m: { symbol: string; name: string; changePercent: number }) => ({
          symbol: m.symbol, name: m.name, changePercent: m.changePercent,
        })));
      })
      .catch(() => {})
      .finally(() => setNewCatHotLoading(false));
  }, [showAddModal, newCatHotStocks.length]);

  const removeCustomSection = useCallback((id: string) => {
    setCustomSections((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveCustomSections(next);
      return next;
    });
    setSectionOrder((prev) => {
      const next = prev.filter((k) => k !== id);
      setHiddenSections((h) => { const nh = new Set(h); nh.delete(id); saveSectionPrefs(next, nh); return nh; });
      return next;
    });
  }, []);

  const toggleSection = useCallback((key: string) => {
    setHiddenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      saveSectionPrefs(sectionOrder, next);
      return next;
    });
  }, [sectionOrder]);

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragIdx.current = idx;
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  }, []);
  const handleDragEnter = useCallback((idx: number) => { overIdx.current = idx; }, []);
  const handleDragEnd = useCallback(() => {
    const from = dragIdx.current;
    const to = overIdx.current;
    setDraggingIdx(null);
    if (from === null || to === null || from === to) {
      dragIdx.current = null;
      overIdx.current = null;
      return;
    }
    setSectionOrder((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      saveSectionPrefs(next, hiddenSections);
      return next;
    });
    dragIdx.current = null;
    overIdx.current = null;
  }, [hiddenSections]);

  const moveSection = useCallback((idx: number, dir: -1 | 1) => {
    setSectionOrder((prev) => {
      const next = [...prev];
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      saveSectionPrefs(next, hiddenSections);
      return next;
    });
  }, [hiddenSections]);

  const allStreamSymbols = useMemo(() => {
    const customSyms = customSections.flatMap((c) => c.symbols);
    return [...ALL_INDEX_SYMBOLS, ...MACRO_SYMBOLS, ...SECTOR_SYMBOLS, ...customSyms];
  }, [customSections]);

  const realtimeQuotes = useRealtimeQuotes(allStreamSymbols, { streamIntervalMs: 2000, pollIntervalMs: 3000 });

  useEffect(() => {
    if (Object.keys(realtimeQuotes.quotes).length === 0) return;
    setQuotes((prev) => ({ ...prev, ...realtimeQuotes.quotes }));
  }, [realtimeQuotes.quotes]);

  const handlePeriodChange = useCallback(
    (sym: string, changePercent: number, changeAmount: number) => {
      setPeriodChanges((prev) => ({ ...prev, [sym]: { percent: changePercent, amount: changeAmount } }));
    }, []
  );

  const currentIndices = REGION_INDICES[regionTab];

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToSection = (key: string) => {
    setActiveNav(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [refsReady, setRefsReady] = useState(false);
  useEffect(() => { setRefsReady(true); }, []);

  useEffect(() => {
    if (!refsReady) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.getAttribute("data-section") || "indices");
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.1 }
    );
    for (const key of Object.keys(sectionRefs.current)) {
      const el = sectionRefs.current[key];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [refsReady]);

  const renderSection = (key: string) => {
    if (key === "indices") {
      return (
        <div ref={(el) => { sectionRefs.current.indices = el; }} data-section="indices" className="scroll-mt-28 space-y-4 rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
          <h3 className="text-lg font-bold text-cyan-400">📊 경제 지수</h3>
          <div className="flex flex-wrap gap-2">
            {TIMEFRAMES.map((tf) => (
              <button key={tf.key} onClick={() => setTimeframe(tf.key)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  timeframe === tf.key ? "bg-cyan-500/30 text-cyan-400" : "bg-slate-700/50 text-white hover:bg-slate-600"
                }`}>
                {tf.label}
              </button>
            ))}
            <CustomPeriodButton current={timeframe} onSelect={setTimeframe} />
          </div>
          <div className="flex gap-2">
            {REGION_TABS.map((tab) => (
              <button key={tab.key} onClick={() => setRegionTab(tab.key)}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  regionTab === tab.key ? "bg-white text-slate-900 shadow" : "bg-slate-700/50 text-white hover:bg-slate-600/50 hover:text-white"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {currentIndices.map(({ symbol, name, flag, label }) => (
              <IndexDetailCard key={symbol} symbol={symbol} name={name} flag={flag} label={label}
                period={timeframe} quotes={quotes} periodChanges={periodChanges} onPeriodChange={handlePeriodChange} />
            ))}
          </div>
        </div>
      );
    }
    if (key === "macro") {
      return (
        <div ref={(el) => { sectionRefs.current.macro = el; }} data-section="macro" className="scroll-mt-28 rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
          <MacroSection quotes={quotes} />
        </div>
      );
    }
    if (key === "sectors") {
      return (
        <div ref={(el) => { sectionRefs.current.sectors = el; }} data-section="sectors" className="scroll-mt-28 rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
          <SectorSection quotes={quotes} />
        </div>
      );
    }
    if (key === "movers") {
      return (
        <div ref={(el) => { sectionRefs.current.movers = el; }} data-section="movers" className="scroll-mt-28 rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
          <MoversSection />
        </div>
      );
    }
    const cs = customSections.find((c) => c.id === key);
    if (cs) {
      return (
        <div ref={(el) => { sectionRefs.current[key] = el; }} data-section={key} className="scroll-mt-28 space-y-4 rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
          <h3 className="text-lg font-bold text-cyan-400">{cs.name}</h3>
          {cs.symbols.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {cs.symbols.map((sym) => {
                const q = quotes[sym];
                const isUp = (q?.change ?? 0) >= 0;
                return (
                  <Link key={sym} href={`/market/${encodeURIComponent(sym)}`}
                    className="block overflow-hidden rounded-xl border border-white/20 bg-slate-800/80 p-4 transition hover:border-cyan-500/40">
                    <p className="text-[15px] font-bold">{sym}</p>
                    {q ? (
                      <>
                        <p className="mt-1 text-sm tabular-nums text-white">
                          {q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span className={`mt-1 inline-flex text-[13px] font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
                          {isUp ? "▲" : "▼"} {Math.abs(q.change).toFixed(2)}%
                        </span>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-white">로딩 중...</p>
                    )}
                    <div className="mt-2 h-[60px]">
                      <Sparkline symbol={sym} height={60} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white">종목이 없습니다. 설정에서 편집하세요.</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Sticky section nav */}
      <div className="sticky top-[49px] z-[30] -mx-4 bg-slate-900/95 px-4 py-2 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {visibleSections.map((key) => (
            <button key={key} onClick={() => scrollToSection(key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                activeNav === key ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-slate-700/60 text-white hover:bg-slate-600 hover:text-white"
              }`}>
              {getSectionLabel(key, customSections)}
            </button>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="shrink-0 rounded-lg p-1.5 transition bg-slate-700/60 text-white hover:bg-green-500/20 hover:text-green-400"
            title="카테고리 추가"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`shrink-0 rounded-lg p-1.5 transition ${showSettings ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-700/60 text-white hover:bg-slate-600 hover:text-white"}`}
            title="섹션 커스터마이징"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {showSettings && (
          <div className="mt-3 w-[30%] min-w-[200px] rounded-xl border border-white/20 bg-slate-800/95 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">섹션 커스터마이징</p>
              <button onClick={() => {
                setSectionOrder([...DEFAULT_SECTION_ORDER, ...customSections.map((c) => c.id)]);
                setHiddenSections(new Set());
                saveSectionPrefs([...DEFAULT_SECTION_ORDER, ...customSections.map((c) => c.id)], new Set());
              }} className="text-xs text-white hover:text-white transition">초기화</button>
            </div>
            <ul className="space-y-1">
              {sectionOrder.map((key, idx) => {
                const isCustom = key.startsWith("custom-");
                const isDragging = draggingIdx === idx;
                return (
                  <li
                    key={key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-2 cursor-grab active:cursor-grabbing select-none transition ${
                      isDragging ? "bg-cyan-500/20 opacity-60" : "bg-slate-700/40"
                    }`}
                  >
                    <span className="shrink-0 cursor-grab text-white hover:text-white px-0.5">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      </svg>
                    </span>
                    <span className={`flex-1 text-sm font-medium ${hiddenSections.has(key) ? "text-white line-through" : "text-white"}`}>
                      {getSectionLabel(key, customSections)}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => toggleSection(key)}
                        className={`rounded p-1 transition ${hiddenSections.has(key) ? "text-white hover:text-green-400" : "text-cyan-400 hover:text-red-400"}`}>
                        {hiddenSections.has(key) ? (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                      {isCustom && (
                        <button onClick={() => removeCustomSection(key)}
                          className="rounded p-1 text-white hover:text-red-400 transition">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[11px] text-white">≡ 아이콘을 드래그하여 순서를 변경하세요.</p>
          </div>
        )}

        {showAddModal && (
          <div className="mt-3 rounded-xl border border-cyan-500/30 bg-slate-800/95 p-4">
            <p className="mb-3 text-sm font-semibold text-cyan-400">새 카테고리 추가</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-white">카테고리 이름</label>
                <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="예: 관심 종목, 반도체, AI"
                  className="w-full rounded-lg border border-white/20 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white">종목 검색 (한국어/영어 모두 가능)</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" value={newCatSearchQuery} onChange={(e) => setNewCatSearchQuery(e.target.value)}
                    onFocus={() => setNewCatSearchFocused(true)}
                    onBlur={() => setTimeout(() => setNewCatSearchFocused(false), 200)}
                    placeholder="예: 유나이티드 헬스, 테슬라, NVDA, 삼성전자..."
                    className="w-full rounded-lg border border-white/20 bg-slate-700/50 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
                  {newCatSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    </div>
                  )}
                </div>
                {newCatSearchResults.length > 0 ? (
                  <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/20 bg-slate-900/80">
                    {newCatSearchResults.map((r) => {
                      const alreadyAdded = newCatSelectedSymbols.some((s) => s.symbol === r.symbol);
                      return (
                        <button key={r.symbol}
                          onClick={() => {
                            if (!alreadyAdded) {
                              setNewCatSelectedSymbols((prev) => [...prev, { symbol: r.symbol, name: r.name }]);
                            }
                            setNewCatSearchQuery("");
                            setNewCatSearchResults([]);
                          }}
                          disabled={alreadyAdded}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                            alreadyAdded ? "opacity-40" : "hover:bg-slate-700/60"
                          }`}>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-cyan-500/10">
                            <span className="text-[10px] font-bold text-cyan-400">{r.symbol.slice(0, 2)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">{r.name}</p>
                            <p className="text-xs text-white">{r.symbol} · {r.exchange}</p>
                          </div>
                          {alreadyAdded && <span className="text-xs text-cyan-400">추가됨</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : newCatSearchFocused && newCatSearchQuery.trim().length === 0 && (
                  <div className="mt-1 rounded-lg border border-white/20 bg-slate-900/80 p-3">
                    <h4 className="mb-2 text-xs font-semibold text-white">🔥 실시간 인기 종목 (미국)</h4>
                    {newCatHotLoading ? (
                      <div className="flex items-center gap-2 py-1 text-xs text-white">
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                        로딩 중...
                      </div>
                    ) : newCatHotStocks.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {newCatHotStocks.map((h) => {
                          const up = h.changePercent >= 0;
                          const alreadyAdded = newCatSelectedSymbols.some((s) => s.symbol === h.symbol);
                          return (
                            <button key={h.symbol}
                              onClick={() => {
                                if (!alreadyAdded) {
                                  setNewCatSelectedSymbols((prev) => [...prev, { symbol: h.symbol, name: h.name }]);
                                }
                              }}
                              className={`flex items-center gap-1.5 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs transition ${
                                alreadyAdded ? "bg-cyan-500/10 border-cyan-500/30 opacity-60" : "bg-slate-700/40 hover:border-cyan-500/40 hover:bg-slate-700/80"
                              }`}>
                              <span className="font-semibold text-cyan-400">{h.symbol}</span>
                              <span className={`font-bold tabular-nums ${up ? "text-green-400" : "text-red-400"}`}>
                                {up ? "+" : ""}{h.changePercent.toFixed(1)}%
                              </span>
                              {alreadyAdded && <span className="text-[10px] text-cyan-400">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-white">데이터 없음</p>
                    )}
                  </div>
                )}
              </div>
              {newCatSelectedSymbols.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-white">선택된 종목 ({newCatSelectedSymbols.length}개)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {newCatSelectedSymbols.map((s) => (
                      <span key={s.symbol} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-2.5 py-1 text-xs font-medium text-cyan-400">
                        <span className="font-bold">{s.symbol}</span>
                        <span className="text-cyan-400/60">{s.name}</span>
                        <button onClick={() => setNewCatSelectedSymbols((prev) => prev.filter((p) => p.symbol !== s.symbol))}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-red-500/20 hover:text-red-400 transition">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={addCustomSection} disabled={!newCatName.trim() || newCatSelectedSymbols.length === 0}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  추가
                </button>
                <button onClick={() => { setShowAddModal(false); setNewCatName(""); setNewCatSelectedSymbols([]); setNewCatSearchQuery(""); setNewCatSearchResults([]); }}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600">
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {visibleSections.map((key) => (
        <div key={key}>{renderSection(key)}</div>
      ))}
    </div>
  );
}

/* ── 기업 분석 ─────────────────────────────────────────────────── */

const COMPANY_PERIODS = [
  { key: "1d", label: "1일" }, { key: "5d", label: "5일" }, { key: "1m", label: "1달" },
  { key: "6m", label: "6달" }, { key: "ytd", label: "YTD" },
  { key: "1y", label: "1년" }, { key: "5y", label: "5년" }, { key: "max", label: "모두" },
];

type Stats = Record<string, number | string | null>;

function fmtNum(v: number | null | undefined, dec = 2): string {
  if (v == null || !Number.isFinite(v)) return "–";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtBig(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "–";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}T`;
  if (abs >= 1e9) return `${(v / 1e9).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
  if (abs >= 1e6) return `${(v / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
  if (abs >= 1e3) return `${(v / 1e3).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}K`;
  return fmtNum(v);
}
function fmtPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "–";
  return `${(v * 100).toFixed(2)}%`;
}
function fmtDate(v: string | null | undefined): string {
  if (!v) return "–";
  const d = new Date(typeof v === "number" ? v * 1000 : v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("ko-KR");
}

function RangeBar({ low, high, current, label }: { low: number; high: number; current: number; label: string }) {
  const range = high - low;
  const pct = range > 0 ? Math.min(Math.max(((current - low) / range) * 100, 0), 100) : 50;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="tabular-nums font-medium">{fmtNum(low)}</span>
        <span className="text-white">{label}</span>
        <span className="tabular-nums font-medium">{fmtNum(high)}</span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-slate-700">
        <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: "100%" }} />
        <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow"
          style={{ left: `calc(${pct}% - 6px)` }} />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/20 py-2.5 last:border-0">
      <span className="text-[13px] text-white">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums text-white">{value}</span>
    </div>
  );
}

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 text-[15px] font-bold text-white">{title}</h4>
      <div>{children}</div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/20 bg-slate-900/50 px-3 py-3">
      <p className="text-[11px] font-medium text-white">{label}</p>
      <p className="mt-1 text-[15px] font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

function MetricCardPct({ label, value }: { label: string; value: number | null | undefined }) {
  const display = value != null && Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "–";
  const isPositive = value != null && value >= 0;
  const hasValue = value != null && Number.isFinite(value);
  return (
    <div className="rounded-lg border border-white/20 bg-slate-900/50 px-3 py-3">
      <p className="text-[11px] font-medium text-white">{label}</p>
      <p className={`mt-1 text-[15px] font-bold tabular-nums ${
        hasValue ? (isPositive ? "text-green-400" : "text-red-400") : "text-white"
      }`}>
        {hasValue && isPositive ? "+" : ""}{display}
      </p>
    </div>
  );
}

type SearchSuggestion = { symbol: string; name: string; exchange: string };

function CompanySection() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("AAPL");
  const [secData, setSecData] = useState<{ name?: string; filings?: { form: string; date: string }[] } | null>(null);
  const [chartPeriod, setChartPeriod] = useState("3m");
  const [quote, setQuote] = useState<{
    price: number; change: number; changePercent: number; name: string;
  } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const composingRef = useRef(false);
  const committedQueryRef = useRef("");

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [hotStocks, setHotStocks] = useState<{ symbol: string; name: string; price: number; changePercent: number }[]>([]);
  const [hotLoading, setHotLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    setSearchHistory(loadSearchHistory());
  }, []);

  useEffect(() => {
    if (hotStocks.length > 0) return;
    setHotLoading(true);
    fetch("/api/top-movers?region=US")
      .then((r) => r.json())
      .then((d) => {
        const active = Array.isArray(d?.active) ? d.active : [];
        setHotStocks(active.slice(0, 10).map((m: { symbol: string; name: string; price: number; changePercent: number }) => ({
          symbol: m.symbol, name: m.name, price: m.price, changePercent: m.changePercent,
        })));
      })
      .catch(() => {})
      .finally(() => setHotLoading(false));
  }, [hotStocks.length]);

  const fetchData = useCallback((sym: string) => {
    setQuoteLoading(true);
    setQuote(null);
    fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.regularMarketPrice) {
          setQuote({
            price: Number(d.regularMarketPrice ?? 0),
            change: Number(d.regularMarketChange ?? 0),
            changePercent: Number(d.regularMarketChangePercent ?? 0),
            name: d.shortName || d.longName || sym,
          });
        }
      })
      .catch(() => {})
      .finally(() => setQuoteLoading(false));

    setStatsLoading(true);
    setStats(null);
    fetch(`/api/company/stats?symbol=${encodeURIComponent(sym)}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setStats(d); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    setSecData(null);
    fetch(`/api/company/sec?ticker=${encodeURIComponent(sym)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSecData(d); })
      .catch(() => {});
  }, []);

  const selectSymbol = useCallback((sym: string, name?: string) => {
    setSearched(sym);
    setQuery("");
    committedQueryRef.current = "";
    setShowAll(false);
    setShowSuggestions(false);
    setSuggestions([]);
    fetchData(sym);
    addToSearchHistory(sym, name || sym);
    setSearchHistory(loadSearchHistory());
  }, [fetchData]);

  const triggerSearch = useCallback((q: string) => {
    if (q.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(q.trim())}&region=all`)
      .then((r) => r.json())
      .then((d) => {
        setSuggestions(Array.isArray(d?.results) ? d.results.slice(0, 10) : []);
        setShowSuggestions(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    if (composingRef.current) return;
    if (query.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    const t = setTimeout(() => triggerSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, triggerSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { fetchData("AAPL"); }, [fetchData]);

  const isUp = (quote?.changePercent ?? 0) >= 0;
  const n = (key: string) => (stats?.[key] as number) ?? null;
  const s = (key: string) => (stats?.[key] as string) ?? "";
  const cur = n("currentPrice") ?? quote?.price ?? 0;
  const appCur = useAppCurrency();
  const native = getNativeCurrencyFromSymbol(searched);
  const fp = (v: number | null | undefined) => {
    if (v == null || !Number.isFinite(v)) return "–";
    return appCur.formatPrice(v, native);
  };
  const fbig = (v: number | null | undefined) => {
    if (v == null || !Number.isFinite(v)) return "–";
    return appCur.formatBig(v, native);
  };

  return (
    <div className="space-y-6">
      <p className="text-white">전 세계 상장 주식 검색 · 미국, 한국, 일본, 유럽 등</p>

      {/* ── 통합 검색 ── */}
      <div ref={suggestRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!composingRef.current) {
                  committedQueryRef.current = e.target.value;
                }
              }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={(e) => {
                composingRef.current = false;
                const val = (e.target as HTMLInputElement).value;
                committedQueryRef.current = val;
                setQuery(val);
                triggerSearch(val);
              }}
              onFocus={() => { setSearchFocused(true); if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || composingRef.current) return;
                if (e.key === "Enter" && query.trim()) {
                  e.preventDefault();
                  const q = query.trim();
                  const exactSymbol = suggestions.find((sg) => sg.symbol.toUpperCase() === q.toUpperCase());
                  if (exactSymbol) {
                    selectSymbol(exactSymbol.symbol, exactSymbol.name);
                  } else if (suggestions.length > 0) {
                    selectSymbol(suggestions[0].symbol, suggestions[0].name);
                  } else {
                    setSearching(true);
                    fetch(`/api/search?q=${encodeURIComponent(q)}&region=all`)
                      .then((r) => r.json())
                      .then((d) => {
                        const results: SearchSuggestion[] = Array.isArray(d?.results) ? d.results : [];
                        if (results.length > 0) {
                          selectSymbol(results[0].symbol, results[0].name);
                        }
                      })
                      .catch(() => {})
                      .finally(() => setSearching(false));
                  }
                }
              }}
              placeholder="회사명 또는 종목코드 검색 (예: Apple, 삼성전자, 7203.T, SAP.DE...)"
              className="w-full rounded-lg border border-white/20 bg-slate-700/50 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              </div>
            )}
          </div>
        </div>

        {/* 자동완성 드롭다운 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-white/20 bg-slate-800 shadow-xl">
            {suggestions.map((s) => (
              <button key={s.symbol} onClick={() => selectSymbol(s.symbol, s.name)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-700/60">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                  <span className="text-xs font-bold text-cyan-400">{s.symbol.slice(0, 2)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-white">{s.symbol} · {s.exchange}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── 실시간 인기 종목 (검색창 포커스 시 드롭다운) ── */}
        {searchFocused && !showSuggestions && query.trim().length === 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/20 bg-slate-800 p-4 shadow-xl">
            <h4 className="mb-2 text-sm font-semibold text-white">🔥 실시간 인기 종목</h4>
            {hotLoading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-white">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                인기 종목 로딩 중...
              </div>
            ) : hotStocks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hotStocks.map((h) => {
                  const up = h.changePercent >= 0;
                  return (
                    <button key={h.symbol} onClick={() => { selectSymbol(h.symbol, h.name); setSearchFocused(false); }}
                      className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-700/40 px-3 py-2 text-sm transition hover:border-cyan-500/40 hover:bg-slate-700/80">
                      <span className="font-semibold text-cyan-400">{h.symbol}</span>
                      <span className={`text-xs font-bold tabular-nums ${up ? "text-green-400" : "text-red-400"}`}>
                        {up ? "+" : ""}{h.changePercent.toFixed(2)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white">데이터 없음</p>
            )}
          </div>
        )}
      </div>

      {/* ── 검색 기록 (항상 표시) ── */}
      {searchHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">최근 검색</h4>
            <button
              onClick={() => { clearSearchHistory(); setSearchHistory([]); }}
              className="text-xs text-white hover:text-red-400 transition"
            >
              전체 삭제
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((h) => (
              <div key={h.symbol} className="group flex items-center gap-1 rounded-lg border border-white/20 bg-slate-800/60 pl-3 pr-1 py-1.5 transition hover:border-cyan-500/40 hover:bg-slate-700/60">
                <button
                  onClick={() => selectSymbol(h.symbol, h.name)}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="font-semibold text-cyan-400">{h.symbol}</span>
                  <span className="max-w-[120px] truncate text-white">{h.name !== h.symbol ? h.name : ""}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromSearchHistory(h.symbol); setSearchHistory(loadSearchHistory()); }}
                  className="ml-0.5 rounded p-1 text-white opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 주가 차트 ── */}
      <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{quote?.name || searched}</h2>
              <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-medium text-white">{searched}</span>
            </div>
            {quoteLoading ? (
              <p className="mt-1 text-sm text-white">시세 로딩 중...</p>
            ) : quote ? (
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-2xl font-bold tabular-nums">
                  {fp(quote.price)}
                </span>
                <span className={`text-sm font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
                  {isUp ? "▲" : "▼"} {fp(Math.abs(quote.change))} ({isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%)
                </span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {COMPANY_PERIODS.map((p) => (
            <button key={p.key} onClick={() => setChartPeriod(p.key)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                chartPeriod === p.key ? "bg-cyan-500/30 text-cyan-400" : "bg-slate-700/50 text-white hover:text-white"
              }`}>
              {p.label}
            </button>
          ))}
          <CustomPeriodButton current={chartPeriod} onSelect={setChartPeriod} className="inline-flex" />
        </div>
        <div className="h-[240px]">
          <DetailChart symbol={searched} period={chartPeriod} chartHeight={240} />
        </div>
      </div>

      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : stats ? (
        <>
          {/* ═══════ 1. Company Overview ═══════ */}
          <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-xl font-bold text-cyan-400">
                {searched.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{s("companyName") || quote?.name || searched}</h2>
                  <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-mono font-medium text-cyan-400">{searched}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white">
                  {s("sector") && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                      {s("sector")}
                    </span>
                  )}
                  {s("industry") && <span>· {s("industry")}</span>}
                  {(s("city") || s("country")) && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                      {[s("city"), s("state"), s("country")].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <span className="text-white">시가총액 <strong className="text-white">{fbig(n("marketCap"))}</strong></span>
                  {n("fullTimeEmployees") != null && (
                    <span className="text-white">직원 <strong className="text-white">{n("fullTimeEmployees")!.toLocaleString()}명</strong></span>
                  )}
                  {s("website") && (
                    <a href={s("website")} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">{s("website").replace(/^https?:\/\//, "")}</a>
                  )}
                </div>
              </div>
            </div>
            {s("longBusinessSummary") && (
              <p className="mt-4 border-t border-white/20 pt-4 text-sm leading-relaxed text-white">
                {s("longBusinessSummary").length > 400
                  ? s("longBusinessSummary").slice(0, 400) + "…"
                  : s("longBusinessSummary")}
              </p>
            )}
          </div>

          {/* ═══════ Price + Range Summary ═══════ */}
          <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-[16px] font-bold">
              <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              거래 요약
            </h3>
            {n("dayLow") != null && n("dayHigh") != null && (
              <RangeBar low={n("dayLow")!} high={n("dayHigh")!} current={cur} label="당일 범위" />
            )}
            {n("fiftyTwoWeekLow") != null && n("fiftyTwoWeekHigh") != null && (
              <RangeBar low={n("fiftyTwoWeekLow")!} high={n("fiftyTwoWeekHigh")!} current={cur} label="52주 범위" />
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard label="전일 종가" value={fp(n("previousClose"))} />
              <MetricCard label="시가" value={fp(n("open"))} />
              <MetricCard label="거래량" value={fmtBig(n("volume"))} />
              <MetricCard label="평균 거래량" value={fmtBig(n("averageVolume"))} />
            </div>
          </div>

          {/* ═══════ 상세 분석 링크 ═══════ */}
          <Link href={`/market/${encodeURIComponent(searched)}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            밸류에이션 · 성장 · 수익성 · 재무 건전성 · 실적 상세 분석 보기 →
          </Link>
        </>
      ) : (
        <div className="rounded-xl border border-white/20 bg-slate-800/80 p-8">
          <p className="text-center text-white">기업을 검색하면 상세 분석 데이터가 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════════════ */

function MarketAndCompanyContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "company" ? "company" : "market";
  const [mainTab, setMainTab] = useState<MainTab>(initialTab);

  return (
    <div className="relative mx-auto max-w-6xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-cyan-400">시장 & 기업 정보</h1>

      <div className="flex gap-1 rounded-xl bg-slate-800/60 p-1">
        {MAIN_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setMainTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              mainTab === tab.key
                ? "bg-cyan-500 text-white shadow"
                : "text-white hover:bg-slate-700/50 hover:text-white"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {mainTab === "market" && <MarketSection />}
      {mainTab === "company" && <CompanySection />}

      <div className="pt-14">
        <NewsSection />
      </div>
    </div>
  );
}

export default function MarketAndCompanyPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8 text-center text-white">로딩 중...</div>}>
      <MarketAndCompanyContent />
    </Suspense>
  );
}
