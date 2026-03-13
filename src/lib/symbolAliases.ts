export type SymbolAlias = {
  symbol: string;
  name: string;
  exchange?: string;
  aliases: string[];
};

const ALIASES: SymbolAlias[] = [
  // ── Korean Stocks ──
  { symbol: "005930.KS", name: "삼성전자", exchange: "KSE", aliases: ["삼성전자", "삼성", "Samsung Electronics", "samsung electronics", "samsung"] },
  { symbol: "000660.KS", name: "SK하이닉스", exchange: "KSE", aliases: ["sk하이닉스", "하이닉스", "SK hynix", "hynix"] },
  { symbol: "035420.KS", name: "NAVER", exchange: "KSE", aliases: ["네이버", "naver"] },
  { symbol: "035720.KS", name: "카카오", exchange: "KSE", aliases: ["카카오", "kakao"] },
  { symbol: "051910.KS", name: "LG화학", exchange: "KSE", aliases: ["lg화학", "LG Chem", "lg chem"] },
  { symbol: "005380.KS", name: "현대자동차", exchange: "KSE", aliases: ["현대차", "현대자동차", "현대", "hyundai", "hyundai motor"] },
  { symbol: "006400.KS", name: "삼성SDI", exchange: "KSE", aliases: ["삼성sdi", "삼성에스디아이"] },
  { symbol: "003670.KS", name: "포스코홀딩스", exchange: "KSE", aliases: ["포스코", "posco"] },
  { symbol: "105560.KS", name: "KB금융", exchange: "KSE", aliases: ["kb금융", "국민은행", "kb"] },
  { symbol: "055550.KS", name: "신한지주", exchange: "KSE", aliases: ["신한", "신한은행", "신한지주", "shinhan"] },
  { symbol: "CPNG", name: "Coupang", exchange: "NYSE", aliases: ["쿠팡", "coupang"] },

  // ── US Tech ──
  { symbol: "AAPL", name: "Apple", exchange: "NASDAQ", aliases: ["애플", "apple", "apple inc"] },
  { symbol: "MSFT", name: "Microsoft", exchange: "NASDAQ", aliases: ["마이크로소프트", "마소", "microsoft", "microsoft corporation"] },
  { symbol: "NVDA", name: "NVIDIA", exchange: "NASDAQ", aliases: ["엔비디아", "엔비", "nvidia", "nvidia corporation"] },
  { symbol: "AMZN", name: "Amazon", exchange: "NASDAQ", aliases: ["아마존", "amazon", "amazon.com"] },
  { symbol: "GOOGL", name: "Alphabet", exchange: "NASDAQ", aliases: ["알파벳", "구글", "google", "alphabet"] },
  { symbol: "TSLA", name: "Tesla", exchange: "NASDAQ", aliases: ["테슬라", "tesla"] },
  { symbol: "META", name: "Meta", exchange: "NASDAQ", aliases: ["메타", "페이스북", "facebook", "meta platforms"] },
  { symbol: "INTC", name: "Intel", exchange: "NASDAQ", aliases: ["인텔", "인탤", "intel", "intel corporation", "intel corp"] },
  { symbol: "AMD", name: "AMD", exchange: "NASDAQ", aliases: ["에이엠디", "amd", "advanced micro devices"] },
  { symbol: "QCOM", name: "Qualcomm", exchange: "NASDAQ", aliases: ["퀄컴", "퀄콤", "qualcomm"] },
  { symbol: "AVGO", name: "Broadcom", exchange: "NASDAQ", aliases: ["브로드컴", "broadcom"] },
  { symbol: "MU", name: "Micron", exchange: "NASDAQ", aliases: ["마이크론", "micron", "micron technology"] },
  { symbol: "NFLX", name: "Netflix", exchange: "NASDAQ", aliases: ["넷플릭스", "넷플", "netflix"] },
  { symbol: "ADBE", name: "Adobe", exchange: "NASDAQ", aliases: ["어도비", "아도비", "adobe"] },
  { symbol: "CRM", name: "Salesforce", exchange: "NYSE", aliases: ["세일즈포스", "salesforce"] },
  { symbol: "ORCL", name: "Oracle", exchange: "NYSE", aliases: ["오라클", "oracle", "oracle corporation"] },
  { symbol: "IBM", name: "IBM", exchange: "NYSE", aliases: ["아이비엠", "ibm"] },
  { symbol: "CSCO", name: "Cisco", exchange: "NASDAQ", aliases: ["시스코", "cisco", "cisco systems"] },
  { symbol: "TXN", name: "Texas Instruments", exchange: "NASDAQ", aliases: ["텍사스인스트루먼트", "texas instruments", "ti"] },
  { symbol: "PLTR", name: "Palantir", exchange: "NYSE", aliases: ["팔란티어", "palantir"] },
  { symbol: "SNOW", name: "Snowflake", exchange: "NYSE", aliases: ["스노우플레이크", "snowflake"] },
  { symbol: "UBER", name: "Uber", exchange: "NYSE", aliases: ["우버", "uber"] },
  { symbol: "ABNB", name: "Airbnb", exchange: "NASDAQ", aliases: ["에어비앤비", "airbnb"] },
  { symbol: "SPOT", name: "Spotify", exchange: "NYSE", aliases: ["스포티파이", "spotify"] },
  { symbol: "ZM", name: "Zoom", exchange: "NASDAQ", aliases: ["줌", "zoom", "zoom video"] },
  { symbol: "SQ", name: "Block", exchange: "NYSE", aliases: ["블록", "스퀘어", "block", "square"] },
  { symbol: "SHOP", name: "Shopify", exchange: "NYSE", aliases: ["쇼피파이", "shopify"] },
  { symbol: "NET", name: "Cloudflare", exchange: "NYSE", aliases: ["클라우드플레어", "cloudflare"] },
  { symbol: "PANW", name: "Palo Alto Networks", exchange: "NASDAQ", aliases: ["팔로알토", "palo alto networks", "palo alto"] },
  { symbol: "CRWD", name: "CrowdStrike", exchange: "NASDAQ", aliases: ["크라우드스트라이크", "crowdstrike"] },
  { symbol: "COIN", name: "Coinbase", exchange: "NASDAQ", aliases: ["코인베이스", "coinbase"] },
  { symbol: "MSTR", name: "MicroStrategy", exchange: "NASDAQ", aliases: ["마이크로스트래티지", "microstrategy"] },
  { symbol: "ARM", name: "Arm Holdings", exchange: "NASDAQ", aliases: ["암홀딩스", "arm", "arm holdings"] },
  { symbol: "TSM", name: "TSMC", exchange: "NYSE", aliases: ["tsmc", "대만반도체", "타이완세미컨덕터", "taiwan semiconductor"] },
  { symbol: "ASML", name: "ASML", exchange: "NASDAQ", aliases: ["asml", "에이에스엠엘"] },

  // ── US Finance ──
  { symbol: "BRK-A", name: "Berkshire Hathaway Class A", exchange: "NYSE", aliases: ["버크셔 A", "버크셔해서웨이 A", "berkshire a", "brk-a", "brk.a"] },
  { symbol: "BRK-B", name: "Berkshire Hathaway Class B", exchange: "NYSE", aliases: ["버크셔", "버크셔 해서웨이", "버크셔해서웨이", "berkshire", "berkshire hathaway", "brk-b", "brk.b"] },
  { symbol: "JPM", name: "JPMorgan Chase", exchange: "NYSE", aliases: ["제이피모건", "JP모건", "jp모건", "jpmorgan", "jpmorgan chase"] },
  { symbol: "GS", name: "Goldman Sachs", exchange: "NYSE", aliases: ["골드만삭스", "골드만", "goldman sachs", "goldman"] },
  { symbol: "MS", name: "Morgan Stanley", exchange: "NYSE", aliases: ["모건스탠리", "morgan stanley"] },
  { symbol: "BAC", name: "Bank of America", exchange: "NYSE", aliases: ["뱅크오브아메리카", "BOA", "bank of america"] },
  { symbol: "C", name: "Citigroup", exchange: "NYSE", aliases: ["시티그룹", "시티", "citigroup", "citi"] },
  { symbol: "V", name: "Visa", exchange: "NYSE", aliases: ["비자", "visa"] },
  { symbol: "MA", name: "Mastercard", exchange: "NYSE", aliases: ["마스터카드", "mastercard"] },
  { symbol: "PYPL", name: "PayPal", exchange: "NASDAQ", aliases: ["페이팔", "paypal"] },
  { symbol: "AXP", name: "American Express", exchange: "NYSE", aliases: ["아메리칸익스프레스", "아멕스", "american express", "amex"] },

  // ── US Consumer / Retail ──
  { symbol: "WMT", name: "Walmart", exchange: "NYSE", aliases: ["월마트", "walmart"] },
  { symbol: "COST", name: "Costco", exchange: "NASDAQ", aliases: ["코스트코", "costco"] },
  { symbol: "NKE", name: "Nike", exchange: "NYSE", aliases: ["나이키", "nike"] },
  { symbol: "SBUX", name: "Starbucks", exchange: "NASDAQ", aliases: ["스타벅스", "starbucks"] },
  { symbol: "MCD", name: "McDonald's", exchange: "NYSE", aliases: ["맥도날드", "맥도널드", "mcdonalds", "mcdonald's"] },
  { symbol: "KO", name: "Coca-Cola", exchange: "NYSE", aliases: ["코카콜라", "coca-cola", "coca cola", "coke"] },
  { symbol: "PEP", name: "PepsiCo", exchange: "NASDAQ", aliases: ["펩시", "펩시코", "pepsico", "pepsi"] },
  { symbol: "PG", name: "Procter & Gamble", exchange: "NYSE", aliases: ["피앤지", "P&G", "procter gamble", "procter & gamble"] },
  { symbol: "DIS", name: "Walt Disney", exchange: "NYSE", aliases: ["디즈니", "disney", "walt disney"] },

  // ── US Healthcare / Pharma ──
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", aliases: ["존슨앤존슨", "존슨", "johnson", "johnson & johnson", "j&j"] },
  { symbol: "PFE", name: "Pfizer", exchange: "NYSE", aliases: ["화이자", "pfizer"] },
  { symbol: "MRNA", name: "Moderna", exchange: "NASDAQ", aliases: ["모더나", "moderna"] },
  { symbol: "LLY", name: "Eli Lilly", exchange: "NYSE", aliases: ["일라이릴리", "릴리", "eli lilly", "lilly"] },
  { symbol: "UNH", name: "UnitedHealth", exchange: "NYSE", aliases: ["유나이티드헬스", "유나이티드 헬스", "유나이티드헬스그룹", "unitedhealth", "unitedhealth group", "united health"] },
  { symbol: "ABBV", name: "AbbVie", exchange: "NYSE", aliases: ["애브비", "abbvie"] },
  { symbol: "NVO", name: "Novo Nordisk", exchange: "NYSE", aliases: ["노보노디스크", "노보", "novo nordisk"] },

  // ── US Industrial / Energy ──
  { symbol: "BA", name: "Boeing", exchange: "NYSE", aliases: ["보잉", "boeing"] },
  { symbol: "LMT", name: "Lockheed Martin", exchange: "NYSE", aliases: ["록히드마틴", "록히드", "lockheed martin", "lockheed"] },
  { symbol: "CAT", name: "Caterpillar", exchange: "NYSE", aliases: ["캐터필러", "caterpillar"] },
  { symbol: "GE", name: "GE Aerospace", exchange: "NYSE", aliases: ["제너럴일렉트릭", "GE", "ge aerospace", "general electric"] },
  { symbol: "XOM", name: "Exxon Mobil", exchange: "NYSE", aliases: ["엑슨모빌", "엑손모빌", "exxon mobil", "exxon"] },
  { symbol: "CVX", name: "Chevron", exchange: "NYSE", aliases: ["쉐브론", "셰브론", "chevron"] },
  { symbol: "SHEL", name: "Shell", exchange: "NYSE", aliases: ["쉘", "셸", "shell"] },

  // ── US EV / Auto ──
  { symbol: "RIVN", name: "Rivian", exchange: "NASDAQ", aliases: ["리비안", "rivian"] },
  { symbol: "LCID", name: "Lucid", exchange: "NASDAQ", aliases: ["루시드", "lucid", "lucid motors"] },
  { symbol: "F", name: "Ford", exchange: "NYSE", aliases: ["포드", "ford", "ford motor"] },
  { symbol: "GM", name: "General Motors", exchange: "NYSE", aliases: ["제너럴모터스", "GM", "general motors"] },

  // ── ETFs ──
  { symbol: "SPY", name: "SPDR S&P 500 ETF", exchange: "NYSEARCA", aliases: ["spy", "s&p 500 etf", "spdr"] },
  { symbol: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ", aliases: ["qqq", "nasdaq etf", "invesco qqq", "큐큐큐"] },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", exchange: "NYSEARCA", aliases: ["vti", "vanguard total stock market"] },
  { symbol: "ARKK", name: "ARK Innovation ETF", exchange: "NYSEARCA", aliases: ["arkk", "아크", "ark innovation"] },
  { symbol: "SOXL", name: "Direxion Semiconductor Bull 3X", exchange: "NYSEARCA", aliases: ["soxl", "삭슬", "반도체3배"] },

  // ── Japan ──
  { symbol: "7203.T", name: "Toyota Motor", exchange: "TSE", aliases: ["도요타", "토요타", "toyota", "toyota motor"] },
  { symbol: "6758.T", name: "Sony Group", exchange: "TSE", aliases: ["소니", "sony", "sony group"] },
  { symbol: "9984.T", name: "SoftBank Group", exchange: "TSE", aliases: ["소프트뱅크", "softbank", "softbank group"] },
  { symbol: "7974.T", name: "Nintendo", exchange: "TSE", aliases: ["닌텐도", "nintendo"] },
  { symbol: "6861.T", name: "Keyence", exchange: "TSE", aliases: ["키엔스", "keyence"] },

  // ── Europe ──
  { symbol: "BMW.DE", name: "BMW", exchange: "XETRA", aliases: ["bmw", "비엠더블유"] },
  { symbol: "ADS.DE", name: "Adidas", exchange: "XETRA", aliases: ["adidas", "아디다스"] },
  { symbol: "SAP.DE", name: "SAP", exchange: "XETRA", aliases: ["sap", "에스에이피"] },
  { symbol: "SIE.DE", name: "Siemens", exchange: "XETRA", aliases: ["지멘스", "siemens"] },
  { symbol: "MC.PA", name: "LVMH", exchange: "EPA", aliases: ["lvmh", "루이비통", "루이뷔통"] },
  { symbol: "AIR.PA", name: "Airbus", exchange: "EPA", aliases: ["airbus", "에어버스"] },
  { symbol: "OR.PA", name: "L'Oréal", exchange: "EPA", aliases: ["로레알", "loreal", "l'oreal"] },
  { symbol: "NESN.SW", name: "Nestlé", exchange: "SIX", aliases: ["네슬레", "nestle", "nestlé"] },
  { symbol: "NOVO-B.CO", name: "Novo Nordisk", exchange: "CPH", aliases: ["노보노디스크", "novo nordisk"] },

  // ── Indices ──
  { symbol: "^GSPC", name: "S&P 500", exchange: "INDEX", aliases: ["s&p500", "sp500", "에스앤피", "미국지수", "s&p 500"] },
  { symbol: "^IXIC", name: "NASDAQ", exchange: "INDEX", aliases: ["nasdaq", "나스닥", "나스닥 종합"] },
  { symbol: "^DJI", name: "Dow Jones", exchange: "INDEX", aliases: ["dow jones", "다우", "다우존스"] },
  { symbol: "^RUT", name: "Russell 2000", exchange: "INDEX", aliases: ["russell", "russell 2000", "러셀", "러셀 2000"] },
  { symbol: "^KS11", name: "KOSPI", exchange: "INDEX", aliases: ["kospi", "코스피"] },
  { symbol: "^KQ11", name: "KOSDAQ", exchange: "INDEX", aliases: ["kosdaq", "코스닥"] },
  { symbol: "^N225", name: "Nikkei 225", exchange: "INDEX", aliases: ["nikkei", "nikkei 225", "닛케이", "니케이"] },
  { symbol: "^GDAXI", name: "DAX", exchange: "INDEX", aliases: ["dax", "닥스"] },
  { symbol: "^FTSE", name: "FTSE 100", exchange: "INDEX", aliases: ["ftse", "ftse100", "풋시", "ftse 100"] },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9\u00C0-\u024F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]+/gi, "");
}

/**
 * Decompose Korean syllable into (initial, medial, final) indices,
 * then map similar-sounding jamo to canonical forms so that
 * "인텔" and "인탤" produce the same normalized string.
 *
 * Vowel merges: ㅐ→ㅔ, ㅒ→ㅖ, ㅙ→ㅞ, ㅓ↔ㅗ (common in transliteration)
 * Consonant merges: tensed → plain (ㄲ→ㄱ, ㄸ→ㄷ, ㅃ→ㅂ, ㅆ→ㅅ, ㅉ→ㅈ)
 */
function normalizeKoreanFuzzy(value: string): string {
  const s = value.toLowerCase().normalize("NFKC");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      let initial = Math.floor(offset / (21 * 28));
      let medial = Math.floor((offset % (21 * 28)) / 28);
      let final_ = offset % 28;

      // Tensed initial → plain: ㄲ(1)→ㄱ(0), ㄸ(4)→ㄷ(3), ㅃ(8)→ㅂ(7), ㅆ(10)→ㅅ(9), ㅉ(13)→ㅈ(12)
      if (initial === 1) initial = 0;
      else if (initial === 4) initial = 3;
      else if (initial === 8) initial = 7;
      else if (initial === 10) initial = 9;
      else if (initial === 13) initial = 12;

      // Vowel: ㅐ(1)→ㅔ(5), ㅒ(3)→ㅖ(7), ㅙ(10)→ㅞ(15), ㅓ(4)→ㅗ(8)
      if (medial === 1) medial = 5;
      else if (medial === 3) medial = 7;
      else if (medial === 10) medial = 15;
      else if (medial === 4) medial = 8;

      // Tensed final → plain: ㄲ(2)→ㄱ(1), ㅆ(20)→ㅅ(19)
      if (final_ === 2) final_ = 1;
      else if (final_ === 20) final_ = 19;

      out += String.fromCharCode(0xac00 + (initial * 21 + medial) * 28 + final_);
    } else {
      out += s[i];
    }
  }
  return out.replace(/[^a-z0-9\u00C0-\u024F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]+/gi, "");
}

function isKorean(value: string): boolean {
  return /[\uAC00-\uD7AF]/.test(value);
}

export function searchSymbolAliases(query: string): { symbol: string; name: string; exchange: string }[] {
  const q = normalize(query.trim());
  if (q.length < 1) return [];

  const qFuzzy = isKorean(query) ? normalizeKoreanFuzzy(query.trim()) : null;

  return ALIASES.filter((x) => {
    const base = [x.symbol, x.name, ...x.aliases].map(normalize);
    if (base.some((b) => b.includes(q))) return true;
    if (qFuzzy) {
      const fuzzyBase = [x.symbol, x.name, ...x.aliases].map(normalizeKoreanFuzzy);
      return fuzzyBase.some((b) => b.includes(qFuzzy));
    }
    return false;
  }).map((x) => ({
    symbol: x.symbol,
    name: x.name,
    exchange: x.exchange || "",
  }));
}
