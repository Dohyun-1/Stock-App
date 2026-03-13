import { NextRequest, NextResponse } from "next/server";
import { quoteMultiple } from "@/lib/yahoo";
import { getUserIdFromRequestHeader, readPortfolioDB } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequestHeader(request.headers.get("x-user-id"));
  const portfolioId = request.nextUrl.searchParams.get("portfolio_id") || "";
  if (!portfolioId) return NextResponse.json({ error: "portfolio_id required" }, { status: 400 });

  const db = readPortfolioDB();
  const portfolio = db.portfolios.find((p) => p.id === portfolioId && p.userId === userId);
  if (!portfolio) return NextResponse.json({ error: "portfolio not found" }, { status: 404 });

  const holdings = db.holdings.filter((h) => h.portfolioId === portfolioId);
  const symbols = holdings.map((h) => h.symbol);
  const quotes = symbols.length > 0 ? await quoteMultiple(symbols) : [];
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  const positions = holdings.map((h) => {
    const q = quoteMap.get(h.symbol);
    const price = q?.regularMarketPrice ?? h.averagePrice;
    const marketValue = price * h.shares;
    const cost = h.averagePrice * h.shares;
    return {
      symbol: h.symbol,
      company_name: h.companyName,
      sector: h.sector,
      shares: h.shares,
      average_price: h.averagePrice,
      current_price: price,
      market_value: marketValue,
      pnl: marketValue - cost,
      pnl_percent: cost > 0 ? ((marketValue - cost) / cost) * 100 : 0,
    };
  });

  const totalValue = positions.reduce((s, p) => s + p.market_value, 0);
  const totalCost = positions.reduce((s, p) => s + p.average_price * p.shares, 0);
  const sectorExposure = positions.reduce<Record<string, number>>((acc, p) => {
    acc[p.sector] = (acc[p.sector] || 0) + p.market_value;
    return acc;
  }, {});

  for (const key of Object.keys(sectorExposure)) {
    sectorExposure[key] = totalValue > 0 ? Number((sectorExposure[key] / totalValue).toFixed(4)) : 0;
  }

  return NextResponse.json({
    portfolio_id: portfolio.id,
    name: portfolio.name,
    base_currency: portfolio.baseCurrency,
    total_value: totalValue,
    total_pnl: totalValue - totalCost,
    total_pnl_percent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    allocation: positions.map((p) => ({
      symbol: p.symbol,
      weight: totalValue > 0 ? p.market_value / totalValue : 0,
      market_value: p.market_value,
    })),
    sector_exposure: sectorExposure,
    positions,
  });
}
