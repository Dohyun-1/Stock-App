import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/* ─── Yahoo Finance search API ─── */
const YAHOO_SEARCH = "https://query1.finance.yahoo.com/v1/finance/search";

const US_QUERIES = [
  "US stock market today",
  "S&P 500 Nasdaq Dow Jones",
  "Federal Reserve interest rate",
  "US earnings report results",
  "tech stocks NVIDIA AI",
  "US Treasury bonds inflation",
  "US economy GDP growth",
  "banking finance stocks",
  "energy oil commodity",
  "healthcare pharma biotech",
  "semiconductor chip stocks",
  "crypto bitcoin ethereum",
  "electric vehicle EV Tesla",
  "AI artificial intelligence",
  "cloud computing SaaS",
  "mergers acquisitions deals",
  "cybersecurity stocks",
  "green energy solar wind",
  "gold silver precious metals",
  "small cap growth stocks",
  "dividend stocks investing",
  "IPO startup venture",
  "real estate housing",
  "retail consumer spending",
  "defense military stocks",
  "airline travel tourism",
  "streaming entertainment",
  "fintech digital banking",
  "supply chain logistics",
  "agriculture food commodity",
  "private equity funding",
  "Wall Street trading",
];

const EU_QUERIES = [
  "European stock market",
  "ECB European Central Bank",
  "FTSE 100 London stocks",
  "DAX Frankfurt Germany",
  "European tech ASML SAP",
  "Euro zone inflation GDP",
  "UK economy stocks",
  "Switzerland banks luxury",
  "European energy market",
  "European auto electric vehicles",
  "European pharma healthcare",
  "European defense aerospace",
  "LVMH luxury goods",
  "European banking finance",
  "European real estate",
  "European bonds sovereign debt",
  "European IPO startup",
  "European green energy climate",
  "Scandinavia Nordic economy",
  "Italy Spain economy bonds",
  "European telecom 5G",
  "European mining metals",
  "European airline tourism",
  "European food beverage",
  "European semiconductor",
  "France CAC 40 stocks",
  "Euro Stoxx 50 market",
  "European retail consumer",
  "European insurance stocks",
  "UK FTSE 250 stocks",
];

const ASIA_QUERIES = [
  "Asia stock market KOSPI Nikkei",
  "Korea KOSPI KOSDAQ Samsung",
  "Japan Nikkei Tokyo BOJ",
  "China Shanghai Hong Kong",
  "India Sensex BSE stocks",
  "Taiwan TSMC semiconductor",
  "Southeast Asia emerging market",
  "Korea technology Samsung SK",
  "Japan yen Bank of Japan",
  "China economy technology",
  "Asia bonds currency forex",
  "Korea battery EV LG",
  "Japan Sony Nintendo gaming",
  "China Alibaba Tencent",
  "India Reliance Infosys",
  "Korea shipbuilding steel",
  "Asia real estate property",
  "Korea pharma biotech",
  "Japan auto Toyota Honda",
  "Hong Kong property stocks",
  "Asia semiconductor supply",
  "Korea entertainment K-pop",
  "Asia fintech payment",
  "Asia Pacific trade economy",
];

/* ─── Yahoo Finance RSS feeds ─── */
const YAHOO_RSS: Record<string, string[]> = {
  US: [
    "https://finance.yahoo.com/news/rssurl",
    "https://finance.yahoo.com/rss/topstories",
    "https://finance.yahoo.com/rss/stock-market-news",
  ],
  EU: [
    "https://finance.yahoo.com/rss/topstories",
    "https://finance.yahoo.com/news/rssurl",
  ],
  ASIA: [
    "https://finance.yahoo.com/rss/topstories",
  ],
};

/* ─── Google News RSS ─── */
const GOOGLE_NEWS_QUERIES: Record<string, string[]> = {
  US: [
    "US stock market",
    "Wall Street stocks",
    "S&P 500 Nasdaq",
    "Federal Reserve economy",
    "tech stocks AI NVIDIA",
    "US economy GDP jobs",
  ],
  EU: [
    "European stock market",
    "ECB economy Europe",
    "FTSE DAX stocks",
    "European economy",
  ],
  ASIA: [
    "Asia stock market",
    "Korea KOSPI Samsung",
    "Japan Nikkei stocks",
    "China economy stocks",
    "India stock market",
  ],
};

/* ─── Naver Finance ─── */
const NAVER_NEWS_URLS = [
  "https://finance.naver.com/news/mainnews.naver?&page=",
  "https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258&page=",
  "https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=259&page=",
  "https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=261&page=",
  "https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=262&page=",
  "https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=310&page=",
  "https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=263&page=",
];

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  date: string;
  image: string;
};

/* ─── Fetchers ─── */

async function fetchYahooSearch(query: string): Promise<NewsItem[]> {
  try {
    const url = `${YAHOO_SEARCH}?q=${encodeURIComponent(query)}&quotesCount=0&newsCount=30`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return ((json.news || []) as Array<{
      title?: string; link?: string; publisher?: string;
      providerPublishTime?: number;
      thumbnail?: { resolutions?: { url?: string; width?: number; height?: number }[] };
    }>).map((n) => {
      const resolutions = n.thumbnail?.resolutions || [];
      const thumb = resolutions.find((r) => (r.width ?? 0) >= 300) || resolutions[resolutions.length - 1];
      return {
        title: n.title || "",
        link: n.link || "",
        publisher: n.publisher || "",
        date: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : "",
        image: thumb?.url || "",
      };
    });
  } catch {
    return [];
  }
}

async function fetchYahooRss(rssUrl: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": UA },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRegex.exec(xml)) !== null) {
      const block = m[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        || block.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || "Yahoo Finance";
      const mediaUrl = block.match(/<media:content[^>]*url="([^"]*)"[^>]*>/)?.[1]
        || block.match(/<enclosure[^>]*url="([^"]*)"[^>]*>/)?.[1] || "";
      if (title && link) {
        items.push({
          title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          link,
          publisher: source,
          date: pubDate ? new Date(pubDate).toISOString() : "",
          image: mediaUrl,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

async function fetchGoogleNewsRss(query: string): Promise<NewsItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:7d")}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRegex.exec(xml)) !== null) {
      const block = m[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        || block.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || "Google News";
      if (title && link) {
        items.push({
          title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          link,
          publisher: source,
          date: pubDate ? new Date(pubDate).toISOString() : "",
          image: "",
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

async function fetchNaverFinanceNews(page: number): Promise<NewsItem[]> {
  try {
    const results: NewsItem[] = [];
    const start = page % NAVER_NEWS_URLS.length;
    const urls = [
      NAVER_NEWS_URLS[start],
      NAVER_NEWS_URLS[(start + 1) % NAVER_NEWS_URLS.length],
      NAVER_NEWS_URLS[(start + 2) % NAVER_NEWS_URLS.length],
    ];

    const fetches = urls.map(async (baseUrl) => {
      const naverPage = Math.floor(page / NAVER_NEWS_URLS.length) + 1;
      const url = `${baseUrl}${naverPage}`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return [];
      const html = await res.text();

      const items: NewsItem[] = [];
      const articlePattern =
        /<dd class="articleSubject">[\s\S]*?<a[^>]*href="([^"]*)"[^>]*title="([^"]*)"[\s\S]*?<span class="articleSummary">[\s\S]*?<span class="press">([\s\S]*?)<\/span>[\s\S]*?<span class="wdate">([\s\S]*?)<\/span>/g;
      let match;
      while ((match = articlePattern.exec(html)) !== null) {
        const link = match[1].startsWith("http") ? match[1] : `https://finance.naver.com${match[1]}`;
        items.push({
          title: match[2].trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"'),
          link,
          publisher: match[3].trim().replace(/<[^>]*>/g, ""),
          date: match[4].trim(),
          image: "",
        });
      }

      if (items.length === 0) {
        const simplePattern =
          /<a[^>]*href="(\/news\/news_read\.naver\?article_id=[^"]*)"[^>]*(?:title="([^"]*)")?[^>]*>([^<]+)<\/a>/g;
        let m2;
        while ((m2 = simplePattern.exec(html)) !== null) {
          const title = (m2[2] || m2[3] || "").trim().replace(/&amp;/g, "&");
          if (title.length < 5) continue;
          items.push({
            title,
            link: `https://finance.naver.com${m2[1]}`,
            publisher: "네이버 금융",
            date: new Date().toISOString(),
            image: "",
          });
        }
      }

      return items;
    });

    const allResults = await Promise.allSettled(fetches);
    for (const r of allResults) {
      if (r.status === "fulfilled") results.push(...r.value);
    }
    return results;
  } catch {
    return [];
  }
}

/* ─── Helpers ─── */

function dedup(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const result: NewsItem[] = [];
  for (const n of items) {
    if (!n.title || !n.link) continue;
    const key = n.title.slice(0, 60).toLowerCase();
    const linkKey = n.link.replace(/[?#].*/, "");
    if (seen.has(key) || seen.has(linkKey)) continue;
    seen.add(key);
    seen.add(linkKey);
    result.push(n);
  }
  return result;
}

function pickQueries(queries: string[], page: number, perPage: number): string[] {
  const result: string[] = [];
  const total = queries.length;
  for (let i = 0; i < perPage; i++) {
    const globalIdx = page * perPage + i;
    const idx = globalIdx % total;
    const cycle = Math.floor(globalIdx / total);
    const suffixes = ["", " latest", " today", " this week", " news", " update"];
    const suffix = cycle > 0 ? (suffixes[cycle % suffixes.length] || "") : "";
    result.push(queries[idx] + suffix);
  }
  return result;
}

/* ─── Main handler ─── */

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");
  if (!country)
    return NextResponse.json({ error: "country required" }, { status: 400 });

  const cc = country.toUpperCase();
  const page = Math.max(0, parseInt(request.nextUrl.searchParams.get("page") || "0", 10));

  if (!["US", "ASIA", "EU"].includes(cc))
    return NextResponse.json({ error: "country must be one of: US, ASIA, EU" }, { status: 400 });

  try {
    const allPromises: Promise<NewsItem[]>[] = [];

    const queriesMap: Record<string, string[]> = { US: US_QUERIES, EU: EU_QUERIES, ASIA: ASIA_QUERIES };
    const searchQueries = pickQueries(queriesMap[cc], page, 3);
    for (const q of searchQueries) {
      allPromises.push(fetchYahooSearch(q));
    }

    const googleQueries = GOOGLE_NEWS_QUERIES[cc] || [];
    const gIdx = page % googleQueries.length;
    const gQuery = googleQueries[gIdx];
    allPromises.push(fetchGoogleNewsRss(gQuery));

    if (page < 3) {
      const rssUrls = YAHOO_RSS[cc] || [];
      for (const rssUrl of rssUrls) {
        allPromises.push(fetchYahooRss(rssUrl));
      }
    }

    if (cc === "ASIA") {
      allPromises.push(fetchNaverFinanceNews(page));
    }

    const results = await Promise.allSettled(allPromises);
    let allNews: NewsItem[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") allNews.push(...r.value);
    }

    const dedupList = dedup(allNews);
    dedupList.sort((a, b) => String(b.date).localeCompare(String(a.date)));

    return NextResponse.json(dedupList);
  } catch (e) {
    return NextResponse.json({ error: String(e), news: [] }, { status: 500 });
  }
}
