import { NextRequest, NextResponse } from "next/server";
import { searchStocks, searchNaverStocks } from "@/lib/yahoo";
import { searchSymbolAliases } from "@/lib/symbolAliases";
import { expandSearchQueries, searchMarketUniverse } from "@/lib/marketUniverse";

function matchRegion(symbol: string, exchange: string, region: string): boolean {
  const sym = symbol.toUpperCase();
  const ex = (exchange || "").toUpperCase();
  if (region === "KR") return sym.endsWith(".KS") || sym.endsWith(".KQ") || ex.includes("KORE") || ex.includes("KOSPI") || ex.includes("KOSDAQ");
  if (region === "US") return !sym.includes(".") || sym.endsWith(".NS") || sym.endsWith(".O") || ex.includes("NASDAQ") || ex.includes("NYSE") || ex.includes("AMEX");
  if (region === "JP") return sym.endsWith(".T") || ex.includes("TOKYO") || ex.includes("JPX");
  if (region === "EU") return /\.(DE|PA|AS|L|SW|MI|MC|HA)$/i.test(sym) || ex.includes("XETRA") || ex.includes("LON") || ex.includes("PAR") || ex.includes("EUR");
  return true;
}

const HAS_KOREAN = /[\uAC00-\uD7AF]/;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const region = request.nextUrl.searchParams.get("region") || "all";
  if (!q || q.trim().length < 1)
    return NextResponse.json({ error: "query too short", results: [] }, { status: 200 });

  try {
    const query = q.trim();
    const expandedQueries = expandSearchQueries(query).slice(0, 5);
    const includeRemote = query.length >= 2;
    const useNaver = HAS_KOREAN.test(query) && query.length >= 2;

    const [remoteBatches, aliasResults, universeResults, naverResults] = await Promise.all([
      includeRemote
        ? Promise.all(expandedQueries.map((one) => searchStocks(one, 30).catch(() => [])))
        : Promise.resolve([]),
      Promise.resolve(
        Array.from(new Map(
          expandedQueries
            .flatMap((one) => searchSymbolAliases(one))
            .map((x) => [x.symbol, x])
        ).values())
      ),
      searchMarketUniverse(query).catch(() => []),
      useNaver ? searchNaverStocks(query).catch(() => []) : Promise.resolve([]),
    ]);
    const remoteResults = Array.isArray(remoteBatches) ? remoteBatches.flat() : [];
    const mergedMap = new Map<string, { symbol: string; name: string; exchange: string }>();
    for (const item of [...naverResults, ...aliasResults, ...universeResults, ...remoteResults]) {
      if (!item.symbol) continue;
      if (!mergedMap.has(item.symbol)) {
        mergedMap.set(item.symbol, {
          symbol: item.symbol,
          name: item.name || item.symbol,
          exchange: item.exchange || "",
        });
      }
    }
    const merged = Array.from(mergedMap.values());
    const filtered = region === "all" ? merged : merged.filter((r) => matchRegion(r.symbol, r.exchange, region));
    return NextResponse.json({ results: filtered.slice(0, 150) });
  } catch (e) {
    return NextResponse.json({ error: String(e), results: [] }, { status: 500 });
  }
}
