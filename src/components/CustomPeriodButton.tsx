"use client";

import { useState } from "react";

export default function CustomPeriodButton({
  current,
  onSelect,
  className = "",
}: {
  current: string;
  onSelect: (v: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const handleApply = () => {
    if (start && end && new Date(start) <= new Date(end)) {
      onSelect(`custom:${start}:${end}`);
      setOpen(false);
    }
  };
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          current.startsWith("custom") ? "bg-cyan-500/30 text-cyan-400" : "bg-slate-700/50 text-white hover:bg-slate-600"
        }`}
      >
        기간 설정
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 flex flex-col gap-2 rounded-lg border border-white/20 bg-slate-800 p-3">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded bg-slate-700 px-2 py-1 text-sm"
          />
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded bg-slate-700 px-2 py-1 text-sm"
          />
          <button onClick={handleApply} className="rounded bg-cyan-500 px-2 py-1 text-sm text-white">
            적용
          </button>
        </div>
      )}
    </div>
  );
}
