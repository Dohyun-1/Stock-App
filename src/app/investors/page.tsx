"use client";

import { useEffect, useState } from "react";

const INVESTORS = [
  { name: "Buffett (Berkshire)", cik: "0001067983", desc: "가치투자의 전설" },
  { name: "Cathie Wood (ARK)", cik: "0001649339", desc: "성장주/테크 집중" },
  { name: "Michael Burry (Scion)", cik: "0001379785", desc: "공매도로 유명" },
  { name: "Bridgewater", cik: "0001350694", desc: "세계 최대 헤지펀드" },
  { name: "Renaissance", cik: "0001037389", desc: "퀀트 투자" },
];

export default function InvestorsPage() {
  const [selected, setSelected] = useState(INVESTORS[0]);
  const [data, setData] = useState<{ name?: string; filings?: { form: string; date: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/investors?cik=${selected.cik}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-cyan-400">유명 투자자 13F 매수 성향</h1>
      <p className="text-white">SEC 13F 공시를 통해 기관투자자의 포트폴리오 변화 추적 (Investing.com, Better Investing 스타일)</p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {INVESTORS.map((inv) => (
          <button
            key={inv.cik}
            onClick={() => setSelected(inv)}
            className={`rounded-xl border p-4 text-left transition ${
              selected.cik === inv.cik ? "border-cyan-500 bg-cyan-500/20" : "border-white/20 bg-slate-800/50 hover:bg-slate-700/50"
            }`}
          >
            <p className="font-medium">{inv.name}</p>
            <p className="text-sm text-white">{inv.desc}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/20 bg-slate-800/50 p-8 text-center">로딩 중...</div>
      ) : data && (
        <div className="rounded-xl border border-white/20 bg-slate-800/50 p-4">
          <h2 className="mb-4 font-semibold">{data.name} - 13F 공시 내역</h2>
          <p className="mb-4 text-sm text-white">
            13F는 1억$ 이상 미국 주식을 보유한 기관이 분기별로 제출하는 공시입니다.
          </p>
          <div className="space-y-2">
            {(data.filings || []).map((f, i) => (
              <div key={i} className="flex justify-between rounded-lg bg-slate-700/30 px-3 py-2">
                <span className="font-medium">{f.form}</span>
                <span className="text-white">{f.date}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-white">
            상세 보유 종목은{" "}
            <a
              href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${selected.cik}&type=13F`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              SEC EDGAR
            </a>
            에서 확인할 수 있습니다.
          </p>
        </div>
      )}

    </div>
  );
}
