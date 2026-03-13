import { NextRequest, NextResponse } from "next/server";
import {
  fetchMacroSnapshot,
  analyzeStock,
  type PortfolioInsightResponse,
  type DeepStockAnalysis,
} from "@/lib/quantEngine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const symbols: string[] = Array.isArray(body?.symbols)
      ? body.symbols.filter((s: unknown) => typeof s === "string" && (s as string).trim())
      : [];

    if (symbols.length === 0) {
      return NextResponse.json({ error: "symbols array required" }, { status: 400 });
    }

    const macro = await fetchMacroSnapshot();

    const results = await Promise.allSettled(
      symbols.slice(0, 20).map((sym) => analyzeStock(sym, macro))
    );

    const stocks: DeepStockAnalysis[] = [];
    const sectorCount: Record<string, number> = {};
    const countryCount: Record<string, number> = {};

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        stocks.push(r.value);
        sectorCount[r.value.sector] = (sectorCount[r.value.sector] ?? 0) + 1;
        countryCount[r.value.country] = (countryCount[r.value.country] ?? 0) + 1;
      }
    }

    if (stocks.length === 0) {
      return NextResponse.json({ error: "No valid stock data found" }, { status: 500 });
    }

    const avgMomentum = stocks.reduce((s, a) => s + a.scores.momentum, 0) / stocks.length;
    const avgRisk = stocks.reduce((s, a) => s + a.scores.risk, 0) / stocks.length;
    const avgDividend = stocks.reduce((s, a) => s + a.scores.dividendAttractiveness, 0) / stocks.length;
    const avgMacro = stocks.reduce((s, a) => s + a.scores.macroAlignment, 0) / stocks.length;
    const avgValuation = stocks.reduce((s, a) => s + a.scores.valuationScore, 0) / stocks.length;

    const uniqueSectors = Object.keys(sectorCount).length;
    const uniqueCountries = Object.keys(countryCount).length;
    const maxSectorWeight = Math.max(...Object.values(sectorCount)) / stocks.length;
    let diversification = 50;
    diversification += Math.min(20, uniqueSectors * 5);
    diversification += Math.min(15, uniqueCountries * 5);
    if (maxSectorWeight > 0.6) diversification -= 20;
    else if (maxSectorWeight > 0.4) diversification -= 10;
    diversification = Math.max(10, Math.min(100, diversification));

    const portfolioScore = Math.round(
      (avgMomentum / 10) * 25 +
      ((10 - avgRisk) / 10) * 20 +
      (avgDividend / 100) * 15 +
      (avgMacro / 100) * 20 +
      (avgValuation / 100) * 20
    );
    const clampedPortfolio = Math.max(0, Math.min(100, portfolioScore));

    const buyCount = stocks.filter((s) => s.signal === "BUY").length;
    const sellCount = stocks.filter((s) => s.signal === "SELL").length;
    const overallSignal: "BULLISH" | "BEARISH" | "NEUTRAL" =
      buyCount > sellCount * 1.5 ? "BULLISH" : sellCount > buyCount * 1.5 ? "BEARISH" : "NEUTRAL";

    const avgAiConf = stocks.reduce((s, a) => s + a.aiConfidence, 0) / stocks.length;

    const parts: string[] = [];
    parts.push(`${stocks.length}개 종목 분석 완료.`);
    parts.push(`매크로 환경: ${macro.rateEnvironment === "HAWKISH" ? "긴축적" : macro.rateEnvironment === "DOVISH" ? "완화적" : "중립"} 금리(${macro.treasuryYield10Y.toFixed(2)}%), VIX ${macro.vix.toFixed(1)}.`);
    if (overallSignal === "BULLISH") parts.push("데이터 결합 결과, 포트폴리오 전반에 매수 신호가 우세함.");
    else if (overallSignal === "BEARISH") parts.push("복합 리스크 요인이 중첩되어, 방어적 포지셔닝이 요구됨.");
    else parts.push("혼합 신호 — 종목별 차별화 전략이 필요한 구간.");
    if (diversification < 40) parts.push("섹터·국가 편중도가 높아 상관관계 위험 존재.");

    const response: PortfolioInsightResponse = {
      macro,
      portfolioScore: clampedPortfolio,
      riskScore: Math.round(avgRisk * 10) / 10,
      dividendScore: Math.round(avgDividend),
      momentumScore: Math.round(avgMomentum * 10) / 10,
      diversificationScore: diversification,
      overallSignal,
      aiConfidence: Math.round(avgAiConf),
      summary: parts.join(" "),
      stocks,
      sectorDistribution: sectorCount,
      countryDistribution: countryCount,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
