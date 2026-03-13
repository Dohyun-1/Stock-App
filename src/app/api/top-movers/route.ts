import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/yahoo";

const YAHOO_SCREENER = "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

type RawQuote = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketChange?: number;
  regularMarketVolume?: number;
};

type Mover = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
};

async function fetchScreener(scrId: string, count = 10): Promise<Mover[]> {
  try {
    const url = `${YAHOO_SCREENER}?scrIds=${scrId}&count=${count}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const quotes: RawQuote[] = json?.finance?.result?.[0]?.quotes || [];
    return quotes.map((q) => ({
      symbol: q.symbol || "",
      name: q.shortName || q.longName || q.symbol || "",
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      volume: q.regularMarketVolume ?? 0,
    }));
  } catch {
    return [];
  }
}

const REGION_SYMBOLS: Record<string, string[]> = {
  KR: [
    "005930.KS","000660.KS","035420.KS","035720.KS","051910.KS","006400.KS","003670.KS",
    "068270.KS","028260.KS","105560.KS","055550.KS","034730.KS","012330.KS","066570.KS",
    "032830.KS","096770.KS","003490.KS","017670.KS","316140.KS","033780.KS",
    "373220.KS","086520.KS","011200.KS","010130.KS","034020.KS","030200.KS",
    "247540.KS","259960.KS","003550.KS","000270.KS",
  ],
  JP: [
    "7203.T","6758.T","9984.T","8306.T","6861.T","6501.T","7267.T","9433.T","4502.T",
    "6902.T","7751.T","6098.T","4063.T","8035.T","6594.T","9432.T","8411.T","2802.T",
    "3382.T","7974.T","6367.T","4568.T","8058.T","6954.T","4503.T",
  ],
  EU: [
    "SAP.DE","SIE.DE","ALV.DE","BAS.DE","DTE.DE","BMW.DE","VOW3.DE","MBG.DE",
    "ASML.AS","MC.PA","OR.PA","SAN.PA","TTE.PA","BNP.PA","AI.PA",
    "SHEL.L","AZN.L","HSBA.L","BP.L","GSK.L","RIO.L","ULVR.L","DGE.L",
    "NESN.SW","NOVN.SW","ROG.SW",
  ],
};

async function fetchRegionMovers(region: string): Promise<{ gainers: Mover[]; losers: Mover[]; active: Mover[] }> {
  const symbols = REGION_SYMBOLS[region];
  if (!symbols || symbols.length === 0) return { gainers: [], losers: [], active: [] };

  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += 30) chunks.push(symbols.slice(i, i + 30));

  const allMovers: Mover[] = [];
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${chunk.join(",")}&fields=symbol,shortName,longName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume`;
        const res = await fetchWithTimeout(url, { headers: { "User-Agent": UA } }, 10000);
        if (!res.ok) return;
        const json = await res.json();
        const quotes: RawQuote[] = json?.quoteResponse?.result ?? [];
        for (const q of quotes) {
          if (!q.symbol || q.regularMarketPrice == null) continue;
          allMovers.push({
            symbol: q.symbol,
            name: q.shortName || q.longName || q.symbol,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            volume: q.regularMarketVolume ?? 0,
          });
        }
      } catch { /* skip */ }
    })
  );

  const sorted = [...allMovers].filter((m) => m.price > 0);
  const gainers = [...sorted].sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
  const losers = [...sorted].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);
  const active = [...sorted].sort((a, b) => b.volume - a.volume).slice(0, 10);

  return { gainers, losers, active };
}

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region")?.toUpperCase() || "US";

  if (region === "US") {
    const [gainers, losers, active] = await Promise.all([
      fetchScreener("day_gainers", 10),
      fetchScreener("day_losers", 10),
      fetchScreener("most_actives", 10),
    ]);
    return NextResponse.json({ gainers, losers, active });
  }

  const data = await fetchRegionMovers(region);
  return NextResponse.json(data);
}
