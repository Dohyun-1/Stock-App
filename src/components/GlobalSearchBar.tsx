"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((d) => setResults(Array.isArray(d?.results) ? d.results.slice(0, 8) : []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = useCallback(
    (symbol: string) => {
      setQuery("");
      setResults([]);
      setOpen(false);
      router.push(`/market/${symbol}`);
    },
    [router]
  );

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl mx-4">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        placeholder="지표 또는 주식 검색..."
        className="w-full rounded-lg border border-white/20 bg-slate-700/50 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
      />
      {open && (query.trim().length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-auto rounded-lg border border-white/20 bg-slate-800 shadow-xl z-50">
          {loading ? (
            <div className="p-4 text-center text-white text-sm">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-white text-sm">검색 결과가 없습니다.</div>
          ) : (
            results.map((r) => (
              <button
                key={r.symbol}
                onClick={() => handleSelect(r.symbol)}
                className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-slate-700/50"
              >
                <span className="font-medium">{r.name || r.symbol}</span>
                <span className="text-white text-sm">{r.symbol}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
