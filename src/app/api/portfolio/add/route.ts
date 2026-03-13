import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequestHeader, newId, readPortfolioDB, writePortfolioDB } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequestHeader(request.headers.get("x-user-id"));
  const body = await request.json().catch(() => ({}));
  const portfolioId = String(body?.portfolio_id || "").trim();
  const symbol = String(body?.symbol || "").trim().toUpperCase();
  const companyName = String(body?.company_name || symbol);
  const sector = String(body?.sector || "Unknown");
  const shares = Number(body?.shares);
  const averagePrice = Number(body?.average_price);

  if (!portfolioId || !symbol || !Number.isFinite(shares) || shares <= 0 || !Number.isFinite(averagePrice) || averagePrice <= 0) {
    return NextResponse.json({ error: "portfolio_id, symbol, shares, average_price are required" }, { status: 400 });
  }

  const db = readPortfolioDB();
  const portfolio = db.portfolios.find((p) => p.id === portfolioId && p.userId === userId);
  if (!portfolio) return NextResponse.json({ error: "portfolio not found" }, { status: 404 });

  const now = new Date().toISOString();
  const existing = db.holdings.find((h) => h.portfolioId === portfolioId && h.symbol === symbol);
  if (existing) {
    const totalShares = existing.shares + shares;
    const weighted = (existing.averagePrice * existing.shares + averagePrice * shares) / totalShares;
    existing.shares = totalShares;
    existing.averagePrice = weighted;
    existing.companyName = companyName || existing.companyName;
    existing.sector = sector || existing.sector;
    existing.updatedAt = now;
  } else {
    db.holdings.push({
      id: newId("h"),
      portfolioId,
      symbol,
      companyName,
      sector,
      shares,
      averagePrice,
      createdAt: now,
      updatedAt: now,
    });
  }

  db.transactions.push({
    id: newId("tx"),
    portfolioId,
    symbol,
    type: "buy",
    shares,
    price: averagePrice,
    amount: shares * averagePrice,
    createdAt: now,
  });
  portfolio.updatedAt = now;
  writePortfolioDB(db);

  return NextResponse.json({ ok: true });
}
