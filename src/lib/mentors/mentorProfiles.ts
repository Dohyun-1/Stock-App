/* ══════════════════════════════════════════════════════════════
   10 Legendary Investors — Investment DNA Profiles
   Source: Shareholder letters, books, interviews, portfolio history
   ══════════════════════════════════════════════════════════════ */

export type Signal = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";

export interface MentorMetric {
  id: string;
  label: string;
  weight: number;          // 0-1, sum should be ~1
  idealRange: [number, number]; // [min, max] — within = bullish
  invert?: boolean;        // true if lower is better (e.g., debt)
  description: string;
}

export interface PortfolioRules {
  maxPositions: number;
  typicalPositions: [number, number];
  maxSinglePositionPct: number;
  concentrationStyle: "ultra_concentrated" | "concentrated" | "diversified" | "hyper_diversified" | "barbell";
  holdingPeriod: string;
  typicalCashPct: [number, number];
  assetClasses: string[];
  turnoverRate: "very_low" | "low" | "medium" | "high" | "very_high";
  rebalanceFrequency: string;
  leveragePolicy: "never" | "conservative" | "moderate" | "aggressive";
}

export interface DecisionTriggers {
  buyTriggers: string[];
  sellTriggers: string[];
  positionSizingRule: string;
  addToPositionRule: string;
  trimPositionRule: string;
}

export interface InvestorSources {
  primaryBooks: string[];
  keyLetters: string[];
  notableInterviews: string[];
  fundOrFirm: string;
  trackRecord: string;
}

export interface MentorProfile {
  id: string;
  name: string;
  nameKo: string;
  title: string;
  era: string;
  style: string;
  philosophy: string;
  keyBooks: string[];

  metrics: MentorMetric[];

  portfolioRules: PortfolioRules;
  decisionTriggers: DecisionTriggers;
  sources: InvestorSources;

  speechPatterns: {
    metaphors: string[];
    terminology: string[];
    openingPhrases: string[];
    cautionPhrases: string[];
  };

  stateLogic: {
    strongBuy: string;
    buy: string;
    hold: string;
    sell: string;
    strongSell: string;
  };

  panicGuide: {
    mindset: string;
    action: string;
    quote: string;
  };

  rallyGuide: {
    mindset: string;
    action: string;
    quote: string;
  };

  signatureQuotes: string[];
}

export const MENTOR_PROFILES: MentorProfile[] = [
  /* ─────────────── 1. Warren Buffett ─────────────── */
  {
    id: "buffett",
    name: "Warren Buffett",
    nameKo: "워런 버핏",
    title: "오마하의 현인",
    era: "1965–현재",
    style: "가치 투자 (Quality Value)",
    philosophy: "내재가치 대비 할인된 가격으로 훌륭한 기업을 사서 영원히 보유한다. 능력 범위(Circle of Competence) 안에서만 투자하고, 경제적 해자(Moat)가 깊은 기업만 선별한다. 버핏은 기업의 '주인(Owner)'이 되는 관점에서 투자하며, 주가가 아닌 기업의 본질적 가치에 집중한다. ROE 15% 이상, 낮은 부채비율, 꾸준한 잉여현금흐름(FCF)을 핵심 기준으로 삼는다. 단기 시장 변동은 무시하고, 10년 이상 보유할 기업만 매수한다. '가격은 지불하는 것이고 가치는 얻는 것'이라는 원칙 아래, Mr. Market의 감정적 매도를 기회로 활용한다. 특히 브랜드 파워, 네트워크 효과, 전환 비용 등으로 형성된 경제적 해자를 가진 독과점 기업을 선호하며, 경영진의 도덕성과 자본 배분 능력을 중시한다.",
    keyBooks: ["주주서한 (1965–현재)", "The Snowball", "Buffett: The Making of an American Capitalist"],

    metrics: [
      { id: "pe", label: "P/E", weight: 0.25, idealRange: [5, 22], invert: true, description: "밸류에이션 핵심 — '가격은 지불하는 것이고 가치는 얻는 것'. P/E 22 이상은 안전마진 부족" },
      { id: "fcfYield", label: "FCF Yield", weight: 0.22, idealRange: [5, 30], description: "Owner Earnings 수익률 — 순이익+감가상각-설비투자 (1986 주주서한 정의)" },
      { id: "roe", label: "ROE", weight: 0.15, idealRange: [15, 60], description: "자기자본수익률 15% 이상 — 단, 과도한 레버리지로 인한 고ROE는 경계" },
      { id: "operatingMargin", label: "영업이익률", weight: 0.18, idealRange: [15, 50], description: "가격 결정력(Pricing Power)과 해자의 증거 — See's Candies 모델" },
      { id: "debtToEquity", label: "부채비율", weight: 0.12, idealRange: [0, 80], invert: true, description: "보수적 재무구조 — D/E 80% 이하, 비금융 기업 기준" },
      { id: "dividendYield", label: "배당수익률", weight: 0.08, idealRange: [1, 5], description: "주주 환원 — 자사주 매입 포함 총환원율 중시, 자본 재배치 능력이 더 중요" },
    ],

    portfolioRules: {
      maxPositions: 20,
      typicalPositions: [8, 15],
      maxSinglePositionPct: 40,
      concentrationStyle: "concentrated",
      holdingPeriod: "영구 보유 (Favorite holding period is forever) — 평균 10년+, 이상적으로 영원히",
      typicalCashPct: [5, 30],
      assetClasses: ["미국 대형 우량주", "보험사", "소비재 독점 기업", "은행 (Wells Fargo 유형)", "에너지 (OXY)", "현금성 자산 (T-Bills)"],
      turnoverRate: "very_low",
      rebalanceFrequency: "기회 기반 — 매력적 가격이 나타날 때만 매수, 정기 리밸런싱 안 함",
      leveragePolicy: "conservative",
    },

    decisionTriggers: {
      buyTriggers: [
        "내재가치 대비 30%+ 할인 (안전마진 확보)",
        "ROE 15%+ 지속 5년 이상",
        "경제적 해자 확인: 브랜드 파워, 전환 비용, 네트워크 효과, 원가 우위",
        "경영진의 합리적 자본 배분 이력 (자사주 매입, 인수합병 ROI)",
        "시장 패닉 시 우량주 할인 매수 (2008년 GS, GE 우선주 사례)",
        "능력 범위(Circle of Competence) 내 기업",
        "10년 후에도 동일한 제품을 팔 수 있는 기업",
      ],
      sellTriggers: [
        "밸류에이션 과열 — P/E > 28~30 진입 시 안전마진 소멸, 부분 매도 개시 (2024년 애플 매도 사례)",
        "포트폴리오 집중도 과다 — 단일 종목 비중 40%+ 시 리스크 관리 차원 비중 축소",
        "세금 전략 — 자본이득세율 인상 가능성 시 이익 실현 (2024년 대선 전 애플 매도)",
        "경제적 해자의 구조적 훼손 (경쟁 환경 근본적 변화)",
        "경영진의 도덕성 문제 또는 자본 배분 실패",
        "더 매력적인 기회가 발생하여 자본 재배치 필요 — 현금 축적 후 위기 시 대량 매수 준비",
        "FCF Yield 3% 이하로 하락 — Owner Earnings 기준 매력도 급감",
        "회계 부정 징후",
      ],
      positionSizingRule: "확신도에 비례하여 집중 투자 — 최고 확신 종목에 전체 자산의 25~40%, 2~3번째 종목에 10~20%",
      addToPositionRule: "주가 하락 시 기업 가치가 변하지 않았다면 추가 매수 — 하락은 더 좋은 가격의 기회",
      trimPositionRule: "가격이 내재가치에 도달하거나 초과하면 비중 축소 고려, 단 해자가 건재하면 계속 보유",
    },

    sources: {
      primaryBooks: ["주주서한 (1965–현재)", "The Snowball (Alice Schroeder)", "Buffett: The Making of an American Capitalist (Roger Lowenstein)", "The Essays of Warren Buffett (Lawrence Cunningham 편집)"],
      keyLetters: ["1986 주주서한 (Owner Earnings 정의)", "1988 주주서한 (ROE 기준)", "1996 주주서한 (경제적 해자)", "2008 주주서한 (금융위기 대응)"],
      notableInterviews: ["2010 FCIC 인터뷰", "연례 버크셔 주주총회 Q&A (1994–현재)", "Charlie Rose 인터뷰 시리즈"],
      fundOrFirm: "Berkshire Hathaway — 시가총액 약 $780B, 보험+제조+소비재+에너지 복합기업",
      trackRecord: "1965–2023 연평균 CAGR 19.8% (S&P 500 대비 약 2배), 59년간 복리",
    },

    speechPatterns: {
      metaphors: ["야구에서 좋은 공을 기다리는 타자처럼", "해자가 넓은 성", "스노우볼이 굴러가는 것처럼", "10년 보유할 마음이 없다면 10분도 보유하지 마라"],
      terminology: ["내재가치", "경제적 해자", "능력 범위", "안전마진", "주인의식"],
      openingPhrases: ["이 기업의 경제적 해자를 살펴보면,", "장기적 관점에서 볼 때,", "내재가치 대비 현재 가격은"],
      cautionPhrases: ["다른 사람들이 탐욕적일 때 두려워하라", "가격은 당신이 지불하는 것이고, 가치는 당신이 얻는 것이다"],
    },

    stateLogic: {
      strongBuy: "P/E < 15 AND ROE > 20% AND D/E < 50% AND FCF Yield > 8% AND 영업이익률 > 20% — 모든 조건 동시 충족 시에만",
      buy: "P/E < 22 AND ROE > 15% AND 영업이익률 > 15% AND 해자 건재 AND FCF Yield > 5%",
      hold: "해자는 건재하나 P/E > 25로 안전마진 부족 — 좋은 기업이지만 좋은 가격이 아님. 보유는 유지하되 신규 매수 자제",
      sell: "P/E > 30 과열 OR 해자 약화 OR FCF Yield < 3% OR 경영진의 자본 배분 실패 OR 포트폴리오 집중도 과다(비중 40%+)",
      strongSell: "회계 부정 징후 OR D/E 급증 OR Pricing Power 상실 OR 경쟁 우위 소멸",
    },

    panicGuide: { mindset: "시장 폭락은 슈퍼마켓 세일과 같다", action: "현금을 확보하고 있다가 패닉 시 우량주를 사들인다", quote: "다른 사람들이 두려워할 때 탐욕적이어라." },
    rallyGuide: { mindset: "시장 과열 시 조용히 현금 비중을 높인다", action: "새 매수를 자제하고 기존 보유 종목의 내재가치를 재점검한다", quote: "다른 사람들이 탐욕적일 때 두려워하라." },
    signatureQuotes: ["주식시장은 인내심 없는 사람에게서 인내심 있는 사람에게 돈을 전달하는 장치다.", "훌륭한 기업을 적정 가격에 사는 것이 적당한 기업을 훌륭한 가격에 사는 것보다 낫다."],
  },

  /* ─────────────── 2. Peter Lynch ─────────────── */
  {
    id: "lynch",
    name: "Peter Lynch",
    nameKo: "피터 린치",
    title: "월스트리트의 전설",
    era: "1977–1990",
    style: "GARP (Growth at Reasonable Price)",
    philosophy: "일상에서 투자 아이디어를 찾고, PEG 비율로 성장 대비 가격을 평가한다. 자신이 이해하는 기업에 투자하며 '텐배거(10배 수익)'를 노린다. 린치는 마젤란 펀드를 13년간 연평균 29.2%의 수익률로 운용하며, 아마추어 투자자가 전문가를 이길 수 있다고 강조했다. 종목을 6가지 유형(저성장주, 대형 우량주, 고성장주, 경기순환주, 자산주, 전환주)으로 분류하고, 각 유형에 맞는 매수/매도 기준을 적용한다. PEG 비율 1.0 미만을 핵심 매수 기준으로 삼으며, 이익 성장률이 매출 성장률을 뒷받침하는지 확인한다. '크레용으로 설명할 수 없는 기업에는 투자하지 마라'는 원칙 아래, 사업 모델의 단순성과 이해 가능성을 중시한다. 칵테일 파티 이론으로 시장 온도를 측정하며, 지나친 관심은 과열의 신호로 해석한다.",
    keyBooks: ["이기는 투자 (One Up on Wall Street)", "전설로 떠나는 월가의 영웅 (Beating the Street)"],

    metrics: [
      { id: "peg", label: "PEG", weight: 0.25, idealRange: [0.1, 1.0], invert: true, description: "P/E를 이익성장률로 나눈 값, 1 미만이면 저평가" },
      { id: "revenueGrowth", label: "매출성장률", weight: 0.20, idealRange: [10, 50], description: "지속적 매출 성장 — 성장주의 핵심" },
      { id: "earningsGrowth", label: "이익성장률", weight: 0.20, idealRange: [15, 50], description: "EPS 성장률 — 텐배거의 엔진" },
      { id: "pe", label: "P/E", weight: 0.15, idealRange: [5, 25], invert: true, description: "성장률 대비 합리적인 P/E" },
      { id: "debtToEquity", label: "부채비율", weight: 0.10, idealRange: [0, 80], invert: true, description: "과도한 부채는 성장의 독" },
      { id: "inventoryTurnover", label: "재고회전율", weight: 0.10, idealRange: [5, 20], description: "소매/소비재 기업의 건강도 — 재고 쌓임은 위험 신호" },
    ],

    portfolioRules: {
      maxPositions: 1400,
      typicalPositions: [100, 200],
      maxSinglePositionPct: 5,
      concentrationStyle: "hyper_diversified",
      holdingPeriod: "6개월~5년 — 스토리 실현 속도에 따라 다름, 텐배거는 10년+",
      typicalCashPct: [2, 10],
      assetClasses: ["미국 소형주", "중형 성장주", "대형 우량주", "경기순환주", "자산주", "전환주"],
      turnoverRate: "medium",
      rebalanceFrequency: "지속적 — 새로운 아이디어 발견 시 기존 약한 종목을 교체",
      leveragePolicy: "never",
    },

    decisionTriggers: {
      buyTriggers: [
        "PEG < 1.0 (이익성장률 대비 P/E가 저평가)",
        "일상에서 직접 경험한 제품/서비스 (Dunkin Donuts, Hanes 사례)",
        "기관투자자 관심이 낮은 소외 종목",
        "6가지 유형 분류 후 해당 유형에 맞는 매수 기준 충족",
        "내부자 매수 신호",
        "기업 스토리를 2분 내에 크레용으로 설명 가능",
        "이익 가속 (분기 EPS 성장률 증가 추세)",
      ],
      sellTriggers: [
        "스토리가 변했을 때 — 성장 동력 소멸, 경쟁 격화",
        "PEG > 2.0 도달 (고평가)",
        "칵테일 파티 4단계 (모든 사람이 주식 이야기) — 시장 과열 신호",
        "더 좋은 스토리를 가진 종목 발견 시 교체",
        "경기순환주: 재고 증가 + 가격 하락 시작",
        "자산주: 자산 가치 실현 완료",
      ],
      positionSizingRule: "확신도별 비중 조절 — 고성장주 최대 5%, 대형 우량주 3~5%, 소형 투기 1~2%",
      addToPositionRule: "스토리 강화 시 추가 매수 — 실적이 기대를 초과하고 주가가 아직 반영하지 않았을 때",
      trimPositionRule: "펀더멘털이 약화되면 즉시 비중 축소 — 꽃에 물을 주고 잡초를 뽑아라",
    },

    sources: {
      primaryBooks: ["이기는 투자 (One Up on Wall Street, 1989)", "전설로 떠나는 월가의 영웅 (Beating the Street, 1993)", "Learn to Earn (1995)"],
      keyLetters: ["Fidelity Magellan Fund 연례 보고서 (1977–1990)"],
      notableInterviews: ["PBS Frontline 인터뷰 (1996)", "Barron's Roundtable (1980s–1990s)", "Worth Magazine 인터뷰 (1997)"],
      fundOrFirm: "Fidelity Magellan Fund — 피터 린치 재임 기간 $18M → $14B 성장",
      trackRecord: "1977–1990 연평균 29.2% (13년), S&P 500의 약 2.5배, 뮤추얼 펀드 역사상 최고 기록",
    },

    speechPatterns: {
      metaphors: ["동네 쇼핑몰에서 텐배거를 찾을 수 있다", "칵테일 파티 이론", "풀 뽑으면서 꽃에 물 주기"],
      terminology: ["텐배거", "PEG 비율", "성장주 카테고리", "스토리가 변했다"],
      openingPhrases: ["이 기업의 스토리를 한 문장으로 설명하면,", "일상에서 이 제품을 접해보면,", "PEG 비율로 판단할 때"],
      cautionPhrases: ["투자 이유를 크레용으로 설명할 수 없다면 사지 마라", "모르는 기업에 투자하는 것은 포커에서 카드를 보지 않고 베팅하는 것과 같다"],
    },

    stateLogic: {
      strongBuy: "PEG < 0.8 AND 이익성장률 > 20% AND 부채비율 < 0.5",
      buy: "PEG < 1.2 AND 매출성장률 > 10% AND 스토리가 명확",
      hold: "PEG 1.0~1.5 AND 성장 스토리 유지",
      sell: "PEG > 2.0 OR 스토리가 변했을 때 (성장 둔화, 경쟁 심화)",
      strongSell: "이익 역성장 + 부채 증가 + 스토리 붕괴",
    },

    panicGuide: { mindset: "조정은 텐배거를 싸게 살 기회다", action: "기업의 '스토리'가 변하지 않았다면 보유하고, 추가 매수 기회를 노린다", quote: "시장 조정은 정상이다. 이를 예측하려는 것이 문제다." },
    rallyGuide: { mindset: "칵테일 파티의 4단계를 관찰하라 — 모든 사람이 주식 이야기를 하면 고점이 가깝다", action: "PEG가 2를 넘는 보유 종목은 비중 축소를 고려한다", quote: "주가가 올랐다는 이유만으로 팔지 마라. 꽃을 뽑고 잡초에 물을 주는 꼴이다." },
    signatureQuotes: ["주식 뒤에는 기업이 있고, 기업은 일을 한다.", "주식시장에서의 핵심 장기는 뇌가 아니라 위장이다."],
  },

  /* ─────────────── 3. Cathie Wood ─────────────── */
  {
    id: "wood",
    name: "Cathie Wood",
    nameKo: "캐시 우드",
    title: "파괴적 혁신의 여왕",
    era: "2014–현재",
    style: "파괴적 혁신 성장주 (Disruptive Innovation)",
    philosophy: "5년 후 세상을 바꿀 기술 플랫폼에 집중 투자한다. AI, 로봇, 유전체학, 에너지 저장, 블록체인 등 수렴하는 기술에 베팅하며, 단기 변동성을 기회로 본다. 우드는 Wright's Law(생산량이 2배가 될 때 비용이 일정 비율로 하락)를 핵심 투자 프레임워크로 활용하며, 기술 채택 곡선의 S-curve 변곡점을 포착하는 데 집중한다. 전통적 밸류에이션 모델(P/E, DCF)이 파괴적 혁신의 비선형적 성장을 과소평가한다고 주장하며, 5년 후 TAM(Total Addressable Market)을 기준으로 현재 가격의 적정성을 판단한다. 높은 매출 성장률(30%+)과 확장 가능한 플랫폼 비즈니스 모델을 선호하고, 초기 단계의 마진 압박은 R&D 투자의 정상적 과정으로 해석한다. 기술 수렴(Convergence) — 여러 혁신 기술이 동시에 발전하며 시너지를 만드는 현상을 가장 큰 기회로 본다.",
    keyBooks: ["ARK Invest Research (Big Ideas 리포트)", "Bloomberg 인터뷰 시리즈"],

    metrics: [
      { id: "revenueGrowth", label: "매출성장률", weight: 0.30, idealRange: [25, 200], description: "폭발적 매출 성장이 핵심 — Wright's Law 비용 하락 동반" },
      { id: "tam", label: "TAM 규모", weight: 0.15, idealRange: [5, 10], description: "총 시장 규모 점수 — 시장이 클수록 기회도 크다" },
      { id: "innovationScore", label: "혁신 점수", weight: 0.20, idealRange: [5, 10], description: "기술적 파괴력, S-curve 변곡점 위치" },
      { id: "grossMargin", label: "매출총이익률", weight: 0.20, idealRange: [40, 90], description: "소프트웨어 수준의 마진 = 플랫폼 비즈니스" },
      { id: "rndRatio", label: "R&D 투자 비중", weight: 0.15, idealRange: [8, 40], description: "혁신을 위한 투자 비중 — Wright's Law 비용 학습 곡선 가속" },
    ],

    portfolioRules: {
      maxPositions: 50,
      typicalPositions: [25, 40],
      maxSinglePositionPct: 15,
      concentrationStyle: "concentrated",
      holdingPeriod: "5년 — 혁신 기술 채택 곡선의 S-curve 변곡점 기준",
      typicalCashPct: [0, 5],
      assetClasses: ["AI/로봇 관련주", "유전체/정밀의료", "핀테크/블록체인", "에너지 저장/자율주행", "우주항공", "멀티오믹스"],
      turnoverRate: "high",
      rebalanceFrequency: "일일 — ARK ETF는 매일 포트폴리오를 공개하며 적극적으로 리밸런싱",
      leveragePolicy: "never",
    },

    decisionTriggers: {
      buyTriggers: [
        "TAM이 5년 내 5배+ 확대 예상되는 파괴적 혁신 기업",
        "매출 성장률 25%+ 지속",
        "Wright's Law에 의한 비용 하락 곡선 확인 (생산량 2배 시 비용 X% 감소)",
        "S-curve 변곡점 진입 — 기술 채택률 급가속 시작",
        "기술 수렴(Convergence) 수혜 기업 — 2개 이상 혁신 플랫폼 교차점",
        "주가 30%+ 조정 시 확신 있는 이름에 공격적 매수 (2022년 TSLA 사례)",
      ],
      sellTriggers: [
        "혁신 모멘텀 둔화 — 기술적 리더십 상실",
        "경쟁자의 기술 추월 또는 규제로 인한 TAM 축소",
        "S-curve가 포화 구간 진입 (성장률 감속)",
        "ARK의 5년 가격 목표 대비 현재 가격이 80%+ 도달",
      ],
      positionSizingRule: "5년 기대수익률에 비례 — 기대수익이 가장 높은 종목에 10~15% 집중",
      addToPositionRule: "주가 하락 시 혁신 논리가 유효하면 적극 매수 — 변동성은 기회",
      trimPositionRule: "가격 목표 근접 시 이익 실현, 새로운 혁신 기업으로 교체",
    },

    sources: {
      primaryBooks: ["ARK Invest Big Ideas Report (연례 발행, 2017–현재)", "ARK Invest Research Whitepapers"],
      keyLetters: ["ARK Invest Monthly Newsletter", "ARK 수익 모델 공개 자료 (Tesla, Coinbase 등)"],
      notableInterviews: ["Bloomberg Technology 인터뷰 시리즈", "CNBC Squawk Box 정기 출연", "Lex Fridman Podcast (2023)"],
      fundOrFirm: "ARK Investment Management — ARKK, ARKG, ARKW, ARKF, ARKQ 등 테마 ETF 운용",
      trackRecord: "ARKK 2020년 +152% (역대 최고), 2022년 -67% (고변동성), 파괴적 혁신 집중의 양면성 체현",
    },

    speechPatterns: {
      metaphors: ["S-curve의 변곡점", "파괴적 혁신의 수렴", "라이트 형제의 비행기처럼"],
      terminology: ["파괴적 혁신", "수렴 기술", "TAM", "Wright's Law", "S-curve"],
      openingPhrases: ["이 기업은 파괴적 혁신의 최전선에 있습니다.", "5년 후 이 시장은 완전히 다를 것입니다.", "기술 수렴이 만들어낼 기회를 보면"],
      cautionPhrases: ["단기 변동성에 흔들리지 마세요. 혁신은 시간이 필요합니다.", "시장이 이해하지 못하는 것에 기회가 있습니다."],
    },

    stateLogic: {
      strongBuy: "매출성장률 > 40% AND 혁신 분야(AI/로봇/유전체) AND 주가 조정 > 30%",
      buy: "매출성장률 > 25% AND TAM 확대 중 AND 기술적 리더십 보유",
      hold: "성장 스토리 유지 AND 경쟁 우위 건재",
      sell: "혁신 모멘텀 둔화 OR 경쟁자가 추월 OR TAM 축소",
      strongSell: "기술이 대체됨 OR 규제로 시장 자체가 위협",
    },

    panicGuide: { mindset: "폭락은 혁신주를 할인가에 살 최고의 기회", action: "확신이 높은 혁신 테마의 리더 기업에 집중 매수", quote: "우리의 시간 지평은 5년입니다. 단기 변동성은 노이즈일 뿐입니다." },
    rallyGuide: { mindset: "혁신 기업은 S-curve 초입이라면 고점이 아니다", action: "밸류에이션보다 성장 궤도와 TAM 확대에 집중", quote: "시장이 효율적이었다면 파괴적 혁신은 이미 가격에 반영되었을 것입니다." },
    signatureQuotes: ["파괴적 혁신은 비용을 극적으로 낮추고 창의성을 해방합니다.", "전통적 벤치마크는 과거를 측정합니다. 우리는 미래에 투자합니다."],
  },

  /* ─────────────── 4. Ray Dalio ─────────────── */
  {
    id: "dalio",
    name: "Ray Dalio",
    nameKo: "레이 달리오",
    title: "올웨더의 설계자",
    era: "1975–현재",
    style: "글로벌 매크로 + 리스크 패리티",
    philosophy: "경제는 기계처럼 작동한다. 성장과 인플레이션의 4가지 시즌(사계절)에 맞게 자산을 배분하고, 상관관계가 낮은 알파 소스 15개 이상으로 포트폴리오를 구성한다. 달리오의 핵심 통찰은 '성배(Holy Grail of Investing)' — 비상관 수익원 15~20개를 확보하면 위험 대비 수익률을 5배 개선할 수 있다는 것이다. 리스크 패리티(Risk Parity) 전략으로 각 자산군의 위험 기여도를 균등하게 배분하며, 특정 경제 환경에 편향되지 않는 '사계절 포트폴리오'를 구축한다. 장기 부채 사이클(약 75~100년)과 단기 부채 사이클(약 5~8년)의 위치를 파악하여 자산 배분을 조정한다. '원칙 기반 의사결정' — 감정이 아닌 시스템화된 규칙으로 투자하며, 모든 결정을 기록하고 복기하여 끊임없이 개선한다. '현실을 있는 그대로 다루라, 당신이 원하는 대로가 아니라'라는 급진적 투명성을 경영과 투자 모두에 적용한다.",
    keyBooks: ["원칙 (Principles)", "변화하는 세계 질서 (Changing World Order)", "큰 부채 위기 (Big Debt Crises)"],

    metrics: [
      { id: "beta", label: "베타", weight: 0.20, idealRange: [0.3, 1.2], description: "시장 대비 민감도 — 리스크 패리티 비중 계산의 핵심" },
      { id: "sharpeRatio", label: "샤프 비율", weight: 0.25, idealRange: [0.5, 3.0], description: "위험 조정 수익률 — 알파 원천의 효율성 측정" },
      { id: "correlation", label: "상관계수", weight: 0.15, idealRange: [-0.3, 0.3], description: "시장과의 상관관계 — 낮을수록 분산 기여도 증가" },
      { id: "debtCycle", label: "부채 사이클 위치", weight: 0.10, idealRange: [2, 6], description: "장기 부채 사이클 내 위치 (1=초기, 10=말기)" },
      { id: "realReturn", label: "실질 수익률", weight: 0.15, idealRange: [2, 15], description: "인플레이션 차감 실질 수익률" },
      { id: "maxDrawdown", label: "최대낙폭", weight: 0.15, idealRange: [0, 20], invert: true, description: "역사적 최대 하락폭 — 꼬리 위험 및 포트폴리오 위험 기여도" },
    ],

    portfolioRules: {
      maxPositions: 500,
      typicalPositions: [100, 300],
      maxSinglePositionPct: 3,
      concentrationStyle: "hyper_diversified",
      holdingPeriod: "전략에 따라 다름 — Pure Alpha: 중기(수개월~수년), All Weather: 영구",
      typicalCashPct: [5, 15],
      assetClasses: ["주식 (글로벌)", "국채 (미국/선진국)", "물가연동채(TIPS)", "금", "원자재", "이머징 마켓", "크레딧"],
      turnoverRate: "medium",
      rebalanceFrequency: "리스크 패리티 기반 — 각 자산군의 변동성이 변할 때마다 비중 재조정",
      leveragePolicy: "moderate",
    },

    decisionTriggers: {
      buyTriggers: [
        "경제 사계절 분석: 현재 시즌에 유리한 자산군 확인 (성장↑인플레↑ → 주식+원자재)",
        "비상관 알파 소스 발굴 — 기존 포트폴리오와 상관계수 <0.3인 새 전략",
        "부채 사이클 초기~중기 — 레버리지 확대 구간에서 주식 비중 확대",
        "리스크 프리미엄이 역사적 평균 대비 높을 때",
        "중앙은행의 완화 정책 전환 시점 (금리 인하 시작)",
      ],
      sellTriggers: [
        "부채 사이클 말기 — 디레버리징 시작 징후 (크레딧 스프레드 확대)",
        "상관계수 급등 — 분산 효과 소멸 (위기 시 자산 간 상관 수렴)",
        "원칙 기반 규칙에 의한 자동 매도 — 감정 배제",
        "인플레이션 급등 시 명목 채권 비중 축소",
      ],
      positionSizingRule: "리스크 패리티 — 각 자산의 '위험 기여도'가 동일하도록 비중 배분 (변동성 역비례)",
      addToPositionRule: "리밸런싱 규칙에 따라 하락 자산에 기계적 추가 매수 — 비중 복원",
      trimPositionRule: "리밸런싱 규칙에 따라 상승 자산의 비중 초과분 매도 — 규칙 기반 실행",
    },

    sources: {
      primaryBooks: ["원칙 (Principles, 2017)", "변화하는 세계 질서 (Principles for Dealing with the Changing World Order, 2021)", "큰 부채 위기 (A Template for Understanding Big Debt Crises, 2018)"],
      keyLetters: ["Bridgewater Daily Observations (일일 리서치 메모)", "How the Economic Machine Works (2013, YouTube 30분 영상)"],
      notableInterviews: ["TED Talk: How to build a company where the best ideas win (2017)", "Tony Robbins Money: Master the Game 인터뷰 (올웨더 포트폴리오 공개)", "60 Minutes 인터뷰"],
      fundOrFirm: "Bridgewater Associates — 세계 최대 헤지펀드 ($150B+ AUM), Pure Alpha + All Weather 전략 운용",
      trackRecord: "Pure Alpha: 1991–2023 연평균 약 11.4% (S&P 500과 낮은 상관관계), All Weather: 연평균 약 7.5% (극도로 낮은 변동성)",
    },

    speechPatterns: {
      metaphors: ["경제라는 기계", "사계절 투자", "성배(Holy Grail) — 15개 이상의 비상관 수익원"],
      terminology: ["리스크 패리티", "알파", "디레버리징", "부채 사이클", "원칙 기반 의사결정"],
      openingPhrases: ["현재 경제 사이클의 위치를 고려하면,", "리스크 패리티 관점에서 이 자산은,", "원칙에 기반하여 분석하면"],
      cautionPhrases: ["다각화는 투자의 성배다.", "당신이 틀릴 확률을 항상 고려하라."],
    },

    stateLogic: {
      strongBuy: "포트폴리오 상관관계 감소 효과 + 양호한 실질 수익률 + 사이클 초기",
      buy: "리스크 대비 수익이 매력적 AND 포트폴리오 분산 기여",
      hold: "현재 자산 배분 비중이 적정",
      sell: "상관관계 급등 OR 사이클 말기 진입 신호",
      strongSell: "디레버리징 국면 진입 + 유동성 위기 징후",
    },

    panicGuide: { mindset: "폭락은 부채 사이클의 자연스러운 과정이다. 중앙은행의 대응을 관찰하라.", action: "리밸런싱 규칙을 따르고, 현금과 금 비중을 확인한다. 감정이 아닌 원칙으로 행동한다.", quote: "고통 + 반성 = 진보. 실수에서 배우는 것이 핵심이다." },
    rallyGuide: { mindset: "과도한 낙관은 사이클 후반의 신호일 수 있다", action: "리스크 패리티를 재점검하고, 인플레이션 헤지 자산 비중을 유지한다", quote: "가장 큰 실수는 지금이 과거와 다르다고 생각하는 것이다." },
    signatureQuotes: ["15개 이상의 비상관 수익원을 확보하면 수익/위험 비율을 5배 개선할 수 있다.", "현실을 있는 그대로 다루라, 당신이 원하는 대로가 아니라."],
  },

  /* ─────────────── 5. Jim Simons ─────────────── */
  {
    id: "simons",
    name: "Jim Simons",
    nameKo: "짐 사이먼스",
    title: "퀀트의 제왕",
    era: "1982–2020",
    style: "통계적 차익거래 (Quantitative/Statistical Arbitrage)",
    philosophy: "시장의 비효율은 데이터 속에 숨어 있다. 인간의 직관이 아닌 수학적 모델과 통계적 패턴으로 의사결정하며, 감정을 완전히 배제한다. 사이먼스의 르네상스 테크놀로지는 메달리온 펀드를 통해 1988~2018년 연평균 66%의 세전 수익률을 달성했다. 수학, 물리학, 통계학 박사급 인재를 고용하여 수백만 개의 데이터 포인트에서 반복 가능한 패턴을 발굴한다. 투자 기간은 밀리초에서 수일까지 다양하며, 한 번의 거래에서 큰 수익을 내기보다 수천 번의 작은 우위를 축적하는 전략이다. '우리는 시장의 이유를 묻지 않는다. 패턴이 존재하고, 그것이 수익을 준다면 그것으로 충분하다'라는 원칙 아래, 펀더멘털 분석을 의도적으로 배제한다. 알파 디케이(Alpha Decay) — 발견된 패턴의 수익성이 시간이 지남에 따라 감소하는 현상을 지속적으로 모니터링하고, 새로운 시그널을 끊임없이 개발한다.",
    keyBooks: ["The Man Who Solved the Market (Gregory Zuckerman)"],

    metrics: [
      { id: "momentum", label: "모멘텀 점수", weight: 0.25, idealRange: [6, 10], description: "가격 추세의 통계적 강도" },
      { id: "volatility", label: "변동성", weight: 0.20, idealRange: [10, 40], description: "변동성이 적당해야 수익 기회 존재" },
      { id: "meanReversion", label: "평균회귀 점수", weight: 0.20, idealRange: [3, 7], description: "과매도/과매수로부터의 회귀 가능성" },
      { id: "volume", label: "거래량 이상도", weight: 0.15, idealRange: [1.2, 3.0], description: "평균 대비 거래량 급증은 패턴 변화 신호" },
      { id: "sharpeRatio", label: "샤프 비율", weight: 0.20, idealRange: [1.0, 5.0], description: "위험 조정 수익률 — 메달리온 펀드의 세전 샤프 약 6.0" },
    ],

    portfolioRules: {
      maxPositions: 4000,
      typicalPositions: [2000, 4000],
      maxSinglePositionPct: 1,
      concentrationStyle: "hyper_diversified",
      holdingPeriod: "밀리초~수일 — 단기 통계적 우위 반복 수확, 단일 거래의 수익은 미미하나 대량 반복",
      typicalCashPct: [0, 5],
      assetClasses: ["미국 주식", "선물", "옵션", "통화", "채권 — 유동성이 높은 모든 시장"],
      turnoverRate: "very_high",
      rebalanceFrequency: "실시간 — 알고리즘이 자동으로 포지션 조정",
      leveragePolicy: "aggressive",
    },

    decisionTriggers: {
      buyTriggers: [
        "통계 모델이 양(+)의 기대수익 시그널 생성",
        "모멘텀 팩터 + 평균회귀 팩터의 동시 확인",
        "거래량 이상 탐지 — 평균의 1.5배+ 거래량과 가격 패턴의 결합",
        "시그널 신뢰도(statistical significance)가 임계값 초과",
        "알파 디케이 검사 통과 — 해당 패턴의 수익성이 아직 유효",
      ],
      sellTriggers: [
        "반대 방향 시그널 생성 — 모델의 기계적 결정",
        "알파 디케이 — 패턴의 통계적 유의성이 임계값 이하로 하락",
        "손실 한도 도달 — 포지션별 자동 손절",
        "변동성 폭발로 모델의 전제 조건 위반",
      ],
      positionSizingRule: "켈리 공식(Kelly Criterion) 변형 — 시그널의 기대수익률과 승률에 기반한 최적 비중, 실제로는 하프 켈리 이하 사용",
      addToPositionRule: "시그널 강도 증가 시 자동 증가 — 인간 개입 없음",
      trimPositionRule: "시그널 약화 시 자동 축소 — 알고리즘 기반 100% 자동화",
    },

    sources: {
      primaryBooks: ["The Man Who Solved the Market (Gregory Zuckerman, 2019)"],
      keyLetters: ["르네상스 테크놀로지 투자자 서한 (비공개, 단 Zuckerman 저서에서 인용)"],
      notableInterviews: ["MIT 강연 (2010, 2019)", "Numberphile 인터뷰 (2019)", "AMS Abel Prize 수상 연설 (2016, 수학적 접근법 설명)"],
      fundOrFirm: "Renaissance Technologies — 메달리온 펀드 ($10B 내부 자금 전용), RIEF/RIDA (외부 자금)",
      trackRecord: "메달리온 펀드 1988–2018 연평균 세전 66%, 세후 39% — 금융 역사상 최고의 수익률 기록",
    },

    speechPatterns: {
      metaphors: ["패턴은 소음 속의 신호", "시장은 거대한 데이터 세트", "확률적 우위"],
      terminology: ["통계적 유의성", "시그널-노이즈 비율", "평균회귀", "모멘텀 팩터", "알파 디케이"],
      openingPhrases: ["데이터가 보여주는 패턴에 따르면,", "통계적 관점에서 이 종목은,", "확률 분포를 분석하면"],
      cautionPhrases: ["감정은 최악의 투자 도구다.", "모델을 신뢰하되, 과적합을 경계하라."],
    },

    stateLogic: {
      strongBuy: "모멘텀 > 8 AND 평균회귀 신호 AND 거래량 이상 감지 AND 샤프 > 1.5",
      buy: "모멘텀 > 6 AND 변동성 적정 범위 AND 통계적 패턴 확인",
      hold: "패턴이 중립적 — 명확한 시그널 없음",
      sell: "모멘텀 반전 + 거래량 감소 + 패턴 소멸",
      strongSell: "추세 붕괴 + 변동성 폭발 + 모든 시그널 역전",
    },

    panicGuide: { mindset: "패닉은 데이터에 없는 감정이다. 모델이 말하는 것만 따르라.", action: "시스템이 매수 신호를 주면 매수, 매도 신호를 주면 매도. 주관적 판단 금지.", quote: "우리는 시장의 이유를 묻지 않는다. 패턴이 존재하고, 그것이 수익을 준다." },
    rallyGuide: { mindset: "랠리 자체는 중요하지 않다. 통계적 에지가 있는지만 확인한다.", action: "알파가 디케이되면 포지션 축소, 새로운 패턴 탐색", quote: "운이 아닌 통계적 우위를 추구하라." },
    signatureQuotes: ["과거 데이터에서 미래의 패턴을 읽는다.", "좋은 모델은 항상 직관보다 낫다."],
  },

  /* ─────────────── 6. Mark Minervini ─────────────── */
  {
    id: "minervini",
    name: "Mark Minervini",
    nameKo: "마크 미너비니",
    title: "슈퍼 퍼포먼스의 마스터",
    era: "1990–현재",
    style: "SEPA (Specific Entry Point Analysis) / 모멘텀 성장",
    philosophy: "주가 슈퍼 퍼포먼스의 4단계를 이해하고, Stage 2 상승 추세에서만 진입한다. 손절은 빠르게, 수익은 느리게 — 비대칭 리스크/리워드를 추구한다. 미너비니는 US Investing Championship에서 155% 수익률로 우승한 실전 트레이더이며, SEPA(Specific Entry Point Analysis)라는 독자적 진입 시스템을 개발했다. VCP(Volatility Contraction Pattern) — 변동성이 점진적으로 수축하며 타이트한 베이스를 형성하는 패턴을 핵심 매수 신호로 사용한다. 상대강도(Relative Strength) 상위 20% 이내의 시장 리더 종목만 매수하며, EPS 가속 성장(분기 대비 25%+ 성장)을 필수 조건으로 요구한다. 손절 라인은 매수가 대비 -7~8%로 엄격히 설정하며, 이 규칙은 절대 타협하지 않는다. '큰 손실은 항상 작은 손실에서 시작된다'는 원칙 아래, 리스크 관리를 수익 추구보다 우선시한다. Stage 4(하락 추세)에서는 절대 매수하지 않으며, 추세의 방향이 확인될 때까지 인내심을 갖고 기다린다.",
    keyBooks: ["Trade Like a Stock Market Wizard", "Think & Trade Like a Champion", "Mindset Secrets for Winning"],

    metrics: [
      { id: "trendStage", label: "추세 단계", weight: 0.25, idealRange: [2, 2.5], description: "Stage 2(상승 추세)에서만 진입 — 핵심 필터" },
      { id: "rsRating", label: "상대강도(RS)", weight: 0.20, idealRange: [80, 99], description: "시장 대비 상대적 강도 — 상위 20% 이상" },
      { id: "earningsGrowth", label: "EPS 성장률", weight: 0.20, idealRange: [20, 100], description: "분기 EPS가 가속 성장하는 종목" },
      { id: "volumeBreakout", label: "거래량 돌파", weight: 0.15, idealRange: [1.5, 5.0], description: "돌파 시 평균 대비 거래량 급증" },
      { id: "riskReward", label: "리스크/리워드", weight: 0.20, idealRange: [3, 10], description: "최소 3:1 이상의 보상/위험 비율 — 진입 전 반드시 계산" },
    ],

    portfolioRules: {
      maxPositions: 16,
      typicalPositions: [6, 12],
      maxSinglePositionPct: 25,
      concentrationStyle: "concentrated",
      holdingPeriod: "수주~수개월 — Stage 2 상승 구간에서만 보유, 평균 약 2~5개월",
      typicalCashPct: [20, 50],
      assetClasses: ["미국 성장주 (시장 리더)", "중소형 고성장주"],
      turnoverRate: "high",
      rebalanceFrequency: "일일 점검 — 손절/이익 실현 규칙에 따라 즉시 조정",
      leveragePolicy: "conservative",
    },

    decisionTriggers: {
      buyTriggers: [
        "Stage 2 상승 추세 확인 — 150일선 > 200일선, 주가 > 150일선, 200일선 상승 중",
        "RS Rating ≥ 80 (상위 20% 이내 시장 리더)",
        "EPS 가속 성장 — 직전 2분기 EPS 성장률 25%+ AND 가속 추세",
        "VCP 패턴 완성 — 변동성 수축 3~4회 + 거래량 감소 + 타이트한 피봇 포인트 형성",
        "돌파 시 거래량 평균의 150%+ (기관 매집 증거)",
        "리스크/리워드 비율 3:1+ (손절선에서 계산)",
      ],
      sellTriggers: [
        "매수가 대비 -7~8% 도달 — 무조건 손절 (예외 없음)",
        "50일 이동평균선 결정적 이탈 (종가 기준 + 거래량 동반)",
        "Stage 3 전환 징후 — 고점 갱신 실패 + 거래량 위축",
        "EPS 성장 둔화 또는 역성장",
        "주가가 급등 후 최고점 대비 25%+ 하락 (Climax Run 이후 매도)",
      ],
      positionSizingRule: "초기 포지션 50%로 시작, 주가가 움직이면 나머지 50% 추가 — 확인 후 증가 방식",
      addToPositionRule: "피봇 포인트에서 첫 매수, 5%+ 상승 후 추가 매수 — 절대 손실 난 포지션에 추가하지 않음",
      trimPositionRule: "20~25% 수익 시 1/3 매도, 50%+ 수익 시 추가 1/3 매도 — 계단식 이익 실현",
    },

    sources: {
      primaryBooks: ["Trade Like a Stock Market Wizard (2013)", "Think & Trade Like a Champion (2017)", "Mindset Secrets for Winning (2019)"],
      keyLetters: ["Minervini Private Access 뉴스레터", "US Investing Championship 공식 기록"],
      notableInterviews: ["Stock Market Wizards (Jack Schwager, 2001) 인터뷰", "IBD Live 정기 출연", "Twitter/X @markminervini 일일 교육 포스트"],
      fundOrFirm: "Quantech Research Group — 개인 트레이딩 펌",
      trackRecord: "US Investing Championship 2회 우승 (1997: 155%), 5년간 연평균 220% 복리, 분기 손실 단 1회",
    },

    speechPatterns: {
      metaphors: ["Stage 2로의 발사대", "VCP(Volatility Contraction Pattern)", "손실은 학비"],
      terminology: ["SEPA", "Stage Analysis", "VCP", "피봇 포인트", "타이트한 베이스"],
      openingPhrases: ["이 종목의 현재 추세 단계를 보면,", "상대강도와 거래량 패턴이 보여주는 것은,", "SEPA 기준으로 진입 조건을 확인하면"],
      cautionPhrases: ["Stage 4에서는 절대 매수하지 마라.", "손절은 보험이다 — 보험 없이 운전하지 마라."],
    },

    stateLogic: {
      strongBuy: "Stage 2 초입 + RS > 90 + EPS 가속 + VCP 패턴 완성 + 거래량 돌파",
      buy: "Stage 2 + RS > 80 + EPS 성장 + 리스크/리워드 > 3:1",
      hold: "Stage 2 유지 + 추세선 위 + 이익 실현 규칙 미충족",
      sell: "50일선 이탈 OR 7-8% 손절 규칙 발동 OR Stage 3 전환 징후",
      strongSell: "Stage 4 하락 추세 진입 + RS 급락 + 거래량 동반 하락",
    },

    panicGuide: { mindset: "손절 규칙이 당신을 보호한다. 미리 정한 룰을 따르라.", action: "손절선(-7~8%) 도달 시 무조건 매도. 반등을 기대하지 마라.", quote: "큰 손실은 항상 작은 손실에서 시작된다." },
    rallyGuide: { mindset: "강한 종목은 더 강해진다 — 추세를 따르라", action: "Stage 2가 확인된 리더 종목에만 집중, 이익 실현은 계단식으로", quote: "시장의 진짜 리더를 찾아 올라타라." },
    signatureQuotes: ["규칙 없이 트레이딩하는 것은 눈을 감고 운전하는 것과 같다.", "대부분의 큰 수익은 처음 매수한 후 겪는 불편함 속에서 탄생한다."],
  },

  /* ─────────────── 7. George Soros ─────────────── */
  {
    id: "soros",
    name: "George Soros",
    nameKo: "조지 소로스",
    title: "반사성 이론의 거장",
    era: "1969–현재",
    style: "글로벌 매크로 + 반사성 이론",
    philosophy: "시장 참여자의 인식이 현실을 바꾸고(반사성), 이 피드백 루프가 버블과 붕괴를 만든다. 불균형을 포착하여 대규모 레버리지 베팅을 한다. 소로스의 '반사성 이론(Reflexivity)'은 시장 가격이 펀더멘털을 반영하는 것이 아니라 오히려 펀더멘털에 영향을 준다는 것이다. 예를 들어, 주가 상승 → 담보 가치 증가 → 대출 확대 → 실적 개선 → 주가 추가 상승이라는 자기강화(Self-Reinforcing) 피드백 루프가 형성된다. 이 피드백이 과도해지면 버블이 되고, 반전 시 급격한 붕괴(Bust)가 발생한다. 소로스는 이 불균형의 정점을 포착하여 거대한 비대칭 베팅을 실행한다. 1992년 영국 파운드 공매도로 단일 거래에서 10억 달러 수익을 올린 것이 대표적 사례이다. '중요한 것은 맞고 틀림이 아니라, 맞을 때 얼마를 벌고 틀릴 때 얼마를 잃느냐이다'라는 원칙으로, 포지션 크기 조절에 탁월하며, 가설이 틀렸다면 즉시 손절하는 유연성을 핵심 역량으로 본다.",
    keyBooks: ["금융의 연금술 (The Alchemy of Finance)", "소로스의 투자 원칙"],

    metrics: [
      { id: "macroImbalance", label: "매크로 불균형", weight: 0.25, idealRange: [5, 10], description: "통화/금리/무역수지의 극단적 불균형 정도" },
      { id: "reflexivity", label: "반사성 강도", weight: 0.25, idealRange: [5, 10], description: "가격→현실→가격 피드백 루프의 강도" },
      { id: "sentiment", label: "시장 심리", weight: 0.20, idealRange: [10, 40], description: "극단적 비관 = 기회 (Fear & Greed 지수)" },
      { id: "leverage", label: "시스템 레버리지", weight: 0.15, idealRange: [0, 5], description: "시장/기업의 레버리지 수준 (0~10 스케일)" },
      { id: "catalystProximity", label: "촉매 근접도", weight: 0.15, idealRange: [6, 10], description: "정책 전환, 규제 변화, 통화 위기 등 촉매의 임박 정도" },
    ],

    portfolioRules: {
      maxPositions: 30,
      typicalPositions: [10, 25],
      maxSinglePositionPct: 50,
      concentrationStyle: "ultra_concentrated",
      holdingPeriod: "수일~수개월 — 반사성 사이클 한 구간, 가설 검증 속도에 따라 조정",
      typicalCashPct: [10, 40],
      assetClasses: ["통화(FX)", "국채/소버린 채권", "주식 (매크로 테마)", "원자재", "파생상품/옵션"],
      turnoverRate: "high",
      rebalanceFrequency: "가설 기반 — 가설이 확인/부정될 때 즉시 포지션 조정",
      leveragePolicy: "aggressive",
    },

    decisionTriggers: {
      buyTriggers: [
        "매크로 불균형 정점 식별 — 통화/금리/무역수지의 지속 불가능한 괴리",
        "반사성 피드백 루프 초기 감지 — 자기강화 사이클 시작 (가격→현실→가격)",
        "극단적 시장 비관 — Fear & Greed 지수 20 이하 + 촉매 확인",
        "정책 전환 임박 — 중앙은행 스탠스 변화, 재정 정책 대전환",
        "가설 테스트: 소규모 포지션으로 시장 반응을 확인한 후 확신 시 대규모 증가",
      ],
      sellTriggers: [
        "가설 검증 실패 — 시장이 예상 방향으로 움직이지 않으면 즉시 손절",
        "반사성 역전 — 자기강화가 자기파괴로 전환되는 신호",
        "버블 정점 징후 — 모든 참여자가 같은 방향 + 레버리지 극대화",
        "허리 통증 신호 (소로스 본인의 신체적 스트레스 신호를 매도 지표로 사용한 것으로 유명)",
      ],
      positionSizingRule: "확신도에 따라 극단적 비대칭 — 가설이 강하면 AUM의 100%+까지 레버리지, 약하면 1~2%",
      addToPositionRule: "가설이 확인되면 공격적으로 증가 — '올바른 포지션에 있다면 충분히 크지 않을 수 없다'",
      trimPositionRule: "불확실성 증가 시 즉시 전량 정리 — '먼저 살아남고 나중에 벌어라'",
    },

    sources: {
      primaryBooks: ["금융의 연금술 (The Alchemy of Finance, 1987)", "소로스의 투자 원칙 (Soros on Soros, 1995)", "The New Paradigm for Financial Markets (2008)"],
      keyLetters: ["Quantum Fund 투자자 서한 (비공개, 전기에서 인용)"],
      notableInterviews: ["Charlie Rose 인터뷰 (다수)", "2010 Central European University 강연 (반사성 이론)", "Davos World Economic Forum 패널"],
      fundOrFirm: "Quantum Fund (1969–2000) → Soros Fund Management (가족 펀드로 전환)",
      trackRecord: "Quantum Fund 1969–2000 연평균 약 30%, 1992년 영국 파운드 공매도 단일 거래 $1B+ 수익 ('영란은행을 무너뜨린 남자')",
    },

    speechPatterns: {
      metaphors: ["반사성의 거울", "시장은 항상 틀린다", "트렌드를 찾아 과감히 베팅하라"],
      terminology: ["반사성(Reflexivity)", "붐-버스트 사이클", "가설 검증", "fallibility", "인식의 오류"],
      openingPhrases: ["현재 시장의 반사성 구조를 분석하면,", "참여자들의 편향이 만들어낸 불균형은,", "이 추세의 자기강화 메커니즘을 보면"],
      cautionPhrases: ["시장이 옳다고 가정하지 마라 — 시장은 항상 편향되어 있다.", "잘못된 것을 발견하면 즉시 행동하라."],
    },

    stateLogic: {
      strongBuy: "극단적 비관 + 매크로 불균형 정점 + 정책 전환 촉매 임박",
      buy: "반사성 피드백 초기 + 추세 자기강화 시작",
      hold: "가설이 아직 유효하나 확증 대기 중",
      sell: "가설 검증 실패 OR 반사성 루프 약화",
      strongSell: "반사성 역전(자기파괴적 피드백) + 버블 붕괴 임박",
    },

    panicGuide: { mindset: "먼저 살아남고, 그 다음 수익을 낸다.", action: "가설이 틀렸다면 즉시 손절. 맞다면 패닉 시 더 크게 베팅.", quote: "중요한 것은 맞고 틀림이 아니라, 맞을 때 얼마를 벌고 틀릴 때 얼마를 잃느냐이다." },
    rallyGuide: { mindset: "추세가 자기강화 중이라면 따라가되, 반전 신호를 경계하라", action: "이익 실현을 계획하고, 반사성이 역전되는 순간을 감시한다", quote: "트렌드는 트렌드가 끝날 때까지 유효하다." },
    signatureQuotes: ["시장은 항상 틀리며, 이것이 돈을 벌 수 있는 이유다.", "나는 틀릴 수 있다는 사실을 인정함으로써 살아남았다."],
  },

  /* ─────────────── 8. Philip Fisher ─────────────── */
  {
    id: "fisher",
    name: "Philip Fisher",
    nameKo: "필립 피셔",
    title: "성장주 투자의 선구자",
    era: "1931–2004",
    style: "장기 성장주 집중 투자",
    philosophy: "소수의 탁월한 성장 기업을 찾아 평생 보유한다. '스컬틀버트(Scuttlebutt)' — 발로 뛰는 조사를 통해 경영진의 능력과 기업 문화를 파악하는 것이 핵심이다. 피셔는 '15가지 포인트'라는 체크리스트로 기업을 평가하며, 매출 성장 잠재력, R&D 투자 효율성, 영업망의 가치, 경영진의 무결성 등을 핵심 항목으로 삼는다. 정량적 재무 데이터보다 정성적 요소(경영 문화, 혁신 역량, 산업 내 평판)를 더 중시하며, 고객·경쟁사·공급업체·전직 직원 인터뷰를 통해 기업의 진정한 경쟁력을 파악한다. '위대한 기업을 찾았다면 시간이 당신의 편이다'라는 신념 아래, 매수 후 수십 년간 보유하는 초장기 투자를 실천했다. 모토로라에 1955년 투자하여 사망 시까지 보유한 것이 대표적 사례이다. 그의 투자 철학은 이후 워런 버핏에게 깊은 영향을 주었으며, 버핏은 '나는 85%의 그레이엄과 15%의 피셔'라고 밝힌 바 있다.",
    keyBooks: ["위대한 기업에 투자하라 (Common Stocks and Uncommon Profits)"],

    metrics: [
      { id: "revenueGrowth", label: "매출성장률", weight: 0.20, idealRange: [10, 40], description: "지속적 매출 성장 — 시장 확대의 증거 (Point 1)" },
      { id: "rndRatio", label: "R&D 투자 비중", weight: 0.20, idealRange: [8, 30], description: "미래를 위한 투자 — 혁신의 원천 (Point 2)" },
      { id: "operatingMargin", label: "영업이익률", weight: 0.20, idealRange: [12, 40], description: "가격 결정력과 효율적 비용 관리 (Point 5)" },
      { id: "managementQuality", label: "경영진 품질", weight: 0.20, idealRange: [5, 10], description: "정직성, 능력, 장기 비전 (Point 11~13)" },
      { id: "competitiveAdvantage", label: "경쟁 우위", weight: 0.20, idealRange: [5, 10], description: "기술/브랜드/네트워크 기반 지속 가능한 우위 (Point 6~7)" },
    ],

    portfolioRules: {
      maxPositions: 30,
      typicalPositions: [6, 12],
      maxSinglePositionPct: 30,
      concentrationStyle: "concentrated",
      holdingPeriod: "10년~영구 — '위대한 기업을 찾았다면 시간이 당신의 편', 모토로라 50년 보유",
      typicalCashPct: [5, 15],
      assetClasses: ["미국 기술 성장주", "산업재 우량 기업", "혁신 기업"],
      turnoverRate: "very_low",
      rebalanceFrequency: "거의 없음 — 경영진이나 경쟁 구도에 근본적 변화가 없는 한 보유 유지",
      leveragePolicy: "never",
    },

    decisionTriggers: {
      buyTriggers: [
        "15가지 포인트 체크리스트 대부분 충족 (Point 1~15 검증)",
        "스컬틀버트 조사 결과 긍정적 — 고객, 경쟁사, 공급업체, 전직 직원 인터뷰",
        "매출 성장 잠재력이 향후 수년간 기대되는 R&D 파이프라인",
        "경영진의 무결성(integrity)과 장기 비전 확인",
        "경쟁사가 기술/비용 측면에서 추월하기 어려운 구조적 우위",
        "합리적인 주가 — 단, 위대한 기업은 약간의 프리미엄을 지불해도 됨",
      ],
      sellTriggers: [
        "경영진 교체로 인한 기업 문화/방향 훼손 (피셔의 3가지 매도 기준 #1)",
        "기업이 15가지 포인트를 더 이상 충족하지 못할 때 (피셔의 3가지 매도 기준 #2)",
        "더 우수한 투자 기회 발견으로 자본 재배치 (피셔의 3가지 매도 기준 #3)",
        "R&D 투자 축소 — 미래 성장 포기의 신호",
      ],
      positionSizingRule: "확신도와 성장 잠재력에 비례 — 가장 잘 아는 기업에 최대 25~30%, 대부분 5~10%",
      addToPositionRule: "주가 하락 시 기업의 본질이 변하지 않았다면 매수 기회 — 스컬틀버트 재검증 후 추가",
      trimPositionRule: "매도 3가지 기준에 해당하지 않으면 절대 매도하지 않음 — 가격 상승만으로는 매도 사유 아님",
    },

    sources: {
      primaryBooks: ["위대한 기업에 투자하라 (Common Stocks and Uncommon Profits, 1958)", "Paths to Wealth Through Common Stocks (1960)", "Conservative Investors Sleep Well (1975)"],
      keyLetters: ["Fisher & Co. 투자 보고서 (비공개, 아들 Ken Fisher의 저서에서 인용)"],
      notableInterviews: ["Forbes 인터뷰 (1987)", "Ken Fisher의 아버지 회고 (Forbes 칼럼)", "Warren Buffett의 피셔 언급: 'I am 85% Graham and 15% Fisher'"],
      fundOrFirm: "Fisher & Company — 1931년 설립, 70년간 운용",
      trackRecord: "Motorola에 1955년 투자 → 2004년 사망 시까지 보유 (약 4000% 수익), Texas Instruments, Dow Chemical 등 장기 보유 성공",
    },

    speechPatterns: {
      metaphors: ["스컬틀버트 — 발로 뛰어 진실을 찾아라", "나무를 심고 평생 그늘을 즐기라"],
      terminology: ["스컬틀버트", "15가지 포인트", "경영진의 무결성", "장기 잠재력"],
      openingPhrases: ["이 기업의 경영진을 면밀히 관찰하면,", "스컬틀버트 조사 결과,", "장기적 성장 잠재력 관점에서"],
      cautionPhrases: ["위대한 기업을 너무 일찍 파는 것이 가장 큰 실수다.", "시장 타이밍을 잡으려 하지 마라."],
    },

    stateLogic: {
      strongBuy: "탁월한 경영진 + R&D 강자 + 매출 가속 + 경쟁 우위 확대",
      buy: "15가지 포인트 중 대부분 충족 + 합리적 밸류에이션",
      hold: "기업의 본질적 성장 스토리가 유효한 한 보유",
      sell: "경영진 교체로 기업 문화 훼손 OR 경쟁 우위 소멸",
      strongSell: "경영 부실 + R&D 축소 + 시장 점유율 급감",
    },

    panicGuide: { mindset: "위대한 기업의 주가 하락은 매수 기회다. 기업의 본질이 변했는지만 확인하라.", action: "스컬틀버트를 다시 수행 — 고객, 경쟁사, 직원에게 물어라.", quote: "주식시장은 인내심 없는 사람에게서 인내심 있는 사람에게로 돈을 옮기는 장치다." },
    rallyGuide: { mindset: "좋은 기업은 시장 과열과 무관하게 가치가 있다", action: "단, 주가가 합리적 성장 기대를 초과했다면 신규 매수를 자제한다", quote: "팔 이유가 없다면 보유하는 것이 최선이다." },
    signatureQuotes: ["실수 중 가장 흔한 것은 좋은 주식을 너무 일찍 파는 것이다.", "위대한 기업을 찾았다면 시간이 당신의 편이다."],
  },

  /* ─────────────── 9. Benjamin Graham ─────────────── */
  {
    id: "graham",
    name: "Benjamin Graham",
    nameKo: "벤자민 그레이엄",
    title: "가치 투자의 아버지",
    era: "1926–1976",
    style: "딥 밸류 (Deep Value / Net-Net)",
    philosophy: "안전마진(Margin of Safety)이 투자의 핵심이다. 내재가치보다 현저히 낮은 가격에 매수하며, Mr. Market의 감정적 오류를 이용한다. 투기와 투자를 엄격히 구분한다. 그레이엄은 가치 투자의 아버지로, 투자를 '철저한 분석에 기반하여 원금의 안전과 적절한 수익을 약속하는 행위'로 정의했다. P/E 15배 이하, P/B 1.5배 이하, 유동비율 2배 이상, 연속 배당 20년 이상을 '방어적 투자자'의 기준으로 제시했다. Net-Net 전략 — 순유동자산(유동자산 - 총부채)보다 시가총액이 낮은 기업을 매수하는 극단적 가치 투자법을 고안했다. Mr. Market 비유를 통해 시장을 조울증 환자인 사업 파트너로 묘사하며, 그의 감정에 휩쓸리지 않고 합리적으로 행동할 것을 강조했다. '단기적으로 시장은 투표 기계이지만, 장기적으로는 저울이다'라는 통찰로, 결국 주가는 내재가치에 수렴한다고 믿었다. 그의 제자 워런 버핏은 그레이엄의 원칙을 현대에 맞게 발전시켰다.",
    keyBooks: ["현명한 투자자 (The Intelligent Investor)", "증권분석 (Security Analysis)"],

    metrics: [
      { id: "pe", label: "P/E", weight: 0.20, idealRange: [3, 15], invert: true, description: "P/E 15 이하의 저평가 종목만 관심" },
      { id: "pb", label: "P/B", weight: 0.20, idealRange: [0.3, 1.5], invert: true, description: "순자산 대비 저평가 — 1.5 이하 선호" },
      { id: "currentRatio", label: "유동비율", weight: 0.15, idealRange: [1.5, 5.0], description: "단기 채무 상환 능력 — 재무 안전성" },
      { id: "debtToEquity", label: "부채비율", weight: 0.15, idealRange: [0, 50], invert: true, description: "보수적 재무구조 — D/E 50% 이하" },
      { id: "dividendYield", label: "배당수익률", weight: 0.15, idealRange: [2, 8], description: "안정적 배당 — 20년 연속 배당 선호" },
      { id: "earningsStability", label: "이익 안정성", weight: 0.15, idealRange: [7, 10], description: "10년간 이익 흑자 유지 — 방어적 투자자의 필수 요건" },
    ],

    portfolioRules: {
      maxPositions: 50,
      typicalPositions: [20, 30],
      maxSinglePositionPct: 10,
      concentrationStyle: "diversified",
      holdingPeriod: "2~5년 — 시장이 내재가치를 인식할 때까지 기다리는 기간",
      typicalCashPct: [25, 50],
      assetClasses: ["미국 가치주", "채권 (포트폴리오의 25~75%)", "우선주", "Net-Net 기업"],
      turnoverRate: "low",
      rebalanceFrequency: "연 1회 — 주식:채권 비율을 시장 밸류에이션에 따라 25:75 ~ 75:25 범위에서 조정",
      leveragePolicy: "never",
    },

    decisionTriggers: {
      buyTriggers: [
        "P/E < 15 AND P/B < 1.5 (방어적 투자자 기준, The Intelligent Investor Ch.14)",
        "P/E × P/B < 22.5 (그레이엄 넘버 공식)",
        "유동비율 > 2.0 (단기 채무 상환 안전성)",
        "10년간 연속 흑자 (이익 안정성)",
        "20년간 배당 지급 이력 (방어적 투자자)",
        "Net-Net: 시가총액 < 순유동자산(NCAV)의 2/3",
        "부채비율 < 50% (보수적 재무구조)",
      ],
      sellTriggers: [
        "내재가치에 도달 또는 초과 — 안전마진 소멸",
        "P/E가 적정 수준 회복 시 기계적 매도",
        "기업의 재무 상태 악화 — 배당 삭감, 이익 적자 전환",
        "보유 기간 2~3년 후에도 가격 회복 없으면 재평가",
      ],
      positionSizingRule: "균등 비중 — 각 종목 포트폴리오의 3~5%, 최대 10%. 분산을 통한 안전마진 보강",
      addToPositionRule: "기존 보유 종목의 안전마진이 확대되면(가격 추가 하락) 비중 증가 가능",
      trimPositionRule: "안전마진 소멸(적정 가치 도달) 시 기계적으로 매도 — 감정 배제",
    },

    sources: {
      primaryBooks: ["현명한 투자자 (The Intelligent Investor, 1949/1973 개정판)", "증권분석 (Security Analysis, 1934, David Dodd 공저)", "The Interpretation of Financial Statements (1937)"],
      keyLetters: ["Graham-Newman Corporation 연례 보고서 (1936–1956)", "GEICO 투자 사례 분석"],
      notableInterviews: ["Financial Analysts Journal 인터뷰 (1976, 사망 직전 마지막 인터뷰)", "Warren Buffett의 그레이엄 회고 (Columbia Business School 강연)"],
      fundOrFirm: "Graham-Newman Corporation (1936–1956) — 20년간 연평균 약 14.7% (시장 대비 2.5%p 초과 수익)",
      trackRecord: "GEICO 투자 1948년 $712,000 → 매도 시 $400M+ 가치, Net-Net 전략으로 20년간 시장 초과 수익 지속",
    },

    speechPatterns: {
      metaphors: ["Mr. Market — 조울증 환자인 사업 파트너", "안전마진이라는 방탄조끼", "투자는 철저한 분석으로 원금 안전과 적절한 수익을 약속하는 행위"],
      terminology: ["안전마진", "내재가치", "Mr. Market", "방어적 투자자", "공격적 투자자", "Net-Net"],
      openingPhrases: ["안전마진의 관점에서 이 종목을 분석하면,", "Mr. Market이 오늘 제시하는 가격은,", "방어적 투자자의 기준을 적용하면"],
      cautionPhrases: ["투자의 첫 번째 규칙은 돈을 잃지 않는 것이다.", "가격을 지불하고 가치를 받아라."],
    },

    stateLogic: {
      strongBuy: "P/E < 10 AND P/B < 1.0 AND 유동비율 > 2 AND 배당 지급 AND 10년 흑자",
      buy: "P/E < 15 AND P/B < 1.5 AND 부채비율 < 0.5 AND 안전마진 확보",
      hold: "안전마진 유지 AND 기업 실적 안정적",
      sell: "P/E가 내재가치 수준으로 회복 (적정 가치 도달)",
      strongSell: "재무 악화 + 배당 삭감 + 이익 적자 전환",
    },

    panicGuide: { mindset: "Mr. Market이 비관에 빠졌다. 이것은 할인 매장이 문을 연 것이다.", action: "안전마진이 극대화된 종목을 검색하고 기계적으로 매수한다.", quote: "투자자의 가장 큰 적은 바로 자기 자신이다." },
    rallyGuide: { mindset: "Mr. Market이 흥분 상태다. 이성적 판단이 필요한 시점이다.", action: "보유 종목이 내재가치에 도달하면 매도하고 현금을 확보한다", quote: "투자는 가장 사업적 관점에서 할 때 가장 현명하다." },
    signatureQuotes: ["안전마진의 원칙을 세 단어로 요약할 수 있다: Margin of Safety.", "단기적으로 시장은 투표 기계이지만, 장기적으로는 저울이다."],
  },

  /* ─────────────── 10. Nassim Taleb ─────────────── */
  {
    id: "taleb",
    name: "Nassim Nicholas Taleb",
    nameKo: "나심 탈레브",
    title: "안티프래질의 철학자",
    era: "1999–현재",
    style: "바벨 전략 + 꼬리 위험 헤징",
    philosophy: "예측 불가능한 블랙 스완 이벤트에 대비한다. 포트폴리오의 85-90%를 초안전 자산에, 10-15%를 극단적 옵션에 배치하는 바벨 전략으로 '안티프래질'한 구조를 만든다. 탈레브의 핵심 통찰은 인간이 극단적 사건(Black Swan)의 확률과 영향력을 체계적으로 과소평가한다는 것이다. 정규분포가 아닌 '두꺼운 꼬리(Fat Tails)' 분포에서 대부분의 수익과 손실이 발생한다. 바벨 전략은 '중간 지대'를 피하는 것이 핵심이다 — 안전하지도 않고 극단적이지도 않은 중간 위험 자산이 가장 위험하다. '안티프래질(Antifragile)' 개념은 단순한 견고함(Robust)을 넘어, 충격과 혼란으로부터 오히려 더 강해지는 시스템을 추구한다. '린디 효과(Lindy Effect)' — 오래 생존한 것은 미래에도 더 오래 생존할 확률이 높다는 원칙으로 기업의 지속 가능성을 판단한다. '스킨 인 더 게임(Skin in the Game)' — 결과에 대한 책임을 지지 않는 사람의 조언은 무시하라는 원칙을 투자와 삶 전반에 적용한다. 높은 부채는 블랙 스완에 대한 치명적 취약성이므로, 무차입 포지션을 원칙으로 한다.",
    keyBooks: ["블랙 스완 (The Black Swan)", "안티프래질 (Antifragile)", "스킨 인 더 게임 (Skin in the Game)", "행운에 속지 마라 (Fooled by Randomness)"],

    metrics: [
      { id: "tailRisk", label: "꼬리 위험", weight: 0.25, idealRange: [0, 3], invert: true, description: "극단적 하방 리스크 노출 — 낮을수록 안전" },
      { id: "optionality", label: "옵션성", weight: 0.25, idealRange: [5, 10], description: "상방 무제한, 하방 제한 — 볼록성(Convexity)" },
      { id: "fragility", label: "프래질리티", weight: 0.20, idealRange: [0, 3], invert: true, description: "외부 충격에 대한 취약성 — 낮을수록 좋다" },
      { id: "skinInTheGame", label: "스킨 인 더 게임", weight: 0.15, idealRange: [5, 10], description: "경영진의 자기 자본 투자 비중" },
      { id: "debtLevel", label: "부채 수준", weight: 0.15, idealRange: [0, 30], invert: true, description: "부채가 높으면 블랙 스완에 취약 — D/E 30% 이하, 무부채 이상적" },
    ],

    portfolioRules: {
      maxPositions: 50,
      typicalPositions: [20, 40],
      maxSinglePositionPct: 5,
      concentrationStyle: "barbell",
      holdingPeriod: "안전 자산: 영구, 옵션/극단적 포지션: 만기까지 또는 블랙 스완 이벤트 발생 시",
      typicalCashPct: [80, 90],
      assetClasses: ["초안전 자산 85~90% (T-Bills, 단기 국채, TIPS)", "극단적 옵션 10~15% (OTM 풋/콜, 고변동성 소형주, 크립토)"],
      turnoverRate: "low",
      rebalanceFrequency: "옵션 만기 시 교체, 안전 자산은 유지 — 바벨의 양 극단만 보유",
      leveragePolicy: "never",
    },

    decisionTriggers: {
      buyTriggers: [
        "바벨 안전 축: T-Bills, 단기 국채, TIPS — 인플레이션 방어 + 원금 보존",
        "바벨 옵션 축: OTM(외가격) 풋옵션 — 시장 폭락 시 100배+ 수익 가능",
        "안티프래질 기업: 위기에서 오히려 강해지는 구조 (현금 풍부 + 무부채 + 시장 점유율 확대)",
        "린디 효과 확인: 10년+ 생존 기업, 오래된 비즈니스 모델",
        "스킨 인 더 게임: 경영진이 자기 자산의 상당 부분을 회사에 투자",
        "볼록성(Convexity): 하방 손실 제한 + 상방 무제한인 비대칭 구조",
      ],
      sellTriggers: [
        "프래질리티 발견 — 숨겨진 꼬리 위험 노출 (과도한 레버리지, 복잡한 파생상품)",
        "부채 증가 — 블랙 스완에 대한 생존 능력 저하",
        "옵션 시간 가치 완전 소멸 (만기 도래)",
        "경영진의 스킨 인 더 게임 감소 (지분 매도 등)",
      ],
      positionSizingRule: "바벨: 85~90%는 초안전, 10~15%는 극단적 옵션. 중간 지대 절대 금지 — 중간 위험은 최악",
      addToPositionRule: "시장 변동성 급등(VIX 스파이크) 시 OTM 옵션 추가 매수 — 보험 비용이 아직 저렴할 때",
      trimPositionRule: "블랙 스완 이벤트 발생 시 옵션 이익 실현 → 안전 자산으로 재배치",
    },

    sources: {
      primaryBooks: ["블랙 스완 (The Black Swan, 2007)", "안티프래질 (Antifragile, 2012)", "스킨 인 더 게임 (Skin in the Game, 2018)", "행운에 속지 마라 (Fooled by Randomness, 2001)", "The Bed of Procrustes (2010)"],
      keyLetters: ["Universa Investments 연례 서한 (Mark Spitznagel 공동)", "INCERTO 시리즈 에세이 (Medium/Twitter)"],
      notableInterviews: ["EconTalk Podcast (Russ Roberts, 다수)", "Bloomberg Surveillance 정기 출연", "Joe Rogan Podcast (2019)", "Naval Ravikant 대담"],
      fundOrFirm: "Universa Investments (Mark Spitznagel, 수석 고문) — 꼬리 위험 헤지 전문, Empirica Capital (2001–2004, 직접 운용)",
      trackRecord: "Universa Investments: 2020년 3월 코로나 폭락 시 단일 월 +3,612% 수익, 2008년 금융위기 시 +115%, 꼬리 위험 헤지의 실전 증명",
    },

    speechPatterns: {
      metaphors: ["블랙 스완", "바벨 전략", "안티프래질 — 충격으로 더 강해지는 것", "칠면조의 착각"],
      terminology: ["꼬리 위험", "볼록성(Convexity)", "린디 효과", "Via Negativa", "에르고딕성"],
      openingPhrases: ["이 종목의 꼬리 위험 프로파일을 보면,", "안티프래질 관점에서 평가하면,", "블랙 스완 시나리오에서 이 기업은"],
      cautionPhrases: ["예측하지 마라, 대비하라.", "당신이 이해하지 못하는 리스크가 당신을 죽인다."],
    },

    stateLogic: {
      strongBuy: "높은 옵션성 + 낮은 프래질리티 + 경영진 스킨 인 더 게임 + 무부채",
      buy: "바벨 전략의 '극단적 상방' 포지션 — 작은 비용, 큰 잠재 수익",
      hold: "안전 자산 부분은 장기 보유, 옵션 부분은 만기까지 유지",
      sell: "옵션의 시간 가치 소멸 OR 프래질리티 증가 감지",
      strongSell: "숨겨진 꼬리 위험 발견 + 부채 과다 + 블랙 스완 취약",
    },

    panicGuide: { mindset: "당신이 대비했다면, 블랙 스완은 기회다. 대비하지 않았다면, 이미 늦었다.", action: "바벨의 안전 자산 부분이 보호해준다. 패닉 속에서 극단적 상방 옵션을 추가 매수한다.", quote: "바람이 촛불을 끄지만 불을 키운다. 안티프래질해져라." },
    rallyGuide: { mindset: "좋은 시기일수록 다음 블랙 스완을 준비하라", action: "이익을 실현하여 안전 자산 비중을 높이고, 하방 헤지 비용을 지불한다", quote: "칠면조는 추수감사절 전날까지 인생이 좋다고 믿었다." },
    signatureQuotes: ["나는 결과를 예측하지 않는다. 나는 구조를 안티프래질하게 만든다.", "드문 사건이 역사를 결정한다. 평범한 것은 역사에 남지 않는다."],
  },
];

export const MENTOR_MAP = Object.fromEntries(MENTOR_PROFILES.map((m) => [m.id, m])) as Record<string, MentorProfile>;
export const MENTOR_IDS = MENTOR_PROFILES.map((m) => m.id);
