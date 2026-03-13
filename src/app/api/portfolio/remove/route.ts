import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequestHeader, newId, readPortfolioDB, writePortfolioDB } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequestHeader(request.headers.get("x-user-id"));
  const body = await request.json().catch(() => ({}));
  const portfolioId = String(body?.portfolio_id || "").trim();
  const symbol = String(body?.symbol || "").trim().toUpperCase();
  const shares = Number(body?.shares);
  const price = Number(body?.price);

  if (!portfolioId || !symbol || !Number.isFinite(shares) || shares <= 0 || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "portfolio_id, symbol, shares, price are required" }, { status: 400 });
  }

  const db = readPortfolioDB();
  const portfolio = db.portfolios.find((p) => p.id === portfolioId && p.userId === userId);
  if (!portfolio) return NextResponse.json({ error: "portfolio not found" }, { status: 404 });

  const holding = db.holdings.find((h) => h.portfolioId === portfolioId && h.symbol === symbol);
  if (!holding) return NextResponse.json({ error: "holding not found" }, { status: 404 });
  if (holding.shares < shares) return NextResponse.json({ error: "insufficient shares" }, { status: 400 });

  const now = new Date().toISOString();
  holding.shares -= shares;
  holding.updatedAt = now;
  if (holding.shares <= 0) {
    db.holdings = db.holdings.filter((h) => h.id !== holding.id);
  }

  db.transactions.push({
    id: newId("tx"),
    portfolioId,
    symbol,
    type: "sell",
    shares,
    price,
    amount: shares * price,
    createdAt: now,
  });
  portfolio.updatedAt = now;
  writePortfolioDB(db);

  return NextResponse.json({ ok: true });
}
