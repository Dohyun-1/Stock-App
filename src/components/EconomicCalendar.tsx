"use client";

import { useMemo, useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

type Event = {
  id: string;
  date: string;
  time?: string;
  country: string;
  title: string;
  importance: string;
  source: string;
  sourceUrl: string;
};

const MIN_DATE = new Date("2026-01-01");

function starsFor(importance: string) {
  if (importance === "3") return "★★★";
  if (importance === "2") return "★★";
  if (importance === "1") return "★";
  return "";
}

function starColor(importance: string) {
  if (importance === "3") return "text-amber-400";
  if (importance === "2") return "text-cyan-400";
  if (importance === "1") return "text-white";
  return "text-white";
}

function shortTitle(title: string) {
  return title
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace("소비자물가지수", "CPI")
    .replace("생산자물가지수", "PPI")
    .replace("소비자심리지수", "심리지수")
    .replace("비농업 부문 고용", "NFP")
    .replace("중소기업 경기낙관지수", "낙관지수")
    .replace("전월 대비", "MoM")
    .replace("전년 대비", "YoY")
    .replace("전분기 대비 연율", "QoQ")
    .replace("전분기 대비", "QoQ")
    .replace("국내총생산", "GDP");
}

function groupTag(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("cpi") || t.includes("소비자물가")) return "CPI";
  if (t.includes("ppi") || t.includes("생산자물가")) return "PPI";
  if (t.includes("pce")) return "PCE";
  if (t.includes("gdp") || t.includes("국내총생산")) return "GDP";
  if (t.includes("nfp") || t.includes("비농업")) return "고용";
  if (t.includes("실업률") || t.includes("시간당 임금") || t.includes("실업수당")) return "고용";
  if (t.includes("국채 경매")) return "국채경매";
  if (t.includes("fomc") || t.includes("금리 결정") || t.includes("의장 기자회견")) return "FOMC";
  return shortTitle(title);
}

type CellLine = { label: string; count: number; maxImp: string };

function buildCellLines(evts: Event[]): CellLine[] {
  const seen = new Map<string, { count: number; maxImp: number }>();
  const order: string[] = [];
  for (const e of evts) {
    const tag = groupTag(e.title);
    const existing = seen.get(tag);
    const imp = Number(e.importance) || 0;
    if (existing) {
      existing.count++;
      if (imp > existing.maxImp) existing.maxImp = imp;
    } else {
      seen.set(tag, { count: 1, maxImp: imp });
      order.push(tag);
    }
  }
  return order.map((tag) => {
    const v = seen.get(tag)!;
    return { label: tag, count: v.count, maxImp: String(v.maxImp) };
  });
}

export default function EconomicCalendar({
  events,
  country,
  onCountryChange,
}: {
  events: Event[];
  country: "US" | "KR" | "JP" | "EU";
  onCountryChange: (c: "US" | "KR" | "JP" | "EU") => void;
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const viewMonth = format(viewDate, "yyyy-MM");
  useEffect(() => {
    if (selectedDay && !selectedDay.startsWith(viewMonth)) {
      setSelectedDay(null);
      setSelectedEvent(null);
    }
  }, [viewMonth, selectedDay]);

  const canGoPrev = subMonths(viewDate, 1) >= MIN_DATE;

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startEmpty = monthStart.getDay();
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => {
        const ia = Number(a.importance) || 0;
        const ib = Number(b.importance) || 0;
        return ib - ia;
      }),
    );
    return map;
  }, [events]);

  return (
    <div className="rounded-2xl border border-white/25 bg-slate-800/60 p-6 shadow-md shadow-black/40">
      <h2 className="mb-4 text-lg font-semibold text-cyan-400">경제 캘린더</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["US", "KR", "JP", "EU"] as const).map((c) => (
          <button
            key={c}
            onClick={() => onCountryChange(c)}
            className={`rounded-lg px-4 py-2 text-base font-medium ${country === c ? "bg-cyan-500 text-white" : "bg-slate-700/50 text-white"}`}
          >
            {c === "US" ? "미국" : c === "KR" ? "한국" : c === "JP" ? "일본" : "유럽"}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => canGoPrev && setViewDate(subMonths(viewDate, 1))}
          className={`rounded px-3 py-1 text-lg ${canGoPrev ? "text-white hover:bg-slate-700" : "cursor-not-allowed text-slate-500"}`}
        >
          ‹
        </button>
        <span className="text-lg font-semibold">{format(viewDate, "yyyy년 M월")}</span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="rounded px-3 py-1 text-lg text-white hover:bg-slate-700"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="py-2 text-base font-semibold text-white">
            {d}
          </div>
        ))}
        {Array.from({ length: startEmpty }).map((_, i) => (
          <div key={`e-${i}`} className="min-h-[6rem]" />
        ))}
        {days.map((day) => {
          const dStr = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dStr] || [];
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDay === dStr;
          return (
            <button
              key={dStr}
              onClick={() => {
                if (dayEvents.length > 0) {
                  setSelectedDay(isSelected ? null : dStr);
                  setSelectedEvent(null);
                }
              }}
              className={`min-h-[6rem] rounded-lg border p-1.5 text-left transition sm:p-2 ${
                isSelected
                  ? "border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-500/30"
                  : isToday
                    ? "border-cyan-500/50 bg-cyan-500/10"
                    : "border-white/15 bg-slate-800/30"
              } ${dayEvents.length > 0 ? "cursor-pointer hover:border-cyan-500/40" : "cursor-default"}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-slate-100 sm:text-xl">{format(day, "d")}</p>
                {dayEvents.length > 0 && (
                  <span className="text-xs font-medium text-white">{dayEvents.length}</span>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {(() => {
                  const lines = buildCellLines(dayEvents);
                  return (
                    <>
                      {lines.slice(0, 2).map((l, i) => (
                        <div
                          key={i}
                          className={`truncate text-[11px] leading-snug sm:text-xs ${
                            l.maxImp === "3"
                              ? "font-bold text-amber-300"
                              : l.maxImp === "2"
                                ? "font-medium text-cyan-300"
                                : "text-white"
                          }`}
                        >
                          {l.label}{l.count > 1 ? ` ${l.count}건` : ""}
                        </div>
                      ))}
                      {lines.length > 2 && (
                        <div className="text-[11px] font-medium text-white">+{lines.length - 2}</div>
                      )}
                    </>
                  );
                })()}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay && eventsByDate[selectedDay] && (
        <div className="mt-4 rounded-lg border border-white/20 bg-slate-800/80 p-5">
          <h3 className="mb-3 text-lg font-bold text-slate-100">
            {selectedDay} ({["일", "월", "화", "수", "목", "금", "토"][new Date(selectedDay + "T00:00:00").getDay()]})
          </h3>
          <div className="space-y-1.5">
            {eventsByDate[selectedDay].map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEvent(selectedEvent?.id === e.id ? null : e)}
                className={`flex w-full items-start gap-3 rounded-lg px-4 py-2.5 text-left transition hover:bg-slate-700/60 ${
                  selectedEvent?.id === e.id ? "bg-slate-700/50 ring-1 ring-cyan-500/30" : ""
                }`}
              >
                <span className="mt-0.5 min-w-[48px] shrink-0 text-sm font-medium text-white">
                  {e.time?.replace(" (KST)", "") ?? "--:--"}
                </span>
                <span className="flex-1 text-base text-slate-100">{e.title}</span>
                <span className={`shrink-0 text-base ${starColor(e.importance)}`}>{starsFor(e.importance)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="mt-3 rounded-lg border border-cyan-500/30 bg-slate-900/80 p-5">
          <div className="flex items-start justify-between">
            <h4 className="text-lg font-bold text-slate-50">{selectedEvent.title}</h4>
            <span className={`text-lg ${starColor(selectedEvent.importance)}`}>
              {starsFor(selectedEvent.importance)}
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-base text-white">
            <p>
              <span className="text-white">날짜:</span> {selectedEvent.date}
              {selectedEvent.time && (
                <> · <span className="text-white">시간:</span> {selectedEvent.time}</>
              )}
            </p>
            <p>
              <span className="text-white">발표기관:</span>{" "}
              <span className="font-medium text-slate-100">{selectedEvent.source}</span>
            </p>
            <p>
              <span className="text-white">중요도:</span>{" "}
              <span className={starColor(selectedEvent.importance)}>
                {starsFor(selectedEvent.importance) || "연준 인사 발언"}
              </span>
            </p>
          </div>
          <a
            href={selectedEvent.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-base font-medium text-cyan-400 hover:underline"
          >
            {selectedEvent.source} 공식 사이트 →
          </a>
          <button
            onClick={() => setSelectedEvent(null)}
            className="mt-2 text-sm text-white hover:text-slate-100"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
