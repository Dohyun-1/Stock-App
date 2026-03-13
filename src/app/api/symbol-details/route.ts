import { NextRequest, NextResponse } from "next/server";
import { chartWithOhlc, quoteSummary } from "@/lib/yahoo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const end = new Date();
    const start1d = new Date();
    start1d.setDate(start1d.getDate() - 5);
    const start1y = new Date();
    start1y.setFullYear(start1y.getFullYear() - 1);

    const [dailyResult, yearlyResult, summaryResult] = await Promise.allSettled([
      chartWithOhlc(symbol, start1d.toISOString(), end.toISOString(), "1d"),
      chartWithOhlc(symbol, start1y.toISOString(), end.toISOString(), "1d"),
      quoteSummary(symbol),
    ]);

    const dailyData = dailyResult.status === "fulfilled" ? dailyResult.value : [];
    const yearlyData = yearlyResult.status === "fulfilled" ? yearlyResult.value : [];
    const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;

    const latest = dailyData[dailyData.length - 1];
    const prev = dailyData[dailyData.length - 2];

    const highs = yearlyData.map((d) => d.high).filter((v): v is number => v != null && v > 0);
    const lows = yearlyData.map((d) => d.low).filter((v): v is number => v != null && v > 0);
    const vols = yearlyData.map((d) => d.volume).filter((v): v is number => v != null && v > 0);

    const fiftyTwoWeekHigh = highs.length > 0 ? Math.max(...highs) : summary?.fiftyTwoWeekHigh;
    const fiftyTwoWeekLow = lows.length > 0 ? Math.min(...lows) : summary?.fiftyTwoWeekLow;
    const avgVolume = vols.length > 0 ? Math.round(vols.reduce((a, b) => a + b, 0) / vols.length) : summary?.averageVolume;

    return NextResponse.json({
      open: latest?.open,
      high: latest?.high,
      low: latest?.low,
      close: latest?.close,
      volume: latest?.volume,
      previousClose: prev?.close,
      fiftyTwoWeekHigh: fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: fiftyTwoWeekLow ?? null,
      averageVolume: avgVolume ?? null,
      marketCap: summary?.marketCap ?? null,
      pe: summary?.pe ?? null,
      eps: summary?.eps ?? null,
      yield: summary?.yield ?? null,
      beta: summary?.beta ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
