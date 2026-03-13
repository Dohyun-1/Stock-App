import { NextRequest, NextResponse } from "next/server";
import { quoteRaw, quoteSummary } from "@/lib/yahoo";
import {
  MENTOR_UNIVERSES,
  buildMentorPortfolio,
  deduplicatePortfolios,
  type QuoteData,
} from "@/lib/mentors/mentorPortfolio";
import { MENTOR_IDS } from "@/lib/mentors/mentorProfiles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchRichQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const [raw, summary] = await Promise.all([
      quoteRaw(symbol),
      quoteSummary(symbol),
    ]);

    if (!raw && !summary) return null;

    const r = (raw ?? {}) as Record<string, unknown>;
    const s = summary ?? ({} as Record<string, unknown>);

    const num = (v: unknown): number | undefined => {
      if (v == null) return undefined;
      const n = typeof v === "object" && v !== null && "raw" in v ? Number((v as { raw: unknown }).raw) : Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    return {
      symbol,
      regularMarketPrice: num(r.regularMarketPrice ?? s.regularMarketPrice),
      regularMarketChangePercent: num(r.regularMarketChangePercent),
      regularMarketChange: num(r.regularMarketChange),
      trailingPE: num(r.trailingPE ?? s.pe),
      returnOnEquity: num(r.returnOnEquity),
      debtToEquity: num(r.debtToEquity ?? s.debtToEquity),
      dividendYield: num(r.dividendYield ?? (s as Record<string, unknown>).yield),
      beta: num(r.beta ?? s.beta),
      shortName: String(r.shortName ?? r.longName ?? symbol),
      fiftyTwoWeekHigh: num(r.fiftyTwoWeekHigh ?? s.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: num(r.fiftyTwoWeekLow ?? s.fiftyTwoWeekLow),
      marketCap: num(r.marketCap ?? s.marketCap),
      revenueGrowth: num(r.revenueGrowth ?? s.revenueGrowth),
      operatingMargins: num(r.operatingMargins ?? s.operatingMargins),
      freeCashflow: num(r.freeCashflow ?? s.freeCashflow),
      pegRatio: num(r.pegRatio),
      priceToBook: num(r.priceToBook),
      averageVolume: num(r.averageVolume ?? r.averageDailyVolume10Day ?? s.averageVolume),
      fiftyDayAverage: num(r.fiftyDayAverage),
      twoHundredDayAverage: num(r.twoHundredDayAverage),
    };
  } catch {
    return null;
  }
}

const CACHE = new Map<string, { data: QuoteData; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function getCachedQuote(symbol: string): Promise<QuoteData | null> {
  const cached = CACHE.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  const data = await fetchRichQuote(symbol);
  if (data) CACHE.set(symbol, { data, ts: Date.now() });
  return data;
}

export async function GET(request: NextRequest) {
  const mentorId = request.nextUrl.searchParams.get("mentorId");

  if (mentorId && !MENTOR_IDS.includes(mentorId)) {
    return NextResponse.json({ error: "Invalid mentorId" }, { status: 400 });
  }

  try {
    const targetIds = mentorId ? [mentorId] : MENTOR_IDS;
    const symbolsNeeded = new Set<string>();

    for (const id of targetIds) {
      const universe = MENTOR_UNIVERSES[id] || [];
      for (const s of universe) symbolsNeeded.add(s.symbol);
    }

    const BATCH_SIZE = 6;
    const allSymbols = Array.from(symbolsNeeded);
    const quotesMap: Record<string, QuoteData> = {};

    for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
      const batch = allSymbols.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map((sym) => getCachedQuote(sym)));
      for (let j = 0; j < batch.length; j++) {
        if (results[j]) quotesMap[batch[j]] = results[j]!;
      }
    }

    let portfolios = targetIds.map((id) => buildMentorPortfolio(id, quotesMap));

    if (!mentorId) {
      portfolios = deduplicatePortfolios(portfolios, 2);
    }

    if (mentorId) {
      return NextResponse.json(portfolios[0], {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    return NextResponse.json(portfolios, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (e) {
    console.error("[mentor-portfolio]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
