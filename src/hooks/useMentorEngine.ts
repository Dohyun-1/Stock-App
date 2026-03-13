"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MENTOR_IDS, MENTOR_MAP } from "@/lib/mentors/mentorProfiles";
import {
  evaluateStockAllMentors,
  getMentorGuide,
  type StockMetrics,
  type MentorVerdict,
  type MarketCondition,
} from "@/lib/mentors/mentorEngine";

const STORAGE_KEY = "stockpro_selected_mentor";

export interface MentorEngineResult {
  selectedMentorId: string;
  selectMentor: (id: string) => void;
  mentorProfile: typeof MENTOR_MAP[string] | null;
  allMentorIds: string[];
  allProfiles: typeof MENTOR_MAP;

  verdicts: Record<string, MentorVerdict[]>;
  selectedVerdicts: Record<string, MentorVerdict>;

  marketGuide: ReturnType<typeof getMentorGuide>;

  loading: boolean;
  analyze: (stocks: StockMetrics[]) => void;
}

export function useMentorEngine(marketCondition: MarketCondition = "normal"): MentorEngineResult {
  const [selectedMentorId, setSelectedMentorId] = useState<string>("buffett");
  const [verdicts, setVerdicts] = useState<Record<string, MentorVerdict[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && MENTOR_IDS.includes(stored)) {
        setSelectedMentorId(stored);
      }
    } catch {}
  }, []);

  const selectMentor = useCallback((id: string) => {
    if (MENTOR_IDS.includes(id)) {
      setSelectedMentorId(id);
      try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    }
  }, []);

  const analyze = useCallback((stocks: StockMetrics[]) => {
    setLoading(true);
    const results: Record<string, MentorVerdict[]> = {};
    for (const stock of stocks) {
      results[stock.symbol] = evaluateStockAllMentors(stock);
    }
    setVerdicts(results);
    setLoading(false);
  }, []);

  const selectedVerdicts = useMemo(() => {
    const map: Record<string, MentorVerdict> = {};
    for (const [symbol, vs] of Object.entries(verdicts)) {
      const found = vs.find((v) => v.mentorId === selectedMentorId);
      if (found) map[symbol] = found;
    }
    return map;
  }, [verdicts, selectedMentorId]);

  const mentorProfile = MENTOR_MAP[selectedMentorId] ?? null;
  const marketGuide = useMemo(
    () => getMentorGuide(selectedMentorId, marketCondition),
    [selectedMentorId, marketCondition]
  );

  return {
    selectedMentorId,
    selectMentor,
    mentorProfile,
    allMentorIds: MENTOR_IDS,
    allProfiles: MENTOR_MAP,
    verdicts,
    selectedVerdicts,
    marketGuide,
    loading,
    analyze,
  };
}
