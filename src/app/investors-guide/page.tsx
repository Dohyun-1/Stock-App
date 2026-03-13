"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { Loader2, Target, BookOpen, GraduationCap, Calculator } from "lucide-react";
import NewsSection from "@/components/NewsSection";

const MentorInsight = lazy(() => import("@/components/MentorInsight"));
const MentorPortfolio = lazy(() => import("@/components/MentorPortfolio"));
const PortfolioCalculator = lazy(() => import("@/components/PortfolioCalculator"));

const WATCHLIST_KEY = "stockpro_watchlist";

const GUIDE_ITEMS = [
  {
    id: "isa",
    title: "ISA (개인종합자산관리계좌)",
    desc: "세제 혜택을 받을 수 있는 대표적인 미국 주식 투자 계좌입니다.",
    points: [
      "연 $20,000(2024년 기준) 한도 내에서 세금 혜택",
      "배당소득세, 양도소득세 비과세 혜택",
      "미국 ETF(SCHD, QQQ, SPY 등) 투자 가능",
      "국내 증권사(키움, 삼성, NH 등)에서 ISA 개설 가능",
    ],
  },
  {
    id: "irp",
    title: "IRP (개인형 퇴직연금)",
    desc: "퇴직 후 안정적인 노후를 위한 세제 혜택 투자 상품입니다.",
    points: [
      "연 700만원(2024년) 한도 내 세액공제",
      "퇴직 시 연금 또는 일시금 수령",
      "펀드, ETF 등 다양한 상품 투자 가능",
      "장기 투자 시 복리 효과 극대화",
    ],
  },
  {
    id: "pension",
    title: "연금저축 / 연금보험",
    desc: "노후 대비 추가 세제 혜택 상품입니다.",
    points: [
      "연 400만원 한도 세액공제(총급여 5,550만원 이하)",
      "연금 수령 시 연금소득세 적용 (일시금보다 유리)",
      "ISA, IRP와 병행 가능",
    ],
  },
  {
    id: "dca",
    title: "정기매수(DCA) 전략",
    desc: "시장 변동성을 완화하는 꾸준한 매수 전략입니다.",
    points: [
      "매월 정해진 금액으로 같은 종목/ETF 매수",
      "가격이 낮을 때 더 많이, 높을 때 적게 사게 됨",
      "감정적 판단 줄이고 장기 수익에 집중",
    ],
  },
  {
    id: "etf",
    title: "추천 ETF 조합 예시",
    desc: "초보자도 쉽게 시작할 수 있는 ETF 포트폴리오입니다.",
    points: [
      "SPY(추종): S&P500, 안정적 시장 추종",
      "QQQ(추종): 나스닥100, 성장주 비중",
      "SCHD: 고배당 성장 ETF",
      "국내: KODEX 200, TIGER 미국S&P500",
    ],
  },
];

type TabId = "portfolio" | "mentor" | "guide" | "calculator";

const TABS: { key: TabId; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "portfolio", label: "거장 포트폴리오", icon: <Target size={16} />, color: "bg-violet-500" },
  { key: "mentor", label: "멘토 분석", icon: <BookOpen size={16} />, color: "bg-indigo-500" },
  { key: "guide", label: "투자 가이드", icon: <GraduationCap size={16} />, color: "bg-cyan-500" },
  { key: "calculator", label: "수익률 계산", icon: <Calculator size={16} />, color: "bg-emerald-500" },
];

export default function InvestorsGuidePage() {
  const [tab, setTab] = useState<TabId>("portfolio");
  const [openId, setOpenId] = useState<string | null>(null);

  const [mentorStocks, setMentorStocks] = useState<{ symbol: string; name: string; price: number; score: number; pe: number; dividendYield: number; beta: number; forwardPE?: number | null; pegRatio?: number | null; debtToEquity?: number | null; operatingMargins?: number | null; revenueGrowth?: number | null; freeCashflow?: number | null; marketCap?: number; advanced?: Record<string, number>; nativeCurrency?: string }[]>([]);
  const [mentorLoading, setMentorLoading] = useState(false);

  useEffect(() => {
    if (tab !== "mentor") return;
    if (mentorStocks.length > 0) return;
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      if (!stored) return;
      const symbols = JSON.parse(stored) as string[];
      if (!Array.isArray(symbols) || symbols.length === 0) return;
      setMentorLoading(true);
      fetch("/api/ai/portfolio-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.stocks && Array.isArray(d.stocks)) setMentorStocks(d.stocks);
        })
        .catch(() => {})
        .finally(() => setMentorLoading(false));
    } catch {}
  }, [tab, mentorStocks.length]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-cyan-400">투자 가이드</h1>
        <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-400">10 Legends</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 font-medium transition ${
              tab === t.key
                ? `${t.color} text-white shadow-lg`
                : "bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* 거장 포트폴리오 탭 */}
      {tab === "portfolio" && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-slate-800/50 p-16">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              <span className="text-sm text-slate-400">투자 거장 포트폴리오를 준비하고 있습니다...</span>
            </div>
          }
        >
          <MentorPortfolio />
        </Suspense>
      )}

      {/* 멘토 분석 탭 */}
      {tab === "mentor" && (
        <div className="space-y-4 rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
          <p className="text-sm text-slate-400">내 포트폴리오 종목을 10인 투자 거장의 철학으로 분석합니다</p>
          {mentorLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-slate-800/50 p-12">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
              <span className="text-sm text-slate-400">포트폴리오 분석 중...</span>
            </div>
          ) : (
            <Suspense fallback={
              <div className="flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-slate-800/50 p-12">
                <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                <span className="text-sm text-slate-400">멘토 엔진 로딩 중...</span>
              </div>
            }>
              <MentorInsight stocks={mentorStocks} />
            </Suspense>
          )}
        </div>
      )}

      {/* 투자 가이드 탭 */}
      {tab === "guide" && (
        <div className="space-y-4 rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
          <p className="text-sm text-slate-400">ISA, IRP, 연금 등 세제 혜택을 활용한 똑똑한 투자 방법</p>
          <div className="space-y-2">
            {GUIDE_ITEMS.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/20 bg-slate-800/50 overflow-hidden">
                <button
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left font-semibold text-white"
                >
                  {item.title}
                  <span className="text-cyan-400">{openId === item.id ? "−" : "+"}</span>
                </button>
                {openId === item.id && (
                  <div className="border-t border-white/20 px-4 pb-4 pt-2">
                    <p className="mb-4 text-sm text-slate-300">{item.desc}</p>
                    <ul className="list-inside list-disc space-y-2 text-sm">
                      {item.points.map((p, i) => (
                        <li key={i} className="text-slate-300">{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
            <h3 className="font-semibold text-cyan-400">투자 전 체크리스트</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li>• 투자 성향에 맞는 자산 배분 하기</li>
              <li>• 비상금(6개월 생활비) 확보 후 투자</li>
              <li>• ISA → IRP → 연금저축 순으로 우선 활용</li>
              <li>• 단기 차트보다 장기 자산 배분에 집중</li>
            </ul>
          </div>
        </div>
      )}

      {/* 수익률 계산 탭 */}
      {tab === "calculator" && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-slate-800/50 p-16">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              <span className="text-sm text-slate-400">수익률 계산기를 불러오고 있습니다...</span>
            </div>
          }
        >
          <PortfolioCalculator />
        </Suspense>
      )}

      <NewsSection />
    </div>
  );
}
