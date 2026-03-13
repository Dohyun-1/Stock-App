import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  const params = await context.params;
  const symbol = decodeURIComponent(params.symbol);
  const period = request.nextUrl.searchParams.get("period") || "1y";
  const interval = request.nextUrl.searchParams.get("interval") || "1d";

  const target = new URL("/api/historical", request.url);
  target.searchParams.set("symbol", symbol);
  target.searchParams.set("period", period);
  target.searchParams.set("interval", interval);

  const res = await fetch(target.toString(), { cache: "no-store" });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
