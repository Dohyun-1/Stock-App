import { gunzipSync } from "zlib";

export type UniverseItem = {
  symbol: string;
  name: string;
  exchange: string;
  aliases?: string[];
};

const QUERY_SYNONYMS: Array<{ re: RegExp; expand: string[] }> = [
  // Korean stocks
  { re: /삼성/, expand: ["samsung", "samsung electronics", "005930"] },
  { re: /하이닉스/, expand: ["sk hynix", "hynix", "000660"] },
  { re: /현대차|현대자동차/, expand: ["hyundai", "hyundai motor", "005380"] },
  { re: /네이버/, expand: ["naver", "035420"] },
  { re: /카카오/, expand: ["kakao", "035720"] },
  { re: /쿠팡/, expand: ["coupang", "cpng"] },
  { re: /포스코/, expand: ["posco", "003670"] },

  // US Tech — phonetic Korean variants
  { re: /애플/, expand: ["apple", "aapl"] },
  { re: /마이크로소프트|마소/, expand: ["microsoft", "msft"] },
  { re: /엔비디아|엔비/, expand: ["nvidia", "nvda"] },
  { re: /아마존/, expand: ["amazon", "amzn"] },
  { re: /구글|알파벳/, expand: ["google", "alphabet", "googl"] },
  { re: /테슬라/, expand: ["tesla", "tsla"] },
  { re: /메타|페이스북/, expand: ["meta", "facebook", "meta platforms"] },
  { re: /인텔|인탤/, expand: ["intel", "intel corporation", "intc"] },
  { re: /에이엠디/, expand: ["amd", "advanced micro devices"] },
  { re: /퀄컴|퀄콤/, expand: ["qualcomm", "qcom"] },
  { re: /브로드컴/, expand: ["broadcom", "avgo"] },
  { re: /마이크론/, expand: ["micron", "micron technology", "mu"] },
  { re: /넷플릭스|넷플/, expand: ["netflix", "nflx"] },
  { re: /어도비|아도비/, expand: ["adobe", "adbe"] },
  { re: /세일즈포스/, expand: ["salesforce", "crm"] },
  { re: /오라클/, expand: ["oracle", "orcl"] },
  { re: /아이비엠/, expand: ["ibm"] },
  { re: /시스코/, expand: ["cisco", "csco"] },
  { re: /팔란티어/, expand: ["palantir", "pltr"] },
  { re: /스노우플레이크/, expand: ["snowflake", "snow"] },
  { re: /우버/, expand: ["uber"] },
  { re: /에어비앤비/, expand: ["airbnb", "abnb"] },
  { re: /스포티파이/, expand: ["spotify", "spot"] },
  { re: /줌/, expand: ["zoom", "zm"] },
  { re: /쇼피파이/, expand: ["shopify", "shop"] },
  { re: /클라우드플레어/, expand: ["cloudflare", "net"] },
  { re: /크라우드스트라이크/, expand: ["crowdstrike", "crwd"] },
  { re: /코인베이스/, expand: ["coinbase", "coin"] },
  { re: /팔로알토/, expand: ["palo alto networks", "panw"] },
  { re: /마이크로스트래티지/, expand: ["microstrategy", "mstr"] },
  { re: /텍사스인스트루먼트/, expand: ["texas instruments", "txn"] },
  { re: /블록|스퀘어/, expand: ["block", "square", "sq"] },
  { re: /암홀딩스/, expand: ["arm", "arm holdings"] },
  { re: /대만반도체|타이완세미/, expand: ["tsmc", "taiwan semiconductor", "tsm"] },
  { re: /에이에스엠엘/, expand: ["asml"] },

  // US Finance
  { re: /버크셔|해서웨이|해세웨이/, expand: ["berkshire hathaway", "brk-b"] },
  { re: /제이피모건|jp모건/, expand: ["jpmorgan", "jpmorgan chase", "jpm"] },
  { re: /골드만삭스|골드만/, expand: ["goldman sachs", "gs"] },
  { re: /모건스탠리/, expand: ["morgan stanley", "ms"] },
  { re: /뱅크오브아메리카/, expand: ["bank of america", "bac"] },
  { re: /시티그룹|시티/, expand: ["citigroup", "citi", "c"] },
  { re: /비자/, expand: ["visa", "v"] },
  { re: /마스터카드/, expand: ["mastercard", "ma"] },
  { re: /페이팔/, expand: ["paypal", "pypl"] },
  { re: /아멕스|아메리칸익스프레스/, expand: ["american express", "amex", "axp"] },

  // US Consumer / Retail
  { re: /월마트/, expand: ["walmart", "wmt"] },
  { re: /코스트코/, expand: ["costco", "cost"] },
  { re: /나이키/, expand: ["nike", "nke"] },
  { re: /스타벅스/, expand: ["starbucks", "sbux"] },
  { re: /맥도날드|맥도널드/, expand: ["mcdonald's", "mcdonalds", "mcd"] },
  { re: /코카콜라/, expand: ["coca-cola", "coca cola", "ko"] },
  { re: /펩시/, expand: ["pepsico", "pepsi", "pep"] },
  { re: /피앤지/, expand: ["procter gamble", "pg"] },
  { re: /디즈니/, expand: ["disney", "walt disney", "dis"] },

  // US Healthcare / Pharma
  { re: /존슨/, expand: ["johnson", "johnson & johnson", "jnj"] },
  { re: /화이자/, expand: ["pfizer", "pfe"] },
  { re: /모더나/, expand: ["moderna", "mrna"] },
  { re: /일라이릴리|릴리/, expand: ["eli lilly", "lilly", "lly"] },
  { re: /유나이티드\s*헬스/, expand: ["unitedhealth", "unitedhealth group", "united health", "unh"] },
  { re: /애브비/, expand: ["abbvie", "abbv"] },
  { re: /노보노디스크|노보/, expand: ["novo nordisk", "nvo"] },

  // US Industrial / Energy
  { re: /보잉/, expand: ["boeing", "ba"] },
  { re: /록히드/, expand: ["lockheed martin", "lockheed", "lmt"] },
  { re: /캐터필러/, expand: ["caterpillar", "cat"] },
  { re: /제너럴일렉트릭/, expand: ["ge aerospace", "general electric", "ge"] },
  { re: /엑슨모빌|엑손모빌/, expand: ["exxon mobil", "exxon", "xom"] },
  { re: /쉐브론|셰브론/, expand: ["chevron", "cvx"] },
  { re: /쉘|셸/, expand: ["shell", "shel"] },

  // US EV / Auto
  { re: /리비안/, expand: ["rivian", "rivn"] },
  { re: /루시드/, expand: ["lucid", "lucid motors", "lcid"] },
  { re: /포드/, expand: ["ford", "ford motor", "f"] },
  { re: /제너럴모터스/, expand: ["general motors", "gm"] },

  // Japan
  { re: /도요타|토요타/, expand: ["toyota", "7203"] },
  { re: /소니/, expand: ["sony", "6758"] },
  { re: /소프트뱅크/, expand: ["softbank", "9984"] },
  { re: /닌텐도/, expand: ["nintendo", "7974"] },
  { re: /키엔스/, expand: ["keyence", "6861"] },

  // Europe
  { re: /비엠더블유/, expand: ["bmw"] },
  { re: /아디다스/, expand: ["adidas", "ads"] },
  { re: /지멘스/, expand: ["siemens", "sie"] },
  { re: /루이비통|루이뷔통/, expand: ["lvmh", "mc"] },
  { re: /에어버스/, expand: ["airbus", "air"] },
  { re: /로레알/, expand: ["loreal", "l'oreal", "or"] },
  { re: /네슬레/, expand: ["nestle", "nestlé", "nesn"] },

  // Indices
  { re: /코스피/, expand: ["kospi", "^ks11"] },
  { re: /코스닥/, expand: ["kosdaq", "^kq11"] },
  { re: /나스닥/, expand: ["nasdaq", "^ixic", "nasdaq 100", "qqq"] },
  { re: /다우/, expand: ["dow jones", "^dji"] },
  { re: /러셀/, expand: ["russell 2000", "^rut", "iwm"] },
  { re: /니케이|닛케이/, expand: ["nikkei", "^n225"] },
  { re: /dax/i, expand: ["dax", "^gdaxi"] },
  { re: /ftse/i, expand: ["ftse", "^ftse"] },
  { re: /에스앤피/, expand: ["s&p 500", "sp500", "spy", "^gspc"] },
  { re: /닥스/, expand: ["dax", "^gdaxi"] },
  { re: /풋시/, expand: ["ftse", "^ftse"] },

  // ETFs
  { re: /큐큐큐/, expand: ["qqq", "invesco qqq"] },
  { re: /아크/, expand: ["ark", "arkk", "ark innovation"] },
  { re: /삭슬|반도체3배/, expand: ["soxl"] },
];

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let universeCache: { expiresAt: number; data: UniverseItem[] } | null = null;
let inflight: Promise<UniverseItem[]> | null = null;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9\u00C0-\u024F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]+/gi, "");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }
    if (ch === "," && !inQuote) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseSimpleCsv(text: string): Array<Record<string, string>> {
  const lines = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (lines.length <= 1) return [];
  const headers = parseCsvLine(lines[0]);
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

async function fetchYfiuaConstituents(code: "sp500" | "nasdaq100" | "dowjones" | "dax" | "ftse100"): Promise<UniverseItem[]> {
  const url = `https://raw.githubusercontent.com/yfiua/index-constituents/main/docs/constituents-${code}.json`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  const exchange =
    code === "dax" ? "XETRA" : code === "ftse100" ? "LSE" : "US";
  return (Array.isArray(json) ? json : [])
    .map((x) => ({
      symbol: String(x?.Symbol || "").trim(),
      name: String(x?.Name || "").trim(),
      exchange,
    }))
    .filter((x) => x.symbol && x.name);
}

async function fetchRussell2000(): Promise<UniverseItem[]> {
  const url = "https://raw.githubusercontent.com/ikoniaris/Russell2000/master/russell_2000_components.csv";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) return [];
  const text = await res.text();
  const rows = parseSimpleCsv(text);
  return rows
    .map((r) => ({
      symbol: (r.Ticker || "").toUpperCase(),
      name: (r.Name || "").trim(),
      exchange: "US",
      aliases: ["russell 2000"],
    }))
    .filter((x) => x.symbol && x.name);
}

async function fetchNikkei225(): Promise<UniverseItem[]> {
  const url = "https://indexes.nikkei.co.jp/en/nkave/index/component?idx=nk225";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) return [];
  const markdown = await res.text();
  const re = /\|\s*(\d{4})\s*\|\s*([^|]+?)\s*\|/g;
  const out: UniverseItem[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    const symbol = `${match[1]}.T`;
    const name = match[2].trim();
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    out.push({ symbol, name, exchange: "TSE", aliases: ["nikkei 225", "nikkei"] });
  }
  return out;
}

async function fetchKrxListings(): Promise<UniverseItem[]> {
  const url = "https://github.com/FinanceData/stock_master/raw/master/stock_master.csv.gz";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) return [];
  const ab = await res.arrayBuffer();
  const csv = gunzipSync(Buffer.from(ab)).toString("utf-8");
  const rows = parseSimpleCsv(csv);
  return rows
    .filter((r) => (r.Listing || "").toLowerCase() === "true")
    .map((r) => {
      const code = (r.Symbol || "").trim();
      const name = (r.Name || "").trim();
      const market = (r.Market || "").toUpperCase();
      const suffix = market === "KOSPI" ? ".KS" : market === "KOSDAQ" ? ".KQ" : "";
      return {
        symbol: suffix ? `${code}${suffix}` : code,
        name,
        exchange: market || "KRX",
        aliases: market === "KOSPI" ? ["코스피"] : market === "KOSDAQ" ? ["코스닥"] : [],
      };
    })
    .filter((x) => x.symbol && x.name && (x.symbol.endsWith(".KS") || x.symbol.endsWith(".KQ")));
}

function normalizeKoreanForMatch(value: string): string {
  const s = value.normalize("NFKC");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      let initial = Math.floor(offset / (21 * 28));
      let medial = Math.floor((offset % (21 * 28)) / 28);
      let final_ = offset % 28;
      if (initial === 1) initial = 0;
      else if (initial === 4) initial = 3;
      else if (initial === 8) initial = 7;
      else if (initial === 10) initial = 9;
      else if (initial === 13) initial = 12;
      if (medial === 1) medial = 5;
      else if (medial === 3) medial = 7;
      else if (medial === 10) medial = 15;
      else if (medial === 4) medial = 8;
      if (final_ === 2) final_ = 1;
      else if (final_ === 20) final_ = 19;
      out += String.fromCharCode(0xac00 + (initial * 21 + medial) * 28 + final_);
    } else {
      out += s[i];
    }
  }
  return out;
}

export function expandSearchQueries(query: string): string[] {
  const q = query.trim();
  const set = new Set<string>([q]);

  const qLower = q.toLowerCase();
  const qFuzzy = normalizeKoreanForMatch(qLower);

  QUERY_SYNONYMS.forEach((rule) => {
    if (rule.re.test(qLower) || rule.re.test(qFuzzy)) {
      rule.expand.forEach((x) => set.add(x));
    }
  });
  return Array.from(set).filter((x) => x.length >= 1);
}

async function loadUniverse(): Promise<UniverseItem[]> {
  const now = Date.now();
  if (universeCache && universeCache.expiresAt > now) {
    return universeCache.data;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const results = await Promise.allSettled([
      fetchYfiuaConstituents("sp500"),
      fetchYfiuaConstituents("nasdaq100"),
      fetchYfiuaConstituents("dowjones"),
      fetchYfiuaConstituents("dax"),
      fetchYfiuaConstituents("ftse100"),
      fetchRussell2000(),
      fetchNikkei225(),
      fetchKrxListings(),
    ]);

    const merged = new Map<string, UniverseItem>();
    for (const rs of results) {
      if (rs.status !== "fulfilled") continue;
      for (const item of rs.value) {
        if (!item.symbol) continue;
        const existing = merged.get(item.symbol);
        if (!existing) {
          merged.set(item.symbol, item);
          continue;
        }
        const aliases = new Set<string>([...(existing.aliases || []), ...(item.aliases || [])]);
        merged.set(item.symbol, {
          ...existing,
          name: existing.name || item.name,
          exchange: existing.exchange || item.exchange,
          aliases: Array.from(aliases),
        });
      }
    }
    const data = Array.from(merged.values());
    universeCache = { expiresAt: Date.now() + CACHE_TTL_MS, data };
    return data;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export async function searchMarketUniverse(query: string): Promise<UniverseItem[]> {
  const expanded = expandSearchQueries(query);
  if (expanded.length === 0) return [];
  const universe = await loadUniverse();
  const normalizedExpanded = expanded.map((x) => normalizeText(x)).filter((x) => x.length >= 1);
  const fuzzyExpanded = expanded.map((x) => normalizeText(normalizeKoreanForMatch(x))).filter((x) => x.length >= 1);

  const scored = universe
    .map((item) => {
      const keys = [
        item.symbol,
        item.name,
        ...(item.aliases || []),
      ]
        .map((x) => normalizeText(x))
        .filter(Boolean);

      const fuzzyKeys = keys.map((k) => normalizeText(normalizeKoreanForMatch(k)));

      let score = 0;
      for (const q of normalizedExpanded) {
        for (const key of keys) {
          if (key === q) score = Math.max(score, 120);
          else if (key.startsWith(q)) score = Math.max(score, 90);
          else if (key.includes(q)) score = Math.max(score, 60);
        }
      }
      if (score === 0) {
        for (const q of fuzzyExpanded) {
          for (const key of fuzzyKeys) {
            if (key === q) score = Math.max(score, 110);
            else if (key.startsWith(q)) score = Math.max(score, 80);
            else if (key.includes(q)) score = Math.max(score, 50);
          }
        }
      }
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.item.symbol.localeCompare(b.item.symbol))
    .slice(0, 200)
    .map((x) => x.item);

  return scored;
}
