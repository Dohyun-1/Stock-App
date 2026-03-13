"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type AppCurrency = "USD" | "KRW";

type NativeCurrency = "USD" | "KRW" | "JPY" | "EUR" | "GBP" | "CHF" | "POINTS";

type CurrencyContextValue = {
  currency: AppCurrency;
  setCurrency: (c: AppCurrency) => void;
  toggle: () => void;
  rate: number | null;
  formatPrice: (value: number, source?: NativeCurrency) => string;
  convertPrice: (value: number, source?: NativeCurrency) => number;
  formatBig: (value: number, source?: NativeCurrency) => string;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  setCurrency: () => {},
  toggle: () => {},
  rate: null,
  formatPrice: (v) => `$${v.toFixed(2)}`,
  convertPrice: (v) => v,
  formatBig: (v) => `$${v.toFixed(2)}`,
});

const STORAGE_KEY = "stockpro_app_currency";

function getNativeCurrencyFromSymbol(symbol: string): NativeCurrency {
  const s = symbol.toUpperCase();
  if (s.startsWith("^")) return "POINTS";
  if (s.endsWith(".KS") || s.endsWith(".KQ")) return "KRW";
  if (s.endsWith(".T")) return "JPY";
  if (s.endsWith(".L")) return "GBP";
  if (s.endsWith(".SW")) return "CHF";
  if (/\.(DE|PA|AS|MI|MC|HA)$/i.test(s)) return "EUR";
  if (s.endsWith(".SS") || s.endsWith(".SZ")) return "POINTS";
  return "USD";
}

export { getNativeCurrencyFromSymbol };
export type { NativeCurrency };

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<AppCurrency>("USD");
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "KRW" || saved === "USD") setCurrencyState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchRate = async () => {
      try {
        const res = await fetch("/api/quote?symbol=KRW%3DX");
        const data = await res.json();
        const p = Number(data?.regularMarketPrice ?? NaN);
        if (!cancelled && Number.isFinite(p)) setRate(p);
      } catch {}
    };
    fetchRate();
    const iv = setInterval(fetchRate, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const setCurrency = useCallback((c: AppCurrency) => {
    setCurrencyState(c);
    try { localStorage.setItem(STORAGE_KEY, c); } catch {}
  }, []);

  const toggle = useCallback(() => {
    setCurrency(currency === "USD" ? "KRW" : "USD");
  }, [currency, setCurrency]);

  const convertPrice = useCallback(
    (value: number, source: NativeCurrency = "USD"): number => {
      if (rate == null) return value;
      if (source === "POINTS") return value;
      if (source === currency) return value;

      if (source === "USD" && currency === "KRW") return value * rate;
      if (source === "KRW" && currency === "USD") return value / rate;

      return value;
    },
    [currency, rate]
  );

  const formatPrice = useCallback(
    (value: number, source: NativeCurrency = "USD"): string => {
      if (source === "POINTS") {
        if (value >= 10000) return value.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
        return value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      if (source !== "USD" && source !== "KRW") {
        const symbols: Record<string, string> = { JPY: "¥", EUR: "€", GBP: "£", CHF: "CHF " };
        const sym = symbols[source] || "";
        const dec = source === "JPY" ? 0 : 2;
        return `${sym}${value.toLocaleString("ko-KR", { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
      }

      const converted = convertPrice(value, source);

      if ((source === "KRW" && currency === "KRW") || (source === "USD" && currency === "KRW")) {
        return `₩${Math.round(converted).toLocaleString("ko-KR")}`;
      }

      return `$${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [currency, convertPrice]
  );

  const formatBig = useCallback(
    (value: number, source: NativeCurrency = "USD"): string => {
      if (source === "POINTS") {
        return fmtBigRaw(value);
      }

      if (source !== "USD" && source !== "KRW") {
        const symbols: Record<string, string> = { JPY: "¥", EUR: "€", GBP: "£", CHF: "CHF " };
        return `${symbols[source] || ""}${fmtBigRaw(value)}`;
      }

      const converted = convertPrice(value, source);
      const sym = currency === "KRW" ? "₩" : "$";

      const abs = Math.abs(converted);
      if (abs >= 1e12) return `${sym}${(converted / 1e12).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}T`;
      if (abs >= 1e9) return `${sym}${(converted / 1e9).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
      if (abs >= 1e6) return `${sym}${(converted / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
      if (abs >= 1e3) return `${sym}${(converted / 1e3).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}K`;
      return formatPrice(value, source);
    },
    [currency, convertPrice, formatPrice]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggle, rate, formatPrice, convertPrice, formatBig }}>
      {children}
    </CurrencyContext.Provider>
  );
}

function fmtBigRaw(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}T`;
  if (abs >= 1e9) return `${(v / 1e9).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
  if (abs >= 1e6) return `${(v / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function useAppCurrency() {
  return useContext(CurrencyContext);
}
