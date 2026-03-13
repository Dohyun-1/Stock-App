import { NextRequest, NextResponse } from "next/server";

// DART 공시 API - 한국 기업 (API 키 필요: dart.fss.or.kr에서 발급)
const DART_BASE = "https://opendart.fss.or.kr/api";

export async function GET(request: NextRequest) {
  const crp = request.nextUrl.searchParams.get("corp_code");
  const apiKey = process.env.DART_API_KEY;

  if (!crp) return NextResponse.json({ error: "corp_code required" }, { status: 400 });
  if (!apiKey) {
    return NextResponse.json(
      { error: "DART_API_KEY is not configured. Official DART source is unavailable." },
      { status: 503 }
    );
  }

  try {
    const url = `${DART_BASE}/list.json?crtfc_key=${apiKey}&corp_code=${crp}&bgn_de=20230101&page_no=1&page_count=20`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `DART request failed: ${res.status}` }, { status: 502 });
    }
    const json = await res.json();

    if (json.status === "000") {
      return NextResponse.json({ list: json.list || [], total: json.total_count });
    }
    return NextResponse.json(
      { error: `DART returned error status: ${json.status}`, message: json.message || "" },
      { status: 502 }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
