"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppCurrency } from "@/contexts/CurrencyContext";
import Image from "next/image";

const WATCHLIST_KEY = "stockpro_watchlist";
const SEARCH_HISTORY_KEY = "market-search-history";
const CUSTOM_SECTIONS_KEY = "market-custom-sections";
const SECTION_PREFS_KEY = "market-section-prefs";
const CURRENCY_STORAGE_KEY = "stockpro_app_currency";
const TICKER_STORAGE_KEY = "stockpro_ticker_slots";

type CustomSection = { id: string; name: string; symbols: string[] };

function Chevron() {
  return (
    <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function SettingRow({
  icon, title, subtitle, onClick, right,
}: {
  icon: React.ReactNode; title: string; subtitle: string; onClick?: () => void; right?: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl bg-slate-800/60 px-4 py-4 text-left transition hover:bg-slate-700/60 active:scale-[0.99]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-[13px] text-white">{subtitle}</p>
      </div>
      {right ?? <Chevron />}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-3 mt-8 px-1 text-[13px] font-semibold tracking-wide text-slate-400 uppercase">{children}</p>;
}

export default function SettingsPage() {
  const { currency, setCurrency } = useAppCurrency();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<{ symbol: string; name: string }[]>([]);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  useEffect(() => {
    try { const wl = localStorage.getItem(WATCHLIST_KEY); if (wl) setWatchlist(JSON.parse(wl)); } catch {}
    try { const sh = localStorage.getItem(SEARCH_HISTORY_KEY); if (sh) setSearchHistory(JSON.parse(sh)); } catch {}
    try { const cs = localStorage.getItem(CUSTOM_SECTIONS_KEY); if (cs) setCustomSections(JSON.parse(cs)); } catch {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const togglePanel = (key: string) => setExpandedPanel((p) => (p === key ? null : key));

  const clearSearchHistory = useCallback(() => {
    try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch {}
    setSearchHistory([]);
    showToast("검색 기록이 삭제되었습니다");
  }, [showToast]);

  const clearWatchlist = useCallback(() => {
    try { localStorage.removeItem(WATCHLIST_KEY); } catch {}
    setWatchlist([]);
    showToast("포트폴리오가 초기화되었습니다");
  }, [showToast]);

  const clearCustomSections = useCallback(() => {
    try { localStorage.removeItem(CUSTOM_SECTIONS_KEY); localStorage.removeItem(SECTION_PREFS_KEY); } catch {}
    setCustomSections([]);
    showToast("커스텀 카테고리가 초기화되었습니다");
  }, [showToast]);

  const clearAllData = useCallback(() => {
    try {
      localStorage.removeItem(WATCHLIST_KEY);
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      localStorage.removeItem(CUSTOM_SECTIONS_KEY);
      localStorage.removeItem(SECTION_PREFS_KEY);
      localStorage.removeItem(CURRENCY_STORAGE_KEY);
      localStorage.removeItem(TICKER_STORAGE_KEY);
    } catch {}
    setWatchlist([]);
    setSearchHistory([]);
    setCustomSections([]);
    setCurrency("USD");
    showToast("모든 데이터가 초기화되었습니다");
  }, [setCurrency, showToast]);

  const removeWatchItem = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((s) => s !== symbol);
      try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeHistoryItem = useCallback((symbol: string) => {
    setSearchHistory((prev) => {
      const next = prev.filter((h) => h.symbol !== symbol);
      try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeCustomSection = useCallback((id: string) => {
    setCustomSections((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try { localStorage.setItem(CUSTOM_SECTIONS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
      {/* Profile */}
      <div className="flex flex-col items-center pb-2 pt-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30">
          <Image src="/stockpro-logo.png" alt="StockPro" width={40} height={40} className="rounded-lg" />
        </div>
        <p className="mt-3 text-lg font-bold text-white">StockPro</p>
        <p className="mt-0.5 text-sm text-white">나만의 투자 파트너</p>
      </div>

      {/* 환경 설정 */}
      <SectionLabel>환경 설정</SectionLabel>
      <div className="space-y-2 rounded-2xl border border-white/25 bg-slate-800/60 p-4 shadow-md shadow-black/40">
        <SettingRow
          icon={<svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="통화 설정"
          subtitle={`현재: ${currency === "USD" ? "$ 달러 (USD)" : "₩ 원화 (KRW)"}`}
          onClick={() => togglePanel("currency")}
        />
        {expandedPanel === "currency" && (
          <div className="ml-14 flex gap-2 pb-1">
            <button onClick={() => { setCurrency("USD"); showToast("USD로 변경되었습니다"); }}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${currency === "USD" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25" : "bg-slate-700/60 text-white"}`}>
              $ USD
            </button>
            <button onClick={() => { setCurrency("KRW"); showToast("KRW로 변경되었습니다"); }}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${currency === "KRW" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25" : "bg-slate-700/60 text-white"}`}>
              ₩ KRW
            </button>
          </div>
        )}

        <SettingRow
          icon={<svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>}
          title="화이트 모드 설정"
          subtitle="라이트 · 다크 모드를 선택해요"
          onClick={() => showToast("다크 모드만 지원됩니다 (추후 업데이트 예정)")}
        />
      </div>

      {/* 활동 */}
      <SectionLabel>활동</SectionLabel>
      <div className="space-y-2 rounded-2xl border border-white/25 bg-slate-800/60 p-4 shadow-md shadow-black/40">
        <SettingRow
          icon={<svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>}
          title="포트폴리오 관리"
          subtitle={`등록된 포트폴리오 종목 ${watchlist.length}개를 관리해요`}
          onClick={() => togglePanel("watchlist")}
        />
        {expandedPanel === "watchlist" && (
          <div className="ml-14 space-y-1 pb-1">
            {watchlist.length > 0 ? (
              <>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl bg-slate-900/50 p-2">
                  {watchlist.map((sym) => (
                    <div key={sym} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm hover:bg-slate-700/40">
                      <span className="font-mono text-white">{sym}</span>
                      <button onClick={() => removeWatchItem(sym)} className="text-xs text-red-400 hover:text-red-300">삭제</button>
                    </div>
                  ))}
                </div>
                <button onClick={clearWatchlist} className="mt-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25">전체 삭제</button>
              </>
            ) : (
              <p className="text-xs text-white">포트폴리오 종목이 없습니다.</p>
            )}
          </div>
        )}

        <SettingRow
          icon={<svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="검색 기록"
          subtitle={`최근 검색 기록 ${searchHistory.length}개를 관리해요`}
          onClick={() => togglePanel("history")}
        />
        {expandedPanel === "history" && (
          <div className="ml-14 space-y-1 pb-1">
            {searchHistory.length > 0 ? (
              <>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl bg-slate-900/50 p-2">
                  {searchHistory.map((h) => (
                    <div key={h.symbol} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm hover:bg-slate-700/40">
                      <div><span className="font-mono text-cyan-400">{h.symbol}</span><span className="ml-1.5 text-white">{h.name}</span></div>
                      <button onClick={() => removeHistoryItem(h.symbol)} className="text-xs text-red-400 hover:text-red-300">삭제</button>
                    </div>
                  ))}
                </div>
                <button onClick={clearSearchHistory} className="mt-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25">전체 삭제</button>
              </>
            ) : (
              <p className="text-xs text-white">검색 기록이 없습니다.</p>
            )}
          </div>
        )}

        <SettingRow
          icon={<svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>}
          title="커스텀 카테고리"
          subtitle={`시장 페이지 커스텀 카테고리 ${customSections.length}개를 관리해요`}
          onClick={() => togglePanel("custom")}
        />
        {expandedPanel === "custom" && (
          <div className="ml-14 space-y-1 pb-1">
            {customSections.length > 0 ? (
              <>
                <div className="space-y-1.5">
                  {customSections.map((cs) => (
                    <div key={cs.id} className="rounded-xl bg-slate-900/50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{cs.name}</span>
                        <button onClick={() => removeCustomSection(cs.id)} className="text-xs text-red-400 hover:text-red-300">삭제</button>
                      </div>
                      <p className="mt-0.5 text-[11px] text-white">{cs.symbols.join(", ")}</p>
                    </div>
                  ))}
                </div>
                <button onClick={clearCustomSections} className="mt-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25">전체 초기화</button>
              </>
            ) : (
              <p className="text-xs text-white">커스텀 카테고리가 없습니다.</p>
            )}
          </div>
        )}
      </div>

      {/* 계정 */}
      <SectionLabel>계정</SectionLabel>
      <div className="space-y-2 rounded-2xl border border-white/25 bg-slate-800/60 p-4 shadow-md shadow-black/40">
        <SettingRow
          icon={<svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>}
          title="전체 데이터 초기화"
          subtitle="모든 로컬 데이터를 삭제해요"
          onClick={() => togglePanel("reset")}
        />
        {expandedPanel === "reset" && (
          <div className="ml-14 pb-1">
            <p className="mb-2 text-xs text-white">관심종목, 검색 기록, 카테고리, 통화 설정 등 모든 데이터가 삭제됩니다.</p>
            <button onClick={clearAllData} className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600">
              초기화 실행
            </button>
          </div>
        )}

        <SettingRow
          icon={<svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>}
          title="앱 정보"
          subtitle="StockPro v1.0.0"
          onClick={() => togglePanel("info")}
        />
        {expandedPanel === "info" && (
          <div className="ml-14 space-y-1.5 rounded-xl bg-slate-900/50 p-3 text-sm">
            <div className="flex justify-between"><span className="text-white">앱 이름</span><span className="text-white">StockPro</span></div>
            <div className="flex justify-between"><span className="text-white">버전</span><span className="text-white">1.0.0</span></div>
            <div className="flex justify-between"><span className="text-white">프레임워크</span><span className="text-white">Next.js 14</span></div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-slate-700 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
