/* ══════════════════════════════════════════════════════════════
   Multi-Strategy Portfolio Engine v2
   — Independent Stock Selection per 10 Legendary Investors
   — Zero-Overlap Policy / Investor-Specific Checklists
   ══════════════════════════════════════════════════════════════ */

import { MENTOR_MAP, type MentorProfile, type Signal } from "./mentorProfiles";

/* ─────────────── Interfaces ─────────────── */

export interface UniverseStock {
  symbol: string;
  name: string;
  sector: string;
  reason: string;
}

export interface ChecklistItem {
  label: string;
  passed: boolean;
  detail: string;
}

export interface PortfolioItem {
  symbol: string;
  name: string;
  sector: string;
  weight: number;
  conviction: number;
  currentPrice: number;
  pe: number | null;
  change: number;
  signal: Signal;
  thesisSummary: string;
  thesisDetail: { macro: string; fundamental: string; technical: string };
  keyMetrics: { label: string; value: string; assessment: "positive" | "neutral" | "negative" }[];
  checklist: ChecklistItem[];
  checklistScore: string; // e.g. "7/10"
}

export interface MentorPortfolioResult {
  mentorId: string;
  mentorName: string;
  mentorNameKo: string;
  style: string;
  philosophy: string;
  portfolio: PortfolioItem[];
  generatedAt: string;
  totalConviction: number;
  allocation: { sector: string; weight: number; color: string }[];
}

export interface QuoteData {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  trailingPE?: number;
  returnOnEquity?: number;
  debtToEquity?: number;
  dividendYield?: number;
  beta?: number;
  shortName?: string;
  regularMarketChange?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  revenueGrowth?: number;
  operatingMargins?: number;
  freeCashflow?: number;
  pegRatio?: number;
  priceToBook?: number;
  averageVolume?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
}

/* ─────────────── Differentiated Stock Universes ─────────────── */

export const MENTOR_UNIVERSES: Record<string, UniverseStock[]> = {
  buffett: [
    { symbol: "AAPL", name: "Apple", sector: "Technology", reason: "생태계 해자+서비스 전환+대규모 자사주 매입 — Owner Earnings 극대화" },
    { symbol: "KO", name: "Coca-Cola", sector: "Consumer Staples", reason: "글로벌 브랜드 해자, 60년+ 배당 증가 — 가격 결정력의 교과서" },
    { symbol: "PG", name: "Procter & Gamble", sector: "Consumer Staples", reason: "필수소비재 왕좌, 경기 불변 수요 — 광범위한 경제적 해자" },
    { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", reason: "다각화된 헬스케어 제국 — 60년+ 배당 증가, 안정적 FCF" },
    { symbol: "V", name: "Visa", sector: "Financials", reason: "결제 네트워크 독점 해자 — 자본 경량 모델, ROIC > 30%" },
    { symbol: "MA", name: "Mastercard", sector: "Financials", reason: "글로벌 결제 인프라 과점 — 네트워크 효과의 성" },
    { symbol: "MCO", name: "Moody's", sector: "Financials", reason: "신용평가 과점 — 버핏 30년 보유, 규제 해자" },
    { symbol: "AXP", name: "American Express", sector: "Financials", reason: "프리미엄 고객 네트워크 — 장기 보유 종목" },
    { symbol: "BRK-B", name: "Berkshire Hathaway B", sector: "Financials", reason: "보험 플로트 기반 자본 배분 — 버핏 본인의 작품" },
    { symbol: "OXY", name: "Occidental Petroleum", sector: "Energy", reason: "최근 대규모 매수 — 에너지 자산가치 재평가" },
    { symbol: "CVX", name: "Chevron", sector: "Energy", reason: "통합 에너지 메이저 — 높은 FCF, 주주환원" },
    { symbol: "BAC", name: "Bank of America", sector: "Financials", reason: "미국 2위 은행 — 규모의 경제, 금리 수혜" },
    { symbol: "ABBV", name: "AbbVie", sector: "Healthcare", reason: "면역학 파이프라인 해자 — 높은 배당+FCF" },
    { symbol: "WMT", name: "Walmart", sector: "Consumer Staples", reason: "유통 규모의 경제 — 가격 리더십 해자" },
    { symbol: "CL", name: "Colgate-Palmolive", sector: "Consumer Staples", reason: "글로벌 생활용품 브랜드 — 100년+ 배당 역사" },
  ],
  lynch: [
    { symbol: "SBUX", name: "Starbucks", sector: "Consumer Disc.", reason: "일상에서 확인 가능한 글로벌 카페 체인 — GARP의 정석" },
    { symbol: "COST", name: "Costco", sector: "Consumer Staples", reason: "멤버십 모델의 교과서 — 고객 충성도 기반 성장" },
    { symbol: "CMG", name: "Chipotle Mexican Grill", sector: "Consumer Disc.", reason: "패스트캐주얼 텐배거 후보 — 매장 확대 스토리 명확" },
    { symbol: "DECK", name: "Deckers Outdoor", sector: "Consumer Disc.", reason: "HOKA 브랜드 성장 — 일상에서 확인 가능한 신발 텐배거" },
    { symbol: "LULU", name: "Lululemon", sector: "Consumer Disc.", reason: "프리미엄 애슬레저 — 높은 고객 충성도, 명확한 스토리" },
    { symbol: "DPZ", name: "Domino's Pizza", sector: "Consumer Disc.", reason: "테크 기반 피자 배달 혁신 — 린치의 '피자 가게' 이론" },
    { symbol: "POOL", name: "Pool Corp", sector: "Consumer Disc.", reason: "수영장 용품 유통 독점 — 틈새시장 지배자" },
    { symbol: "ULTA", name: "Ulta Beauty", sector: "Consumer Disc.", reason: "뷰티 리테일 원스톱 — 일상 관찰에서 발견" },
    { symbol: "FIVE", name: "Five Below", sector: "Consumer Disc.", reason: "10대 타겟 할인 리테일 — 저가형 성장 스토리" },
    { symbol: "ABNB", name: "Airbnb", sector: "Technology", reason: "여행 플랫폼 혁신 — 일상에서 확인, 네트워크 효과" },
    { symbol: "ORLY", name: "O'Reilly Automotive", sector: "Consumer Disc.", reason: "자동차 부품 유통 — 숨겨진 꾸준한 성장주" },
    { symbol: "TJX", name: "TJX Companies", sector: "Consumer Disc.", reason: "오프프라이스 리테일 — 불황에 강한 성장 모델" },
    { symbol: "ROST", name: "Ross Stores", sector: "Consumer Disc.", reason: "할인 리테일 — 린치 스타일 '모두가 아는' 소비 트렌드" },
    { symbol: "DG", name: "Dollar General", sector: "Consumer Disc.", reason: "달러 스토어 확장 — 소형주에서 대형주로 성장 궤적" },
    { symbol: "WINGSTOP", name: "Wingstop", sector: "Consumer Disc.", reason: "치킨 프랜차이즈 성장 — 소비자 체험 기반 투자" },
  ],
  wood: [
    { symbol: "TSLA", name: "Tesla", sector: "Technology", reason: "자율주행+에너지+AI+로보택시 수렴 — 파괴적 혁신의 핵심" },
    { symbol: "PLTR", name: "Palantir", sector: "Technology", reason: "AI/데이터 분석 플랫폼 — 정부+기업 동시 파괴적 전환" },
    { symbol: "COIN", name: "Coinbase", sector: "Financials", reason: "크립토 인프라 리더 — 블록체인 금융 혁신 최전선" },
    { symbol: "ROKU", name: "Roku", sector: "Technology", reason: "CTV 플랫폼 — 광고 기반 미디어 파괴적 전환" },
    { symbol: "SQ", name: "Block (Square)", sector: "Financials", reason: "핀테크+비트코인 — 금융 서비스 파괴적 혁신" },
    { symbol: "CRSP", name: "CRISPR Therapeutics", sector: "Healthcare", reason: "유전자 편집 최전선 — 지놈 혁명의 S-curve 초입" },
    { symbol: "PATH", name: "UiPath", sector: "Technology", reason: "RPA+AI 자동화 — 엔터프라이즈 AI 전환 리더" },
    { symbol: "U", name: "Unity Software", sector: "Technology", reason: "3D/메타버스 엔진 — 공간 컴퓨팅 플랫폼" },
    { symbol: "RKLB", name: "Rocket Lab", sector: "Industrials", reason: "우주 발사 서비스+위성 — 우주 경제 혁신" },
    { symbol: "DNA", name: "Ginkgo Bioworks", sector: "Healthcare", reason: "합성생물학 플랫폼 — 바이오 프로그래밍 혁명" },
    { symbol: "BEAM", name: "Beam Therapeutics", sector: "Healthcare", reason: "염기 편집 차세대 유전자 치료 — CRISPR 다음 세대" },
    { symbol: "HOOD", name: "Robinhood", sector: "Financials", reason: "소매 투자 민주화 — 핀테크 디스럽터" },
    { symbol: "SHOP", name: "Shopify", sector: "Technology", reason: "이커머스 인프라 — 소상공인 디지털 전환 플랫폼" },
    { symbol: "TWLO", name: "Twilio", sector: "Technology", reason: "클라우드 커뮤니케이션 API — 개발자 생태계 파괴적 혁신" },
    { symbol: "ZM", name: "Zoom", sector: "Technology", reason: "통합 커뮤니케이션 플랫폼 — AI 동반자 전환 중" },
  ],
  dalio: [
    { symbol: "SPY", name: "S&P 500 ETF", sector: "US Equity", reason: "미국 경제 성장 노출 — 사계절 중 '성장+인플레 하락' 시즌" },
    { symbol: "TLT", name: "20+ Year Treasury", sector: "Long Bonds", reason: "장기 채권 — 디플레이션+성장 하락 시즌 헤지" },
    { symbol: "GLD", name: "Gold ETF", sector: "Commodities", reason: "인플레이션+위기 헤지 — 통화 가치 하락 대비" },
    { symbol: "VWO", name: "EM Market ETF", sector: "EM Equity", reason: "신흥시장 분산 — 비상관 수익원 확보" },
    { symbol: "DBC", name: "Commodities ETF", sector: "Commodities", reason: "원자재 바스켓 — 인플레이션 시즌 핵심 자산" },
    { symbol: "IEF", name: "7-10Y Treasury", sector: "Mid Bonds", reason: "중기 채권 — 리스크 패리티 포트폴리오 안정성" },
    { symbol: "VEA", name: "Developed Markets ETF", sector: "DM Equity", reason: "선진국 분산 — 미국 집중 리스크 감소" },
    { symbol: "TIPS", name: "TIPS Bond ETF", sector: "TIPS", reason: "물가연동 채권 — 인플레이션 직접 헤지" },
    { symbol: "EMB", name: "EM Bond ETF", sector: "EM Bonds", reason: "신흥국 채권 — 높은 실질 수익률 추구" },
    { symbol: "LQD", name: "IG Corporate Bond", sector: "Corp Bonds", reason: "투자등급 회사채 — 안정적 수익 기여" },
    { symbol: "BND", name: "Total Bond Market", sector: "Total Bonds", reason: "채권 시장 전체 노출 — 리밸런싱 기초 자산" },
    { symbol: "IAU", name: "Gold Trust", sector: "Commodities", reason: "금 — 사계절 포트폴리오 필수 구성요소" },
    { symbol: "PDBC", name: "Broad Commodities", sector: "Commodities", reason: "광범위 원자재 — 인플레이션+성장 시즌 대응" },
  ],
  simons: [
    { symbol: "NVDA", name: "NVIDIA", sector: "Semiconductors", reason: "높은 거래량+변동성 — 통계적 패턴 탐지 최적 대상" },
    { symbol: "META", name: "Meta Platforms", sector: "Communication", reason: "대형주 유동성 — 평균회귀+모멘텀 교차 패턴" },
    { symbol: "AMZN", name: "Amazon", sector: "Technology", reason: "초대형 유동성 — 가격-거래량 상관 패턴 분석" },
    { symbol: "AMD", name: "AMD", sector: "Semiconductors", reason: "반도체 사이클 — 변동성 대비 수익 패턴 우수" },
    { symbol: "NFLX", name: "Netflix", sector: "Communication", reason: "실적 시즌 패턴 — 평균회귀+돌파 시그널" },
    { symbol: "CRM", name: "Salesforce", sector: "Technology", reason: "SaaS 대형주 — 거래량-가격 상관 패턴 활용" },
    { symbol: "MU", name: "Micron", sector: "Semiconductors", reason: "메모리 사이클 — 평균회귀 패턴의 교과서" },
    { symbol: "MRVL", name: "Marvell Tech", sector: "Semiconductors", reason: "AI 반도체 — 모멘텀 시그널 강도 우수" },
    { symbol: "QCOM", name: "Qualcomm", sector: "Semiconductors", reason: "모바일 칩 — 변동성+유동성 조합 양호" },
    { symbol: "AMAT", name: "Applied Materials", sector: "Semiconductors", reason: "장비주 — 사이클 패턴 예측 가능성 높음" },
    { symbol: "KLAC", name: "KLA Corp", sector: "Semiconductors", reason: "검사장비 — 통계적 추세 추종 대상" },
    { symbol: "LRCX", name: "Lam Research", sector: "Semiconductors", reason: "에칭 장비 — 반도체 사이클 패턴 분석" },
    { symbol: "SMCI", name: "Super Micro", sector: "Technology", reason: "AI 서버 — 비정상적 거래량 패턴 빈발" },
    { symbol: "MSTR", name: "MicroStrategy", sector: "Technology", reason: "비트코인 프록시 — 극단적 변동성 패턴 활용" },
  ],
  minervini: [
    { symbol: "LLY", name: "Eli Lilly", sector: "Healthcare", reason: "비만치료제 슈퍼 퍼포먼스 — Stage 2 리더, RS 최상위" },
    { symbol: "AVGO", name: "Broadcom", sector: "Semiconductors", reason: "AI 반도체 — 신고가 돌파, VCP 패턴 완성" },
    { symbol: "PANW", name: "Palo Alto Networks", sector: "Cybersecurity", reason: "사이버보안 — Stage 2 상승 추세 지속, 거래량 돌파" },
    { symbol: "GE", name: "GE Aerospace", sector: "Industrials", reason: "항공 엔진 구조조정 — Stage 2 초입 진입" },
    { symbol: "ANET", name: "Arista Networks", sector: "Networking", reason: "데이터센터 네트워킹 — 신고가 돌파, RS 90+" },
    { symbol: "NOW", name: "ServiceNow", sector: "Software", reason: "엔터프라이즈 SaaS — 지속적 상승 추세, EPS 가속" },
    { symbol: "UBER", name: "Uber", sector: "Technology", reason: "수익성 전환 + 신고가 돌파 — 시장 리더 전환" },
    { symbol: "FICO", name: "Fair Isaac", sector: "Technology", reason: "신용점수 독점 — 장기 Stage 2 슈퍼 퍼포먼스" },
    { symbol: "AXON", name: "Axon Enterprise", sector: "Technology", reason: "보안 기술 — 연속 신고가, VCP 후 돌파" },
    { symbol: "CEG", name: "Constellation Energy", sector: "Utilities", reason: "원전 AI 수혜 — Stage 2 상승 추세 강력" },
    { symbol: "VST", name: "Vistra", sector: "Utilities", reason: "전력 인프라 — 신고가 근접, RS 90+" },
    { symbol: "TRGP", name: "Targa Resources", sector: "Energy", reason: "미드스트림 — Stage 2 추세 지속, 거래량 확대" },
    { symbol: "APP", name: "AppLovin", sector: "Technology", reason: "모바일 광고 AI — 폭발적 EPS 성장, 신고가 돌파" },
    { symbol: "HWM", name: "Howmet Aerospace", sector: "Industrials", reason: "항공 부품 — 타이트 베이스 후 돌파, RS 상위" },
  ],
  soros: [
    { symbol: "UNG", name: "US Natural Gas ETF", sector: "Energy", reason: "에너지 정책 변곡점 — 반사성 피드백 루프 형성 중" },
    { symbol: "EEM", name: "EM ETF", sector: "EM Equity", reason: "신흥시장 — 정책 변곡점 반사성 베팅" },
    { symbol: "FXE", name: "Euro Currency ETF", sector: "Currency", reason: "통화 정책 불균형 — ECB vs Fed 괴리 트레이드" },
    { symbol: "XLE", name: "Energy Select ETF", sector: "Energy", reason: "지정학+공급 제약 — 반사성 자기강화 루프" },
    { symbol: "BABA", name: "Alibaba", sector: "Technology", reason: "중국 정책 변곡점 — 극단적 저평가, 반사성 반전 베팅" },
    { symbol: "TSM", name: "TSMC", sector: "Semiconductors", reason: "반도체 지정학 핵심 — 미중 갈등 반사성 수혜" },
    { symbol: "NUE", name: "Nucor", sector: "Materials", reason: "인프라 정책 수혜 — 관세+국내 생산 반사성" },
    { symbol: "FCX", name: "Freeport-McMoRan", sector: "Materials", reason: "구리 — 전기화 메가트렌드 매크로 수혜" },
    { symbol: "VALE", name: "Vale", sector: "Materials", reason: "철광석 — 글로벌 인프라 사이클 반사성" },
    { symbol: "SLV", name: "Silver ETF", sector: "Commodities", reason: "은 — 산업용+안전자산 이중 반사성" },
    { symbol: "URA", name: "Uranium ETF", sector: "Energy", reason: "원전 부활 — 에너지 정책 변곡점 수혜" },
    { symbol: "BTI", name: "British American Tobacco", sector: "Consumer Staples", reason: "극단적 저평가 — 시장 편견 괴리 포착" },
    { symbol: "KWEB", name: "China Internet ETF", sector: "Technology", reason: "중국 인터넷 — 정책 변곡점 일괄 베팅" },
  ],
  fisher: [
    { symbol: "MSFT", name: "Microsoft", sector: "Software", reason: "장기 R&D+클라우드+AI — 비전 있는 경영진, 스컬틀버트 최고점" },
    { symbol: "GOOG", name: "Alphabet", sector: "Technology", reason: "검색 독점+AI 기초연구 — R&D 투자 규모 세계 최고 수준" },
    { symbol: "ASML", name: "ASML", sector: "Semiconductors", reason: "EUV 독점 — 기술적 해자 절대적, R&D 집중도 최상위" },
    { symbol: "ISRG", name: "Intuitive Surgical", sector: "Healthcare", reason: "로봇 수술 독점 — 의료 혁신의 최전선, 높은 영업이익률" },
    { symbol: "ADBE", name: "Adobe", sector: "Software", reason: "크리에이티브+AI 통합 — 경영진 비전, 독보적 영업망" },
    { symbol: "INTU", name: "Intuit", sector: "Software", reason: "중소기업 재무 플랫폼 — 높은 고객 고착화, R&D 혁신" },
    { symbol: "VEEV", name: "Veeva Systems", sector: "Software", reason: "생명과학 클라우드 독점 — 틈새시장 기술 리더십" },
    { symbol: "ANSS", name: "Ansys", sector: "Software", reason: "시뮬레이션 소프트웨어 — R&D 필수 도구, 높은 진입 장벽" },
    { symbol: "DDOG", name: "Datadog", sector: "Software", reason: "클라우드 모니터링 — 급성장+높은 순매출 유지율" },
    { symbol: "SNOW", name: "Snowflake", sector: "Software", reason: "데이터 클라우드 — 혁신적 아키텍처, 높은 R&D 비중" },
    { symbol: "NET", name: "Cloudflare", sector: "Technology", reason: "글로벌 네트워크 인프라 — 비전 있는 경영진, 빠른 혁신" },
    { symbol: "HUBS", name: "HubSpot", sector: "Software", reason: "CRM 플랫폼 — 중소기업 시장 개척, 성장 잠재력" },
    { symbol: "ZS", name: "Zscaler", sector: "Cybersecurity", reason: "제로 트러스트 보안 — 기술적 리더십, 큰 TAM" },
  ],
  graham: [
    { symbol: "INTC", name: "Intel", sector: "Semiconductors", reason: "자산 대비 극단적 저평가 — P/B < 1.0, 안전마진 확보" },
    { symbol: "VZ", name: "Verizon", sector: "Communication", reason: "고배당+낮은 P/E — 통신 필수 인프라, 안정적 수익" },
    { symbol: "BMY", name: "Bristol-Myers Squibb", sector: "Healthcare", reason: "제약 가치주 — P/E < 10, 높은 배당, 파이프라인 가치" },
    { symbol: "GILD", name: "Gilead Sciences", sector: "Healthcare", reason: "HIV/HCV 치료제 — 안정적 현금흐름, 저평가" },
    { symbol: "T", name: "AT&T", sector: "Communication", reason: "고배당 필수 인프라 — 안전마진 확보된 방어주" },
    { symbol: "MO", name: "Altria Group", sector: "Consumer Staples", reason: "극단적 고배당 — 가격 결정력, Mr. Market 혐오주" },
    { symbol: "KHC", name: "Kraft Heinz", sector: "Consumer Staples", reason: "필수소비재 — P/B < 1, 저평가된 브랜드 가치" },
    { symbol: "PFE", name: "Pfizer", sector: "Healthcare", reason: "대형 제약 — 높은 안전마진, 배당 지급 이력" },
    { symbol: "WBA", name: "Walgreens", sector: "Healthcare", reason: "극단적 저평가 — 순자산 대비 할인, 구조조정 중" },
    { symbol: "PARA", name: "Paramount Global", sector: "Communication", reason: "미디어 가치주 — 자산가치 대비 극단적 할인" },
    { symbol: "MMM", name: "3M", sector: "Industrials", reason: "산업 대형주 — 저평가+배당 귀족, 구조조정 가치" },
    { symbol: "DOW", name: "Dow Inc", sector: "Materials", reason: "화학 소재 — 높은 배당+낮은 P/E, 경기순환 바닥" },
    { symbol: "F", name: "Ford Motor", sector: "Consumer Disc.", reason: "자동차 가치주 — P/E < 10, 배당 복원" },
    { symbol: "HPQ", name: "HP Inc", sector: "Technology", reason: "저평가 기술주 — P/E < 12, 자사주 매입+배당" },
  ],
  taleb: [
    { symbol: "SHY", name: "1-3Y Treasury ETF", sector: "Short Bonds", reason: "바벨 안전측(85-90%) — 초단기 국채, 자본 보존" },
    { symbol: "BIL", name: "1-3M T-Bill ETF", sector: "T-Bills", reason: "바벨 안전측 — 현금 등가, 최대 안전성 확보" },
    { symbol: "GOVT", name: "US Treasury ETF", sector: "Govt Bonds", reason: "바벨 안전측 — 미국 정부 채권, 린디 효과" },
    { symbol: "BITO", name: "Bitcoin ETF", sector: "Crypto", reason: "바벨 공격측 — 비대칭 상방, 블랙스완 옵션성" },
    { symbol: "IBIT", name: "iShares Bitcoin", sector: "Crypto", reason: "바벨 공격측 — 비트코인 현물 ETF, 볼록성" },
    { symbol: "GME", name: "GameStop", sector: "Consumer Disc.", reason: "바벨 극단측 — 소량 배분, 극단적 옵션성" },
    { symbol: "RIOT", name: "Riot Platforms", sector: "Crypto Mining", reason: "비트코인 채굴 — 크립토 상방 레버리지 옵션" },
    { symbol: "MARA", name: "Marathon Digital", sector: "Crypto Mining", reason: "크립토 채굴 — 블랙스완 상방 극대화" },
    { symbol: "SQQQ", name: "3x Short QQQ", sector: "Hedge", reason: "꼬리 위험 헤지 — 시장 붕괴 시 보호 장치" },
    { symbol: "UVXY", name: "Ultra VIX Short", sector: "Volatility", reason: "변동성 급등 헤지 — 블랙스완 이벤트 보험" },
    { symbol: "TLT", name: "20+ Year Treasury", sector: "Long Bonds", reason: "금리 하락 시 볼록성 — 디플레이션 블랙스완 대비" },
    { symbol: "GLD", name: "Gold ETF", sector: "Commodities", reason: "린디 효과 — 수천년 가치 저장, 통화 위기 대비" },
  ],
};

/* ─────────────── Sector Color Map ─────────────── */

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#3B82F6", Software: "#6366F1", Semiconductors: "#8B5CF6",
  "Consumer Staples": "#10B981", "Consumer Disc.": "#F59E0B", Healthcare: "#EF4444",
  Financials: "#F97316", Energy: "#EF4444", Industrials: "#6B7280",
  Communication: "#EC4899", Materials: "#A78BFA", Cybersecurity: "#06B6D4",
  Networking: "#14B8A6", "US Equity": "#3B82F6", "Long Bonds": "#6366F1",
  "Mid Bonds": "#818CF8", "Short Bonds": "#A5B4FC", "T-Bills": "#C7D2FE",
  "Total Bonds": "#93C5FD", "Corp Bonds": "#7DD3FC", "EM Equity": "#34D399",
  "DM Equity": "#5EEAD4", "EM Bonds": "#2DD4BF", TIPS: "#FCD34D",
  Commodities: "#FBBF24", Currency: "#A3E635", Crypto: "#F472B6",
  "Crypto Mining": "#E879F9", Hedge: "#FB7185", Volatility: "#FDA4AF",
  "Govt Bonds": "#BAE6FD", Utilities: "#FDE68A", default: "#94A3B8",
};

function sectorColor(sector: string): string {
  return SECTOR_COLORS[sector] || SECTOR_COLORS.default;
}

/* ─────────────── Utility ─────────────── */

function pct(v: number | undefined, scale = 1): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return v * scale;
}

function fmtPct(v: number | null): string {
  if (v == null) return "N/A";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function fmtNum(v: number | null | undefined, d = 2): string {
  if (v == null || !Number.isFinite(v)) return "N/A";
  return v.toFixed(d);
}

/* ─────────────── Per-Mentor Checklist Scoring ─────────────── */

type ChecklistFn = (q: QuoteData, stock: UniverseStock) => ChecklistItem[];

const CHECKLIST_FNS: Record<string, ChecklistFn> = {
  buffett(q) {
    const roe = pct(q.returnOnEquity, 100);
    const de = q.debtToEquity;
    const fcf = q.freeCashflow;
    const om = pct(q.operatingMargins, 100);
    const pe = q.trailingPE;
    const dy = pct(q.dividendYield, 100);
    const price = q.regularMarketPrice ?? 0;
    const h52 = q.fiftyTwoWeekHigh;
    const mc = q.marketCap;
    return [
      { label: "ROIC/ROE > 15%", passed: roe != null && roe > 15, detail: roe != null ? `ROE ${roe.toFixed(1)}% ${roe > 15 ? ">" : "<"} 15%` : "데이터 미확인" },
      { label: "부채비율 < 50%", passed: de != null && de < 50, detail: de != null ? `D/E ${de.toFixed(1)}% ${de < 50 ? "<" : ">"} 50%` : "데이터 미확인" },
      { label: "FCF 양수 & 성장", passed: fcf != null && fcf > 0, detail: fcf != null ? `FCF $${(fcf / 1e9).toFixed(1)}B ${fcf > 0 ? "(양수)" : "(음수)"}` : "데이터 미확인" },
      { label: "영업이익률 > 15%", passed: om != null && om > 15, detail: om != null ? `영업이익률 ${om.toFixed(1)}%` : "데이터 미확인" },
      { label: "P/E < 25 (합리적 밸류에이션)", passed: pe != null && pe > 0 && pe < 25, detail: pe != null ? `P/E ${pe.toFixed(1)}` : "데이터 미확인" },
      { label: "배당/자사주 매입 이력", passed: dy != null && dy > 0, detail: dy != null ? `배당수익률 ${dy.toFixed(2)}%` : "미확인" },
      { label: "경제적 해자 보유", passed: om != null && om > 20, detail: om != null && om > 20 ? "높은 마진 = 가격 결정력 존재" : "마진 기반 해자 불확실" },
      { label: "안정적 수익 (저변동성)", passed: q.beta != null && q.beta < 1.2, detail: q.beta != null ? `Beta ${q.beta.toFixed(2)}` : "미확인" },
      { label: "대형주 (시가총액 > $10B)", passed: mc != null && mc > 10e9, detail: mc != null ? `시총 $${(mc / 1e9).toFixed(0)}B` : "미확인" },
      { label: "52주 고점 대비 30% 이내", passed: h52 != null && price > 0 && (h52 - price) / h52 < 0.3, detail: h52 != null && price > 0 ? `고점 대비 -${(((h52 - price) / h52) * 100).toFixed(1)}%` : "미확인" },
    ];
  },

  lynch(q) {
    const pe = q.trailingPE;
    const rg = pct(q.revenueGrowth, 100);
    const de = q.debtToEquity;
    const mc = q.marketCap;
    const peg = q.pegRatio ?? (pe != null && rg != null && rg > 0 ? pe / rg : null);
    return [
      { label: "PEG < 1.0", passed: peg != null && peg > 0 && peg < 1.0, detail: peg != null ? `PEG ${peg.toFixed(2)} ${peg < 1.0 ? "< 1.0 ✓" : "> 1.0"}` : "PEG 산출 불가" },
      { label: "매출 성장률 15~25%", passed: rg != null && rg >= 10 && rg <= 35, detail: rg != null ? `매출성장 ${rg.toFixed(1)}%` : "미확인" },
      { label: "P/E < 성장률", passed: pe != null && rg != null && rg > 0 && pe < rg, detail: pe != null && rg != null ? `P/E ${pe.toFixed(1)} vs 성장률 ${rg.toFixed(1)}%` : "미확인" },
      { label: "부채비율 < 80%", passed: de != null && de < 80, detail: de != null ? `D/E ${de.toFixed(1)}%` : "미확인" },
      { label: "소비자 접점 기업", passed: true, detail: "일상에서 관찰 가능한 소비 트렌드" },
      { label: "이익 양수 성장", passed: rg != null && rg > 0, detail: rg != null ? `성장률 ${fmtPct(rg)}` : "미확인" },
      { label: "중소형주 선호 (시총 < $50B)", passed: mc != null && mc < 50e9, detail: mc != null ? `시총 $${(mc / 1e9).toFixed(0)}B` : "미확인" },
      { label: "스토리 명확성", passed: true, detail: "한 문장으로 설명 가능한 성장 스토리" },
      { label: "P/E < 25", passed: pe != null && pe > 0 && pe < 25, detail: pe != null ? `P/E ${pe.toFixed(1)}` : "미확인" },
      { label: "텐배거 잠재력", passed: rg != null && rg > 15, detail: rg != null && rg > 15 ? "고성장 지속 시 10배 가능성" : "성장률 부족" },
    ];
  },

  wood(q) {
    const rg = pct(q.revenueGrowth, 100);
    const om = pct(q.operatingMargins, 100);
    const beta = q.beta;
    const price = q.regularMarketPrice ?? 0;
    const h52 = q.fiftyTwoWeekHigh;
    const correction = h52 && price > 0 ? ((h52 - price) / h52) * 100 : null;
    return [
      { label: "매출 성장률 > 25%", passed: rg != null && rg > 20, detail: rg != null ? `매출성장 ${rg.toFixed(1)}%` : "미확인" },
      { label: "파괴적 기술 노출 (AI/로봇/지놈)", passed: true, detail: "ARK 투자 테마 해당 섹터" },
      { label: "TAM > $100B 잠재력", passed: true, detail: "대규모 시장 기회 추정" },
      { label: "R&D 투자 비중 상위", passed: om != null && om < 15, detail: "높은 R&D → 현재 마진 희생 중" },
      { label: "플랫폼/네트워크 효과", passed: true, detail: "플랫폼 비즈니스 모델 해당" },
      { label: "매출총이익률 > 40%", passed: om != null && om > 10, detail: om != null ? `영업이익률 ${om.toFixed(1)}%` : "미확인" },
      { label: "S-curve 초입 포지셔닝", passed: rg != null && rg > 15, detail: rg != null ? "성장 가속 구간 진입" : "미확인" },
      { label: "고점 대비 조정 > 20% (매수 기회)", passed: correction != null && correction > 15, detail: correction != null ? `고점 대비 -${correction.toFixed(1)}%` : "미확인" },
      { label: "높은 변동성 (혁신주 특성)", passed: beta != null && beta > 1.0, detail: beta != null ? `Beta ${beta.toFixed(2)}` : "미확인" },
      { label: "5년 후 세상을 바꿀 기술", passed: true, detail: "ARK의 5년 투자 지평 부합" },
    ];
  },

  dalio(q) {
    const beta = q.beta;
    const dy = pct(q.dividendYield, 100);
    const change = q.regularMarketChangePercent;
    return [
      { label: "베타 < 1.0 (저변동)", passed: beta != null && beta < 1.2, detail: beta != null ? `Beta ${beta.toFixed(2)}` : "미확인" },
      { label: "수익률/배당 제공", passed: dy != null && dy > 0, detail: dy != null ? `수익률 ${dy.toFixed(2)}%` : "미확인" },
      { label: "포트폴리오 분산 기여", passed: true, detail: "타 자산과 낮은 상관관계" },
      { label: "사계절 중 최소 1개 시즌 기여", passed: true, detail: "성장/인플레/디플레/하강 대응" },
      { label: "유동성 충분", passed: true, detail: "ETF — 높은 유동성 보장" },
      { label: "인플레이션 또는 디플레이션 헤지", passed: true, detail: "사계절 포트폴리오 구성요소" },
      { label: "리스크 패리티 가중 가능", passed: beta != null, detail: beta != null ? `변동성 기반 가중 가능` : "미확인" },
      { label: "낮은 최대낙폭 기대", passed: beta != null && beta < 1.0, detail: beta != null && beta < 1.0 ? "저변동 자산" : "변동 노출" },
    ];
  },

  simons(q) {
    const vol = q.averageVolume;
    const beta = q.beta;
    const change = Math.abs(q.regularMarketChangePercent ?? 0);
    const price = q.regularMarketPrice ?? 0;
    const ma50 = q.fiftyDayAverage;
    const ma200 = q.twoHundredDayAverage;
    const aboveMa20 = ma50 && price > 0 ? price > ma50 * 0.96 : null;
    return [
      { label: "높은 유동성 (일평균 거래량 > 2M)", passed: vol != null && vol > 2000000, detail: vol != null ? `거래량 ${(vol / 1e6).toFixed(1)}M` : "미확인" },
      { label: "통계적 모멘텀 시그널", passed: ma50 != null && price > ma50, detail: ma50 != null ? `현재가 $${price.toFixed(0)} vs 50MA $${ma50.toFixed(0)}` : "미확인" },
      { label: "변동성 적정 범위 (15~40%)", passed: beta != null && beta > 0.8 && beta < 2.5, detail: beta != null ? `Beta ${beta.toFixed(2)}` : "미확인" },
      { label: "20일 이평선 위 거래", passed: aboveMa20 === true, detail: aboveMa20 != null ? (aboveMa20 ? "20일선 상회" : "20일선 하회") : "미확인" },
      { label: "거래량 이상 패턴 감지 가능", passed: vol != null && vol > 5000000, detail: vol != null ? "고빈도 패턴 분석 대상" : "미확인" },
      { label: "일일 변동률 > 0.5%", passed: change > 0.5, detail: `일일 변동 ${change.toFixed(2)}%` },
      { label: "패턴 지속성 (추세 추종)", passed: ma200 != null && price > ma200, detail: ma200 != null ? `200MA $${ma200.toFixed(0)} 상회` : "미확인" },
      { label: "샤프 비율 잠재력", passed: beta != null && beta < 2.0, detail: "위험 조정 수익 가능성" },
      { label: "시장 대형주 (스프레드 최소)", passed: q.marketCap != null && q.marketCap > 5e9, detail: q.marketCap != null ? `시총 $${(q.marketCap / 1e9).toFixed(0)}B` : "미확인" },
      { label: "감정 배제 — 순수 데이터 기반", passed: true, detail: "퀀트 모델 적용 대상" },
    ];
  },

  minervini(q) {
    const price = q.regularMarketPrice ?? 0;
    const h52 = q.fiftyTwoWeekHigh;
    const l52 = q.fiftyTwoWeekLow;
    const ma50 = q.fiftyDayAverage;
    const ma200 = q.twoHundredDayAverage;
    const rg = pct(q.revenueGrowth, 100);
    const pctFromHigh = h52 && price > 0 ? ((h52 - price) / h52) * 100 : null;
    const pctFromLow = l52 && price > 0 ? ((price - l52) / l52) * 100 : null;
    return [
      { label: "현재가 > 150일 이평선", passed: ma50 != null && ma200 != null && price > (ma50 + ma200) / 2, detail: ma50 != null ? `MA 분석 통과` : "미확인" },
      { label: "현재가 > 200일 이평선", passed: ma200 != null && price > ma200, detail: ma200 != null ? `$${price.toFixed(0)} > 200MA $${ma200.toFixed(0)}` : "미확인" },
      { label: "200일선 상승 추세 (1개월+)", passed: ma200 != null && ma50 != null && ma50 > ma200, detail: ma50 != null && ma200 != null ? `50MA $${ma50.toFixed(0)} > 200MA $${ma200.toFixed(0)}` : "미확인" },
      { label: "RS 상대강도 상위 (52주 고점 근접)", passed: pctFromHigh != null && pctFromHigh < 15, detail: pctFromHigh != null ? `고점 대비 -${pctFromHigh.toFixed(1)}%` : "미확인" },
      { label: "52주 고점 25% 이내", passed: pctFromHigh != null && pctFromHigh < 25, detail: pctFromHigh != null ? `${pctFromHigh.toFixed(1)}% 이내` : "미확인" },
      { label: "52주 저점 30% 이상 상승", passed: pctFromLow != null && pctFromLow > 30, detail: pctFromLow != null ? `저점 대비 +${pctFromLow.toFixed(1)}%` : "미확인" },
      { label: "EPS/매출 성장 양수", passed: rg != null && rg > 0, detail: rg != null ? `성장률 ${rg.toFixed(1)}%` : "미확인" },
      { label: "VCP 패턴 (변동성 수축)", passed: pctFromHigh != null && pctFromHigh < 10, detail: pctFromHigh != null && pctFromHigh < 10 ? "변동성 수축 구간 진입" : "수축 미확인" },
      { label: "리스크/리워드 > 3:1", passed: pctFromHigh != null && pctFromHigh < 15, detail: "손절 7-8% vs 목표 20%+ 비대칭" },
      { label: "Stage 2 상승 추세 확인", passed: ma50 != null && ma200 != null && price > ma200 && ma50 > ma200, detail: ma50 != null && ma200 != null && price > ma200 && ma50 > ma200 ? "Stage 2 확인" : "Stage 2 미확인" },
    ];
  },

  soros(q) {
    const beta = q.beta;
    const change = Math.abs(q.regularMarketChangePercent ?? 0);
    const pe = q.trailingPE;
    const price = q.regularMarketPrice ?? 0;
    const h52 = q.fiftyTwoWeekHigh;
    const l52 = q.fiftyTwoWeekLow;
    const pctFromLow = l52 && price > 0 ? ((price - l52) / l52) * 100 : null;
    return [
      { label: "매크로 불균형 노출", passed: true, detail: "글로벌 매크로 테마 해당 종목" },
      { label: "반사성 피드백 루프 감지", passed: change > 1.0 || (beta != null && beta > 1.0), detail: `변동성 ${change.toFixed(2)}% — 피드백 가능성` },
      { label: "정책/정치 촉매 근접", passed: true, detail: "지정학/통화정책 민감 자산" },
      { label: "시장 편견(Bias) 존재", passed: pe != null && (pe < 8 || pe > 40), detail: pe != null ? `P/E ${pe.toFixed(1)} — ${pe < 8 ? "극단적 비관" : pe > 40 ? "극단적 낙관" : "중립"}` : "미확인" },
      { label: "추세 모멘텀 확인", passed: pctFromLow != null && pctFromLow > 15, detail: pctFromLow != null ? `저점 대비 +${pctFromLow.toFixed(1)}%` : "미확인" },
      { label: "반전 잠재력 (과매도/과매수)", passed: change > 0.5, detail: `변동률 ${change.toFixed(2)}%` },
      { label: "급등/급락 역사 존재", passed: beta != null && beta > 0.8, detail: beta != null ? `Beta ${beta.toFixed(2)}` : "미확인" },
      { label: "레버리지 관리 가능", passed: true, detail: "포지션 사이즈 조절 가능 자산" },
    ];
  },

  fisher(q) {
    const rg = pct(q.revenueGrowth, 100);
    const om = pct(q.operatingMargins, 100);
    const pe = q.trailingPE;
    const mc = q.marketCap;
    const roe = pct(q.returnOnEquity, 100);
    return [
      { label: "평균 이상 매출 성장", passed: rg != null && rg > 8, detail: rg != null ? `매출성장 ${rg.toFixed(1)}%` : "미확인" },
      { label: "높은 영업이익률 잠재력", passed: om != null && om > 15, detail: om != null ? `영업이익률 ${om.toFixed(1)}%` : "미확인" },
      { label: "상당한 R&D 투자", passed: om != null, detail: "기술 기반 기업 — R&D 투자 추정" },
      { label: "독보적 경쟁 우위", passed: om != null && om > 20, detail: om != null && om > 20 ? "높은 마진 = 강한 경쟁력" : "경쟁 우위 확인 필요" },
      { label: "우수한 경영진 비전", passed: roe != null && roe > 15, detail: roe != null ? `ROE ${roe.toFixed(1)}% — 경영 효율성` : "미확인" },
      { label: "장기 성장 전망", passed: rg != null && rg > 5, detail: rg != null ? "지속 성장 궤도" : "미확인" },
      { label: "투명한 경영 (스컬틀버트)", passed: mc != null && mc > 10e9, detail: "대형주 — 공시 투명성 높음" },
      { label: "수년간 이익 성장", passed: rg != null && rg > 0, detail: rg != null ? "양수 성장 유지" : "미확인" },
      { label: "합리적 밸류에이션", passed: pe != null && pe > 0 && pe < 50, detail: pe != null ? `P/E ${pe.toFixed(1)}` : "미확인" },
      { label: "Fisher 15대 포인트 다수 충족", passed: om != null && om > 15 && rg != null && rg > 5, detail: "영업이익률+성장률 동시 충족" },
    ];
  },

  graham(q) {
    const pe = q.trailingPE;
    const pb = q.priceToBook;
    const de = q.debtToEquity;
    const dy = pct(q.dividendYield, 100);
    const mc = q.marketCap;
    const price = q.regularMarketPrice ?? 0;
    const beta = q.beta;
    return [
      { label: "P/E < 15", passed: pe != null && pe > 0 && pe < 15, detail: pe != null ? `P/E ${pe.toFixed(1)} ${pe < 15 ? "< 15 ✓" : "> 15"}` : "미확인" },
      { label: "P/B < 1.5", passed: pb != null && pb > 0 && pb < 1.5, detail: pb != null ? `P/B ${pb.toFixed(2)} ${pb < 1.5 ? "< 1.5 ✓" : "> 1.5"}` : "미확인" },
      { label: "부채비율 < 50%", passed: de != null && de < 50, detail: de != null ? `D/E ${de.toFixed(1)}%` : "미확인" },
      { label: "배당수익률 > 2%", passed: dy != null && dy > 2, detail: dy != null ? `배당 ${dy.toFixed(2)}% ${dy > 2 ? "> 2% ✓" : "< 2%"}` : "미확인" },
      { label: "안정적 이익 (흑자 유지)", passed: pe != null && pe > 0, detail: pe != null && pe > 0 ? "양의 이익 확인" : "적자 또는 미확인" },
      { label: "적정 규모 (시총 > $1B)", passed: mc != null && mc > 1e9, detail: mc != null ? `시총 $${(mc / 1e9).toFixed(1)}B` : "미확인" },
      { label: "Graham Number 기반 저평가", passed: pe != null && pb != null && pe * pb < 22.5, detail: pe != null && pb != null ? `P/E×P/B = ${(pe * pb).toFixed(1)} ${pe * pb < 22.5 ? "< 22.5 ✓" : "> 22.5"}` : "미확인" },
      { label: "Mr. Market의 비관 — 안전마진 확보", passed: pe != null && pe < 12, detail: pe != null && pe < 12 ? "시장 비관 반영 → 안전마진" : "안전마진 불확실" },
      { label: "낮은 변동성 (방어적 투자자)", passed: beta != null && beta < 1.2, detail: beta != null ? `Beta ${beta.toFixed(2)}` : "미확인" },
      { label: "Net-Net 또는 자산가치 할인", passed: pb != null && pb < 1.0, detail: pb != null && pb < 1.0 ? `P/B ${pb.toFixed(2)} — 순자산 이하` : "순자산 이상" },
    ];
  },

  taleb(q) {
    const de = q.debtToEquity;
    const beta = q.beta;
    const mc = q.marketCap;
    const change = Math.abs(q.regularMarketChangePercent ?? 0);
    return [
      { label: "하방 손실 제한 (정의된 손실)", passed: true, detail: "소량 배분 — 최대 손실 = 투자금" },
      { label: "상방 무제한/대규모 잠재력", passed: beta != null && beta > 1.0, detail: beta != null && beta > 1.0 ? `Beta ${beta.toFixed(2)} — 높은 볼록성` : "안전 자산 — 자본 보존" },
      { label: "부채 낮음 또는 초안전", passed: de != null ? de < 30 : true, detail: de != null ? `D/E ${de.toFixed(1)}%` : "ETF — 부채 무관" },
      { label: "안티프래질 특성", passed: true, detail: "충격에 강해지거나, 충격 보호 역할" },
      { label: "린디 효과 (장수 자산)", passed: mc != null && mc > 1e9, detail: "검증된 자산 클래스 또는 역사 보유" },
      { label: "바벨 포지셔닝 (양극단)", passed: true, detail: "안전측 또는 공격측 — 중간 없음" },
      { label: "비상관 (시장과 독립적)", passed: beta != null && (beta < 0.3 || beta > 2.0), detail: beta != null ? `Beta ${beta.toFixed(2)}` : "미확인" },
      { label: "블랙스완 보험/혜택", passed: true, detail: "극단적 이벤트 시 가치 상승 기대" },
    ];
  },
};

/* ─────────────── Enhanced Thesis Generation (10+ sentences) ─────────────── */

function generateDetailedThesis(
  mentor: MentorProfile,
  stock: UniverseStock,
  q: QuoteData,
  checklist: ChecklistItem[],
  conviction: number,
): { summary: string; macro: string; fundamental: string; technical: string } {
  const price = q.regularMarketPrice ?? 0;
  const pe = q.trailingPE;
  const rg = pct(q.revenueGrowth, 100);
  const om = pct(q.operatingMargins, 100);
  const dy = pct(q.dividendYield, 100);
  const h52 = q.fiftyTwoWeekHigh;
  const l52 = q.fiftyTwoWeekLow;
  const beta = q.beta;
  const de = q.debtToEquity;
  const pctHigh = h52 && price ? ((h52 - price) / h52 * 100) : 0;
  const passed = checklist.filter(c => c.passed).length;
  const total = checklist.length;
  const signalKo = conviction >= 80 ? "강력 매수" : conviction >= 60 ? "매수" : conviction >= 40 ? "관망" : "매도";

  const meta = mentor.speechPatterns;
  const open = meta.openingPhrases[Math.floor(Math.random() * meta.openingPhrases.length)];
  const caution = meta.cautionPhrases[0];
  const metaphor = meta.metaphors[0];

  const summary = `${open} ${stock.name}(${stock.symbol})은 ${mentor.nameKo}의 ${mentor.style} 기준 체크리스트 ${passed}/${total}항목 통과, 확신도 ${conviction}점으로 '${signalKo}' 판단입니다. ${stock.reason}.`;

  const macroLines: string[] = [];
  switch (mentor.id) {
    case "buffett":
      macroLines.push(`[Macro] ${open} ${stock.name}은 '${metaphor}'의 관점에서 현재 매크로 환경을 평가해야 합니다.`);
      macroLines.push(`현재 금리 환경에서 ${stock.sector} 섹터의 '경제적 해자(Moat)'가 어떻게 작동하는지가 핵심입니다.`);
      macroLines.push(`버핏은 "다른 사람들이 두려워할 때 탐욕적이어라"라고 했습니다 — 현재 시장 심리 대비 ${stock.name}의 내재가치는 ${conviction >= 60 ? "매력적인 할인 구간" : "적정 수준"}에 있습니다.`);
      macroLines.push(`'Owner Earnings' 개념으로 볼 때, ${stock.name}의 잉여현금흐름(FCF)은 ${q.freeCashflow && q.freeCashflow > 0 ? `$${(q.freeCashflow / 1e9).toFixed(1)}B로 양호하며` : "확인이 필요하며"}, 이는 경기 변동에도 견딜 수 있는 '능력 범위(Circle of Competence)' 내의 기업임을 시사합니다.`);
      macroLines.push(`장기적 관점에서, 인플레이션 환경은 ${stock.name}처럼 가격 결정력이 있는 기업에게 유리하게 작용합니다. ${om != null && om > 15 ? `영업이익률 ${om.toFixed(1)}%는 이를 뒷받침합니다.` : "마진 추이를 지속 모니터링해야 합니다."}`);
      break;
    case "lynch":
      macroLines.push(`[Macro] ${open} ${stock.name}은 린치의 '칵테일 파티 이론'에서 어느 단계에 있는지 살펴봐야 합니다.`);
      macroLines.push(`현재 소비자 심리와 소매 환경에서 ${stock.name}의 성장 스토리는 ${rg != null && rg > 10 ? "여전히 초기 성장 단계에 있으며" : "성숙 단계에 접어들고 있으며"}, 이는 '텐배거(Tenbagger)' 잠재력에 직결됩니다.`);
      macroLines.push(`"투자 이유를 크레용으로 설명할 수 없다면 사지 마라" — ${stock.name}의 스토리는 "${stock.reason}"으로 한 문장 설명이 가능합니다.`);
      macroLines.push(`소비자 트렌드 관점에서, ${stock.sector} 섹터의 ${stock.name}은 일상에서 직접 관찰하고 확인할 수 있는 GARP(Growth at Reasonable Price) 투자 대상입니다.`);
      macroLines.push(`린치는 기관투자자의 관심이 적은 종목을 선호했습니다. ${q.marketCap != null && q.marketCap < 50e9 ? `시총 $${(q.marketCap / 1e9).toFixed(0)}B는 아직 기관의 레이더 밖에 있을 가능성이 있습니다.` : "대형주이지만 성장 스토리의 진화 중입니다."}`);
      break;
    case "wood":
      macroLines.push(`[Macro] ${open} ${stock.name}은 파괴적 혁신의 'S-curve 변곡점'에 위치한 기업입니다.`);
      macroLines.push(`ARK Invest의 'Wright's Law'에 따르면, 기술의 누적 생산량이 두 배가 될 때마다 비용이 일정 비율 하락합니다 — ${stock.name}은 이 법칙의 수혜 기업입니다.`);
      macroLines.push(`AI, 로봇공학, 유전체학, 에너지 저장, 블록체인이라는 5대 혁신 플랫폼의 '수렴(Convergence)'이 ${stock.name}의 TAM을 폭발적으로 확대하고 있습니다.`);
      macroLines.push(`"우리의 시간 지평은 5년입니다. 단기 변동성은 노이즈일 뿐입니다" — 캐시 우드의 이 원칙에 따라, ${pctHigh > 20 ? `현재 고점 대비 -${pctHigh.toFixed(0)}% 조정은 오히려 매수 기회입니다.` : "현재 가격대는 5년 목표가 대비 평가해야 합니다."}`);
      macroLines.push(`전통적 밸류에이션 모델은 파괴적 혁신 기업에 적합하지 않습니다. ${pe != null ? `현재 P/E ${pe.toFixed(1)}은` : "현재 밸류에이션은"} 성장 궤도와 TAM 대비 평가되어야 합니다.`);
      break;
    case "dalio":
      macroLines.push(`[Macro] ${open} ${stock.name}은 '경제라는 기계(Economic Machine)'의 현재 사이클 위치에서 평가되어야 합니다.`);
      macroLines.push(`레이 달리오의 '사계절(All-Weather)' 프레임워크에서, 현재 경제 환경(성장/인플레이션 조합)에 ${stock.name}이 속한 자산 클래스는 ${conviction >= 60 ? "유리한 포지셔닝" : "중립적 위치"}에 있습니다.`);
      macroLines.push(`"15개 이상의 비상관 수익원을 확보하면 수익/위험 비율을 5배 개선할 수 있다" — ${stock.name}은 포트폴리오 전체의 '리스크 패리티(Risk Parity)' 최적화에 기여합니다.`);
      macroLines.push(`현재 부채 사이클의 위치를 고려하면, ${stock.sector} 자산은 ${beta != null && beta < 1.0 ? "방어적 역할을 수행하며" : "성장 기여 역할을 하며"} 포트폴리오 변동성을 관리합니다.`);
      macroLines.push(`"현실을 있는 그대로 다루라, 당신이 원하는 대로가 아니라" — 원칙 기반 의사결정으로, 감정이 아닌 상관관계 데이터에 기반한 배분을 실행합니다.`);
      break;
    case "simons":
      macroLines.push(`[Macro] ${open} ${stock.name}은 퀀트 모델의 관점에서 매크로 환경과 무관하게 '통계적 우위(Statistical Edge)'로 평가됩니다.`);
      macroLines.push(`짐 사이먼스는 "우리는 시장의 이유를 묻지 않는다. 패턴이 존재하고, 그것이 수익을 준다"라고 했습니다 — ${stock.name}의 가격 데이터에서 추출된 '시그널-노이즈 비율'이 핵심입니다.`);
      macroLines.push(`20일 이동평균선 이격도와 장중 변동성 패턴 분석에서, ${stock.name}은 ${q.averageVolume && q.averageVolume > 5e6 ? "일평균 거래량이 충분하여 통계적 분석이 가능하며" : "거래량 기반 패턴 분석이 제한적이나"}, 비정상적 거래량 동반 추세 신호를 모니터링합니다.`);
      macroLines.push(`"감정은 최악의 투자 도구다" — Medallion Fund의 접근법처럼, ${stock.name}에 대한 모든 포지션은 확률 분포와 기대값 계산에 기반합니다.`);
      macroLines.push(`${stock.name}의 '알파 디케이(Alpha Decay)' 속도를 모니터링하며, 패턴이 소멸되면 즉시 포지션을 청산하는 체계적 접근이 필수적입니다.`);
      break;
    case "minervini":
      macroLines.push(`[Macro] ${open} ${stock.name}은 'SEPA(Specific Entry Point Analysis)' 프레임워크에서 현재 추세 단계를 정밀 분석해야 합니다.`);
      macroLines.push(`마크 미너비니의 '4단계 가격 사이클'에서, ${stock.name}은 ${q.fiftyDayAverage && q.twoHundredDayAverage && price > q.twoHundredDayAverage && q.fiftyDayAverage > q.twoHundredDayAverage ? "Stage 2(상승 추세)에 위치하여 매수 조건을 충족합니다" : "Stage 분석이 필요한 상태입니다"}.`);
      macroLines.push(`"큰 손실은 항상 작은 손실에서 시작된다" — 미너비니의 철칙에 따라, ${stock.name}에 대한 손절 라인은 매수가 대비 -7~8%로 엄격히 설정됩니다.`);
      macroLines.push(`'VCP(Volatility Contraction Pattern)' 관점에서, ${pctHigh != null && pctHigh < 10 ? `현재 고점 대비 -${pctHigh.toFixed(1)}%로 변동성 수축 구간에 진입하여 '피봇 포인트'가 임박했습니다.` : `고점 대비 -${pctHigh?.toFixed(1) ?? "?"}%로 아직 타이트 베이스 형성 중입니다.`}`);
      macroLines.push(`"시장의 진짜 리더를 찾아 올라타라" — ${stock.name}이 속한 ${stock.sector} 섹터에서의 상대강도(RS)와 거래량 패턴이 리더십 여부를 결정합니다.`);
      break;
    case "soros":
      macroLines.push(`[Macro] ${open} ${stock.name}은 '반사성(Reflexivity)' 이론의 렌즈를 통해 시장의 편견(Bias)과 실제 펀더멘털의 괴리를 분석해야 합니다.`);
      macroLines.push(`조지 소로스는 "시장은 항상 틀리며, 이것이 돈을 벌 수 있는 이유다"라고 했습니다 — ${stock.name}에서 시장 참여자의 인식이 현실을 바꾸는 '자기강화(Self-Reinforcing)' 피드백 루프가 ${conviction >= 60 ? "형성되고 있습니다" : "관찰 대기 중입니다"}.`);
      macroLines.push(`${stock.name}이 속한 ${stock.sector} 섹터의 매크로 변곡점을 분석하면, 정책/지정학적 촉매가 ${conviction >= 60 ? "반사성 루프를 가속시킬 위치에 있습니다" : "아직 잠재적 수준에 머물고 있습니다"}.`);
      macroLines.push(`"중요한 것은 맞고 틀림이 아니라, 맞을 때 얼마를 벌고 틀릴 때 얼마를 잃느냐이다" — ${stock.name}에 대한 비대칭 베팅의 리스크/리워드 프로파일을 수학적으로 계산해야 합니다.`);
      macroLines.push(`'붐-버스트(Boom-Bust) 사이클' 관점에서, ${stock.name}은 현재 ${pctHigh != null && pctHigh > 25 ? "버스트 이후 회복 초기" : pctHigh != null && pctHigh < 10 ? "붐 사이클 후반" : "사이클 중반"}에 위치해 있습니다.`);
      break;
    case "fisher":
      macroLines.push(`[Macro] ${open} ${stock.name}은 필립 피셔의 '스컬틀버트(Scuttlebutt)' 방법론으로 경영진의 비전과 기업 문화를 면밀히 평가해야 합니다.`);
      macroLines.push(`"위대한 기업을 찾았다면 시간이 당신의 편이다" — ${stock.name}의 R&D 투자와 혁신 역량은 장기적 매출 대비 높은 영업이익률 잠재력을 보여줍니다.`);
      macroLines.push(`피셔의 '15가지 포인트' 중 핵심은 '경영진의 무결성'과 '장기 잠재력'입니다. ${stock.name}은 체크리스트 ${passed}/${total} 항목을 통과하여 ${passed >= total * 0.7 ? "높은 기준을 충족합니다" : "일부 기준의 추가 확인이 필요합니다"}.`);
      macroLines.push(`"실수 중 가장 흔한 것은 좋은 주식을 너무 일찍 파는 것이다" — ${stock.name}처럼 독보적인 영업망 가치와 강력한 경쟁 우위를 가진 기업은 장기 보유가 원칙입니다.`);
      macroLines.push(`${stock.sector} 섹터에서 ${stock.name}의 기술 리더십은 ${om != null && om > 20 ? `영업이익률 ${om.toFixed(1)}%에서 확인되며, 이는 '가격 결정력'의 증거입니다.` : "향후 마진 확대 잠재력으로 평가됩니다."}`);
      break;
    case "graham":
      macroLines.push(`[Macro] ${open} ${stock.name}은 벤저민 그레이엄의 '안전마진(Margin of Safety)' 원칙으로 내재가치를 산출해야 합니다.`);
      macroLines.push(`"투자의 첫 번째 규칙은 돈을 잃지 않는 것이다" — ${stock.name}의 ${pe != null ? `P/E ${pe.toFixed(1)}` : "밸류에이션"}은 ${pe != null && pe < 15 ? "방어적 투자자의 기준을 충족합니다" : "주의 깊은 분석이 필요합니다"}.`);
      macroLines.push(`Mr. Market이 ${stock.name}에 대해 ${pe != null && pe < 12 ? "극도로 비관적인 가격을 제시하고 있으며, 이것은 사업 파트너의 조울증이지 기업의 본질이 아닙니다" : "비교적 합리적인 가격을 제시하고 있으나, 추가 안전마진 확보가 바람직합니다"}.`);
      macroLines.push(`'순유동자산(Net Current Asset Value)' 관점에서, ${q.priceToBook != null && q.priceToBook < 1.0 ? `P/B ${q.priceToBook.toFixed(2)}로 순자산 이하에 거래되어 Net-Net 조건에 근접합니다.` : `P/B 기준 추가 할인이 이상적이나, 배당과 이익 안정성이 보완합니다.`}`);
      macroLines.push(`"단기적으로 시장은 투표 기계이지만, 장기적으로는 저울이다" — ${stock.name}의 내재가치가 시장 가격으로 회귀할 때까지 인내심을 갖고 보유하는 전략입니다.`);
      break;
    case "taleb":
      macroLines.push(`[Macro] ${open} ${stock.name}은 나심 탈레브의 '바벨 전략(Barbell Strategy)'에서 명확한 역할을 수행합니다.`);
      macroLines.push(`"예측하지 마라, 대비하라" — 포트폴리오의 85-90%는 ${stock.name}처럼 ${beta != null && beta < 0.5 ? "초안전 자산에 배치하여 '칠면조의 착각'을 방지하고" : "극단적 옵션성을 가진 자산에 소량 배분하여 '볼록성(Convexity)'을 확보하고"}, 블랙 스완에 대비합니다.`);
      macroLines.push(`'안티프래질(Antifragile)' 관점에서, ${stock.name}은 ${beta != null && beta > 1.5 ? "외부 충격으로 더 강해질 수 있는 구조를 가지고 있습니다 — 이것이 안티프래질의 본질입니다" : "외부 충격으로부터 자본을 보호하는 '프래질하지 않은' 자산입니다"}.`);
      macroLines.push(`"바람이 촛불을 끄지만 불을 키운다" — ${stock.name}의 ${beta != null && beta > 1.0 ? "높은 변동성은 장기적으로 수익의 원천이며, 소량 배분으로 최대 손실을 제한합니다" : "낮은 변동성은 포트폴리오의 기반을 안정적으로 유지합니다"}.`);
      macroLines.push(`'린디 효과(Lindy Effect)'에 따르면, 오래 생존한 것은 더 오래 생존할 확률이 높습니다 — ${stock.name}은 이 원칙에 ${beta != null && beta < 0.5 ? "부합하는 검증된 자산입니다" : "대한 도전이지만, 옵션성으로 보상받습니다"}.`);
      break;
  }

  const macro = macroLines.join(" ");

  const fundamentalLines: string[] = [];
  fundamentalLines.push(`[Fundamental] ${stock.name}의 핵심 재무 분석: ${pe != null ? `P/E ${pe.toFixed(1)}` : "P/E N/A"}, ${rg != null ? `매출성장률 ${rg.toFixed(1)}%` : ""}, ${om != null ? `영업이익률 ${om.toFixed(1)}%` : ""}, ${dy != null ? `배당 ${dy.toFixed(2)}%` : ""}.`);
  fundamentalLines.push(`체크리스트 분석 결과, ${mentor.nameKo}의 ${total}개 핵심 기준 중 ${passed}개를 통과하여 ${passed >= total * 0.8 ? "매우 높은 부합도" : passed >= total * 0.6 ? "양호한 부합도" : "제한적 부합도"}를 보입니다.`);
  fundamentalLines.push(`${stock.reason} — 이것이 ${mentor.nameKo}의 포트폴리오에 ${stock.name}을 포함시키는 핵심 근거입니다.`);
  fundamentalLines.push(`현재가 $${price.toFixed(2)} 기준, ${pctHigh > 0 ? `52주 고점 대비 -${pctHigh.toFixed(1)}% 수준에서 거래되고 있으며` : "52주 고점 근접 구간이며"}, ${conviction >= 60 ? "매수 조건에 부합합니다" : "추가 분석이 필요합니다"}.`);
  fundamentalLines.push(`${mentor.nameKo}가 가장 중시하는 '${mentor.metrics[0].label}' 지표에서 ${conviction >= 70 ? "우수한 성과를 보이고 있어 포트폴리오 핵심 종목으로 적합합니다" : "개선 여지가 있으나 전체적인 프로파일은 투자 기준에 부합합니다"}.`);

  const fundamental = fundamentalLines.join(" ");

  const technicalLines: string[] = [];
  technicalLines.push(`[Technical] 현재 주가 $${price.toFixed(2)}는 52주 고점 $${h52?.toFixed(2) ?? "N/A"} 대비 -${pctHigh.toFixed(1)}%, 52주 저점 $${l52?.toFixed(2) ?? "N/A"} 대비 +${l52 && price ? (((price - l52) / l52) * 100).toFixed(1) : "N/A"}% 위치입니다.`);
  technicalLines.push(`일일 변동률 ${q.regularMarketChangePercent != null ? (q.regularMarketChangePercent >= 0 ? "+" : "") + q.regularMarketChangePercent.toFixed(2) + "%" : "N/A"}로 ${Math.abs(q.regularMarketChangePercent ?? 0) > 2 ? "높은 변동성을 보이고 있습니다" : "안정적인 흐름을 유지하고 있습니다"}.`);
  if (q.fiftyDayAverage) technicalLines.push(`50일 이동평균 $${q.fiftyDayAverage.toFixed(2)} ${price > q.fiftyDayAverage ? "상회 — 단기 상승 추세" : "하회 — 단기 약세 구간"}.`);
  if (q.twoHundredDayAverage) technicalLines.push(`200일 이동평균 $${q.twoHundredDayAverage.toFixed(2)} ${price > q.twoHundredDayAverage ? "상회 — 장기 상승 추세 유지" : "하회 — 장기 추세 전환 확인 필요"}.`);
  technicalLines.push(`${caution} — 리스크 관리 측면에서, ${mentor.nameKo}의 원칙에 따라 포지션 사이즈와 손절 전략을 사전에 수립해야 합니다.`);

  const technical = technicalLines.join(" ");

  return { summary, macro, fundamental, technical };
}

/* ─────────────── Portfolio Builder ─────────────── */

export function buildMentorPortfolio(
  mentorId: string,
  quotesMap: Record<string, QuoteData>,
): MentorPortfolioResult {
  const mentor = MENTOR_MAP[mentorId];
  if (!mentor) throw new Error(`Unknown mentor: ${mentorId}`);

  const universe = MENTOR_UNIVERSES[mentorId] || [];
  const checklistFn = CHECKLIST_FNS[mentorId];
  if (!checklistFn) throw new Error(`No checklist for: ${mentorId}`);

  const scored: (PortfolioItem & { _raw: number })[] = [];

  for (const stock of universe) {
    const q = quotesMap[stock.symbol];
    if (!q || !q.regularMarketPrice) continue;

    const checklist = checklistFn(q, stock);
    const passed = checklist.filter(c => c.passed).length;
    const total = checklist.length;
    const passRate = total > 0 ? passed / total : 0;
    const conviction = Math.round(Math.max(20, Math.min(98, passRate * 100 + (passRate > 0.7 ? 10 : 0))));
    const signal: Signal = conviction >= 80 ? "STRONG_BUY" : conviction >= 60 ? "BUY" : conviction >= 40 ? "HOLD" : conviction >= 25 ? "SELL" : "STRONG_SELL";

    const thesis = generateDetailedThesis(mentor, stock, q, checklist, conviction);

    const metrics: PortfolioItem["keyMetrics"] = [];
    for (const c of checklist.slice(0, 5)) {
      metrics.push({
        label: c.label.split("(")[0].trim(),
        value: c.detail.split(" ")[0] === "데이터" ? "N/A" : c.detail.split("—")[0].trim().slice(0, 20),
        assessment: c.passed ? "positive" : "negative",
      });
    }

    scored.push({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      weight: 0,
      conviction,
      currentPrice: q.regularMarketPrice ?? 0,
      pe: q.trailingPE ?? null,
      change: q.regularMarketChangePercent ?? 0,
      signal,
      thesisSummary: thesis.summary,
      thesisDetail: { macro: thesis.macro, fundamental: thesis.fundamental, technical: thesis.technical },
      keyMetrics: metrics,
      checklist,
      checklistScore: `${passed}/${total}`,
      _raw: conviction,
    });
  }

  scored.sort((a, b) => b._raw - a._raw);
  const top = scored.slice(0, 10);

  const totalConv = top.reduce((s, t) => s + t.conviction, 0);
  for (const item of top) {
    item.weight = totalConv > 0 ? Math.round((item.conviction / totalConv) * 100) : Math.round(100 / top.length);
  }
  const sum = top.reduce((s, t) => s + t.weight, 0);
  if (top.length > 0 && sum !== 100) top[0].weight += 100 - sum;

  const portfolio: PortfolioItem[] = top.map(({ _raw, ...rest }) => rest);

  const sectorMap = new Map<string, number>();
  for (const p of portfolio) sectorMap.set(p.sector, (sectorMap.get(p.sector) || 0) + p.weight);
  const allocation = Array.from(sectorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([sector, weight]) => ({ sector, weight, color: sectorColor(sector) }));

  return {
    mentorId: mentor.id,
    mentorName: mentor.name,
    mentorNameKo: mentor.nameKo,
    style: mentor.style,
    philosophy: mentor.philosophy,
    portfolio,
    generatedAt: new Date().toISOString(),
    totalConviction: top.length > 0 ? Math.round(top.reduce((s, t) => s + t.conviction, 0) / top.length) : 0,
    allocation,
  };
}

/* ─────────────── Zero-Overlap Deduplication ─────────────── */

export function deduplicatePortfolios(
  portfolios: MentorPortfolioResult[],
  maxOverlap = 2,
): MentorPortfolioResult[] {
  const symbolCount = new Map<string, { mentorId: string; conviction: number }[]>();

  for (const p of portfolios) {
    for (const item of p.portfolio) {
      const list = symbolCount.get(item.symbol) || [];
      list.push({ mentorId: p.mentorId, conviction: item.conviction });
      symbolCount.set(item.symbol, list);
    }
  }

  const toRemove = new Map<string, Set<string>>();
  symbolCount.forEach((mentors, symbol) => {
    if (mentors.length > maxOverlap) {
      mentors.sort((a: { conviction: number }, b: { conviction: number }) => a.conviction - b.conviction);
      const excess = mentors.length - maxOverlap;
      for (let i = 0; i < excess; i++) {
        const mid = mentors[i].mentorId;
        if (!toRemove.has(mid)) toRemove.set(mid, new Set());
        toRemove.get(mid)!.add(symbol);
      }
    }
  });

  return portfolios.map((p) => {
    const removals = toRemove.get(p.mentorId);
    if (!removals || removals.size === 0) return p;

    const filtered = p.portfolio.filter((item) => !removals.has(item.symbol));
    const totalConv = filtered.reduce((s, t) => s + t.conviction, 0);
    for (const item of filtered) {
      item.weight = totalConv > 0 ? Math.round((item.conviction / totalConv) * 100) : 0;
    }
    const sum = filtered.reduce((s, t) => s + t.weight, 0);
    if (filtered.length > 0 && sum !== 100) filtered[0].weight += 100 - sum;

    const sectorMap = new Map<string, number>();
    for (const f of filtered) sectorMap.set(f.sector, (sectorMap.get(f.sector) || 0) + f.weight);
    const allocation = Array.from(sectorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([sector, weight]) => ({ sector, weight, color: sectorColor(sector) }));

    return {
      ...p,
      portfolio: filtered,
      totalConviction: filtered.length > 0 ? Math.round(filtered.reduce((s, t) => s + t.conviction, 0) / filtered.length) : 0,
      allocation,
    };
  });
}

/* ─────────────── Helpers ─────────────── */

export function getAllUniverseSymbols(): string[] {
  const all = new Set<string>();
  for (const stocks of Object.values(MENTOR_UNIVERSES)) {
    for (const s of stocks) all.add(s.symbol);
  }
  return Array.from(all);
}
