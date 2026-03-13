import { NextRequest, NextResponse } from "next/server";
import { getInvestorById } from "@/lib/ai/investorProfiles";
import { evaluateByInvestor, HoldingInput, SourceEvidence } from "@/lib/ai/investorEvaluation";
import { quote, quoteSummary } from "@/lib/yahoo";

const KR_DART_CORP_CODE_MAP: Record<string, string> = {
  "005930.KS": "00126380",
  "000660.KS": "00164779",
};

function isKoreanSymbol(symbol: string): boolean {
  return symbol.endsWith(".KS") || symbol.endsWith(".KQ");
}

function toUsTicker(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper.includes(".")) {
    const [base] = upper.split(".");
    return base;
  }
  return upper;
}

async function fetchOfficialSources(request: NextRequest, symbol: string): Promise<SourceEvidence[]> {
  const sources: SourceEvidence[] = [];
  if (isKoreanSymbol(symbol)) {
    const corpCode = KR_DART_CORP_CODE_MAP[symbol.toUpperCase()];
    if (corpCode) {
      const url = new URL(`/api/company/dart?corp_code=${corpCode}`, request.url);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      if (Array.isArray(json?.list) && json.list.length > 0 && !json?.note) {
        sources.push({
          name: "DART 공시",
          url: "https://opendart.fss.or.kr/",
          reliability: "high",
          note: `최근 공시 ${Math.min(5, json.list.length)}건 확인`,
        });
      } else {
        sources.push({
          name: "DART 공시",
          url: "https://opendart.fss.or.kr/",
          reliability: "medium",
          note: "공식 DART 데이터 연동이 제한되어 샘플 또는 부분 데이터입니다.",
        });
      }
    } else {
      sources.push({
        name: "DART 공시",
        url: "https://opendart.fss.or.kr/",
        reliability: "medium",
        note: "해당 종목의 corp_code 매핑이 없어 공식 공시 자동 수집이 제한됩니다.",
      });
    }
  } else {
    const ticker = toUsTicker(symbol);
    const url = new URL(`/api/company/sec?ticker=${encodeURIComponent(ticker)}`, request.url);
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();
    if (res.ok && Array.isArray(json?.filings) && json.filings.length > 0) {
      sources.push({
        name: "SEC EDGAR",
        url: `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker)}`,
        reliability: "high",
        note: `최근 공시 ${Math.min(5, json.filings.length)}건 확인`,
      });
    } else {
      sources.push({
        name: "SEC EDGAR",
        url: "https://www.sec.gov/edgar/searchedgar/companysearch",
        reliability: "medium",
        note: "공식 SEC 공시 데이터를 충분히 확보하지 못했습니다.",
      });
    }
  }
  return sources;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const investorId = String(body?.investor_id || "warren_buffett");
  const holdings = Array.isArray(body?.holdings) ? body.holdings : [];
  const investor = getInvestorById(investorId);
  if (!investor) return NextResponse.json({ error: "investor not found" }, { status: 404 });

  const normalized: HoldingInput[] = holdings
    .map((h: { symbol?: string; company_name?: string; shares?: number; average_price?: number }) => ({
      symbol: String(h.symbol || "").toUpperCase(),
      company_name: String(h.company_name || h.symbol || ""),
      shares: Number(h.shares || 0),
      average_price: Number(h.average_price || 0),
    }))
    .filter((h: HoldingInput) => h.symbol.length > 0 && h.shares > 0);

  if (normalized.length === 0) {
    return NextResponse.json({ error: "holdings required" }, { status: 400 });
  }

  const evaluations = await Promise.all(
    normalized.map(async (h) => {
      const totalValue = normalized.reduce((sum, x) => sum + x.shares * x.average_price, 0) || 1;
      const weights = normalized.reduce<Record<string, number>>((acc, x) => {
        acc[x.symbol.toUpperCase()] = (x.shares * x.average_price) / totalValue;
        return acc;
      }, {});
      const [q, summary, sources] = await Promise.all([
        quote(h.symbol).catch(() => null),
        quoteSummary(h.symbol).catch(() => null),
        fetchOfficialSources(request, h.symbol).catch(() => [] as SourceEvidence[]),
      ]);
      return evaluateByInvestor(investor, h, q, summary, sources, {
        total_value: totalValue,
        weights,
      });
    })
  );

  const confidenceAvg = evaluations.reduce((sum, e) => sum + e.confidence, 0) / Math.max(1, evaluations.length);
  const reliabilityAvg = evaluations.reduce((sum, e) => sum + e.reliability_score, 0) / Math.max(1, evaluations.length);
  const buyCount = evaluations.filter((e) => e.decision === "buy").length;
  const sellCount = evaluations.filter((e) => e.decision === "sell").length;
  const holdCount = evaluations.filter((e) => e.decision === "hold").length;
  const foreignCount = evaluations.filter((e) => !e.symbol.endsWith(".KS") && !e.symbol.endsWith(".KQ")).length;
  const domesticCount = evaluations.length - foreignCount;
  const taxPlacementHints: string[] = [];
  if (foreignCount > 0) {
    taxPlacementHints.push("해외 주식/ETF는 연 250만 원 공제 후 22% 과세가 적용되므로, 손익통산과 계좌별 과세 구조를 함께 고려하세요.");
  }
  if (domesticCount > 0) {
    taxPlacementHints.push("국내 주식 매매차익은 일반적으로 비과세(대주주 요건 제외)이나 배당·ETF 과세 체계는 별도로 확인해야 합니다.");
  }
  taxPlacementHints.push("ISA/연금계좌를 활용하면 과세이연·분리과세 등으로 세후 수익률 개선 여지가 있습니다.");

  return NextResponse.json({
    investor: {
      id: investor.id,
      name: investor.name,
      display_name_ko: investor.displayNameKo,
      summary: investor.summary,
      principles: investor.principles,
    },
    portfolio_assessment: {
      score: Math.round((confidenceAvg * 0.45 + reliabilityAvg * 0.55)),
      score_max: 100,
      confidence: Math.round(confidenceAvg),
      confidence_max: 100,
      reliability_score: Math.round(reliabilityAvg),
      reliability_max: 100,
      decision_breakdown: { buy: buyCount, sell: sellCount, hold: holdCount },
      overview:
        `공식 공시(EDGAR/DART)와 재무/가격 데이터 기준으로 ${investor.displayNameKo} 철학에 맞춰 포트폴리오를 평가했습니다. ` +
        `현재 권고 분포는 BUY ${buyCount}, SELL ${sellCount}, HOLD ${holdCount} 입니다.`,
    },
    tax_hints: taxPlacementHints,
    evaluations,
    generated_at: new Date().toISOString(),
  });
}
