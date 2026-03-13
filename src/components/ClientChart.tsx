"use client";

import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";

function formatX(dateStr: string, period: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    if (period === "1d") return format(d, "HH:mm");
    if (period === "5d") return format(d, "M/d");
    if (period === "1m" || period === "3m") return format(d, "M/d");
    if (period === "ytd") return format(d, "M/d");
    if (period === "6m" || period === "1y") return format(d, "M월");
    if (period === "2y") return format(d, "yy.M월");
    if (period === "5y" || period === "10y" || period === "max") return format(d, "yyyy");
    return format(d, "M월");
  } catch {
    return dateStr;
  }
}

function pickTicks(data: { date: string }[], period: string): number[] {
  const len = data.length;
  if (len < 2) return [0];

  if (period === "1d") {
    const step = Math.max(1, Math.floor(len / 6));
    const ticks: number[] = [];
    for (let i = 0; i < len; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== len - 1) ticks.push(len - 1);
    return ticks;
  }

  if (period === "5d") {
    const seen = new Set<string>();
    const ticks: number[] = [];
    for (let i = 0; i < len; i++) {
      const d = new Date(data[i].date);
      const key = `${d.getMonth()}-${d.getDate()}`;
      if (!seen.has(key)) { seen.add(key); ticks.push(i); }
    }
    return ticks;
  }

  if (period === "1m") {
    const ticks: number[] = [0];
    const step = Math.max(1, Math.floor((len - 1) / 4));
    for (let i = step; i < len - 1; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== len - 1) ticks.push(len - 1);
    return ticks;
  }

  if (period === "6m") {
    const seen = new Set<number>();
    const ticks: number[] = [];
    for (let i = 0; i < len; i++) {
      const m = new Date(data[i].date).getMonth();
      if (!seen.has(m)) { seen.add(m); ticks.push(i); }
    }
    return ticks;
  }

  if (period === "ytd") {
    const firstDate = new Date(data[0].date);
    const lastDate = new Date(data[len - 1].date);
    const totalMonths = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth());

    const seen = new Set<number>();
    const ticks: number[] = [0];
    seen.add(firstDate.getMonth());

    if (totalMonths <= 6) {
      for (let i = 1; i < len; i++) {
        const m = new Date(data[i].date).getMonth();
        if (!seen.has(m)) { seen.add(m); ticks.push(i); }
      }
    } else {
      for (let i = 1; i < len; i++) {
        const d = new Date(data[i].date);
        const m = d.getMonth();
        if (m % 3 === 0 && !seen.has(m)) { seen.add(m); ticks.push(i); }
      }
    }
    if (ticks[ticks.length - 1] !== len - 1) ticks.push(len - 1);
    return ticks;
  }

  if (period === "1y") {
    const seen = new Set<string>();
    const ticks: number[] = [];
    for (let i = 0; i < len; i++) {
      const d = new Date(data[i].date);
      const q = Math.floor(d.getMonth() / 3);
      const key = `${d.getFullYear()}-${q}`;
      if (!seen.has(key)) { seen.add(key); ticks.push(i); }
    }
    return ticks;
  }

  if (period === "2y") {
    const seen = new Set<string>();
    const ticks: number[] = [];
    for (let i = 0; i < len; i++) {
      const d = new Date(data[i].date);
      const q = Math.floor(d.getMonth() / 3);
      const key = `${d.getFullYear()}-${q}`;
      if (!seen.has(key)) { seen.add(key); ticks.push(i); }
    }
    return ticks;
  }

  if (period === "5y" || period === "10y") {
    const seen = new Set<number>();
    const ticks: number[] = [];
    for (let i = 0; i < len; i++) {
      const y = new Date(data[i].date).getFullYear();
      if (!seen.has(y)) { seen.add(y); ticks.push(i); }
    }
    return ticks;
  }

  if (period === "max") {
    const first = new Date(data[0].date).getFullYear();
    const last = new Date(data[len - 1].date).getFullYear();
    const span = last - first;
    const yearStep = span <= 5 ? 1 : span <= 15 ? 2 : span <= 30 ? 5 : 10;
    const seen = new Set<number>();
    const ticks: number[] = [];
    for (let i = 0; i < len; i++) {
      const y = new Date(data[i].date).getFullYear();
      if (y % yearStep === 0 && !seen.has(y)) { seen.add(y); ticks.push(i); }
    }
    if (ticks.length === 0) {
      const step = Math.max(1, Math.floor(len / 6));
      for (let i = 0; i < len; i += step) ticks.push(i);
    }
    return ticks;
  }

  const step = Math.max(1, Math.floor(len / 6));
  const ticks: number[] = [];
  for (let i = 0; i < len; i += step) ticks.push(i);
  return ticks;
}

function formatTooltipLabel(dateStr: string, period: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hasTime = dateStr.includes("T") || /^\d{4}-\d{2}-\d{2}\s/.test(dateStr);
    if ((period === "today" || period === "1d" || period === "5d") && hasTime) return format(d, "M월 d일 HH:mm");
    return format(d, "yyyy년 M월 d일");
  } catch {
    return dateStr;
  }
}

export default function ClientChart({
  data,
  period,
  isUp: _isUp,
  chartId,
  height = 128,
  baselineClose,
}: {
  data: { date: string; close: number }[];
  period: string;
  isUp: boolean;
  chartId: string;
  height?: number;
  baselineClose?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const firstClose = data[0]?.close ?? 0;
  const baseline =
    Number.isFinite(Number(baselineClose)) && Number(baselineClose) > 0
      ? Number(baselineClose)
      : firstClose;

  const { gradientOffset, dataMin, dataMax, yMin, yMax } = useMemo(() => {
    if (data.length === 0) return { gradientOffset: 0.5, dataMin: 0, dataMax: 0, yMin: 0, yMax: 0 };

    const closes = data.map((d) => d.close);
    const dMin = Math.min(...closes);
    const dMax = Math.max(...closes);

    const rangeMin = Math.min(dMin, baseline);
    const rangeMax = Math.max(dMax, baseline);
    const padding = (rangeMax - rangeMin) * 0.05 || 1;
    const yMin = rangeMin - padding;
    const yMax = rangeMax + padding;

    const fullRange = yMax - yMin;
    const offset = fullRange > 0 ? (yMax - baseline) / fullRange : 0.5;

    return { gradientOffset: Math.max(0, Math.min(1, offset)), dataMin: dMin, dataMax: dMax, yMin, yMax };
  }, [data, baseline]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center text-white" style={{ height }}>
        로딩...
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-white" style={{ height }}>
        데이터 없음
      </div>
    );
  }

  const showXAxis = height >= 80;
  const MARGIN_TOP = 4;
  const MARGIN_BOTTOM = showXAxis ? 20 : 4;

  const tickIndices = showXAxis ? pickTicks(data, period) : [];
  const tickDates = tickIndices.map((i) => data[i]?.date).filter(Boolean);

  const allAbove = dataMin >= baseline;
  const allBelow = dataMax <= baseline;

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: MARGIN_TOP, right: 8, left: 8, bottom: MARGIN_BOTTOM }}>
          <defs>
            {/* Stroke gradient: sharp transition at baseline */}
            <linearGradient id={`stroke-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset={`${gradientOffset * 100}%`} stopColor="#22c55e" />
              <stop offset={`${gradientOffset * 100}%`} stopColor="#ef4444" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            {/* Fill gradient: fade from line color toward baseline */}
            <linearGradient id={`fill-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={allBelow ? 0 : 0.30} />
              <stop offset={`${gradientOffset * 100}%`} stopColor="#22c55e" stopOpacity={0.05} />
              <stop offset={`${gradientOffset * 100}%`} stopColor="#ef4444" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={allAbove ? 0 : 0.30} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            hide={!showXAxis}
            ticks={tickDates.length > 0 ? tickDates : undefined}
            tickFormatter={(v) => formatX(v, period)}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#cbd5e1", fontSize: 11 }}
            dy={4}
          />
          <YAxis domain={[yMin, yMax]} hide />
          <ReferenceLine
            y={baseline}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeOpacity={0.8}
            ifOverflow="extendDomain"
          />
          <Tooltip
            formatter={(v: number) => [v.toLocaleString("en-US", { minimumFractionDigits: 2 }), "가격"]}
            labelFormatter={(d) => formatTooltipLabel(d, period)}
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={`url(#stroke-${chartId})`}
            strokeWidth={2}
            fill={`url(#fill-${chartId})`}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 4, fill: "#e2e8f0" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
