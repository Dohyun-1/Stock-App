export type InvestorProfile = {
  id: string;
  name: string;
  displayNameKo: string;
  style: "value" | "growth" | "macro" | "quality";
  summary: string;
  principles: string[];
  secCik?: string;
};

export const INVESTOR_PROFILES: InvestorProfile[] = [
  {
    id: "warren_buffett",
    name: "Warren Buffett",
    displayNameKo: "워렌 버핏",
    style: "value",
    summary: "경제적 해자와 안정적 현금흐름, 합리적 밸류에이션을 중시하는 장기 가치 투자.",
    principles: [
      "이해 가능한 사업 모델",
      "지속 가능한 경쟁우위(경제적 해자)",
      "높은 품질의 이익과 보수적 부채",
      "장기 보유 가능한 가격에서 매수",
    ],
    secCik: "0001067983",
  },
  {
    id: "benjamin_graham",
    name: "Benjamin Graham",
    displayNameKo: "벤저민 그레이엄",
    style: "value",
    summary: "안전마진을 핵심으로 하는 정통 가치투자. 과대평가를 피하고 저평가 구간을 선호.",
    principles: [
      "PER 등 밸류 지표의 보수적 기준",
      "재무 건전성 우선",
      "안전마진 확보",
      "감정보다 규칙 기반",
    ],
  },
  {
    id: "peter_lynch",
    name: "Peter Lynch",
    displayNameKo: "피터 린치",
    style: "growth",
    summary: "사업의 성장성과 실적 추세를 중시하며, 이해 가능한 성장주를 적정 가격에 매수.",
    principles: [
      "이익 성장의 지속성",
      "과도한 고평가 회피",
      "실적/수요 근거 확인",
      "기업 스토리의 검증",
    ],
  },
  {
    id: "ray_dalio",
    name: "Ray Dalio",
    displayNameKo: "레이 달리오",
    style: "macro",
    summary: "거시 사이클과 리스크 균형을 중시. 단일 베팅보다 분산과 리스크 조정 수익을 선호.",
    principles: [
      "거시 이벤트 리스크 반영",
      "상관관계 분산",
      "리스크 패리티 관점",
      "변동성 관리",
    ],
    secCik: "0001350694",
  },
  {
    id: "cathie_wood",
    name: "Cathie Wood",
    displayNameKo: "캐시 우드",
    style: "growth",
    summary: "혁신 섹터의 장기 성장 잠재력에 높은 비중을 두는 공격적 성장 전략.",
    principles: [
      "혁신 기술 성장성",
      "장기 TAM(총주소가능시장) 확대",
      "단기 변동성 감내",
      "성장 둔화 시 신속한 재평가",
    ],
    secCik: "0001649339",
  },
];

export function searchInvestors(query: string): InvestorProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return INVESTOR_PROFILES;
  return INVESTOR_PROFILES.filter((inv) => {
    const corpus = [inv.name, inv.displayNameKo, inv.summary, ...inv.principles].join(" ").toLowerCase();
    return corpus.includes(q);
  });
}

export function getInvestorById(id: string): InvestorProfile | null {
  return INVESTOR_PROFILES.find((x) => x.id === id) || null;
}
