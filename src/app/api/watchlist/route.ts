import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequestHeader, newId, readWatchlistDB, writeWatchlistDB } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequestHeader(request.headers.get("x-user-id"));
  const db = readWatchlistDB();
  const watchlists = db.watchlists
    .filter((w) => w.userId === userId)
    .map((w) => ({
      ...w,
      items: db.items.filter((i) => i.watchlistId === w.id).map((i) => i.symbol),
    }));
  return NextResponse.json({ watchlists });
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequestHeader(request.headers.get("x-user-id"));
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || "").trim() || "관심종목";
  const now = new Date().toISOString();

  const db = readWatchlistDB();
  const watchlist = {
    id: newId("wl"),
    userId,
    name,
    createdAt: now,
    updatedAt: now,
  };
  db.watchlists.push(watchlist);
  writeWatchlistDB(db);
  return NextResponse.json({ watchlist }, { status: 201 });
}
