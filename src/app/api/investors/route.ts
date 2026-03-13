import { NextRequest, NextResponse } from "next/server";

// SEC 13F filings - 기관투자자 보유 주식 (실제 API 호출)
const SEC_BASE = "https://data.sec.gov";

const FAMOUS_INVESTORS: { name: string; cik: string }[] = [
  { name: "Buffett (Berkshire)", cik: "0001067983" },
  { name: "Cathie Wood (ARK)", cik: "0001649339" },
  { name: "Michael Burry (Scion)", cik: "0001379785" },
  { name: "Bridgewater", cik: "0001350694" },
  { name: "Renaissance", cik: "0001037389" },
];

export async function GET(request: NextRequest) {
  const investor = request.nextUrl.searchParams.get("investor");
  const cikParam = request.nextUrl.searchParams.get("cik");

  let cik: string | null = cikParam;
  if (!cik && investor) {
    const match = FAMOUS_INVESTORS.find((i) => i.name.toLowerCase().includes(investor.toLowerCase()));
    cik = match?.cik ?? null;
  }
  if (!cik) cik = FAMOUS_INVESTORS[0].cik;

  try {
    const cikPadded = String(cik).padStart(10, "0");
    const res = await fetch(`${SEC_BASE}/submissions/CIK${cikPadded}.json`, {
      headers: { "User-Agent": "StockPro Hackathon/1.0" },
    });
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = await res.json();

    const recent = (data.recent as Record<string, string[]>) || {};
    const forms = recent.form || [];
    const dates = recent.filing_date || [];
    const idx = forms.findIndex((f: string) => f === "13F-HR" || f === "13F-HR/A");
    const filings = forms
      .map((f: string, i: number) => ({ form: f, date: dates[i] }))
      .filter((f: { form: string }) => f.form?.startsWith("13F"));

    return NextResponse.json({
      name: data.name || "Unknown",
      cik: data.cik,
      filings: filings.slice(0, 10),
      recent13F: idx >= 0 ? { form: forms[idx], date: dates[idx] } : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ investors: FAMOUS_INVESTORS });
}
