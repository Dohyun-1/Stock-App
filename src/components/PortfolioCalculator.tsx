"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PortfolioChart from "@/components/PortfolioChart";
import ClientChart from "@/components/ClientChart";

const PERIODS = [
  { value: "1y", label: "1년" },
  { value: "2y", label: "2년" },
  { value: "5y", label: "5년" },
  { value: "10y", label: "10년" },
];

const CURRENCIES = [
  { code: "KRW" as const, symbol: "₩", label: "원 (KRW)", locale: "ko-KR" },
  { code: "USD" as const, symbol: "$", label: "달러 (USD)", locale: "en-US" },
  { code: "EUR" as const, symbol: "€", label: "유로 (EUR)", locale: "de-DE" },
  { code: "JPY" as const, symbol: "¥", label: "엔 (JPY)", locale: "ja-JP" },
  { code: "GBP" as const, symbol: "£", label: "파운드 (GBP)", locale: "en-GB" },
];

export default function PortfolioCalculator() {
  const [items, setItems] = useState<{ symbol: string; name: string; ratio: number }[]>([
    { symbol: "SPY", name: "SPY", ratio: 1 },
    { symbol: "QQQ", name: "QQQ", ratio: 1 },
    { symbol: "SCHD", name: "SCHD", ratio: 1 },
  ]);
  const [investment, setInvestment] = useState(100000);
  const [currency, setCurrency] = useState<"KRW" | "USD" | "EUR" | "JPY" | "GBP">("KRW");
  const [period, setPeriod] = useState("1y");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [chartData, setChartData] = useState<{ date: string; total: number; [k: string]: string | number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [addSymbol, setAddSymbol] = useState("");
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [, setSearching] = useState(false);
  const [dailyData, setDailyData] = useState<Record<string, { data: { date: string; close: number }[]; prevClose: number }>>({});
  const [quoteData, setQuoteData] = useState<Record<string, { price: number; change: number; changePercent: number }>>({});
  const [hotStocks, setHotStocks] = useState<{ symbol: string; name: string; price: number; changePercent: number }[]>([]);
  const [hotLoading, setHotLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const totalRatio = items.reduce((a, b) => a + b.ratio, 0) || 1;

  const addItem = useCallback((symbol: string, name?: string) => {
    if (items.some((i) => i.symbol === symbol)) return;
    setItems((prev) => [...prev, { symbol, name: name || symbol, ratio: 1 }]);
    setAddSymbol("");
    setSearchResults([]);
  }, [items]);

  const removeItem = useCallback((symbol: string) => {
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
  }, []);

  const setRatio = useCallback((symbol: string, ratio: number) => {
    const v = Math.max(0, Math.round(ratio));
    setItems((prev) => prev.map((i) => (i.symbol === symbol ? { ...i, ratio: v } : i)));
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setSearchFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback(() => {
    if (addSymbol.trim().length < 2) return;
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(addSymbol.trim())}`)
      .then((r) => r.json())
      .then((d) => setSearchResults(Array.isArray(d?.results) ? d.results.slice(0, 10) : []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [addSymbol]);

  useEffect(() => {
    if (items.length === 0) return;
    const symbols = items.map((i) => i.symbol);

    symbols.forEach((sym) => {
      if (dailyData[sym]) return;
      fetch(`/api/historical?symbol=${encodeURIComponent(sym)}&period=1d`)
        .then((r) => r.json())
        .then((d) => {
          const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
          const pc = d?.previousClose ?? null;
          setDailyData((prev) => ({ ...prev, [sym]: { data: arr, prevClose: pc ?? arr[0]?.close ?? 0 } }));
        })
        .catch(() => {});
    });

    fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`)
      .then((r) => r.json())
      .then((quotes) => {
        if (!Array.isArray(quotes)) return;
        const map: Record<string, { price: number; change: number; changePercent: number }> = {};
        for (const q of quotes) {
          if (!q?.symbol) continue;
          map[q.symbol] = {
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
          };
        }
        setQuoteData(map);
      })
      .catch(() => {});
  }, [items, dailyData]);

  useEffect(() => {
    if (items.length === 0) {
      setChartData([]);
      return;
    }
    setLoading(true);
    const isCustom = period.startsWith("custom:");
    const [, cs, ce] = isCustom ? period.split(":") : ["", "", ""];
    const promises = items.map((i) => {
      const url = isCustom && cs && ce
        ? `/api/historical?symbol=${encodeURIComponent(i.symbol)}&start=${cs}&end=${ce}`
        : `/api/historical?symbol=${encodeURIComponent(i.symbol)}&period=${period}`;
      return fetch(url).then((r) => r.json()).catch(() => []);
    });

    Promise.all(promises).then((rawResults) => {
      const results = rawResults.map((r) => (Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []));
      const symbols = items.map((i) => i.symbol);
      const byDate: Record<string, { [k: string]: number }> = {};
      results.forEach((data: { date: string; close: number }[], i) => {
        const sym = symbols[i];
        if (!Array.isArray(data)) return;
        data.forEach((row) => {
          if (!byDate[row.date]) byDate[row.date] = {};
          if (row.close != null) byDate[row.date][sym] = row.close;
        });
      });

      const dates = Object.keys(byDate).sort();
      if (dates.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      const lastKnown: Record<string, number> = {};
      symbols.forEach((s, i) => {
        lastKnown[s] = results[i]?.[0]?.close ?? 1;
      });

      const allocs = items.map((i) => (investment * i.ratio) / totalRatio);
      const firstPrices = items.map((_, i) => results[i]?.[0]?.close ?? 1);
      const shares = allocs.map((a, i) => a / firstPrices[i]);

      const chart: { date: string; total: number; [k: string]: string | number }[] = dates.map((d) => {
        const row = byDate[d];
        const out: { date: string; total: number; [k: string]: string | number } = { date: d, total: 0 };
        let total = 0;
        items.forEach((item, i) => {
          const price = row[item.symbol] ?? lastKnown[item.symbol];
          if (row[item.symbol] != null) lastKnown[item.symbol] = row[item.symbol];
          const val = price * shares[i];
          total += val;
          out[item.name || item.symbol] = Math.round(val);
        });
        out.total = Math.round(total);
        return out;
      });

      setChartData(chart);
      setLoading(false);
    });
  }, [items, period, investment, totalRatio]);

  const startVal = chartData[0]?.total ?? investment;
  const endVal = chartData[chartData.length - 1]?.total ?? investment;
  const totalReturn = startVal ? (((endVal - startVal) / startVal) * 100).toFixed(2) : "0";
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? period;
  const curInfo = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const fmtMoney = (v: number) => `${curInfo.symbol}${v.toLocaleString(curInfo.locale)}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
        <h2 className="mb-4 font-semibold text-cyan-400">포트폴리오 구성</h2>
        <p className="mb-4 text-sm text-white">미국·한국·일본·유럽 주식 및 ETF 모두 검색 후 추가 가능합니다.</p>

        <div ref={searchBoxRef} className="relative mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={addSymbol}
              onChange={(e) => setAddSymbol(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="예: 삼성전자, NVDA, SPY, 7203.T..."
              className="flex-1 rounded-lg border border-white/20 bg-slate-700/50 px-4 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={addSymbol.trim().length < 2}
              className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              검색
            </button>
          </div>
          {searchFocused && addSymbol.trim().length === 0 && searchResults.length === 0 && (
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
                      <button key={h.symbol} onClick={() => { addItem(h.symbol, h.name); setSearchFocused(false); }}
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
                onClick={() => addItem(r.symbol, r.name)}
                className="rounded-lg border border-cyan-500/50 bg-slate-800 px-3 py-1.5 text-sm text-cyan-400 hover:bg-slate-700"
              >
                + {r.name || r.symbol}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {items.map((item) => {
            const q = quoteData[item.symbol];
            const dd = dailyData[item.symbol];
            const isUp = (q?.changePercent ?? 0) >= 0;
            return (
              <div
                key={item.symbol}
                className="group relative flex items-center gap-4 rounded-xl border border-white/20 bg-slate-800/50 p-3"
              >
                <div className="flex w-40 shrink-0 flex-col items-center justify-center">
                  <span className="text-base font-extrabold text-cyan-400 text-center leading-tight line-clamp-2">
                    {item.name || item.symbol}
                  </span>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.ratio === 0 ? "" : String(item.ratio)}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setRatio(item.symbol, raw === "" ? 0 : Number(raw));
                      }}
                      className="w-10 rounded border border-white/20 bg-slate-700 px-1.5 py-0.5 text-center text-xs tabular-nums text-white"
                    />
                    <span className="text-xs text-slate-400 tabular-nums">
                      ({((item.ratio / totalRatio) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="h-14 min-w-0 flex-1">
                  {dd && dd.data.length >= 2 ? (
                    <ClientChart
                      data={dd.data}
                      period="1d"
                      isUp={isUp}
                      chartId={`pf-${item.symbol.replace(/[^a-zA-Z0-9]/g, "")}`}
                      height={56}
                      baselineClose={dd.prevClose}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-white">···</div>
                  )}
                </div>

                <div className="w-32 shrink-0 text-right transition-opacity duration-200 group-hover:opacity-0">
                  {q ? (
                    <>
                      <p className="font-bold text-white">
                        {q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
                        {isUp ? "+" : ""}{q.changePercent.toFixed(2)}%
                      </p>
                      {investment > 0 && (
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          {fmtMoney(Math.round((investment * item.ratio) / totalRatio))}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[11px] text-white">로딩...</p>
                  )}
                </div>

                <button
                  onClick={() => removeItem(item.symbol)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-bold text-red-400 opacity-0 transition-opacity duration-200 hover:bg-red-500/40 hover:text-red-300 group-hover:opacity-100"
                >
                  제거
                </button>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <p className="py-4 text-center text-white">종목을 검색하여 추가해주세요.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
        <div>
          <label className="block text-sm text-white">투자금액 ({curInfo.symbol})</label>
          <input
            type="text"
            inputMode="numeric"
            value={investment === 0 ? "" : investment.toLocaleString(curInfo.locale)}
            placeholder="0"
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setInvestment(raw === "" ? 0 : Number(raw));
            }}
            className="mt-1 rounded-lg border border-white/20 bg-slate-700/50 px-4 py-2 w-48"
          />
        </div>
        <div>
          <label className="block text-sm text-white">통화</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as typeof currency)}
            className="mt-1 rounded-lg border border-white/20 bg-slate-700/50 px-4 py-2"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-white">기간</label>
          <select
            value={period.startsWith("custom") ? "custom" : period}
            onChange={(e) => {
              if (e.target.value === "custom") {
                setShowCustomRange(true);
              } else {
                setPeriod(e.target.value);
                setShowCustomRange(false);
              }
            }}
            className="mt-1 rounded-lg border border-white/20 bg-slate-700/50 px-4 py-2"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
            <option value="custom">기간 선택</option>
          </select>
          {showCustomRange && (
            <div className="mt-2 flex items-center gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded bg-slate-700 px-2 py-1 text-sm" />
              <span className="text-white">~</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded bg-slate-700 px-2 py-1 text-sm" />
              <button onClick={() => { if (customStart && customEnd && new Date(customStart) <= new Date(customEnd)) { setPeriod(`custom:${customStart}:${customEnd}`); setShowCustomRange(false); } }} className="rounded bg-cyan-500 px-3 py-1 text-sm text-white">적용</button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-white">계산 중...</div>
      ) : items.length > 0 && chartData.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
              <p className="text-sm text-white">총 수익률</p>
              <p className={`text-2xl font-bold ${Number(totalReturn) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {totalReturn}%
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
              <p className="text-sm text-white">예상 최종 금액</p>
              <p className="text-2xl font-bold">{fmtMoney(Math.round(endVal))}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
              <p className="text-sm text-white">기간</p>
              <p className="text-2xl font-bold">{periodLabel}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
            <h2 className="mb-4 font-semibold">포트폴리오 가치 변화</h2>
            <PortfolioChart data={chartData} period={period.startsWith("custom") ? "custom" : period} currencySymbol={curInfo.symbol} />
          </div>
        </>
      ) : items.length > 0 && !loading ? (
        <div className="py-12 text-center text-white">데이터를 불러오는 중이거나 해당 기간 데이터가 없습니다.</div>
      ) : null}
    </div>
  );
}
