"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalculationHistoryEntry } from "@/types/history";
import {
  appendHistoryEntry,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
} from "@/lib/history/calculationHistory";

export function useCalculationHistory() {
  const [entries, setEntries] = useState<CalculationHistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(loadHistory());
    setReady(true);
  }, []);

  const addEntry = useCallback(
    (partial: Omit<CalculationHistoryEntry, "id" | "createdAt">) => {
      const next = appendHistoryEntry(partial);
      setEntries(next);
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    const next = removeHistoryEntry(id);
    setEntries(next);
  }, []);

  const clearAll = useCallback(() => {
    clearHistory();
    setEntries([]);
  }, []);

  return { entries, ready, addEntry, deleteEntry, clearAll };
}
