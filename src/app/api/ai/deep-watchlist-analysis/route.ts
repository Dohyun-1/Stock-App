import { NextRequest, NextResponse } from "next/server";
import { analyzeWithBuffettLynch } from "@/lib/ai/buffettLynch";
import { quote, quoteSummary } from "@/lib/yahoo";

type HoldingInput = {
  symbol: string;
  company_name: string;
};

type SourceEvidence = {
  name: string;
  url: string;
  reliability: "high" | "medium";
  note: string;
};

const KR_DART_CORP_CODE_MAP: Record<string, string> = {
  "005930.KS": "00126380",
  "000660.KS": "00164779",
  "035420.KS": "00834079",
  "035720.KS": "01013533",
};

function isKoreanSymbol(symbol: string): boolean {
  return symbol.endsWith(".KS") || symbol.endsWith(".KQ");
}

function toUsTicker(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper.includes(".")) return upper.split(".")[0];
  return upper;
}

async function fetchOfficialSources(request: NextRequest, symbol: string): Promise<SourceEvidence[]> {
  const out: SourceEvidence[] = [];
  if (isKoreanSymbol(symbol)) {
    const corpCode = KR_DART_CORP_CODE_MAP[symbol.toUpperCase()];
    if (!corpCode) {
      out.push({
        name: "DART 공시",
        url: "https://opendart.fss.or.kr/",
        reliability: "medium",
        note: "corp_code 매핑이 없어 공시 자동 조회 범위가 제한됩니다.",
      });
      return out;
    }
    const res = await fetch(new URL(`/api/company/dart?corp_code=${corpCode}`, request.url), { cache: "no-store" });
    const json = await res.json();
    if (res.ok && Array.isArray(json?.list) && json.list.length > 0) {
      out.push({
        name: "DART 공시",
        url: "https://opendart.fss.or.kr/",
        reliability: "high",
        note: `최근 공시 ${Math.min(5, json.list.length)}건 확인`,
      });
    } else {
      out.push({
        name: "DART 공시",
        url: "https://opendart.fss.or.kr/",
        reliability: "medium",
        note: "공식 DART 데이터가 충분하지 않아 신뢰도 보정이 필요합니다.",
      });
    }
  } else {
    const ticker = toUsTicker(symbol);
    const res = await fetch(new URL(`/api/company/sec?ticker=${encodeURIComponent(ticker)}`, request.url), { cache: "no-store" });
    const json = await res.json();
    if (res.ok && Array.isArray(json?.filings) && json.filings.length > 0) {
      out.push({
        name: "SEC EDGAR",
        url: `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker)}`,
        reliability: "high",
        note: `최근 공시 ${Math.min(5, json.filings.length)}건 확인`,
      });
    } else {
      out.push({
        name: "SEC EDGAR",
        url: "https://www.sec.gov/edgar/searchedgar/companysearch",
        reliability: "medium",
        note: "SEC 공시 확보가 제한되어 보수적으로 해석해야 합니다.",
      });
    }
  }
  return out;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const holdings = Array.isArray(body?.holdings) ? body.holdings : [];
  const normalized: HoldingInput[] = holdings
    .map((h: { symbol?: string; company_name?: string }) => ({
      symbol: String(h.symbol || "").toUpperCase(),
      company_name: String(h.company_name || h.symbol || ""),
    }))
    .filter((h: HoldingInput) => h.symbol.length > 0);

  if (normalized.length === 0) {
    return NextResponse.json({ error: "holdings required" }, { status: 400 });
  }

  const results = await Promise.all(
    normalized.map(async (h) => {
      const [q, summary, sources] = await Promise.all([
        quote(h.symbol).catch(() => null),
        quoteSummary(h.symbol).catch(() => null),
        fetchOfficialSources(request, h.symbol).catch(() => [] as SourceEvidence[]),
      ]);
      const officialCount = sources.filter((s) => s.reliability === "high").length;
      const reliabilityScore = Math.max(35, Math.min(100, 45 + officialCount * 25 + (q ? 10 : 0) + (summary ? 10 : 0)));
      const analyzed = analyzeWithBuffettLynch(h.symbol, q, summary, reliabilityScore);
      return {
        symbol: h.symbol,
        company_name: h.company_name,
        decision: analyzed.decision,
        total_score: analyzed.totalScore,
        total_score_max: 100,
        buffett_score: analyzed.buffettScore,
        buffett_score_max: 50,
        lynch_score: analyzed.lynchScore,
        lynch_score_max: 50,
        reliability_score: reliabilityScore,
        reliability_score_max: 100,
        reasons: analyzed.reasons,
        summary: {
          price: q?.regularMarketPrice ?? null,
          change_percent: q?.regularMarketChangePercent ?? null,
          change_amount: q?.regularMarketChange ?? null,
          pe: summary?.pe ?? null,
          eps: summary?.eps ?? null,
          beta: summary?.beta ?? null,
          free_cashflow: summary?.freeCashflow ?? null,
          debt_to_equity: summary?.debtToEquity ?? null,
          operating_margins: summary?.operatingMargins ?? null,
          revenue_growth: summary?.revenueGrowth ?? null,
        },
        sources,
      };
    })
  );

  const buy = results.filter((r) => r.decision === "buy").length;
  const sell = results.filter((r) => r.decision === "sell").length;
  const hold = results.filter((r) => r.decision === "hold").length;
  const avgScore = Math.round(results.reduce((sum, x) => sum + x.total_score, 0) / results.length);
  const avgReliability = Math.round(results.reduce((sum, x) => sum + x.reliability_score, 0) / results.length);

  return NextResponse.json({
    framework: "Buffett + Lynch Deep Analysis",
    portfolio_overview: {
      score: avgScore,
      score_max: 100,
      reliability_score: avgReliability,
      reliability_score_max: 100,
      decision_breakdown: { buy, sell, hold },
      note:
        "Buffett(가치/해자/현금흐름) 50점 + Lynch(성장/PEG/실적추세) 50점 구조로 심층 평가했습니다.",
    },
    items: results,
    generated_at: new Date().toISOString(),
  });
}
