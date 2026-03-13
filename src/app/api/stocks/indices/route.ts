import { NextResponse } from "next/server";
import { quoteMultiple } from "@/lib/yahoo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INDEX_SYMBOLS = ["^GSPC", "^IXIC", "^DJI", "^RUT", "^KS11", "^KQ11", "KRW=X"];

export async function GET() {
  try {
    const quotes = await quoteMultiple(INDEX_SYMBOLS);
    return NextResponse.json({ indices: quotes });
  } catch (e) {
    return NextResponse.json({ error: String(e), indices: [] }, { status: 500 });
  }
}
