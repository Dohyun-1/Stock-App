import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequestHeader, newId, readWatchlistDB, writeWatchlistDB } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequestHeader(request.headers.get("x-user-id"));
  const body = await request.json().catch(() => ({}));
  const watchlistId = String(body?.watchlist_id || "").trim();
  const symbol = String(body?.symbol || "").trim().toUpperCase();
  if (!watchlistId || !symbol) {
    return NextResponse.json({ error: "watchlist_id and symbol required" }, { status: 400 });
  }

  const db = readWatchlistDB();
  const watchlist = db.watchlists.find((w) => w.id === watchlistId && w.userId === userId);
  if (!watchlist) return NextResponse.json({ error: "watchlist not found" }, { status: 404 });

  const existing = db.items.find((i) => i.watchlistId === watchlistId && i.symbol === symbol);
  if (!existing) {
    const now = new Date().toISOString();
    db.items.push({
      id: newId("wli"),
      watchlistId,
      symbol,
      createdAt: now,
      updatedAt: now,
    });
    watchlist.updatedAt = now;
    writeWatchlistDB(db);
  }

  return NextResponse.json({ ok: true });
}
