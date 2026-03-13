import { NextRequest, NextResponse } from "next/server";
import { searchInvestors } from "@/lib/ai/investorProfiles";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const investors = searchInvestors(q).map((x) => ({
    id: x.id,
    name: x.name,
    display_name_ko: x.displayNameKo,
    summary: x.summary,
    principles: x.principles,
  }));
  return NextResponse.json({ investors });
}
