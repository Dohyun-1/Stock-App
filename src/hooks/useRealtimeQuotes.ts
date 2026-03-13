"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type QuoteValue = { price: number; change: number; changeAmount: number; previousClose: number; shortName?: string };
type QuoteMap = Record<string, QuoteValue>;
type StreamStatus = "idle" | "connecting" | "streaming" | "polling" | "error";

type StreamQuote = {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketChange?: number;
  regularMarketPreviousClose?: number;
  error?: string;
};

function normalizeQuotes(list: StreamQuote[]): QuoteMap {
  const map: QuoteMap = {};
  for (const q of list) {
    const symbol = String(q?.symbol || "");
    if (!symbol || q?.error) continue;
    const price = Number(q?.regularMarketPrice ?? 0);
    const change = Number(q?.regularMarketChangePercent ?? 0);
    const changeAmountRaw = Number(q?.regularMarketChange ?? NaN);
    const changeAmount = Number.isFinite(changeAmountRaw)
      ? changeAmountRaw
      : price !== 0
        ? (price * change) / 100
        : 0;
    const previousCloseRaw = Number(q?.regularMarketPreviousClose ?? NaN);
    const previousClose = Number.isFinite(previousCloseRaw)
      ? previousCloseRaw
      : Number.isFinite(price - changeAmount)
        ? price - changeAmount
        : 0;

    map[symbol] = {
      price,
      change,
      changeAmount,
      previousClose,
      shortName: q?.shortName,
    };
  }
  return map;
}

export function useRealtimeQuotes(
  symbols: string[],
  options?: {
    streamIntervalMs?: number;
    pollIntervalMs?: number;
    maxReconnectAttempts?: number;
  }
) {
  const streamIntervalMs = Math.max(1000, Math.min(5000, options?.streamIntervalMs ?? 2000));
  const pollIntervalMs = Math.max(1000, Math.min(5000, options?.pollIntervalMs ?? 2000));
  const maxReconnectAttempts = Math.max(1, options?.maxReconnectAttempts ?? 3);

  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const reconnectAttemptRef = useRef(0);

  const symbolsKey = useMemo(
    () =>
      Array.from(new Set(symbols.map((s) => s.trim()).filter(Boolean)))
        .sort()
        .join(","),
    [symbols]
  );

  useEffect(() => {
    if (!symbolsKey) {
      setQuotes({});
      setStatus("idle");
      setError(null);
      return;
    }

    let stopped = false;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let source: EventSource | null = null;
    let pollingAbort: AbortController | null = null;

    const symbolsParam = encodeURIComponent(symbolsKey);

    const applyQuotes = (map: QuoteMap) => {
      if (stopped || Object.keys(map).length === 0) return;
      setQuotes((prev) => ({ ...prev, ...map }));
    };

    const clearPolling = () => {
      if (pollingTimer) clearInterval(pollingTimer);
      pollingTimer = null;
      if (pollingAbort) pollingAbort.abort();
      pollingAbort = null;
    };

    const stopSse = () => {
      if (!source) return;
      source.close();
      source = null;
    };

    const pollOnce = async () => {
      if (stopped) return;
      try {
        pollingAbort = new AbortController();
        const res = await fetch(`/api/quotes?symbols=${symbolsParam}&_t=${Date.now()}`, {
          cache: "no-store",
          signal: pollingAbort.signal,
        });
        if (!res.ok) throw new Error(`Polling failed: ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.error ? [] : [data];
        applyQuotes(normalizeQuotes(list));
        setStatus("polling");
        setError(null);
      } catch (e) {
        if (stopped) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    };

    const startPolling = () => {
      if (stopped) return;
      stopSse();
      clearPolling();
      setStatus("polling");
      void pollOnce();
      pollingTimer = setInterval(() => {
        void pollOnce();
      }, pollIntervalMs);
    };

    const scheduleReconnectOrPolling = () => {
      if (stopped) return;
      reconnectAttemptRef.current += 1;
      if (reconnectAttemptRef.current > maxReconnectAttempts) {
        startPolling();
        return;
      }

      const delay = Math.min(5000, 1000 * 2 ** (reconnectAttemptRef.current - 1));
      setStatus("connecting");
      reconnectTimer = setTimeout(() => {
        if (!stopped) connectSse();
      }, delay);
    };

    const connectSse = () => {
      if (stopped) return;
      clearPolling();
      stopSse();
      setStatus("connecting");

      source = new EventSource(
        `/api/quotes/stream?symbols=${symbolsParam}&intervalMs=${streamIntervalMs}`
      );

      source.addEventListener("open", () => {
        reconnectAttemptRef.current = 0;
        setStatus("streaming");
        setError(null);
      });

      source.addEventListener("quotes", (evt) => {
        try {
          const payload = JSON.parse((evt as MessageEvent<string>).data) as { quotes?: StreamQuote[] };
          const list = Array.isArray(payload?.quotes) ? payload.quotes : [];
          applyQuotes(normalizeQuotes(list));
        } catch {
          // Ignore malformed event payload and keep stream alive.
        }
      });

      source.addEventListener("server-error", (evt) => {
        try {
          const payload = JSON.parse((evt as MessageEvent<string>).data) as { message?: string };
          setError(payload?.message || "Streaming error");
        } catch {
          setError("Streaming error");
        }
      });

      source.onerror = () => {
        stopSse();
        scheduleReconnectOrPolling();
      };
    };

    reconnectAttemptRef.current = 0;
    connectSse();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearPolling();
      stopSse();
    };
  }, [maxReconnectAttempts, pollIntervalMs, streamIntervalMs, symbolsKey]);

  return { quotes, status, error };
}
