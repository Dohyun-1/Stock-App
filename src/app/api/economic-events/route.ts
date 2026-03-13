import { NextRequest, NextResponse } from "next/server";

type CalendarEvent = {
  id: string;
  date: string;
  country: string;
  title: string;
  importance: string;
  source: string;
  sourceUrl: string;
};

function normalizeImportance(value: string): "low" | "medium" | "high" {
  const v = value.toLowerCase();
  if (v === "high" || v === "medium" || v === "low") return v;
  return "medium";
}

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");
  const base = new URL("/api/calendar", request.url);
  if (country) base.searchParams.set("country", country);

  const response = await fetch(base.toString(), { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json({ error: "failed to fetch calendar events" }, { status: 500 });
  }

  const items = (await response.json()) as CalendarEvent[];
  const events = items.map((e) => ({
    event_name: e.title,
    date: e.date,
    importance: normalizeImportance(e.importance),
    expected_value: "N/A",
    previous_value: "N/A",
  }));
  return NextResponse.json({ events });
}
