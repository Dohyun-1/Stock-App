import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const region = request.nextUrl.searchParams.get("region") || "all";
  const target = new URL("/api/search", request.url);
  target.searchParams.set("q", q);
  target.searchParams.set("region", region);
  const res = await fetch(target.toString(), { cache: "no-store" });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
