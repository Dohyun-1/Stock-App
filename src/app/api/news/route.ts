import { NextRequest, NextResponse } from "next/server";

const YAHOO_SEARCH = "https://query1.finance.yahoo.com/v1/finance/search";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const url = `${YAHOO_SEARCH}?q=${encodeURIComponent(symbol)}&quotesCount=1&newsCount=10`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`News failed: ${res.status}`);
    const json = await res.json();

    const news = (json.news || []).map((n: {
      title?: string; link?: string; publisher?: string; providerPublishTime?: number;
      thumbnail?: { resolutions?: { url?: string; width?: number; height?: number }[] };
    }) => {
      const resolutions = n.thumbnail?.resolutions || [];
      const thumb = resolutions.find((r) => (r.width ?? 0) >= 300) || resolutions[resolutions.length - 1];
      return {
        title: n.title || "",
        link: n.link || "",
        publisher: n.publisher || "",
        date: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : "",
        image: thumb?.url || "",
      };
    });

    return NextResponse.json(news);
  } catch (e) {
    return NextResponse.json({ error: String(e), news: [] }, { status: 500 });
  }
}
