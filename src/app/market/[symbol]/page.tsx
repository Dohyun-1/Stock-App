"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import ClientChart from "@/components/ClientChart";
import CustomPeriodButton from "@/components/CustomPeriodButton";
import { useAppCurrency, getNativeCurrencyFromSymbol, type NativeCurrency } from "@/contexts/CurrencyContext";

type Stats = Record<string, number | string | null>;

function fmtNumRaw(v: number | null | undefined, dec = 2): string {
  if (v == null || !Number.isFinite(v)) return "–";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtBigRaw(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "–";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}T`;
  if (abs >= 1e9) return `${(v / 1e9).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
  if (abs >= 1e6) return `${(v / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
  return fmtNumRaw(v);
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
      <p className={`mt-1 text-[15px] font-bold tabular-nums ${hasValue ? (isPositive ? "text-green-400" : "text-red-400") : "text-white"}`}>
        {hasValue && isPositive ? "+" : ""}{display}
      </p>
    </div>
  );
}

function RangeBar({ low, high, current, label }: { low: number; high: number; current: number; label: string }) {
  const range = high - low;
  const pct = range > 0 ? Math.min(Math.max(((current - low) / range) * 100, 0), 100) : 50;
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-[12px]">
        <span className="tabular-nums font-medium">{fmtNumRaw(low)}</span>
        <span className="text-white">{label}</span>
        <span className="tabular-nums font-medium">{fmtNumRaw(high)}</span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-slate-700">
        <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: "100%" }} />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pct}%` }}>
          <div className="h-3.5 w-1 rounded-full bg-white shadow" />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/15 py-1.5">
      <span className="text-[13px] text-white">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums text-white">{value}</span>
    </div>
  );
}

const SOURCE_COLORS: Record<string, string> = {
  "SEC EDGAR": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "DART": "bg-green-500/15 text-green-400 border-green-500/30",
  "네이버 금융": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Yahoo Finance": "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

function SourceBadges({
  sources,
  keys,
  filingSource,
  filingPeriod,
}: {
  sources: Record<string, string>;
  keys: string[];
  filingSource: string | null;
  filingPeriod: string | null;
}) {
  const usedSources = new Set<string>();
  for (const k of keys) {
    if (sources[k]) usedSources.add(sources[k]);
  }
  if (usedSources.size === 0 && filingSource) usedSources.add(filingSource);
  if (usedSources.size === 0) usedSources.add("Yahoo Finance");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from(usedSources).map((src) => (
        <span
          key={src}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[src] ?? "bg-slate-700/50 text-white border-white/20"}`}
        >
          {src === "SEC EDGAR" && <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" /></svg>}
          {src === "DART" && <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6z" clipRule="evenodd" /></svg>}
          {src}
        </span>
      ))}
      {filingPeriod && (
        <span className="text-[9px] text-white">
          ({filingPeriod})
        </span>
      )}
    </div>
  );
}

const NAMES: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^DJI": "다우존스",
  "^IXIC": "나스닥",
  "CL=F": "WTI 원유",
  "KRW=X": "원/달러 환율",
  "EURKRW=X": "유로/원화 환율",
  "KRWJPY=X": "원/엔 환율",
  "JPY=X": "엔/달러 환율",
  "EUR=X": "유로/달러 환율",
  "^KS11": "코스피",
  "^KQ11": "코스닥",
  "^N225": "니케이225",
  "^GDAXI": "DAX",
  "^FTSE": "FTSE 100",
  "AAPL": "애플",
  "MSFT": "마이크로소프트",
  "005930.KS": "삼성전자",
  "000660.KS": "SK하이닉스",
  "7203.T": "도요타",
  "9984.T": "소프트뱅크",
};

function formatNewsDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : format(d, "yyyy.MM.dd");
}

const PERIODS = [
  { key: "1d", label: "1일" },
  { key: "5d", label: "5일" },
  { key: "1m", label: "1달" },
  { key: "6m", label: "6달" },
  { key: "ytd", label: "YTD" },
  { key: "1y", label: "1년" },
  { key: "5y", label: "5년" },
  { key: "max", label: "모두" },
];

function isIndex(sym: string): boolean {
  return sym.startsWith("^") || sym.endsWith("=X") || sym.endsWith("=F") || /^(VIX|DXY|TNX|GC=F|CL=F|SI=F|BTC-USD|ETH-USD)/i.test(sym);
}

function IndexKeyStatistics({
  stats,
  n,
  cur,
  native,
}: {
  stats: Stats | null;
  n: (key: string) => number | null;
  cur: number;
  native: NativeCurrency;
}) {
  const { formatPrice: fp, formatBig: fBig } = useAppCurrency();
  if (!stats) return null;

  const fmtP = (v: number | null) => v != null ? fp(v, native) : "–";

  const dayLow = n("dayLow");
  const dayHigh = n("dayHigh");
  const w52Low = n("fiftyTwoWeekLow");
  const w52High = n("fiftyTwoWeekHigh");
  const prevClose = n("previousClose");
  const open = n("open");
  const volume = n("volume");
  const avgVol = n("averageVolume");
  const lastPrice = cur > 0 ? cur : n("currentPrice");
  const beta = n("beta");
  const fiftyDayAvg = n("fiftyDayAverage");
  const twoHundredDayAvg = n("twoHundredDayAverage");

  return (
    <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
      <h2 className="mb-5 text-lg font-semibold text-cyan-400">KEY STATISTICS</h2>

      <div className="space-y-5">
        {dayLow != null && dayHigh != null && (
          <RangeBar low={dayLow} high={dayHigh} current={cur} label="Day&apos;s Range" />
        )}
        {w52Low != null && w52High != null && (
          <RangeBar low={w52Low} high={w52High} current={cur} label="52 Week Range" />
        )}
      </div>

      <div className="mt-5 divide-y divide-slate-700/40">
        <IndexStatRow label="전일 종가" value={fmtP(prevClose)} />
        <IndexStatRow label="시가" value={fmtP(open)} />
        <IndexStatRow label="현재가" value={fmtP(lastPrice)} />
        <IndexStatRow label="거래량" value={volume != null ? fBig(volume, "POINTS") : "–"} />
        <IndexStatRow label="평균 거래량 (3M)" value={avgVol != null ? fBig(avgVol, "POINTS") : "–"} />
        {beta != null && <IndexStatRow label="베타" value={fmtNumRaw(beta)} />}
        {fiftyDayAvg != null && <IndexStatRow label="50일 이동평균" value={fmtP(fiftyDayAvg)} />}
        {twoHundredDayAvg != null && <IndexStatRow label="200일 이동평균" value={fmtP(twoHundredDayAvg)} />}
      </div>
    </div>
  );
}

function IndexStatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[14px] text-white">{label}</span>
      <span className="text-[15px] font-bold tabular-nums text-slate-100">{value}</span>
    </div>
  );
}

export default function SymbolDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = decodeURIComponent(params?.symbol || "");
  const name = NAMES[symbol] || symbol;
  const isIdx = isIndex(symbol);
  const native = getNativeCurrencyFromSymbol(symbol);
  const { formatPrice: fpCur, formatBig: fBigCur } = useAppCurrency();
  const fmtNum = (v: number | null | undefined) => {
    if (v == null || !Number.isFinite(v)) return "–";
    return fpCur(v, native);
  };
  const fmtBig = (v: number | null | undefined) => {
    if (v == null || !Number.isFinite(v)) return "–";
    return fBigCur(v, native);
  };

  const [period, setPeriod] = useState("1d");
  const [chartData, setChartData] = useState<{ date: string; close: number }[]>([]);
  const [previousClose, setPreviousClose] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<{ title: string; link: string; publisher: string; date: string; image: string }[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [details, setDetails] = useState<{
    open?: number; high?: number; low?: number; close?: number; volume?: number;
    fiftyTwoWeekHigh?: number | null; fiftyTwoWeekLow?: number | null; averageVolume?: number | null;
    marketCap?: number | null; pe?: number | null; eps?: number | null; yield?: number | null; beta?: number | null;
  } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const isCustom = period.startsWith("custom:");
  const [customStart, customEnd] = isCustom ? period.replace("custom:", "").split(":") : ["", ""];
  const fetchUrl = isCustom && customStart && customEnd
    ? `/api/historical?symbol=${encodeURIComponent(symbol)}&start=${customStart}&end=${customEnd}`
    : `/api/historical?symbol=${encodeURIComponent(symbol)}&period=${period}`;

  useEffect(() => {
    setLoading(true);
    fetch(fetchUrl)
      .then((r) => r.json())
      .then(async (d) => {
        let arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        const pc: number | null = d?.previousClose ?? null;
        if (pc != null && Number.isFinite(pc) && pc > 0) setPreviousClose(pc);
        return arr;
      })
      .then((arr) => setChartData(arr))
      .catch(() => setChartData([]))
      .finally(() => setLoading(false));
  }, [symbol, period, fetchUrl]);

  useEffect(() => {
    fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((q) => {
        const prevRaw = Number(q?.regularMarketPreviousClose ?? NaN);
        const price = Number(q?.regularMarketPrice ?? 0);
        const change = Number(q?.regularMarketChange ?? NaN);
        const derivedPrev = Number.isFinite(change) ? price - change : 0;
        const nextPrev = Number.isFinite(prevRaw) && prevRaw > 0 ? prevRaw : derivedPrev;
        if (Number.isFinite(nextPrev) && nextPrev > 0) setPreviousClose(nextPrev);
      })
      .catch(() => {});
  }, [symbol]);

  useEffect(() => {
    setDetails(null);
    fetch(`/api/symbol-details?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => setDetails(d?.error ? null : d))
      .catch(() => setDetails(null));
  }, [symbol]);

  useEffect(() => {
    setNewsLoading(true);
    fetch(`/api/news?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => {
        setNews(Array.isArray(d) ? d : d?.news || []);
      })
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [symbol]);

  useEffect(() => {
    setStatsLoading(true);
    setStats(null);
    fetch(`/api/company/stats?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setStats(d); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [symbol]);

  const n = useCallback((key: string) => (stats?.[key] as number) ?? null, [stats]);
  const s = useCallback((key: string) => (stats?.[key] as string) ?? "", [stats]);
  const cur = n("currentPrice") ?? 0;
  const dataSources = (stats?.dataSources ?? {}) as Record<string, string>;
  const filingSource = (stats?.filingSource as string) ?? null;
  const filingPeriod = (stats?.filingPeriod as string) ?? null;

  const startVal = previousClose > 0 ? previousClose : chartData[0]?.close ?? 0;
  const endVal = chartData[chartData.length - 1]?.close ?? 0;
  const growthPercent = startVal > 0 ? (((endVal - startVal) / startVal) * 100).toFixed(1) : "0";

  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Sticky back button */}
      <div className="sticky top-[57px] z-40 -mx-4 px-4 py-2 bg-slate-900/95 backdrop-blur border-b border-white/15">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition text-sm font-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          이전으로
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-cyan-400">{name}</h1>
        <p className="mt-1 text-white">{symbol}</p>
      </div>

      {/* ═══════ Company Overview ═══════ */}
      {!isIdx && stats && (s("companyName") || s("sector")) && (
        <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white">
            {s("sector") && <span className="rounded-md bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-white">{s("sector")}</span>}
            {s("industry") && <span className="rounded-md bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-white">{s("industry")}</span>}
            {(s("city") || s("country")) && <span className="text-white">{[s("city"), s("state"), s("country")].filter(Boolean).join(", ")}</span>}
          </div>
          {s("longBusinessSummary") && (
            <p className="mt-3 text-sm leading-relaxed text-white">{s("longBusinessSummary")}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              period === p.key ? "bg-cyan-500 text-white" : "bg-slate-700/50 text-white hover:bg-slate-600"
            }`}
          >
            {p.label}
          </button>
        ))}
        <CustomPeriodButton current={period} onSelect={setPeriod} />
      </div>

      <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
        <h2 className="mb-4 font-semibold">역사적 성장</h2>
        {startVal > 0 && endVal > 0 && (
          <div className="mb-4 flex flex-wrap gap-4">
            <div>
              <span className="text-white">시작: </span>
              <span className="font-medium">{startVal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-white">현재: </span>
              <span className="font-medium">{endVal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-white">성장률: </span>
              <span className={`font-bold ${Number(growthPercent) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {Number(growthPercent) >= 0 ? "+" : ""}{growthPercent}%
              </span>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-white">차트 로딩 중...</div>
        ) : chartData.length > 0 ? (
          <div className="h-80">
            <ClientChart
              data={chartData}
              period={isCustom
                ? (customStart && customEnd
                  ? (new Date(customEnd).getTime() - new Date(customStart).getTime()) / 86400000 > 90
                    ? "1y"
                    : "3m"
                  : "1d")
                : period}
              isUp={Number(growthPercent) >= 0}
              chartId={symbol.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "chart"}
              height={320}
              baselineClose={previousClose}
            />
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-white">데이터 없음</div>
        )}
      </div>

      {/* ═══════ Price + Range Summary ═══════ */}
      {isIdx ? (
        <IndexKeyStatistics stats={stats} n={n} cur={cur} native={native} />
      ) : stats ? (
        <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
          <h2 className="mb-4 font-semibold text-cyan-400">거래 요약</h2>
          {n("dayLow") != null && n("dayHigh") != null && (
            <RangeBar low={n("dayLow")!} high={n("dayHigh")!} current={cur} label="당일 범위" />
          )}
          {n("fiftyTwoWeekLow") != null && n("fiftyTwoWeekHigh") != null && (
            <RangeBar low={n("fiftyTwoWeekLow")!} high={n("fiftyTwoWeekHigh")!} current={cur} label="52주 범위" />
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="전일 종가" value={fmtNum(n("previousClose"))} />
            <MetricCard label="시가" value={fmtNum(n("open"))} />
            <MetricCard label="거래량" value={fmtBig(n("volume"))} />
            <MetricCard label="평균 거래량" value={fmtBig(n("averageVolume"))} />
          </div>
        </div>
      ) : null}

      {/* ═══════ Detailed Analysis Sections (stocks only) ═══════ */}
      {!isIdx && (statsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Valuation */}
          <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-amber-400">밸류에이션 지표</h2>
              <SourceBadges sources={dataSources} keys={["trailingPE", "forwardPE", "priceToBook", "marketCap", "enterpriseValue"]} filingSource={filingSource} filingPeriod={filingPeriod} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <MetricCard label="P/E (TTM)" value={fmtNumRaw(n("trailingPE"))} />
              <MetricCard label="Forward P/E" value={fmtNumRaw(n("forwardPE"))} />
              <MetricCard label="PEG 비율" value={fmtNumRaw(n("pegRatio"))} />
              <MetricCard label="P/S (TTM)" value={fmtNumRaw(n("priceToSalesTrailing12Months"))} />
              <MetricCard label="P/B" value={fmtNumRaw(n("priceToBook"))} />
              <MetricCard label="EV/EBITDA" value={fmtNumRaw(n("evToEbitda"))} />
              <MetricCard label="시가총액" value={fmtBig(n("marketCap"))} />
              <MetricCard label="기업가치 (EV)" value={fmtBig(n("enterpriseValue"))} />
            </div>
          </div>

          {/* Growth + Profitability */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-green-400">성장 지표</h2>
                <SourceBadges sources={dataSources} keys={["revenueGrowth", "earningsGrowth"]} filingSource={filingSource} filingPeriod={filingPeriod} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCardPct label="매출 성장률 (QoQ)" value={n("revenueGrowth")} />
                <MetricCardPct label="EPS 성장률 (QoQ)" value={n("earningsGrowth")} />
                <MetricCardPct label="분기 매출 성장 (YoY)" value={n("quarterlyRevenueGrowth")} />
                <MetricCardPct label="분기 이익 성장 (YoY)" value={n("quarterlyEarningsGrowth")} />
              </div>
            </div>
            <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-purple-400">수익성 지표</h2>
                <SourceBadges sources={dataSources} keys={["returnOnEquity", "returnOnAssets", "grossMargin", "operatingMargin", "profitMargin"]} filingSource={filingSource} filingPeriod={filingPeriod} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCardPct label="ROE" value={n("returnOnEquity")} />
                <MetricCardPct label="ROA" value={n("returnOnAssets")} />
                <MetricCardPct label="매출총이익률" value={n("grossMargin")} />
                <MetricCardPct label="영업이익률" value={n("operatingMargin")} />
                <MetricCardPct label="순이익률" value={n("profitMargin")} />
              </div>
            </div>
          </div>

          {/* Financial Health */}
          <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-blue-400">재무 건전성</h2>
              <SourceBadges sources={dataSources} keys={["totalCash", "totalDebt", "debtToEquity", "currentRatio", "freeCashflow", "operatingCashflow", "bookValue"]} filingSource={filingSource} filingPeriod={filingPeriod} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <MetricCard label="부채비율 (D/E)" value={n("debtToEquity") != null ? `${fmtNumRaw(n("debtToEquity"))}%` : "–"} />
              <MetricCard label="유동비율" value={fmtNumRaw(n("currentRatio"))} />
              <MetricCard label="잉여현금흐름" value={fmtBig(n("freeCashflow"))} />
              <MetricCard label="총 현금" value={fmtBig(n("totalCash"))} />
              <MetricCard label="총 부채" value={fmtBig(n("totalDebt"))} />
              <MetricCard label="영업현금흐름" value={fmtBig(n("operatingCashflow"))} />
              <MetricCard label="주당순자산" value={fmtNum(n("bookValue"))} />
              <MetricCard label="주당 현금" value={fmtNum(n("totalCashPerShare"))} />
            </div>
          </div>

          {/* Earnings */}
          <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-orange-400">실적 발표</h2>
              <SourceBadges sources={dataSources} keys={["dilutedEPS", "netIncomeToCommon", "totalRevenue"]} filingSource={filingSource} filingPeriod={filingPeriod} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/20 bg-slate-900/50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">다음 실적 발표</p>
                <p className="text-lg font-bold text-white">
                  {s("earningsStart")
                    ? s("earningsEnd") && s("earningsEnd") !== s("earningsStart")
                      ? `${fmtDate(s("earningsStart"))} – ${fmtDate(s("earningsEnd"))}`
                      : fmtDate(s("earningsStart"))
                    : "–"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div><p className="text-[11px] text-white">EPS 추정치</p><p className="text-sm font-semibold tabular-nums text-white">{fmtNum(n("epsEstimate"))}</p></div>
                  <div><p className="text-[11px] text-white">매출 추정치</p><p className="text-sm font-semibold tabular-nums text-white">{fmtBig(n("revenueEstimate"))}</p></div>
                </div>
              </div>
              <div className="rounded-lg border border-white/20 bg-slate-900/50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">직전 실적</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[11px] text-white">실제 EPS</p><p className="text-sm font-semibold tabular-nums text-white">{fmtNum(n("lastEpsActual"))}</p></div>
                  <div><p className="text-[11px] text-white">예상 EPS</p><p className="text-sm font-semibold tabular-nums text-white">{fmtNum(n("lastEpsEstimate"))}</p></div>
                </div>
                {n("epsSurprisePercent") != null && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] text-white">서프라이즈</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${(n("epsSurprisePercent") ?? 0) >= 0 ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {(n("epsSurprisePercent") ?? 0) >= 0 ? "+" : ""}{((n("epsSurprisePercent") ?? 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
                <div className="mt-3"><p className="text-[11px] text-white">희석 EPS (TTM)</p><p className="text-sm font-semibold tabular-nums text-white">{fmtNum(n("dilutedEPS"))}</p></div>
              </div>
            </div>
          </div>

          {/* Trading Info + Dividends */}
          <div className="rounded-xl border border-white/20 bg-slate-800/80 p-5">
            <h2 className="mb-4 font-semibold text-white">거래 정보 · 배당 · 주식 통계</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="grid grid-cols-1 gap-0">
                  <StatRow label="베타 (5년)" value={fmtNumRaw(n("beta"))} />
                  <StatRow label="52주 변동률" value={fmtPct(n("fiftyTwoWeekChange"))} />
                  <StatRow label="50일 이동평균" value={fmtNum(n("fiftyDayAverage"))} />
                  <StatRow label="200일 이동평균" value={fmtNum(n("twoHundredDayAverage"))} />
                  <StatRow label="발행주식 수" value={fmtBigRaw(n("sharesOutstanding"))} />
                  <StatRow label="유통주식 수" value={fmtBigRaw(n("floatShares"))} />
                  <StatRow label="1년 목표가" value={fmtNum(n("targetMeanPrice"))} />
                </div>
              </div>
              <div>
                <div className="grid grid-cols-1 gap-0">
                  <StatRow label="내부자 보유" value={fmtPct(n("heldPercentInsiders"))} />
                  <StatRow label="기관 보유" value={fmtPct(n("heldPercentInstitutions"))} />
                  <StatRow label="공매도 비율" value={fmtNumRaw(n("shortRatio"))} />
                  <StatRow label="배당금 (Forward)" value={fmtNum(n("forwardDividendRate"))} />
                  <StatRow label="배당수익률" value={fmtPct(n("forwardDividendYield"))} />
                  <StatRow label="배당성향" value={fmtPct(n("payoutRatio"))} />
                  <StatRow label="배당락일" value={fmtDate(s("exDividendDate"))} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null)}

      {!isIdx && <ReportsSection symbol={symbol} />}

      <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
        <h2 className="mb-4 font-semibold text-cyan-400">최근 관련 뉴스</h2>
        {newsLoading ? (
          <p className="text-white">뉴스 로딩 중...</p>
        ) : news.length > 0 ? (
          <div className="space-y-3">
            {news.map((n, i) => (
              <a
                key={i}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 rounded-lg border border-white/20 bg-slate-700/30 p-3 transition hover:border-cyan-500/50"
              >
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-700/50">
                  {n.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external news URL
                    <img src={n.image} alt="" className="h-full w-full object-cover" loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{n.title}</p>
                  <p className="mt-1 text-sm text-white">{n.publisher} · {formatNewsDate(n.date)}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-white">관련 뉴스가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

/* ── 공시·리포트 출처 섹션 ─────────────────────────── */

type ReportItem = { title: string; source: string; date: string; url: string; origin: "naver" | "sec" | "dart" };

function ReportsSection({ symbol }: { symbol: string }) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/company/reports?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => setReports(d?.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [symbol]);

  const originLabel = (o: string) => {
    if (o === "sec") return "SEC EDGAR";
    if (o === "dart") return "DART 공시";
    if (o === "naver") return "네이버 증권";
    return o;
  };
  const originColor = (o: string) => {
    if (o === "sec") return "bg-blue-500/20 text-blue-400";
    if (o === "dart") return "bg-emerald-500/20 text-emerald-400";
    return "bg-orange-500/20 text-orange-400";
  };

  const isKR = /\.(KS|KQ)$/i.test(symbol);
  const code = symbol.replace(/\.(KS|KQ)$/i, "");
  const ticker = symbol.replace(/\..*$/, "");

  const visible = expanded ? reports : reports.slice(0, 5);

  return (
    <div className="rounded-xl border border-white/20 bg-slate-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-cyan-400">공시 · 리포트 출처</h2>
        <div className="flex gap-2 text-[11px]">
          {isKR ? (
            <>
              <a href={`https://finance.naver.com/item/research_read.naver?code=${code}`}
                target="_blank" rel="noopener noreferrer"
                className="rounded-md bg-orange-500/15 px-2 py-0.5 text-orange-400 hover:bg-orange-500/25">
                네이버 증권 리포트
              </a>
              <a href={`https://dart.fss.or.kr/`}
                target="_blank" rel="noopener noreferrer"
                className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-emerald-400 hover:bg-emerald-500/25">
                DART 공시
              </a>
            </>
          ) : (
            <a href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${ticker}&type=&dateb=&owner=include&count=40&search_text=&action=getcompany`}
              target="_blank" rel="noopener noreferrer"
              className="rounded-md bg-blue-500/15 px-2 py-0.5 text-blue-400 hover:bg-blue-500/25">
              SEC EDGAR 전체 공시
            </a>
          )}
        </div>
      </div>

      <p className="mb-3 text-xs text-white">
        {isKR
          ? "네이버 증권 리서치 리포트, DART 전자공시 기반 재무·공시 데이터입니다."
          : "SEC EDGAR 공시(10-K, 10-Q, 8-K) 기반 재무·공시 데이터입니다."
        }
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <p className="py-4 text-center text-sm text-white">공시·리포트 데이터가 없습니다.</p>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-white/20 bg-slate-900/40 p-3 transition hover:border-cyan-500/40 hover:bg-slate-800/60">
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${originColor(r.origin)}`}>
                  {originLabel(r.origin)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{r.title}</p>
                  <p className="mt-0.5 text-[11px] text-white">{r.source} · {r.date}</p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5" />
                </svg>
              </a>
            ))}
          </div>
          {reports.length > 5 && (
            <button onClick={() => setExpanded(!expanded)}
              className="mt-3 w-full rounded-lg bg-slate-700/40 py-2 text-sm text-white transition hover:bg-slate-700/60">
              {expanded ? "접기" : `전체 ${reports.length}건 보기`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
