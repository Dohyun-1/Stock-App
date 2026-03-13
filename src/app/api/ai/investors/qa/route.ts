import { NextRequest, NextResponse } from "next/server";

type Evaluation = {
  symbol: string;
  company_name: string;
  decision: "buy" | "sell" | "hold";
  confidence: number;
  rationale: string;
  sources: { name: string; url: string; reliability: "high" | "medium"; note: string }[];
  reliability_score: number;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const question = String(body?.question || "").trim();
  const analysis = body?.analysis;
  const evaluations: Evaluation[] = Array.isArray(analysis?.evaluations) ? analysis.evaluations : [];

  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });
  if (evaluations.length === 0) return NextResponse.json({ answer: "먼저 투자자 분석을 실행해야 Q&A를 제공할 수 있습니다." });

  const qUpper = question.toUpperCase();
  const target = evaluations.find((e) => qUpper.includes(e.symbol.toUpperCase()));

  if (target) {
    const sourceText = target.sources
      .map((s) => `${s.name}(${s.reliability}) - ${s.note}`)
      .join(" / ");
    const answer =
      `${target.symbol}에 대한 판단은 ${target.decision.toUpperCase()}입니다. ` +
      `핵심 근거: ${target.rationale} ` +
      `근거 출처: ${sourceText}. ` +
      `이 종목의 근거 신뢰도는 ${target.reliability_score}/100, 판단 신뢰도는 ${target.confidence}/100입니다.`;
    return NextResponse.json({ answer });
  }

  const buy = evaluations.filter((e) => e.decision === "buy").length;
  const sell = evaluations.filter((e) => e.decision === "sell").length;
  const hold = evaluations.filter((e) => e.decision === "hold").length;
  const avgReliability = Math.round(evaluations.reduce((sum, e) => sum + e.reliability_score, 0) / evaluations.length);
  const avgConfidence = Math.round(evaluations.reduce((sum, e) => sum + e.confidence, 0) / evaluations.length);

  const answer =
    `질문에 종목 심볼이 명시되지 않아 포트폴리오 전체 기준으로 답변합니다. ` +
    `현재 권고 분포는 BUY ${buy}, SELL ${sell}, HOLD ${hold}이며, 평균 근거 신뢰도 ${avgReliability}/100, ` +
    `평균 판단 신뢰도 ${avgConfidence}/100입니다. 구체 종목(예: AAPL, 005930.KS)을 질문에 포함하면 해당 종목 근거를 상세히 설명합니다.`;
  return NextResponse.json({ answer });
}
