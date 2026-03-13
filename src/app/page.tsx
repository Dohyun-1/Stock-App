"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ClientChart from "@/components/ClientChart";
import EconomicCalendar from "@/components/EconomicCalendar";
import NewsSection from "@/components/NewsSection";
import AIPortfolioInsight from "@/components/AIPortfolioInsight";
import { useRealtimeQuotes } from "@/hooks/useRealtimeQuotes";
import { useAppCurrency, getNativeCurrencyFromSymbol } from "@/contexts/CurrencyContext";


const WATCHLIST_KEY = "stockpro_watchlist";
const WATCHLIST_NAMES_KEY = "stockpro_watchlist_names";

type CalendarCountry = "US" | "KR" | "JP" | "EU";
type RegionTab = "americas" | "apac" | "europe";

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

function MiniChart({
  symbol,
  baselineClose,
  onPeriodReturn,
}: {
  symbol: string;
  baselineClose?: number;
  onPeriodReturn?: (ret: { periodPct: number; periodAmt: number; startPrice: number; endPrice: number }) => void;
}) {
  const [data, setData] = useState<{ date: string; close: number }[]>([]);
  const [prevClose, setPrevClose] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const onPeriodReturnRef = useRef(onPeriodReturn);
  onPeriodReturnRef.current = onPeriodReturn;

  useEffect(() => {
    let cancelled = false;

    async function fetchQuoteFallback(): Promise<{ arr: { date: string; close: number }[]; pc: number | null }> {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      try {
        const qr = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`, { signal: ctrl.signal });
        const qj = await qr.json();
        const price = Number(qj?.regularMarketPrice ?? 0);
        const change = Number(qj?.regularMarketChange ?? 0);
        const prev = price - change;
        if (Number.isFinite(price) && Number.isFinite(prev) && price > 0 && prev > 0) {
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return {
            arr: [
              { date: yesterday.toISOString().slice(0, 10), close: prev },
              { date: today.toISOString().slice(0, 10), close: price },
            ],
            pc: prev,
          };
        }
      } catch {} finally { clearTimeout(t); }
      return { arr: [], pc: null };
    }

    async function fetchHistorical(): Promise<{ arr: { date: string; close: number }[]; pc: number | null }> {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      try {
        const r = await fetch(`/api/historical?symbol=${encodeURIComponent(symbol)}&period=5d`, { signal: ctrl.signal });
        const d = await r.json();
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        const pc: number | null = d?.previousClose ?? null;
        if (arr.length > 0) return { arr, pc };
      } catch {} finally { clearTimeout(t); }
      return { arr: [], pc: null };
    }

    async function loadData(attempt = 0) {
      if (cancelled) return;
      let result = await fetchHistorical();
      if (result.arr.length === 0) {
        result = await fetchQuoteFallback();
      }
      if (cancelled) return;
      if (result.arr.length === 0 && attempt < 1) {
        setTimeout(() => loadData(attempt + 1), 2000);
        return;
      }
      setData(result.arr);
      setPrevClose(result.pc);
      setLoading(false);
      if (result.arr.length >= 2 && onPeriodReturnRef.current) {
        const startPrice = result.arr[0].close;
        const endPrice = result.arr[result.arr.length - 1].close;
        if (startPrice > 0) {
          onPeriodReturnRef.current({
            periodPct: ((endPrice - startPrice) / startPrice) * 100,
            periodAmt: endPrice - startPrice,
            startPrice,
            endPrice,
          });
        }
      }
    }

    void loadData();
    return () => { cancelled = true; };
  }, [symbol]);

  const effectiveBaseline = prevClose ?? baselineClose ?? (data.length > 0 ? data[0].close : 0);
  const lastClose = data.length > 0 ? data[data.length - 1].close : 0;
  const isUp = lastClose >= effectiveBaseline;
  const chartId = `home-${symbol.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;

  if (loading)
    return (
      <div className="flex h-full items-center justify-center text-xs text-white">
        로딩 중
      </div>
    );
  if (data.length === 0)
    return (
      <div className="flex h-full items-center justify-center text-xs text-white">
        데이터 없음
      </div>
    );

  return (
    <ClientChart
      data={data}
      period="5d"
      isUp={isUp}
      chartId={chartId}
      height={56}
      baselineClose={prevClose ?? baselineClose}
    />
  );
}

function IndexCard({
  symbol,
  name,
  flag,
  label,
  price,
  change,
  previousClose,
}: {
  symbol: string;
  name: string;
  flag: string;
  label: string;
  price: number | null;
  change: number;
  previousClose: number | null;
}) {
  const isUp = change >= 0;
  const { formatPrice } = useAppCurrency();
  const native = getNativeCurrencyFromSymbol(symbol);

  return (
    <Link
      href={`/market/${encodeURIComponent(symbol)}`}
      className="group block overflow-hidden rounded-xl border border-white/20 bg-slate-800/80 transition hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5"
    >
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-start justify-between">
          <p className="text-[17px] font-bold tracking-tight">{name}</p>
          <span className="shrink-0 text-[11px] font-semibold text-cyan-400 opacity-0 transition group-hover:opacity-100">상세보기 →</span>
        </div>
        <p className="mt-0.5 text-[15px] tabular-nums text-white">
          {price != null ? formatPrice(price, native) : "-"}
        </p>
        <span
          className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[13px] font-bold ${
            isUp
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {isUp ? "▲" : "▼"} {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>
      <div className="h-[56px] px-2">
        <MiniChart
          symbol={symbol}
          baselineClose={previousClose ?? undefined}
        />
      </div>
      <div className="flex items-center gap-1.5 border-t border-white/15 bg-slate-900/60 px-3 py-1.5">
        <span className="text-sm leading-none">{flag}</span>
        <span className="text-[11px] font-bold text-yellow-400">{label}</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [regionTab, setRegionTab] = useState<RegionTab>("americas");
  const [quotes, setQuotes] = useState<
    Record<
      string,
      {
        price: number;
        change: number;
        changeAmount: number;
        previousClose: number;
      }
    >
  >({});
  const { formatPrice } = useAppCurrency();

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [periodReturns, setPeriodReturns] = useState<
    Record<string, { periodPct: number; periodAmt: number; startPrice: number; endPrice: number }>
  >({});
  const [watchlistQuotes, setWatchlistQuotes] = useState<
    Record<
      string,
      {
        price: number;
        change: number;
        changeAmount: number;
        previousClose: number;
      }
    >
  >({});
  const [watchlistNames, setWatchlistNames] = useState<
    Record<string, string>
  >({});
  const [addSymbol, setAddSymbol] = useState("");
  const [searchResults, setSearchResults] = useState<
    { symbol: string; name: string }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [hotStocks, setHotStocks] = useState<{ symbol: string; name: string; changePercent: number }[]>([]);
  const [hotLoading, setHotLoading] = useState(false);
  const [watchSearchFocused, setWatchSearchFocused] = useState(false);
  const watchSearchRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<
    {
      id: string;
      date: string;
      country: string;
      title: string;
      importance: string;
      source: string;
      sourceUrl: string;
    }[]
  >([]);
  const [calCountry, setCalCountry] = useState<CalendarCountry>("US");

  const allIndexSymbols = useMemo(
    () =>
      [
        ...REGION_INDICES.americas,
        ...REGION_INDICES.apac,
        ...REGION_INDICES.europe,
      ].map((i) => i.symbol),
    []
  );

  useEffect(() => {
    let syms: string[] = [];
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWatchlist(parsed);
          syms = parsed;
        }
      }
      const storedNames = localStorage.getItem(WATCHLIST_NAMES_KEY);
      if (storedNames) {
        const parsed = JSON.parse(storedNames) as Record<string, string>;
        if (parsed && typeof parsed === "object") setWatchlistNames(parsed);
      }
    } catch {}
    if (syms.length > 0) {
      fetch(`/api/quotes?symbols=${encodeURIComponent(syms.join(","))}&_t=${Date.now()}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          const map: Record<string, { price: number; change: number; changeAmount: number; previousClose: number }> = {};
          const names: Record<string, string> = {};
          for (const q of list) {
            const s = String(q?.symbol || "");
            if (!s) continue;
            const price = Number(q?.regularMarketPrice ?? 0);
            const changePct = Number(q?.regularMarketChangePercent ?? 0);
            const changeAmt = Number(q?.regularMarketChange ?? 0);
            const prev = Number(q?.regularMarketPreviousClose ?? price - changeAmt);
            map[s] = { price, change: changePct, changeAmount: changeAmt, previousClose: Number.isFinite(prev) ? prev : 0 };
            if (q?.shortName) names[s] = q.shortName;
          }
          if (Object.keys(map).length > 0) setWatchlistQuotes((p) => ({ ...p, ...map }));
          if (Object.keys(names).length > 0) setWatchlistNames((p) => {
            const next = { ...p };
            for (const [k, v] of Object.entries(names)) { if (!next[k]) next[k] = v; }
            return next;
          });
        })
        .catch(() => {});
    }
  }, []);

  const homeRealtime = useRealtimeQuotes(allIndexSymbols, {
    streamIntervalMs: 2000,
    pollIntervalMs: 3000,
  });
  const watchlistRealtime = useRealtimeQuotes(watchlist, {
    streamIntervalMs: 1500,
    pollIntervalMs: 2000,
  });

  useEffect(() => {
    if (Object.keys(homeRealtime.quotes).length === 0) return;
    setQuotes((prev) => ({ ...prev, ...homeRealtime.quotes }));
  }, [homeRealtime.quotes]);

  useEffect(() => {
    if (watchlist.length === 0) {
      setWatchlistQuotes({});
      return;
    }
    if (Object.keys(watchlistRealtime.quotes).length === 0) return;
    setWatchlistQuotes((prev) => ({ ...prev, ...watchlistRealtime.quotes }));
    setWatchlistNames((prev) => {
      const next = { ...prev };
      Object.entries(watchlistRealtime.quotes).forEach(([sym, q]) => {
        if (q.shortName && !next[sym]) next[sym] = q.shortName;
      });
      return next;
    });
  }, [watchlist, watchlistRealtime.quotes]);

  useEffect(() => {
    fetch(`/api/calendar?country=${calCountry}`)
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => setEvents([]));
  }, [calCountry]);

  useEffect(() => {
    if (hotStocks.length > 0) return;
    setHotLoading(true);
    fetch("/api/top-movers?region=US")
      .then((r) => r.json())
      .then((d) => {
        const active = Array.isArray(d?.active) ? d.active : [];
        setHotStocks(active.slice(0, 10).map((m: { symbol: string; name: string; changePercent: number }) => ({
          symbol: m.symbol, name: m.name, changePercent: m.changePercent,
        })));
      })
      .catch(() => {})
      .finally(() => setHotLoading(false));
  }, [hotStocks.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (watchSearchRef.current && !watchSearchRef.current.contains(e.target as Node)) setWatchSearchFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback(() => {
    if (addSymbol.trim().length < 1) return;
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(addSymbol.trim())}`)
      .then((r) => r.json())
      .then((d) =>
        setSearchResults(
          Array.isArray(d?.results) ? d.results.slice(0, 12) : []
        )
      )
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [addSymbol]);

  useEffect(() => {
    const q = addSymbol.trim();
    if (q.length < 1) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const ac = new AbortController();
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ac.signal })
        .then((r) => r.json())
        .then((d) =>
          setSearchResults(
            Array.isArray(d?.results) ? d.results.slice(0, 12) : []
          )
        )
        .catch((e) => {
          if (e?.name !== "AbortError") setSearchResults([]);
        })
        .finally(() => setSearching(false));
    }, 180);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [addSymbol]);

  const addToWatchlist = useCallback((symbol: string, name?: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(symbol) ? prev : [...prev, symbol];
      try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    if (name) {
      setWatchlistNames((p) => {
        const next = { ...p, [symbol]: name };
        try { localStorage.setItem(WATCHLIST_NAMES_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    }
    setAddSymbol("");
    setSearchResults([]);
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((s) => s !== symbol);
      try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setWatchlistNames((p) => {
      const { [symbol]: _, ...rest } = p;
      try { localStorage.setItem(WATCHLIST_NAMES_KEY, JSON.stringify(rest)); } catch {}
      return rest;
    });
  }, []);

  const currentIndices = REGION_INDICES[regionTab];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* At A Glance - Regional Indices */}
      <section className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">At A Glance</h2>
        </div>

        <div className="mb-5 flex gap-2">
          {REGION_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRegionTab(tab.key)}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                regionTab === tab.key
                  ? "bg-white text-slate-900 shadow"
                  : "bg-slate-700/50 text-white hover:bg-slate-600/50 hover:text-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {currentIndices.map(({ symbol, name, flag, label }) => (
            <IndexCard
              key={symbol}
              symbol={symbol}
              name={name}
              flag={flag}
              label={label}
              price={quotes[symbol]?.price ?? null}
              change={quotes[symbol]?.change ?? 0}
              previousClose={quotes[symbol]?.previousClose ?? null}
            />
          ))}
        </div>
      </section>

      {/* Watchlist */}
      <section className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
        <h2 className="mb-4 font-semibold text-cyan-400">My Portfolio</h2>
        <p className="mb-4 text-sm text-white">
          검색 후 추가하여 커스터마이징하세요.
        </p>
        <div ref={watchSearchRef} className="relative mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={addSymbol}
              onChange={(e) => setAddSymbol(e.target.value)}
              onFocus={() => setWatchSearchFocused(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="예: 삼성전자, AAPL..."
              className="flex-1 rounded-lg border border-white/20 bg-slate-700/50 px-4 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={addSymbol.trim().length < 1}
              className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              검색
            </button>
          </div>
          {watchSearchFocused && addSymbol.trim().length === 0 && searchResults.length === 0 && (
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
                      <button key={h.symbol} onClick={() => { addToWatchlist(h.symbol, h.name); setWatchSearchFocused(false); }}
                        className="flex items-center gap-2 rounded-lg border border-white/20 bg-slate-700/40 px-3 py-2 text-sm transition hover:border-cyan-500/40 hover:bg-slate-700/80">
                        <span className="font-semibold text-cyan-400">{h.symbol}</span>
                        <span className={`text-xs font-bold tabular-nums ${up ? "text-green-400" : "text-red-400"}`}>
                          {up ? "+" : ""}{h.changePercent.toFixed(2)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {searchResults.map((r) => (
              <button
                key={r.symbol}
                onClick={() => addToWatchlist(r.symbol, r.name)}
                className="rounded-lg border border-cyan-500/50 bg-slate-800 px-3 py-1.5 text-sm text-cyan-400 hover:bg-slate-700"
              >
                + {r.name || r.symbol}
              </button>
            ))}
          </div>
        )}
        {watchlist.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 p-8 text-center text-white">
            추가된 종목이 없습니다. 검색 후 추가해보세요.
          </div>
        ) : (
          <div className="space-y-2">
            {watchlist.map((symbol) => {
              const q = watchlistQuotes[symbol];
              const pr = periodReturns[symbol];
              const native = getNativeCurrencyFromSymbol(symbol);
              const pctValue = pr?.periodPct ?? q?.change ?? 0;
              const isUp = pctValue >= 0;
              return (
                <div
                  key={symbol}
                  className="group relative flex items-center gap-4 rounded-xl border border-white/20 bg-slate-800/50 p-3"
                >
                  <div className="flex w-40 shrink-0 items-center justify-center">
                    <Link
                      href={`/market/${symbol}`}
                      className="text-base font-extrabold text-cyan-400 hover:underline text-center leading-tight line-clamp-2"
                    >
                      {watchlistNames[symbol] || symbol}
                    </Link>
                  </div>
                  <div className="h-14 min-w-0 flex-1">
                    <MiniChart
                      symbol={symbol}
                      baselineClose={q?.previousClose}
                      onPeriodReturn={(ret) =>
                        setPeriodReturns((prev) => ({ ...prev, [symbol]: ret }))
                      }
                    />
                  </div>
                  <div className="w-32 shrink-0 text-right transition-opacity duration-200 group-hover:opacity-0">
                    <p className="font-bold">
                      {q?.price != null
                        ? formatPrice(q.price, native)
                        : "-"}
                    </p>
                    <p
                      className={`text-sm font-bold ${
                        isUp ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {pr
                        ? `${isUp ? "+" : ""}${pctValue.toFixed(2)}%`
                        : q?.change != null
                          ? `${q.change >= 0 ? "+" : ""}${q.change.toFixed(2)}%`
                          : "-"}
                    </p>
                    {pr && (
                      <p className={`text-[11px] ${isUp ? "text-green-400/70" : "text-red-400/70"}`}>
                        {isUp ? "+" : "-"}{formatPrice(Math.abs(pr.periodAmt), native)}
                        <span className="text-white/50 ml-1">(5D)</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(symbol)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-bold text-red-400 opacity-0 transition-opacity duration-200 hover:bg-red-500/40 hover:text-red-300 group-hover:opacity-100"
                  >
                    제거
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Portfolio Insight */}
      {watchlist.length > 0 && (
        <section className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
          <AIPortfolioInsight watchlist={watchlist} />
        </section>
      )}

      <EconomicCalendar
        events={events}
        country={calCountry}
        onCountryChange={setCalCountry}
      />

      <NewsSection />
    </div>
  );
}
