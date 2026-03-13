"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";

export default function SymbolChart({
  data,
  baselineClose,
}: {
  data: { date: string; close: number }[];
  baselineClose?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || data.length === 0) return null;
  const start = Number(data[0]?.close || 0);
  const baseline =
    Number.isFinite(Number(baselineClose)) && Number(baselineClose) > 0
      ? Number(baselineClose)
      : start;
  const end = Number(data[data.length - 1]?.close || 0);
  const min = Math.min(...data.map((x) => Number(x.close)));
  const max = Math.max(...data.map((x) => Number(x.close)));
  const padding = (max - min) * 0.05 || 1;
  const yMin = min - padding;
  const yMax = max + padding;
  const baseOffset = yMax === yMin ? 50 : ((yMax - baseline) / (yMax - yMin)) * 100;
  const clampedOffset = Math.max(0, Math.min(100, baseOffset));
  const changeAmount = end - baseline;
  const changePercent = baseline > 0 ? (changeAmount / baseline) * 100 : 0;
  const isUp = changeAmount >= 0;

  return (
    <div className="relative h-80">
      <div className={`pointer-events-none absolute right-1 top-0 z-10 text-xs font-medium ${isUp ? "text-green-400" : "text-red-400"}`}>
        {`${isUp ? "+" : ""}${changeAmount.toLocaleString("ko-KR", { maximumFractionDigits: 2 })} (${isUp ? "+" : ""}${changePercent.toFixed(2)}%)`}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="symbol-line-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset={`${clampedOffset}%`} stopColor="#22c55e" />
              <stop offset={`${clampedOffset}%`} stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "yyyy")} stroke="#94a3b8" />
          <YAxis domain={[yMin, yMax]} stroke="#94a3b8" tickFormatter={(v) => v.toLocaleString()} />
          <ReferenceLine y={baseline} stroke="#94a3b8" strokeDasharray="4 4" strokeOpacity={0.8} ifOverflow="extendDomain" />
          <Tooltip
            formatter={(v: number) => [v.toLocaleString("en-US", { maximumFractionDigits: 2 }), "가격"]}
            labelFormatter={(d) => format(new Date(d), "yyyy-MM-dd")}
          />
          <Line type="monotone" dataKey="close" stroke="url(#symbol-line-grad)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
