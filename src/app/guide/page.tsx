"use client";

import { useState } from "react";

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
      "연 400만원 한도 세액공제(총급여 5,500만원 이하)",
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

export default function GuidePage() {
  const [openId, setOpenId] = useState<string | null>("isa");

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-cyan-400">한국인을 위한 투자 가이드</h1>
      <p className="text-white">ISA, IRP, 연금 등 세제 혜택을 활용한 똑똑한 투자 방법</p>

      <div className="space-y-2">
        {GUIDE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/20 bg-slate-800/50 overflow-hidden"
          >
            <button
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className="flex w-full items-center justify-between px-4 py-4 text-left font-semibold"
            >
              {item.title}
              <span className="text-cyan-400">{openId === item.id ? "−" : "+"}</span>
            </button>
            {openId === item.id && (
              <div className="border-t border-white/20 px-4 pb-4 pt-2">
                <p className="mb-4 text-white">{item.desc}</p>
                <ul className="list-inside list-disc space-y-2 text-sm">
                  {item.points.map((p, i) => (
                    <li key={i} className="text-white">{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
        <h3 className="font-semibold text-cyan-400">투자 전 체크리스트</h3>
        <ul className="mt-2 space-y-1 text-sm text-white">
          <li>• 투자 성향에 맞는 자산 배분 하기</li>
          <li>• 비상금(6개월 생활비) 확보 후 투자</li>
          <li>• ISA → IRP → 연금저축 순으로 우선 활용</li>
          <li>• 단기 차트보다 장기 자산 배분에 집중</li>
        </ul>
      </div>

    </div>
  );
}
