import { NextRequest, NextResponse } from "next/server";
import { quote } from "@/lib/yahoo";

export async function GET(_request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  const params = await context.params;
  const symbol = decodeURIComponent(params.symbol);
  try {
    const q = await quote(symbol);
    return NextResponse.json({
      symbol,
      price: q.regularMarketPrice,
      previous_close: q.regularMarketPreviousClose,
      change_percent: q.regularMarketChangePercent,
      change_amount: q.regularMarketChange,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
