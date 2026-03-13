"use client";

import { useEffect, useRef, useState } from "react";
import { useAppCurrency } from "@/contexts/CurrencyContext";

const CURRENCIES = [
  { code: "USD", name: "미국 달러", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "KRW", name: "한국 원", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "EUR", name: "유로", flag: "\u{1F1EA}\u{1F1FA}" },
  { code: "GBP", name: "영국 파운드", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "JPY", name: "일본 엔", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "CNY", name: "중국 위안", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "CHF", name: "스위스 프랑", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "CAD", name: "캐나다 달러", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "AUD", name: "호주 달러", flag: "\u{1F1E6}\u{1F1FA}" },
];

function findCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

function buildSymbol(base: string, quote: string): string {
  if (base === "USD") return `${quote}=X`;
  return `${base}${quote}=X`;
}

type Slot = { base: string; quote: string };
type RateData = { rate: number | null; change: number };

const STORAGE_KEY = "stockpro_currency_v2";
const DEFAULT_SLOTS: Slot[] = [{ base: "USD", quote: "KRW" }];

/* ── Currency Dropdown ───────────────────────────────────────── */

function CurrencyDropdown({
  selected,
  disabled,
  onSelect,
  side,
}: {
  selected: string;
  disabled: string;
  onSelect: (code: string) => void;
  side: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = findCurrency(selected);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 rounded-md bg-slate-700/60 px-2 py-1 text-[12px] font-semibold transition hover:bg-slate-600/80"
      >
        <span className="text-[13px] leading-none">{cur.flag}</span>
        <span>{cur.code}</span>
        <svg
          className={`h-2.5 w-2.5 text-white transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-1 min-w-[170px] overflow-hidden rounded-lg border border-white/20 bg-slate-800 shadow-xl ${
            side === "right" ? "right-0" : "left-0"
          }`}
        >
          {CURRENCIES.map((c) => {
            const isDisabled = c.code === disabled;
            const isSelected = c.code === selected;
            return (
              <button
                key={c.code}
                disabled={isDisabled}
                onClick={() => {
                  onSelect(c.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition ${
                  isDisabled
                    ? "cursor-not-allowed text-slate-400"
                    : isSelected
                      ? "bg-slate-700/60 text-cyan-400"
                      : "text-white hover:bg-slate-700"
                }`}
              >
                <span className="text-[14px] leading-none">{c.flag}</span>
                <span className="font-semibold">{c.code}</span>
                <span className="ml-auto text-[11px] text-white">{c.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Single Ticker Chip ──────────────────────────────────────── */

function TickerChip({
  slot,
  rateData,
  onChangeBase,
  onChangeQuote,
  onRemove,
  removable,
}: {
  slot: Slot;
  rateData: RateData;
  onChangeBase: (code: string) => void;
  onChangeQuote: (code: string) => void;
  onRemove?: () => void;
  removable: boolean;
}) {
  const isUp = rateData.change >= 0;

  return (
    <div className="relative flex items-center gap-1 rounded-lg border border-white/20/50 bg-slate-800 px-2 py-1.5">
      <CurrencyDropdown
        selected={slot.base}
        disabled={slot.quote}
        onSelect={onChangeBase}
        side="left"
      />
      <span className="text-[11px] text-white">/</span>
      <CurrencyDropdown
        selected={slot.quote}
        disabled={slot.base}
        onSelect={onChangeQuote}
        side="right"
      />

      <span className="ml-1 font-bold tabular-nums text-[13px]">
        {rateData.rate != null
          ? rateData.rate.toLocaleString("ko-KR", {
              minimumFractionDigits: rateData.rate >= 100 ? 2 : 4,
              maximumFractionDigits: rateData.rate >= 100 ? 2 : 4,
            })
          : "···"}
      </span>
      <span className={`text-[11px] font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
        {isUp ? "▲" : "▼"}
        {Math.abs(rateData.change).toFixed(2)}%
      </span>

      {removable && (
        <button
          onClick={onRemove}
          className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-[10px] text-white transition hover:bg-red-500 hover:text-white"
        >
          ×
        </button>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export default function CurrencyTicker() {
  const [slots, setSlots] = useState<Slot[]>(DEFAULT_SLOTS);
  const [rateMap, setRateMap] = useState<Record<string, RateData>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Slot[];
        if (
          Array.isArray(parsed) &&
          parsed.length >= 1 &&
          parsed.length <= 2 &&
          parsed.every((s) => s.base && s.quote && s.base !== s.quote)
        ) {
          setSlots(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch {}
  }, [slots]);

  const symbols = slots.map((s) => buildSymbol(s.base, s.quote));
  const symbolsKey = symbols.join(",");

  useEffect(() => {
    if (!symbolsKey) return;
    let cancelled = false;
    const fetchAll = async () => {
      const results: Record<string, RateData> = {};
      await Promise.all(
        symbolsKey.split(",").map(async (sym) => {
          try {
            const res = await fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`);
            const data = await res.json();
            if (cancelled) return;
            const p = Number(data?.regularMarketPrice ?? NaN);
            const c = Number(data?.regularMarketChangePercent ?? 0);
            results[sym] = { rate: Number.isFinite(p) ? p : null, change: c };
          } catch {
            results[sym] = { rate: null, change: 0 };
          }
        })
      );
      if (!cancelled) setRateMap((prev) => ({ ...prev, ...results }));
    };
    fetchAll();
    const iv = setInterval(fetchAll, 8000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [symbolsKey]);

  const updateSlot = (index: number, field: "base" | "quote", code: string) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: code };
      return next;
    });
  };

  const addSlot = () => {
    if (slots.length >= 2) return;
    const usedPairs = new Set(slots.map((s) => `${s.base}/${s.quote}`));
    let newSlot: Slot = { base: "EUR", quote: "USD" };
    if (usedPairs.has("EUR/USD")) newSlot = { base: "GBP", quote: "JPY" };
    setSlots((prev) => [...prev, newSlot]);
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const { currency, toggle } = useAppCurrency();

  return (
    <div className="ml-auto flex shrink-0 items-center gap-1.5">
      {slots.length < 2 && (
        <button
          onClick={addSlot}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-white/20 text-white transition hover:border-cyan-500 hover:text-cyan-400"
          title="환율 추가"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}
      {slots.map((slot, i) => {
        const sym = buildSymbol(slot.base, slot.quote);
        const data = rateMap[sym] || { rate: null, change: 0 };
        return (
          <TickerChip
            key={`${i}-${slot.base}-${slot.quote}`}
            slot={slot}
            rateData={data}
            onChangeBase={(code) => updateSlot(i, "base", code)}
            onChangeQuote={(code) => updateSlot(i, "quote", code)}
            onRemove={() => removeSlot(i)}
            removable={slots.length > 1}
          />
        );
      })}
      <button
        onClick={toggle}
        className="flex items-center gap-0.5 rounded-lg border border-white/20/50 bg-slate-800 px-2 py-1.5 transition hover:border-cyan-500/50 hover:bg-slate-700/80"
        title={currency === "USD" ? "원화(₩)로 전환" : "달러($)로 전환"}
      >
        <span className={`flex h-5 w-5 items-center justify-center rounded text-[12px] font-bold ${currency === "USD" ? "bg-cyan-500 text-white" : "bg-slate-700 text-white"}`}>$</span>
        <span className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold ${currency === "KRW" ? "bg-cyan-500 text-white" : "bg-slate-700 text-white"}`}>원</span>
      </button>
    </div>
  );
}
