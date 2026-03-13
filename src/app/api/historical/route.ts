import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE = "https://query1.finance.yahoo.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const EXCHANGE_SUFFIXES = new Set([
  ".KS",".KQ",".T",".L",".DE",".PA",".AS",".SW",".MI",".MC",".HA",
  ".NS",".BO",".HK",".SS",".SZ",".AX",".TO",".V",".SA",".MX",
]);

function normalizeSymbol(symbol: string): string {
  const dot = symbol.lastIndexOf(".");
  if (dot <= 0) return symbol;
  const suffix = symbol.slice(dot).toUpperCase();
  if (EXCHANGE_SUFFIXES.has(suffix)) return symbol;
  return symbol.slice(0, dot) + "-" + symbol.slice(dot + 1);
}

type ChartPoint = { date: string; close: number; ts?: number };

const _cache = new Map<string, { data: ChartPoint[]; previousClose: number | null; ts: number }>();
const CACHE_TTL = 5 * 60_000;

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const period = request.nextUrl.searchParams.get("period") || "1y";
  const startParam = request.nextUrl.searchParams.get("start");
  const endParam = request.nextUrl.searchParams.get("end");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const norm = normalizeSymbol(symbol);
  let range: string;
  let interval: string;

  if (startParam && endParam) {
    const days = (new Date(endParam).getTime() - new Date(startParam).getTime()) / 86400000;
    range = daysToRange(days);
    interval = rangeToInterval(range);
  } else {
    range = periodToRange(period);
    interval = rangeToInterval(range);
  }

  const cacheKey = `${norm}|${range}`;
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ data: cached.data, previousClose: cached.previousClose }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  }

  try {
    const url = `${BASE}/v8/finance/chart/${encodeURIComponent(norm)}?range=${range}&interval=${interval}&_t=${Date.now()}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await res.text();
    let json: Record<string, unknown>;
    try { json = JSON.parse(text); } catch { json = {}; }

    const result = (json as { chart?: { result?: Array<{ timestamp?: number[]; meta?: Record<string, unknown>; indicators?: Record<string, unknown> }> } }).chart?.result?.[0];
    if (!result?.timestamp?.length) {
      return NextResponse.json(
        { data: [], previousClose: null, error: `Yahoo returned status ${res.status}` },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const timestamps = result.timestamp || [];
    const quotes = (result.indicators as { quote?: Array<{ close?: (number | null)[] }> })?.quote?.[0];
    const adjclose = (result.indicators as { adjclose?: Array<{ adjclose?: (number | null)[] }> })?.adjclose?.[0]?.adjclose;
    const closes = adjclose || quotes?.close || [];
    const isIntraday = interval === "5m" || interval === "1h";

    const data: ChartPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close == null) continue;
      const d = new Date(timestamps[i] * 1000);
      const date = isIntraday ? d.toISOString() : d.toISOString().split("T")[0];
      data.push({ date, close: Number(close), ts: timestamps[i] });
    }

    const meta = result.meta as { previousClose?: number; chartPreviousClose?: number } | undefined;
    const previousClose = meta?.previousClose ?? meta?.chartPreviousClose ?? null;

    _cache.set(cacheKey, { data, previousClose, ts: Date.now() });

    return NextResponse.json({ data, previousClose }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (e) {
    return NextResponse.json(
      { data: [], previousClose: null, error: String(e) },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}

function periodToRange(period: string): string {
  switch (period) {
    case "today": case "0d": return "1d";
    case "1d": return "1d";
    case "5d": return "5d";
    case "1m": return "1mo";
    case "3m": return "3mo";
    case "6m": return "6mo";
    case "ytd": return "ytd";
    case "1y": return "1y";
    case "2y": return "2y";
    case "5y": return "5y";
    case "10y": return "10y";
    case "20y": case "50y": case "max": return "max";
    default: return "1y";
  }
}

function daysToRange(days: number): string {
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
    case "1mo": case "3mo": case "6mo": case "1y": case "ytd": case "2y": return "1d";
    case "5y": case "10y": return "1wk";
    case "max": return "1mo";
    default: return "1d";
  }
}
