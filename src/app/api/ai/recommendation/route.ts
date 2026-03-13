import { NextRequest, NextResponse } from "next/server";
import { buildRecommendations } from "@/lib/ai/recommendationEngine";
import { EconomicEventInput, MarketSnapshot, PortfolioInput } from "@/lib/ai/types";
import { getUserIdFromRequestHeader, readPortfolioDB } from "@/lib/storage";
import { quoteMultiple } from "@/lib/yahoo";

const KNOWN_SECTORS: Record<string, string> = {
  SPY: "Broad Market",
  QQQ: "Technology",
  "005930.KS": "Technology",
  NVDA: "Technology",
  AAPL: "Technology",
  MSFT: "Technology",
  TSLA: "Automotive",
  "7203.T": "Automotive",
};

function parseImportance(v: string): "low" | "medium" | "high" {
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

type NormalizedHolding = {
  symbol: string;
  companyName: string;
  sector: string;
  shares: number;
  averagePrice: number;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const portfolioId = String(body?.portfolio_id || "").trim();
  const requestHoldings = Array.isArray(body?.holdings) ? body.holdings : [];

  const db = readPortfolioDB();
  const rawUserId = request.headers.get("x-user-id");
  const userId = getUserIdFromRequestHeader(rawUserId);
  if (portfolioId.length > 0 && !rawUserId?.trim()) {
    return NextResponse.json({ error: "x-user-id header is required for portfolio_id access" }, { status: 401 });
  }
  const ownedPortfolio =
    portfolioId.length > 0
      ? db.portfolios.find((p) => p.id === portfolioId && p.userId === userId)
      : null;
  if (portfolioId.length > 0 && !ownedPortfolio) {
    return NextResponse.json({ error: "portfolio not found or unauthorized" }, { status: 404 });
  }
  const holdings: NormalizedHolding[] =
    portfolioId.length > 0
      ? db.holdings
          .filter((h) => h.portfolioId === portfolioId)
          .map((h) => ({
            symbol: h.symbol,
            companyName: h.companyName,
            sector: h.sector,
            shares: h.shares,
            averagePrice: h.averagePrice,
          }))
      : requestHoldings.map((h: { symbol?: string; company_name?: string; sector?: string; shares?: number; average_price?: number }) => ({
          symbol: String(h.symbol || "").toUpperCase(),
          companyName: String(h.company_name || h.symbol || ""),
          sector: String(h.sector || KNOWN_SECTORS[String(h.symbol || "").toUpperCase()] || "Unknown"),
          shares: Number(h.shares || 0),
          averagePrice: Number(h.average_price || 0),
        }))
          .filter((h: { symbol: string; shares: number; averagePrice: number }) => h.symbol && h.shares > 0 && h.averagePrice > 0);

  if (holdings.length === 0) {
    return NextResponse.json({ error: "portfolio holdings are empty" }, { status: 400 });
  }

  const quotes = await quoteMultiple(holdings.map((h) => h.symbol));
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  const totalValue = holdings.reduce((sum, h) => {
    const q = quoteMap.get(h.symbol);
    const price = q?.regularMarketPrice ?? h.averagePrice;
    return sum + price * h.shares;
  }, 0) || 1;

  const portfolio: PortfolioInput = {
    holdings: holdings.map((h) => {
      const q = quoteMap.get(h.symbol);
      const price = q?.regularMarketPrice ?? h.averagePrice;
      const value = price * h.shares;
      return {
        symbol: h.symbol,
        sector: h.sector || KNOWN_SECTORS[h.symbol] || "Unknown",
        weight: value / totalValue,
        value,
      };
    }),
  };

  const market: MarketSnapshot[] = holdings.map((h) => {
    const q = quoteMap.get(h.symbol);
    const price = q?.regularMarketPrice ?? h.averagePrice;
    const momentum = q?.regularMarketChangePercent ?? 0;
    return {
      symbol: h.symbol,
      companyName: h.companyName,
      sector: h.sector || KNOWN_SECTORS[h.symbol] || "Unknown",
      price,
      marketCap: q?.marketCap ?? Math.max(1_000_000_000, price * 1_000_000),
      volume: q?.regularMarketVolume ?? 1_000_000,
      volatility: Math.min(100, Math.abs(momentum) * 4 + 20),
      momentum,
      liquidity: 70,
    };
  });

  const eventRes = await fetch(new URL("/api/economic-events", request.url), { cache: "no-store" });
  const eventJson = eventRes.ok ? await eventRes.json() : { events: [] };
  const events: EconomicEventInput[] = (Array.isArray(eventJson?.events) ? eventJson.events : []).map(
    (e: {
      event_name?: string;
      date?: string;
      importance?: string;
      expected_value?: string;
      previous_value?: string;
    }) => ({
      event_name: String(e.event_name || ""),
      date: String(e.date || ""),
      importance: parseImportance(String(e.importance || "medium")),
      expected_value: String(e.expected_value || ""),
      previous_value: String(e.previous_value || ""),
    })
  );

  const result = buildRecommendations(market, portfolio, events);
  return NextResponse.json(result);
}
