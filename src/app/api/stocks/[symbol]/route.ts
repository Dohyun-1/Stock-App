import { NextRequest, NextResponse } from "next/server";
import { quote, quoteSummary } from "@/lib/yahoo";

export async function GET(_request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  const params = await context.params;
  const symbol = decodeURIComponent(params.symbol);
  try {
    const [q, summary] = await Promise.all([quote(symbol), quoteSummary(symbol)]);
    return NextResponse.json({
      symbol,
      latest_price: q.regularMarketPrice,
      change_percent: q.regularMarketChangePercent,
      change_amount: q.regularMarketChange,
      details: summary,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
