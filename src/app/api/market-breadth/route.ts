import { NextResponse } from "next/server";

const YAHOO_QUOTE = "https://query1.finance.yahoo.com/v7/finance/quote";

type RawQuote = {
  symbol?: string;
  regularMarketChangePercent?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketPrice?: number;
};

const SP500_SAMPLE = [
  "AAPL","MSFT","AMZN","NVDA","GOOGL","META","BRK-B","UNH","XOM","JNJ",
  "JPM","V","PG","MA","AVGO","HD","CVX","MRK","ABBV","LLY",
  "PEP","KO","COST","TMO","MCD","WMT","ACN","CSCO","ABT","CRM",
  "DHR","NEE","ADBE","AMD","TXN","PM","UPS","BMY","QCOM","RTX",
  "SCHW","LOW","HON","INTC","AMGN","CAT","BA","GS","IBM","AXP",
];

export async function GET() {
  try {
    const symbols = SP500_SAMPLE.join(",");
    const res = await fetch(
      `${YAHOO_QUOTE}?symbols=${encodeURIComponent(symbols)}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 120 } }
    );
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    const quotes: RawQuote[] = json?.quoteResponse?.result || [];

    let advancing = 0;
    let declining = 0;
    let unchanged = 0;
    let week52High = 0;
    let week52Low = 0;

    for (const q of quotes) {
      const pct = q.regularMarketChangePercent ?? 0;
      if (pct > 0.01) advancing++;
      else if (pct < -0.01) declining++;
      else unchanged++;

      const price = q.regularMarketPrice ?? 0;
      const hi = q.fiftyTwoWeekHigh ?? 0;
      const lo = q.fiftyTwoWeekLow ?? Infinity;
      if (price > 0 && hi > 0 && price >= hi * 0.98) week52High++;
      if (price > 0 && lo > 0 && lo < Infinity && price <= lo * 1.02) week52Low++;
    }

    const total = quotes.length;

    return NextResponse.json({
      advancing,
      declining,
      unchanged,
      total,
      week52High,
      week52Low,
    });
  } catch (e) {
    return NextResponse.json(
      { advancing: 0, declining: 0, unchanged: 0, total: 0, week52High: 0, week52Low: 0, error: String(e) },
      { status: 500 }
    );
  }
}
