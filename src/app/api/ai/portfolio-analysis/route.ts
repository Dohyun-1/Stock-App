import { NextRequest, NextResponse } from "next/server";
import { analyzePortfolio } from "@/lib/ai/portfolioAnalysis";
import { PortfolioInput } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const holdings = Array.isArray(body?.holdings) ? body.holdings : [];
  const input: PortfolioInput = {
    holdings: holdings
      .map((h: { symbol?: string; sector?: string; weight?: number; value?: number }) => ({
        symbol: String(h.symbol || "").toUpperCase(),
        sector: String(h.sector || "Unknown"),
        weight: Number(h.weight || 0),
        value: Number(h.value || 0),
      }))
      .filter((h: { symbol: string; value: number }) => h.symbol && h.value > 0),
  };
  if (input.holdings.length === 0) {
    return NextResponse.json({ error: "holdings required" }, { status: 400 });
  }
  return NextResponse.json(analyzePortfolio(input));
}
