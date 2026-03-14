import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequestHeader, newId, readPortfolioDB, writePortfolioDB } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequestHeader(request.headers.get("x-user-id"));
    const db = readPortfolioDB();
    const portfolios = db.portfolios.filter((p) => p.userId === userId);
    return NextResponse.json({ portfolios });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to read portfolios", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequestHeader(request.headers.get("x-user-id"));
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || "").trim() || "내 포트폴리오";
    const baseCurrency = String(body?.base_currency || "KRW").trim().toUpperCase();

    const now = new Date().toISOString();
    const db = readPortfolioDB();
    const portfolio = {
      id: newId("pf"),
      userId,
      name,
      baseCurrency,
      createdAt: now,
      updatedAt: now,
    };
    db.portfolios.push(portfolio);
    writePortfolioDB(db);
    return NextResponse.json({ portfolio }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create portfolio", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
