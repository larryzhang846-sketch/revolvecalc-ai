import type { CalculationHistoryEntry } from "@/types/history";
import type { InputFormState } from "@/components/revolve/InputPanel";
import type { CalculationResult } from "@/types/revolve";
import { AXIS_MODE_ZH } from "@/lib/revolve/labels";
const STORAGE_KEY = "revolvecalc-calculation-history";
const MAX_ENTRIES = 50;

function createSafeId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const CROSS_SHAPE_ZH = {
  square: "正方形",
  semicircle: "半圆",
  equilateral: "等边三角形",
  rectangle: "矩形",
} as const;

export function loadHistory(): CalculationHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CalculationHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: CalculationHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function formatModeDetailLabel(form: InputFormState): string {
  if (form.calculationMode === "revolution") {
    const base = AXIS_MODE_ZH[form.axisMode];
    if (form.axisMode === "y=k" || form.axisMode === "x=k") {
      const k = form.k.trim() || "0";
      return form.axisMode === "y=k" ? `水平线 y = ${k}` : `垂直线 x = ${k}`;
    }
    if (form.axisMode === "custom") {
      return form.customAxisExpr.trim() || base;
    }
    return base;
  }
  const shapeLabel = CROSS_SHAPE_ZH[form.crossSectionShape];
  if (form.crossSectionShape === "rectangle") {
    const k = form.rectangleK.trim() || "1";
    return `${shapeLabel}（k = ${k}）`;
  }
  return shapeLabel;
}

export function buildHistoryEntry(
  form: InputFormState,
  result: CalculationResult
): Omit<CalculationHistoryEntry, "id" | "createdAt"> {
  const a = parseFloat(form.a);
  const b = parseFloat(form.b);

  return {
    calculationMode: form.calculationMode,
    fExpr: form.fExpr,
    gExpr: form.gExpr,
    a,
    b,
    modeDetailLabel: formatModeDetailLabel(form),
    volume: result.volume,
    axisMode: form.calculationMode === "revolution" ? form.axisMode : undefined,
    k:
      form.calculationMode === "revolution" &&
      (form.axisMode === "y=k" || form.axisMode === "x=k")
        ? parseFloat(form.k)
        : undefined,
    customAxisExpr:
      form.calculationMode === "revolution" && form.axisMode === "custom"
        ? form.customAxisExpr
        : undefined,
    crossSectionShape:
      form.calculationMode === "cross-section"
        ? form.crossSectionShape
        : undefined,
    rectangleK:
      form.calculationMode === "cross-section" &&
      form.crossSectionShape === "rectangle"
        ? parseFloat(form.rectangleK)
        : undefined,
  };
}

export function historyEntryToForm(
  entry: CalculationHistoryEntry
): InputFormState {
  return {
    calculationMode: entry.calculationMode,
    fExpr: entry.fExpr,
    gExpr: entry.gExpr,
    a: String(entry.a),
    b: String(entry.b),
    axisMode: entry.axisMode ?? "x-axis",
    k: entry.k !== undefined ? String(entry.k) : "0",
    customAxisExpr: entry.customAxisExpr ?? "y = 0",
    crossSectionShape: entry.crossSectionShape ?? "square",
    rectangleK:
      entry.rectangleK !== undefined ? String(entry.rectangleK) : "1",
  };
}

export function createHistoryEntry(
  partial: Omit<CalculationHistoryEntry, "id" | "createdAt">
): CalculationHistoryEntry {
  return {
    ...partial,
    id: createSafeId(),
    createdAt: new Date().toISOString(),
  };
}

export function appendHistoryEntry(
  partial: Omit<CalculationHistoryEntry, "id" | "createdAt">
): CalculationHistoryEntry[] {
  const entry = createHistoryEntry(partial);
  const next = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
  saveHistory(next);
  return next;
}

export function removeHistoryEntry(id: string): CalculationHistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  saveHistory(next);
  return next;
}

export function clearHistory(): CalculationHistoryEntry[] {
  saveHistory([]);
  return [];
}

export function formatHistoryTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const CALCULATION_MODE_ZH = {
  revolution: "旋转体体积",
  "cross-section": "截面法求体积",
} as const;
