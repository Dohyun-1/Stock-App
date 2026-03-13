import { NextRequest, NextResponse } from "next/server";
import { runDebate } from "@/lib/ai/debateEngine";
import { AgentOpinion } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const opinions = Array.isArray(body?.opinions) ? body.opinions : [];
  const parsed: AgentOpinion[] = opinions
    .map((o: {
      agentName?: AgentOpinion["agentName"];
      symbol?: string;
      action?: AgentOpinion["action"];
      confidence?: number;
      rationale?: string;
    }) => ({
      agentName: o.agentName || "Risk Manager",
      symbol: String(o.symbol || "").toUpperCase(),
      action: o.action || "hold",
      confidence: Number(o.confidence || 50),
      rationale: String(o.rationale || ""),
    }))
    .filter((o: AgentOpinion) => o.symbol.length > 0);

  if (parsed.length === 0) {
    return NextResponse.json({ error: "opinions required" }, { status: 400 });
  }
  return NextResponse.json(runDebate(parsed));
}
