// Yahoo Finance API with crumb-based authentication
import https from "https";

const BASE = "https://query1.finance.yahoo.com";
const BASE_FALLBACK = "https://query2.finance.yahoo.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
const REFERER = "https://finance.yahoo.com/";

function rawGet(url: string, timeoutMs = 12000): Promise<{ status: number; body: string; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": UA, Referer: REFERER }, timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        const h: Record<string, string | string[] | undefined> = {};
        for (const [k, v] of Object.entries(res.headers)) h[k] = v;
        resolve({ status: res.statusCode ?? 0, body, headers: h });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

let _crumb: string | null = null;
let _cookie: string | null = null;
let _crumbExpiry = 0;

async function getCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  if (_crumb && _cookie && Date.now() < _crumbExpiry) {
    return { crumb: _crumb, cookie: _cookie };
  }
  try {
    const cookieRes = await fetch("https://fc.yahoo.com/", {
      headers: { "User-Agent": UA, Referer: REFERER },
      redirect: "manual",
    });
    const setCookies = cookieRes.headers.getSetCookie?.() ?? [];
    let a3 = "";
    for (const c of setCookies) {
      const m = c.match(/^A3=([^;]+)/);
      if (m) { a3 = m[1]; break; }
    }
    if (!a3) {
      const raw = cookieRes.headers.get("set-cookie") ?? "";
      const m2 = raw.match(/A3=([^;]+)/);
      if (m2) a3 = m2[1];
    }
    if (!a3) return null;

    const crumbRes = await fetch(
      `${BASE_FALLBACK}/v1/test/getcrumb`,
      { headers: { "User-Agent": UA, Referer: REFERER, Cookie: `A3=${a3}` }, cache: "no-store" }
    );
    if (!crumbRes.ok) return null;
    const crumb = await crumbRes.text();
    if (!crumb || crumb.includes("<")) return null;

    _crumb = crumb;
    _cookie = `A3=${a3}`;
    _crumbExpiry = Date.now() + 30 * 60 * 1000;
    return { crumb, cookie: _cookie };
  } catch {
    return null;
  }
}

function appendCrumb(url: string, crumb: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}crumb=${encodeURIComponent(crumb)}`;
}

const EXCHANGE_SUFFIXES = new Set([
  ".KS",".KQ",".T",".L",".DE",".PA",".AS",".SW",".MI",".MC",".HA",
  ".NS",".BO",".HK",".SS",".SZ",".AX",".TO",".V",".SA",".MX",
  ".IS",".JK",".TW",".TWO",".O",".SI",".NZ",".CO",".HE",".OL",".ST",
]);

function normalizeSymbol(symbol: string): string {
  const dot = symbol.lastIndexOf(".");
  if (dot <= 0) return symbol;
  const suffix = symbol.slice(dot).toUpperCase();
  if (EXCHANGE_SUFFIXES.has(suffix)) return symbol;
  return symbol.slice(0, dot) + "-" + symbol.slice(dot + 1);
}

export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = 10000
): Promise<Response> {
  const auth = await getCrumb();
  const headers: Record<string, string> = {
    "User-Agent": UA,
    Referer: REFERER,
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (auth?.cookie) headers["Cookie"] = auth.cookie;

  const finalUrl = auth?.crumb ? appendCrumb(url, auth.crumb) : url;

  const baseInit: RequestInit = {
    ...init,
    headers,
    cache: "no-store",
  };

  const tryFetch = async (targetUrl: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(targetUrl, { ...baseInit, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const attempt = async (targetUrl: string): Promise<Response> => {
    const res = await tryFetch(targetUrl);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500));
      return tryFetch(targetUrl);
    }
    return res;
  };

  try {
    const first = await attempt(finalUrl);
    if (first.ok) return first;
    if (finalUrl.startsWith(BASE)) {
      const fallbackUrl = finalUrl.replace(BASE, BASE_FALLBACK);
      const second = await attempt(fallbackUrl);
      return second;
    }
    return first;
  } catch (err) {
    if (finalUrl.startsWith(BASE)) {
      const fallbackUrl = finalUrl.replace(BASE, BASE_FALLBACK);
      return attempt(fallbackUrl);
    }
    throw err;
  }
}

export type QuoteResult = {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketChange: number;
  regularMarketPreviousClose: number;
  shortName?: string;
  marketCap?: number;
  regularMarketVolume?: number;
};

function parseQuoteItem(item: {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketChange?: number;
  regularMarketPreviousClose?: number;
  shortName?: string;
  longName?: string;
  marketCap?: number;
  regularMarketVolume?: number;
}): QuoteResult | null {
  if (!item?.symbol) return null;
  const price = Number(item.regularMarketPrice ?? 0);
  const prevCloseRaw = Number(item.regularMarketPreviousClose ?? NaN);
  const hasPrevClose = Number.isFinite(prevCloseRaw) && prevCloseRaw > 0;
  const changeAmountRaw = Number(item.regularMarketChange ?? NaN);
  const changePercentRaw = Number(item.regularMarketChangePercent ?? NaN);

  // Some index/FX symbols omit change fields in quote API.
  // In that case, derive both values from previous close.
  const derivedChangeAmount = hasPrevClose ? price - prevCloseRaw : 0;
  const derivedChangePercent = hasPrevClose ? (derivedChangeAmount / prevCloseRaw) * 100 : 0;

  const changeAmount = Number.isFinite(changeAmountRaw) ? changeAmountRaw : derivedChangeAmount;
  const changePercent = Number.isFinite(changePercentRaw) ? changePercentRaw : derivedChangePercent;
  const previousClose =
    hasPrevClose
      ? prevCloseRaw
      : Number.isFinite(price - changeAmount)
        ? price - changeAmount
        : 0;
  return {
    symbol: item.symbol,
    regularMarketPrice: Number.isFinite(price) ? price : 0,
    regularMarketChangePercent: Number.isFinite(changePercent) ? changePercent : derivedChangePercent,
    regularMarketChange: Number.isFinite(changeAmount) ? changeAmount : derivedChangeAmount,
    regularMarketPreviousClose: Number.isFinite(previousClose) ? previousClose : 0,
    shortName: item.shortName ?? item.longName ?? item.symbol,
    marketCap: item.marketCap && Number.isFinite(item.marketCap) ? item.marketCap : undefined,
    regularMarketVolume: item.regularMarketVolume && Number.isFinite(item.regularMarketVolume) ? item.regularMarketVolume : undefined,
  };
}

async function quoteByChartFallback(symbol: string): Promise<QuoteResult> {
  const url = `${BASE}/v8/finance/chart/${encodeURIComponent(normalizeSymbol(symbol))}?interval=1d&range=5d`;
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0" } }, 10000);
  if (!res.ok) throw new Error(`Quote fallback failed: ${res.status}`);
  const json = await res.json();
  const meta = json.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("Invalid fallback response");

  const regularMarketPrice = Number(meta.regularMarketPrice ?? meta.previousClose ?? 0);
  const previousClose = Number(meta.previousClose ?? regularMarketPrice);
  const regularMarketChange =
    previousClose !== 0 && Number.isFinite(previousClose) ? regularMarketPrice - previousClose : 0;
  const regularMarketChangePercent =
    previousClose !== 0 && Number.isFinite(previousClose) ? (regularMarketChange / previousClose) * 100 : 0;

  return {
    symbol: meta.symbol || symbol,
    regularMarketPrice,
    regularMarketChangePercent,
    regularMarketChange,
    regularMarketPreviousClose: previousClose,
    shortName: meta.shortName,
  };
}

export async function quoteRaw(symbol: string): Promise<Record<string, unknown> | null> {
  const norm = normalizeSymbol(symbol);
  const url = `${BASE}/v7/finance/quote?symbols=${encodeURIComponent(norm)}`;
  try {
    const res = await fetchWithTimeout(url, {}, 10000);
    if (res.ok) {
      const json = await res.json();
      const q = json?.quoteResponse?.result?.[0];
      if (q) return q as Record<string, unknown>;
    }
  } catch { /* fall through to chart */ }

  try {
    const chartUrl = `${BASE}/v8/finance/chart/${encodeURIComponent(norm)}?interval=1d&range=5d`;
    const res = await fetchWithTimeout(chartUrl, {}, 10000);
    if (res.ok) {
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta) return meta as Record<string, unknown>;
    }
  } catch { /* return null */ }

  return null;
}

export async function quoteSummaryRaw(symbol: string): Promise<Record<string, unknown> | null> {
  const modules = "defaultKeyStatistics,financialData,summaryDetail,calendarEvents,assetProfile,earningsTrend,earningsHistory,summaryProfile,incomeStatementHistory";
  const norm = normalizeSymbol(symbol);
  const url = `${BASE}/v10/finance/quoteSummary/${encodeURIComponent(norm)}?modules=${modules}`;
  try {
    const res = await fetchWithTimeout(url, {}, 10000);
    if (res.ok) {
      const json = await res.json();
      const r = json?.quoteSummary?.result?.[0];
      if (r) return r as Record<string, unknown>;
    }
  } catch { /* unavailable */ }
  return null;
}

export async function quote(symbol: string): Promise<QuoteResult> {
  const list = await quoteMultiple([symbol]);
  if (list.length > 0) return list[0];
  return quoteByChartFallback(symbol);
}

export async function quoteMultiple(symbols: string[]): Promise<QuoteResult[]> {
  const raw = Array.from(new Set(symbols.map((s) => s.trim()).filter(Boolean)));
  if (raw.length === 0) return [];
  const normMap = new Map<string, string>();
  for (const s of raw) { normMap.set(normalizeSymbol(s), s); }
  const unique = Array.from(normMap.keys());
  const url = `${BASE}/v7/finance/quote?symbols=${encodeURIComponent(unique.join(","))}`;
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0" } }, 10000);
  if (!res.ok) {
    const fallback = await Promise.all(unique.map((s) => quoteByChartFallback(s).catch(() => null)));
    return fallback.filter((q): q is QuoteResult => q != null).map((q) => ({
      ...q, symbol: normMap.get(q.symbol) ?? q.symbol,
    }));
  }
  const json = await res.json();
  const results = Array.isArray(json?.quoteResponse?.result) ? json.quoteResponse.result : [];
  const parsed: QuoteResult[] = results
    .map((r: {
      symbol?: string;
      regularMarketPrice?: number;
      regularMarketChangePercent?: number;
      regularMarketChange?: number;
      regularMarketPreviousClose?: number;
      shortName?: string;
      longName?: string;
    }) => parseQuoteItem(r))
    .filter((q: QuoteResult | null): q is QuoteResult => q != null)
    .map((q: QuoteResult) => ({ ...q, symbol: normMap.get(q.symbol) ?? q.symbol }));

  if (parsed.length === raw.length) return parsed;
  const have = new Set(parsed.map((p) => p.symbol));
  const missing = raw.filter((s) => !have.has(s));
  if (missing.length === 0) return parsed;
  const fallback = await Promise.all(missing.map((s) => quoteByChartFallback(s).catch(() => null)));
  return [...parsed, ...fallback.filter((q): q is QuoteResult => q != null).map((q) => ({
    ...q, symbol: normMap.get(q.symbol) ?? q.symbol,
  }))];
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return {}; }
}

const _chartCache = new Map<string, { data: ChartPoint[]; previousClose: number | null; ts: number }>();
const CHART_CACHE_TTL = 5 * 60_000;

let _warmupDone = false;
async function ensureWarmup() {
  if (_warmupDone) return;
  _warmupDone = true;
  try {
    await fetch(`${BASE}/v8/finance/chart/AAPL?range=5d&interval=1d`, {
      headers: { "User-Agent": UA },
      cache: "no-store",
    });
  } catch { /* ignore */ }
}

const _requestQueue: Array<() => Promise<void>> = [];
let _queueRunning = false;
async function runQueue() {
  if (_queueRunning) return;
  _queueRunning = true;
  while (_requestQueue.length > 0) {
    const task = _requestQueue.shift()!;
    await task();
    await new Promise((r) => setTimeout(r, 200));
  }
  _queueRunning = false;
}
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    _requestQueue.push(async () => {
      try { resolve(await fn()); } catch (e) { reject(e); }
    });
    runQueue();
  });
}

type ChartJson = { chart?: { result?: Array<{ timestamp?: number[]; meta?: Record<string, unknown>; indicators?: Record<string, unknown> }> } };

function periodToRange(period1: string, period2: string): string | null {
  const ms = new Date(period2).getTime() - new Date(period1).getTime();
  const days = ms / 86400000;
  if (days <= 1.5) return "1d";
  if (days <= 6) return "5d";
  if (days <= 35) return "1mo";
  if (days <= 100) return "3mo";
  if (days <= 200) return "6mo";
  if (days <= 400) return "1y";
  if (days <= 800) return "2y";
  if (days <= 2000) return "5y";
  if (days <= 4000) return "10y";
  return "max";
}

function rangeToInterval(range: string): string {
  switch (range) {
    case "1d": return "5m";
    case "5d": return "1h";
    case "1mo": case "3mo": case "6mo": case "1y": case "2y": return "1d";
    case "5y": case "10y": return "1wk";
    case "max": return "1mo";
    default: return "1d";
  }
}

export async function chart(symbol: string, period1: string, period2: string, interval = "1d"): Promise<{ data: ChartPoint[]; previousClose: number | null }> {
  const norm = normalizeSymbol(symbol);
  const range = periodToRange(period1, period2);
  const effectiveInterval = range ? rangeToInterval(range) : interval;
  const cacheKey = `${norm}|${range || interval}`;

  const cached = _chartCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CHART_CACHE_TTL) {
    return { data: cached.data, previousClose: cached.previousClose };
  }

  await ensureWarmup();

  const chartFetch = async (chartUrl: string): Promise<ChartJson> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(chartUrl, {
        headers: { "User-Agent": UA },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await res.text();
      try { return JSON.parse(text) as ChartJson; } catch { return {}; }
    } catch {
      clearTimeout(timer);
      return {};
    }
  };

  const url = range
    ? `${BASE}/v8/finance/chart/${encodeURIComponent(norm)}?range=${range}&interval=${effectiveInterval}`
    : `${BASE}/v8/finance/chart/${encodeURIComponent(norm)}?interval=${interval}&period1=${Math.floor(new Date(period1).getTime() / 1000)}&period2=${Math.floor(new Date(period2).getTime() / 1000)}`;

  const json = await chartFetch(url);
  let result = json.chart?.result?.[0];

  if (!result?.timestamp?.length && ["5m", "1h"].includes(effectiveInterval)) {
    const fallbackUrl = range
      ? `${BASE}/v8/finance/chart/${encodeURIComponent(norm)}?range=${range}&interval=1d`
      : `${BASE}/v8/finance/chart/${encodeURIComponent(norm)}?interval=1d&period1=${Math.floor(new Date(period1).getTime() / 1000)}&period2=${Math.floor(new Date(period2).getTime() / 1000)}`;
    const json2 = await chartFetch(fallbackUrl);
    result = json2.chart?.result?.[0];
    if (result) {
      const out = { data: formatChartResult(result, "1d"), previousClose: extractPreviousClose(result) };
      _chartCache.set(cacheKey, { ...out, ts: Date.now() });
      return out;
    }
  }
  if (!result) throw new Error("Invalid response: " + JSON.stringify(json).slice(0, 200));

  const out = { data: formatChartResult(result, effectiveInterval), previousClose: extractPreviousClose(result) };
  _chartCache.set(cacheKey, { ...out, ts: Date.now() });
  return out;
}

function extractPreviousClose(result: { meta?: { previousClose?: number; chartPreviousClose?: number } }): number | null {
  const pc = result?.meta?.previousClose ?? result?.meta?.chartPreviousClose;
  return typeof pc === "number" && Number.isFinite(pc) ? pc : null;
}

export type ChartPoint = { date: string; close: number; open?: number; high?: number; low?: number; volume?: number };

function formatChartResult(
  result: {
    timestamp?: number[];
    indicators?: {
      quote?: { 0?: { open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[]; volume?: (number | null)[] } };
      adjclose?: { 0?: { adjclose?: (number | null)[] } };
    };
  },
  interval: string,
  withOhlc = false
) {
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0];
  const closes = quotes?.close || [];
  const adjclose = result.indicators?.adjclose?.[0]?.adjclose || closes;
  const opens = quotes?.open || [];
  const highs = quotes?.high || [];
  const lows = quotes?.low || [];
  const volumes = quotes?.volume || [];

  const isIntraday = interval === "5m" || interval === "1h";
  return timestamps
    .map((ts: number, i: number) => {
      const close = adjclose[i] ?? closes[i];
      if (close == null) return null;
      const d = new Date(ts * 1000);
      const date = isIntraday ? d.toISOString() : d.toISOString().split("T")[0];
      const item: ChartPoint & { ts?: number } = { date, close: Number(close), ts };
      if (withOhlc) {
        item.open = opens[i] != null ? Number(opens[i]) : undefined;
        item.high = highs[i] != null ? Number(highs[i]) : undefined;
        item.low = lows[i] != null ? Number(lows[i]) : undefined;
        item.volume = volumes[i] != null ? Number(volumes[i]) : undefined;
      }
      return item;
    })
    .filter((q): q is ChartPoint & { ts?: number } => q != null);
}

export async function chartWithOhlc(symbol: string, period1: string, period2: string, interval = "1d"): Promise<ChartPoint[]> {
  const norm = normalizeSymbol(symbol);
  const p1 = Math.floor(new Date(period1).getTime() / 1000);
  const p2 = Math.floor(new Date(period2).getTime() / 1000);
  const url = `${BASE}/v8/finance/chart/${encodeURIComponent(norm)}?interval=${interval}&period1=${p1}&period2=${p2}`;
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0" } }, 12000);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error("Invalid response");
  return formatChartResult(result, interval, true) as ChartPoint[];
}

export async function searchStocks(q: string, quotesCount = 20) {
  const url = `${BASE}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=${quotesCount}&newsCount=0`;
  const res = await fetchWithTimeout(
    url,
    { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } },
    10000
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const json = await res.json();
  const quotes = json.quotes || [];
  return quotes
    .filter((x: { quoteType?: string; symbol?: string }) => x?.quoteType === "EQUITY" || (x?.quoteType === "ETF" && x?.symbol))
    .map((x: { symbol?: string; shortname?: string; longname?: string; longName?: string; shortName?: string; exchange?: string }) => ({
      symbol: x.symbol || "",
      name: (x.longname ?? x.longName ?? x.shortname ?? x.shortName ?? x.symbol) || "",
      exchange: x.exchange || "",
    }))
    .filter((x: { symbol: string }) => x.symbol);
}

/**
 * Search Korean stocks via Naver Finance autocomplete API.
 * Naver has the most comprehensive Korean stock name coverage.
 */
export async function searchNaverStocks(q: string): Promise<{ symbol: string; name: string; exchange: string }[]> {
  try {
    const url = `https://ac.stock.naver.com/ac?q=${encodeURIComponent(q)}&target=stock&st=111`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": UA, Referer: "https://finance.naver.com/" },
    }, 8000);
    if (!res.ok) return [];
    const json = await res.json();
    const items: { code?: string; name?: string; typeName?: string; marketName?: string }[] =
      json?.items?.[0]?.items ?? json?.items ?? [];
    return items
      .filter((x) => x.code && x.name)
      .map((x) => {
        const code = x.code!.trim();
        const market = (x.marketName ?? x.typeName ?? "");
        const mu = market.toUpperCase();
        const isKospi = mu.includes("KOSPI") || market.includes("코스피");
        const isKosdaq = mu.includes("KOSDAQ") || market.includes("코스닥");
        let suffix = "";
        if (isKospi) suffix = ".KS";
        else if (isKosdaq) suffix = ".KQ";
        const exchange = isKospi ? "KOSPI" : isKosdaq ? "KOSDAQ" : mu || "KRX";
        return {
          symbol: suffix ? `${code}${suffix}` : code,
          name: x.name!.trim(),
          exchange,
        };
      })
      .filter((x) => x.symbol);
  } catch {
    return [];
  }
}

export async function quoteSummary(symbol: string) {
  const norm = normalizeSymbol(symbol);
  const url = `${BASE}/v10/finance/quoteSummary/${encodeURIComponent(norm)}?modules=defaultKeyStatistics,financialData,summaryDetail,price`;
  const res = await fetchWithTimeout(
    url,
    { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } },
    10000
  );
  if (!res.ok) return null;
  const json = await res.json();
  const q = json.quoteSummary?.result?.[0];
  if (!q) return null;
  const summary = q.summaryDetail || {};
  const stats = q.defaultKeyStatistics || {};
  const fin = q.financialData || {};
  const price = q.price || {};
  const trailingPE = summary.trailingPE?.raw ?? summary.trailingPE;
  const currentPrice = fin.currentPrice?.raw ?? fin.currentPrice;
  const trailingEps = stats.trailingEps?.raw ?? stats.trailingEps;
  const computedPE = typeof currentPrice === "number" && trailingEps
    ? currentPrice / (Number(trailingEps) || 1)
    : undefined;

  return {
    marketCap: summary.marketCap?.raw ?? summary.marketCap,
    pe: trailingPE ?? computedPE,
    eps: stats.trailingEps?.raw ?? stats.trailingEps,
    yield: summary.yield?.raw ?? summary.yield,
    beta: stats.beta?.raw ?? stats.beta,
    freeCashflow: fin.freeCashflow?.raw ?? fin.freeCashflow,
    debtToEquity: fin.debtToEquity?.raw ?? fin.debtToEquity,
    operatingMargins: fin.operatingMargins?.raw ?? fin.operatingMargins,
    revenueGrowth: fin.revenueGrowth?.raw ?? fin.revenueGrowth,
    fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh?.raw ?? summary.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: summary.fiftyTwoWeekLow?.raw ?? summary.fiftyTwoWeekLow,
    averageVolume: summary.averageVolume?.raw ?? summary.averageVolume,
    regularMarketPrice: price.regularMarketPrice?.raw ?? price.regularMarketPrice,
  };
}
