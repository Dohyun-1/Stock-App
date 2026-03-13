import { NextRequest, NextResponse } from "next/server";
import { quoteMultiple } from "@/lib/yahoo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols");
  if (!symbols) return NextResponse.json({ error: "symbols required" }, { status: 400 });

  const list = symbols.split(",").map((s) => s.trim()).filter(Boolean);
  try {
    const quotes = await quoteMultiple(list);
    return NextResponse.json(quotes, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
