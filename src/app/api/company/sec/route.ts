import { NextRequest, NextResponse } from "next/server";

// SEC EDGAR API - 기업 공시 검색
const SEC_BASE = "https://data.sec.gov";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  try {
    const searchRes = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": "StockAnalysis admin@stockapp.dev" },
      cache: "no-store",
    });
    if (!searchRes.ok) {
      return NextResponse.json({ error: `SEC ticker lookup failed: ${searchRes.status}` }, { status: 502 });
    }
    const data = await searchRes.json();
    const match = Object.values(data as Record<string, { ticker: string; cik_str: number }>).find(
      (c) => String(c.ticker).toUpperCase() === String(ticker).toUpperCase()
    );
    if (!match) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    const cik = String((match as { cik_str: number }).cik_str).padStart(10, "0");
    const subRes = await fetch(`${SEC_BASE}/submissions/CIK${cik}.json`, {
      headers: { "User-Agent": "StockAnalysis admin@stockapp.dev" },
      cache: "no-store",
    });
    if (!subRes.ok) {
      return NextResponse.json({ error: `SEC submission lookup failed: ${subRes.status}` }, { status: 502 });
    }
    const sub = await subRes.json();
    return NextResponse.json(formatCompanyData(sub, ticker));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function formatCompanyData(data: Record<string, unknown>, ticker: string) {
  // SEC submissions payload stores recent filings under filings.recent.
  const filingsObj = (data.filings as Record<string, unknown> | undefined) || {};
  const recent = (filingsObj.recent as Record<string, string[]>) || {};
  const forms = recent.form || [];
  const descs = recent.primary_document || [];
  const dates = recent.filing_date || [];
  const filings = forms.slice(0, 20).map((f, i) => ({ form: f, date: dates[i] || "", desc: descs[i] || "" }));

  return {
    name: (data.name as string) || ticker,
    cik: data.cik,
    ticker,
    filings,
    sic: data.sic,
    sicDescription: data.sicDescription,
  };
}
