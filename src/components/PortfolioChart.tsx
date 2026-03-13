"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { format } from "date-fns";

function pickPortfolioTicks(data: { date: string }[], period: string): string[] {
  const len = data.length;
  if (len < 2) return data.map((d) => d.date);

  const first = new Date(data[0].date);
  const last = new Date(data[len - 1].date);
  const spanMs = last.getTime() - first.getTime();
  const spanDays = spanMs / (1000 * 60 * 60 * 24);

  const target = period === "10y" ? 6 : 5;

  if (period === "1y" || spanDays <= 400) {
    const seen = new Set<number>();
    const ticks: string[] = [];
    for (let i = 0; i < len; i++) {
      const d = new Date(data[i].date);
      const m = d.getMonth();
      if (m % 3 === 0 && !seen.has(m + d.getFullYear() * 12)) {
        seen.add(m + d.getFullYear() * 12);
        ticks.push(data[i].date);
      }
    }
    return ticks.length > 1 ? ticks : evenlyPick(data, target);
  }

  if (period === "2y" || (spanDays > 400 && spanDays <= 900)) {
    const seen = new Set<string>();
    const ticks: string[] = [];
    for (let i = 0; i < len; i++) {
      const d = new Date(data[i].date);
      const half = d.getMonth() < 6 ? 0 : 1;
      const key = `${d.getFullYear()}-${half}`;
      if (!seen.has(key)) { seen.add(key); ticks.push(data[i].date); }
    }
    return ticks;
  }

  if (period === "5y" || (spanDays > 900 && spanDays <= 2000)) {
    const seen = new Set<number>();
    const ticks: string[] = [];
    for (let i = 0; i < len; i++) {
      const y = new Date(data[i].date).getFullYear();
      if (!seen.has(y)) { seen.add(y); ticks.push(data[i].date); }
    }
    return ticks;
  }

  if (period === "10y" || spanDays > 2000) {
    const seen = new Set<number>();
    const ticks: string[] = [];
    const yearStep = spanDays > 5000 ? 3 : 2;
    for (let i = 0; i < len; i++) {
      const y = new Date(data[i].date).getFullYear();
      if (y % yearStep === 0 && !seen.has(y)) { seen.add(y); ticks.push(data[i].date); }
    }
    if (ticks.length < 3) return evenlyPick(data, target);
    return ticks;
  }

  return evenlyPick(data, target);
}

function evenlyPick(data: { date: string }[], count: number): string[] {
  const len = data.length;
  if (len <= count) return data.map((d) => d.date);
  const step = (len - 1) / (count - 1);
  const ticks: string[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(data[Math.round(i * step)].date);
  }
  return ticks;
}

function formatPortfolioX(dateStr: string, period: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    if (period === "1y") return format(d, "yy.M월");
    if (period === "2y") return format(d, "yy.M월");
    if (period === "5y" || period === "10y") return format(d, "yyyy");
    if (period.startsWith("custom")) {
      return format(d, "yy.M월");
    }
    return format(d, "yy.M월");
  } catch {
    return dateStr;
  }
}

function formatYAxis(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_0000_0000) return `${sign}${(abs / 1_0000_0000).toFixed(1)}억`;
  if (abs >= 1_0000) return `${sign}${(abs / 1_0000).toFixed(0)}만`;
  return `${sign}${Math.round(abs).toLocaleString("en-US")}`;
}

function calcYAxisWidth(data: { total: number }[]): number {
  if (data.length === 0) return 55;
  const maxVal = Math.max(...data.map((d) => Math.abs(d.total)));
  const sampleStr = formatYAxis(maxVal);
  const charWidth = 8;
  return Math.max(48, Math.min(90, sampleStr.length * charWidth + 14));
}

export default function PortfolioChart({
  data,
  period = "1y",
  currencySymbol = "₩",
}: {
  data: { date: string; total: number; [k: string]: string | number }[];
  period?: string;
  currencySymbol?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || data.length === 0) return null;
  const start = Number(data[0]?.total || 0);
  const end = Number(data[data.length - 1]?.total || 0);
  const min = Math.min(...data.map((x) => Number(x.total)));
  const max = Math.max(...data.map((x) => Number(x.total)));

  const range = max - min || 1;
  const yMin = min - range * 0.02;
  const yMax = max + range * 0.02;

  const pct = yMax === yMin ? 50 : ((yMax - start) / (yMax - yMin)) * 100;
  const baselinePct = Math.max(1, Math.min(99, pct));

  const changeAmount = end - start;
  const changePercent = start > 0 ? (changeAmount / start) * 100 : 0;
  const isUp = changeAmount >= 0;

  const ticks = pickPortfolioTicks(data, period);
  const yAxisWidth = calcYAxisWidth(data);

  return (
    <div className="relative mx-auto h-[600px] max-w-2xl">
      <div className={`pointer-events-none absolute right-2 top-1 z-10 text-base font-extrabold drop-shadow-sm ${isUp ? "text-green-400" : "text-red-400"}`}>
        {`${isUp ? "+" : ""}${currencySymbol}${Math.round(changeAmount).toLocaleString("en-US")} (${isUp ? "+" : ""}${changePercent.toFixed(2)}%)`}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 14, left: 4, bottom: 10 }}>
          <defs>
            {/* Stroke: green above baseline, red below */}
            <linearGradient id="pf-stroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={`${baselinePct}%`} stopColor="#22c55e" />
              <stop offset={`${baselinePct}%`} stopColor="#ef4444" />
            </linearGradient>
            {/* Fill: green fading to transparent at baseline, then red fading in below */}
            <linearGradient id="pf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset={`${Math.max(0, baselinePct - 2)}%`} stopColor="#22c55e" stopOpacity={0.08} />
              <stop offset={`${baselinePct}%`} stopColor="#64748b" stopOpacity={0} />
              <stop offset={`${Math.min(100, baselinePct + 2)}%`} stopColor="#ef4444" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={(d) => formatPortfolioX(d, period)}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#e2e8f0", fontSize: 13, fontWeight: 600 }}
            dy={6}
          />
          <YAxis
            domain={[yMin, yMax]}
            width={yAxisWidth}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#e2e8f0", fontSize: 13, fontWeight: 600 }}
            tickFormatter={(v) => formatYAxis(v)}
            tickCount={8}
          />
          <ReferenceLine
            y={start}
            stroke="#cbd5e1"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            strokeOpacity={0.9}
            ifOverflow="extendDomain"
            label={{ value: `기준 ${formatYAxis(start)}`, position: "left", fill: "#94a3b8", fontSize: 11 }}
          />
          <Tooltip
            formatter={(v: number) => {
              const diff = Number(v) - start;
              const pctDiff = start > 0 ? (diff / start) * 100 : 0;
              const prefix = diff >= 0 ? "+" : "";
              return [`${currencySymbol}${Number(v).toLocaleString("en-US")}  (${prefix}${pctDiff.toFixed(2)}%)`, ""];
            }}
            labelFormatter={(d) => {
              try { return format(new Date(d), "yyyy년 M월 d일"); } catch { return d; }
            }}
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: 14, fontWeight: 600 }}
            labelStyle={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="url(#pf-stroke)"
            strokeWidth={2.5}
            fill="url(#pf-fill)"
            fillOpacity={1}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
