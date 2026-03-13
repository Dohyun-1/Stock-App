"use client";

import { useState } from "react";

const SAMPLE_METRICS = {
  AAPL: { per: 28.5, pbr: 45.2, roe: 147, eps: "6.42", debtRatio: 0.18 },
  MSFT: { per: 35.2, pbr: 12.8, roe: 36, eps: "11.06", debtRatio: 0.22 },
  GOOGL: { per: 25.1, pbr: 5.4, roe: 22, eps: "5.80", debtRatio: 0.12 },
  NVDA: { per: 65.3, pbr: 22.1, roe: 34, eps: "2.13", debtRatio: 0.25 },
  TSLA: { per: 72.1, pbr: 10.2, roe: 14, eps: "3.45", debtRatio: 0.08 },
};

export default function CompanyPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [secData, setSecData] = useState<{ name?: string; filings?: { form: string; date: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"US" | "KR">("US");

  const search = async () => {
    setLoading(true);
    setSecData(null);
    try {
      const res = await fetch(`/api/company/sec?ticker=${encodeURIComponent(ticker)}`);
      const data = await res.json();
      if (res.ok) setSecData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const metrics = SAMPLE_METRICS[ticker as keyof typeof SAMPLE_METRICS] || SAMPLE_METRICS.AAPL;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-cyan-400">기업 분석</h1>
      <p className="text-white">SEC EDGAR(미국), DART(한국) 기반 기업 공시 및 재무 지표</p>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("US")}
            className={`rounded-lg px-4 py-2 ${mode === "US" ? "bg-cyan-500" : "bg-slate-700"}`}
          >
            미국 (SEC)
          </button>
          <button
            onClick={() => setMode("KR")}
            className={`rounded-lg px-4 py-2 ${mode === "KR" ? "bg-cyan-500" : "bg-slate-700"}`}
          >
            한국 (DART)
          </button>
        </div>
        {mode === "US" && (
          <>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="종목코드 (예: AAPL)"
              className="rounded-lg border border-white/20 bg-slate-700/50 px-3 py-2"
            />
            <button onClick={search} disabled={loading} className="rounded-lg bg-cyan-500 px-4 py-2 font-medium">
              {loading ? "검색 중..." : "검색"}
            </button>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {["per", "pbr", "roe", "eps", "debtRatio"].map((k) => (
          <div key={k} className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
            <p className="text-sm text-white">
              {k === "per" ? "PER" : k === "pbr" ? "PBR" : k === "roe" ? "ROE(%)" : k === "eps" ? "EPS($)" : "부채비율"}
            </p>
            <p className="text-xl font-bold">{metrics[k as keyof typeof metrics]}</p>
          </div>
        ))}
      </div>

      {secData && (
        <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
          <h2 className="mb-4 font-semibold">{secData.name} - SEC EDGAR 공시</h2>
          <div className="space-y-2">
            {(secData.filings || []).slice(0, 10).map((f, i) => (
              <div key={i} className="flex justify-between rounded bg-slate-700/30 px-3 py-2">
                <span className="font-medium">{f.form}</span>
                <span className="text-white">{f.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
        <h2 className="mb-2 font-semibold">지표 설명</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-white">
          <li>PER(주가수익비율): 현재 주가 / 주당순이익. 낮을수록 상대적으로 저평가.</li>
          <li>PBR(주가순자산비율): 주가 / 주당순자산. 1 미만이면 이론상 저평가.</li>
          <li>ROE(자기자본이익률): 순이익 / 자기자본. 수익성 지표.</li>
          <li>EPS(주당순이익): 순이익 / 주식수.</li>
        </ul>
      </div>

    </div>
  );
}
