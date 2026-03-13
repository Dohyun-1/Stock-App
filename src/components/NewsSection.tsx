"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type NewsRegion = "US" | "ASIA" | "EU";
type NewsItem = { title: string; link: string; publisher: string; date: string; image: string };
const REGION_NAMES: Record<NewsRegion, string> = { US: "미국", ASIA: "아시아", EU: "유럽" };
const PAGE_SIZE = 5;
const MAX_API_PAGES = 100;

export default function NewsSection() {
  const [country, setCountry] = useState<NewsRegion>("US");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [apiPage, setApiPage] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(true);
  const seenKeys = useRef(new Set<string>());
  const emptyStreak = useRef(0);
  const fetchingRef = useRef(false);

  const newsKey = (n: NewsItem) => n.title.slice(0, 60).toLowerCase();

  const sortByDate = (items: NewsItem[]) =>
    [...items].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

  const addFresh = useCallback((arr: NewsItem[]) => {
    const fresh = arr.filter((n) => {
      const key = newsKey(n);
      const linkKey = n.link.replace(/[?#].*/, "");
      if (seenKeys.current.has(key) || seenKeys.current.has(linkKey)) return false;
      seenKeys.current.add(key);
      seenKeys.current.add(linkKey);
      return true;
    });
    return fresh;
  }, []);

  useEffect(() => {
    setLoading(true);
    setVisibleCount(PAGE_SIZE);
    setApiPage(0);
    setHasMorePages(true);
    seenKeys.current = new Set();
    emptyStreak.current = 0;
    fetchingRef.current = false;

    fetch(`/api/news-by-country?country=${country}&page=0`)
      .then((r) => r.json())
      .then((d) => {
        const arr: NewsItem[] = Array.isArray(d) ? d : [];
        const fresh = addFresh(arr);
        setNews(sortByDate(fresh));
        if (fresh.length === 0) {
          fetchPage1Fallback();
        }
      })
      .catch(() => { setNews([]); setHasMorePages(false); })
      .finally(() => setLoading(false));

    function fetchPage1Fallback() {
      fetch(`/api/news-by-country?country=${country}&page=1`)
        .then((r) => r.json())
        .then((d) => {
          const arr: NewsItem[] = Array.isArray(d) ? d : [];
          const fresh = addFresh(arr);
          if (fresh.length > 0) {
            setNews((prev) => sortByDate([...prev, ...fresh]));
            setApiPage(1);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const fetchMoreFromApi = useCallback(async () => {
    if (fetchingRef.current) return;
    const nextPage = apiPage + 1;
    if (nextPage > MAX_API_PAGES) { setHasMorePages(false); return; }

    fetchingRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/news-by-country?country=${country}&page=${nextPage}`);
      const d = await res.json();
      const arr: NewsItem[] = Array.isArray(d) ? d : [];
      const fresh = addFresh(arr);

      if (fresh.length > 0) {
        setNews((prev) => sortByDate([...prev, ...fresh]));
        emptyStreak.current = 0;
      } else {
        emptyStreak.current += 1;
        if (emptyStreak.current >= 8) setHasMorePages(false);
      }
      setApiPage(nextPage);
    } catch {
      emptyStreak.current += 1;
      if (emptyStreak.current >= 8) setHasMorePages(false);
    } finally {
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [apiPage, country, addFresh]);

  const loadMore = useCallback(() => {
    const nextVisible = visibleCount + PAGE_SIZE;
    setVisibleCount(nextVisible);
    if (nextVisible >= news.length - 5 && hasMorePages) {
      fetchMoreFromApi();
    }
  }, [visibleCount, news.length, hasMorePages, fetchMoreFromApi]);

  const displayNews = news.slice(0, visibleCount);
  const canShowMore = visibleCount < news.length || hasMorePages;

  return (
    <div className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40 space-y-4">
      <h3 className="text-lg font-bold text-cyan-400">📰 뉴스</h3>
      <div className="flex gap-2">
        {(Object.keys(REGION_NAMES) as NewsRegion[]).map((c) => (
          <button key={c}
            onClick={() => setCountry(c)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              country === c ? "bg-cyan-500 text-white" : "bg-slate-700/50 text-white hover:bg-slate-600"
            }`}>
            {REGION_NAMES[c]}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-white">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            뉴스 로딩 중...
          </div>
        ) : news.length === 0 ? (
          <p className="py-4 text-white">뉴스를 불러오는 중입니다... 잠시 후 다시 시도해주세요.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {displayNews.map((n, i) => (
                <li key={`${n.link}-${i}`}>
                  <a href={n.link} target="_blank" rel="noopener noreferrer"
                    className="flex gap-4 rounded-lg p-3 text-white transition hover:bg-slate-700/50">
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-700/50">
                      {n.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- external news URL
                        <img src={n.image} alt="" className="h-full w-full object-cover" loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium">{n.title}</p>
                      <p className="mt-1 text-xs text-white">
                        {n.publisher} · {n.date ? new Date(n.date).toLocaleDateString("ko-KR") : ""}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-center border-t border-white/20 pt-4">
              {loadingMore ? (
                <div className="flex items-center gap-2 py-2 text-sm text-white">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  뉴스 더 불러오는 중...
                </div>
              ) : canShowMore ? (
                <button
                  onClick={loadMore}
                  className="w-full rounded-lg bg-slate-700/60 py-3 text-sm font-semibold text-cyan-400 transition hover:bg-slate-600 hover:text-cyan-300"
                >
                  더보기
                </button>
              ) : (
                <span className="text-xs text-white">모든 뉴스를 확인했습니다</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
