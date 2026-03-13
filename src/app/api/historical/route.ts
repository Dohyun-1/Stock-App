import { NextRequest, NextResponse } from "next/server";
import { chart } from "@/lib/yahoo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const period = request.nextUrl.searchParams.get("period") || "1y";
  const interval = request.nextUrl.searchParams.get("interval") || "1d";
  const startParam = request.nextUrl.searchParams.get("start");
  const endParam = request.nextUrl.searchParams.get("end");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    let start: string;
    let end: string;
    let int: string | undefined;

    if (startParam && endParam) {
      start = startParam.includes("T") ? startParam : `${startParam}T00:00:00.000Z`;
      const endDate = new Date(endParam.includes("T") ? endParam : `${endParam}T23:59:59.999Z`);
      end = endDate.toISOString();
      const days = (endDate.getTime() - new Date(start).getTime()) / 86400000;
      int = days <= 5 ? "1h" : days <= 90 ? "1d" : days <= 365 ? "1d" : "1wk";
    } else {
      const range = getPeriodRange(period);
      start = range.start;
      end = range.end;
      int = range.int;
    }

    const { data, previousClose } = await chart(symbol, start, end, int || interval);
    return NextResponse.json({ data, previousClose }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function getPeriodRange(period: string): { start: string; end: string; int?: string } {
  const end = new Date();
  const start = new Date();
  let int: string | undefined;
  switch (period) {
    case "today":
    case "0d": start.setHours(0, 0, 0, 0); int = "5m"; break; // 당일
    case "1d": start.setDate(start.getDate() - 1); int = "1h"; break;
    case "5d": start.setDate(start.getDate() - 5); int = "1h"; break;
    case "1m": start.setMonth(start.getMonth() - 1); int = "1d"; break;
    case "3m": start.setMonth(start.getMonth() - 3); int = "1d"; break;
    case "6m": start.setMonth(start.getMonth() - 6); int = "1d"; break;
    case "ytd": start.setMonth(0, 1); start.setHours(0, 0, 0, 0); int = "1d"; break;
    case "1y": start.setFullYear(start.getFullYear() - 1); int = "1d"; break;
    case "2y": start.setFullYear(start.getFullYear() - 2); int = "1d"; break;
    case "5y": start.setFullYear(start.getFullYear() - 5); int = "1wk"; break;
    case "10y": start.setFullYear(start.getFullYear() - 10); int = "1wk"; break;
    case "20y": start.setFullYear(start.getFullYear() - 20); int = "1mo"; break;
    case "50y":
    case "max": start.setFullYear(start.getFullYear() - 50); int = "1mo"; break;
    default: start.setFullYear(start.getFullYear() - 1); int = "1d";
  }
  const endStr = end.toISOString();
  const startStr = start.toISOString();
  return { start: startStr, end: endStr, int };
}
