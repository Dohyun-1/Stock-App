import { NextRequest, NextResponse } from "next/server";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

type ReportItem = {
  title: string;
  source: string;
  date: string;
  url: string;
  origin: "naver" | "sec" | "dart";
};

async function fetchNaverReports(stockCode: string): Promise<ReportItem[]> {
  try {
    const code = stockCode.replace(/\.(KS|KQ)$/i, "");
    const url = `https://finance.naver.com/research/company_list.naver?searchType=itemCode&itemCode=${code}&page=1`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
    if (!res.ok) return [];
    const html = await res.text();

    const rows: ReportItem[] = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;
    while ((trMatch = trRe.exec(html)) !== null) {
      const tr = trMatch[1];
      const tds = Array.from(tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((m) => m[1].trim());
      if (tds.length < 5) continue;

      const titleMatch = tds[1]?.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!titleMatch) continue;

      const title = titleMatch[2].replace(/<[^>]+>/g, "").trim();
      const href = titleMatch[1].replace(/&amp;/g, "&");
      const source = tds[2]?.replace(/<[^>]+>/g, "").trim() || "";
      const date = tds[4]?.replace(/<[^>]+>/g, "").trim() || "";

      if (!title || !date) continue;

      rows.push({
        title,
        source: source || "증권사 리포트",
        date,
        url: href.startsWith("http") ? href : `https://finance.naver.com/research/${href}`,
        origin: "naver",
      });
    }
    return rows.slice(0, 10);
  } catch {
    return [];
  }
}

const SEC_UA = "StockAnalysis admin@stockapp.dev";

const FORM_LABELS: Record<string, string> = {
  "10-K": "연간 보고서 (10-K)",
  "10-Q": "분기 보고서 (10-Q)",
  "8-K": "수시 공시 (8-K)",
  "20-F": "외국기업 연간보고서 (20-F)",
  "6-K": "외국기업 수시보고서 (6-K)",
};

let tickerCache: Record<string, number> | null = null;
let tickerCacheExpiry = 0;

async function lookupCik(ticker: string): Promise<number | null> {
  const now = Date.now();
  if (!tickerCache || now > tickerCacheExpiry) {
    try {
      const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
        headers: { "User-Agent": SEC_UA },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const map: Record<string, number> = {};
      for (const entry of Object.values(data as Record<string, { ticker: string; cik_str: number }>)) {
        map[String(entry.ticker).toUpperCase()] = entry.cik_str;
      }
      tickerCache = map;
      tickerCacheExpiry = now + 60 * 60 * 1000;
    } catch {
      return null;
    }
  }
  return tickerCache?.[ticker.toUpperCase()] ?? null;
}

async function fetchSecFilings(ticker: string): Promise<ReportItem[]> {
  try {
    const cikNum = await lookupCik(ticker);
    if (!cikNum) return [];

    const cikPad = String(cikNum).padStart(10, "0");
    const res = await fetch(`https://data.sec.gov/submissions/CIK${cikPad}.json`, {
      headers: { "User-Agent": SEC_UA },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const sub = await res.json();

    const recent = (sub.filings?.recent as Record<string, string[]>) || {};
    const forms = recent.form || [];
    const dates = recent.filingDate || [];
    const accNums = recent.accessionNumber || [];
    const primaryDocs = recent.primaryDocument || [];

    const items: ReportItem[] = [];
    const important = new Set(["10-K", "10-Q", "8-K", "20-F", "6-K"]);
    for (let i = 0; i < Math.min(forms.length, 80); i++) {
      if (!important.has(forms[i])) continue;
      const accClean = (accNums[i] || "").replace(/-/g, "");
      const label = FORM_LABELS[forms[i]] ?? forms[i];
      items.push({
        title: label,
        source: "SEC EDGAR",
        date: dates[i] || "",
        url: `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accClean}/${primaryDocs[i] || ""}`,
        origin: "sec",
      });
      if (items.length >= 10) break;
    }
    return items;
  } catch {
    return [];
  }
}

async function fetchDartFilings(corpCode: string): Promise<ReportItem[]> {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey || !corpCode) return [];
  try {
    const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bgn_de=20240101&page_no=1&page_count=10`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    if (json.status !== "000") return [];
    return (json.list || []).slice(0, 10).map((f: { report_nm: string; rcept_dt: string; rcept_no: string }) => ({
      title: f.report_nm || "",
      source: "DART 공시",
      date: f.rcept_dt ? `${f.rcept_dt.slice(0, 4)}-${f.rcept_dt.slice(4, 6)}-${f.rcept_dt.slice(6, 8)}` : "",
      url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${f.rcept_no}`,
      origin: "dart" as const,
    }));
  } catch {
    return [];
  }
}

const KR_DART_CODES: Record<string, string> = {
  "005930": "00126380",
  "000660": "00164779",
  "035420": "00258801",
  "035720": "00352170",
  "051910": "00356361",
  "005380": "00164742",
  "006400": "00164780",
  "003670": "00126186",
  "105560": "00783485",
  "055550": "00382199",
};

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") || "";
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const isKR = /\.(KS|KQ)$/i.test(symbol);
  const code = symbol.replace(/\.(KS|KQ)$/i, "");
  const ticker = symbol.replace(/\..*$/, "");

  const promises: Promise<ReportItem[]>[] = [];

  if (isKR) {
    promises.push(fetchNaverReports(code));
    const dartCode = KR_DART_CODES[code];
    if (dartCode) promises.push(fetchDartFilings(dartCode));
  } else {
    promises.push(fetchSecFilings(ticker));
  }

  const results = await Promise.allSettled(promises);
  const all = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<ReportItem[]>).value);

  all.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return NextResponse.json({ reports: all.slice(0, 15) });
}
