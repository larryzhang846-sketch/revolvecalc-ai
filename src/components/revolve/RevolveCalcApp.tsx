"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { InputPanel, type InputFormState } from "./InputPanel";
import { SolutionPanel } from "./SolutionPanel";
import { HistoryPanel } from "./HistoryPanel";
import { calculateVolume } from "@/lib/revolve/volumeCalculator";
import {
  calculateSurfaceArea,
  surfaceAreaForCrossSection,
} from "@/lib/revolve/surfaceAreaCalculator";
import { calculateCrossSectionVolume } from "@/lib/crossSection/crossSectionCalculator";
import { buildHistoryEntry, historyEntryToForm } from "@/lib/history/calculationHistory";
import { useCalculationHistory } from "@/hooks/useCalculationHistory";
import type { CalculationHistoryEntry } from "@/types/history";
import type { SurfaceAreaOutcome } from "@/types/surfaceArea";
import type {
  CalculationResult,
  CrossSectionResult,
  ExampleProblem,
  RevolveInput,
  VolumeResult,
} from "@/types/revolve";

const SolidVisualization3D = dynamic(
  () => import("./SolidVisualization3D").then((m) => m.SolidVisualization3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-white/5 bg-surface/50 text-sm text-slate-500">
        正在加载三维旋转体…
      </div>
    ),
  }
);

const CrossSectionVisualization3D = dynamic(
  () =>
    import("./CrossSectionVisualization3D").then(
      (m) => m.CrossSectionVisualization3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-white/5 bg-surface/50 text-sm text-slate-500">
        正在加载截面可视化…
      </div>
    ),
  }
);

const DEFAULT_FORM: InputFormState = {
  calculationMode: "revolution",
  fExpr: "4",
  gExpr: "x^2",
  a: "0",
  b: "2",
  axisMode: "x-axis",
  k: "0",
  customAxisExpr: "y = 0",
  crossSectionShape: "square",
  rectangleK: "1",
};

function formToRevolveInput(form: InputFormState): RevolveInput {
  return {
    fExpr: form.fExpr,
    gExpr: form.gExpr,
    a: parseFloat(form.a),
    b: parseFloat(form.b),
    axisMode: form.axisMode,
    k:
      form.axisMode === "y=k" || form.axisMode === "x=k"
        ? parseFloat(form.k)
        : undefined,
    customAxisExpr:
      form.axisMode === "custom" ? form.customAxisExpr : undefined,
  };
}

function computeFromForm(form: InputFormState): CalculationResult {
  const a = parseFloat(form.a);
  const b = parseFloat(form.b);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new Error("区间端点 a、b 必须是有效数字。");
  }
  if (form.calculationMode === "revolution") {
    return calculateVolume(formToRevolveInput(form));
  }
  return calculateCrossSectionVolume({
    fExpr: form.fExpr,
    gExpr: form.gExpr,
    a,
    b,
    shape: form.crossSectionShape,
    rectangleK:
      form.crossSectionShape === "rectangle"
        ? parseFloat(form.rectangleK)
        : undefined,
  });
}

function computeSurfaceAreaFromForm(form: InputFormState): SurfaceAreaOutcome {
  if (form.calculationMode === "cross-section") {
    return surfaceAreaForCrossSection();
  }
  return calculateSurfaceArea(formToRevolveInput(form));
}

export function RevolveCalcApp() {
  const [form, setForm] = useState<InputFormState>(DEFAULT_FORM);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [surfaceArea, setSurfaceArea] = useState<SurfaceAreaOutcome | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    entries: historyEntries,
    ready: historyReady,
    addEntry,
    deleteEntry,
    clearAll: clearHistory,
  } = useCalculationHistory();

  const runCalculate = useCallback(() => {
    setError(null);
    setLoading(true);
    try {
      const res = computeFromForm(form);
      const surface = computeSurfaceAreaFromForm(form);
      setResult(res);
      setSurfaceArea(surface);
      addEntry(buildHistoryEntry(form, res));
    } catch (e) {
      setResult(null);
      setSurfaceArea(null);
      setError(e instanceof Error ? e.message : "计算出错，请检查输入。");
    } finally {
      setLoading(false);
    }
  }, [form, addEntry]);

  const reloadFromHistory = useCallback((entry: CalculationHistoryEntry) => {
    const next = historyEntryToForm(entry);
    setForm(next);
    setError(null);
    setLoading(true);
    try {
      const res = computeFromForm(next);
      setResult(res);
      setSurfaceArea(computeSurfaceAreaFromForm(next));
    } catch (e) {
      setResult(null);
      setSurfaceArea(null);
      setError(e instanceof Error ? e.message : "计算出错，请检查输入。");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExample = useCallback((ex: ExampleProblem) => {
    const next: InputFormState = {
      calculationMode: ex.mode,
      fExpr: ex.fExpr,
      gExpr: ex.gExpr,
      a: String(ex.a),
      b: String(ex.b),
      axisMode: ex.axisMode ?? "x-axis",
      k: ex.k !== undefined ? String(ex.k) : "0",
      customAxisExpr: ex.customAxisExpr ?? "y = 0",
      crossSectionShape: ex.crossShape ?? "square",
      rectangleK: ex.rectangleK !== undefined ? String(ex.rectangleK) : "1",
    };
    setForm(next);
    setError(null);
    try {
      if (ex.mode === "revolution") {
        setResult(
          calculateVolume({
            fExpr: ex.fExpr,
            gExpr: ex.gExpr,
            a: ex.a,
            b: ex.b,
            axisMode: ex.axisMode!,
            k: ex.k,
            customAxisExpr: ex.customAxisExpr,
          })
        );
        setSurfaceArea(
          calculateSurfaceArea({
            fExpr: ex.fExpr,
            gExpr: ex.gExpr,
            a: ex.a,
            b: ex.b,
            axisMode: ex.axisMode!,
            k: ex.k,
            customAxisExpr: ex.customAxisExpr,
          })
        );
      } else {
        setResult(
          calculateCrossSectionVolume({
            fExpr: ex.fExpr,
            gExpr: ex.gExpr,
            a: ex.a,
            b: ex.b,
            shape: ex.crossShape ?? "square",
            rectangleK: ex.rectangleK,
          })
        );
        setSurfaceArea(surfaceAreaForCrossSection());
      }
    } catch {
      setResult(null);
      setSurfaceArea(null);
    }
  }, []);

  const aNum = parseFloat(form.a) || 0;
  const bNum = parseFloat(form.b) || 2;
  const rectK = parseFloat(form.rectangleK) || 1;
  const isRevolution = form.calculationMode === "revolution";
  const revolveInput = useMemo(() => {
    if (!isRevolution) return null;
    try {
      return formToRevolveInput(form);
    } catch {
      return null;
    }
  }, [form, isRevolution]);
  const revolutionResult =
    result?.kind === "revolution" ? (result as VolumeResult) : null;
  const crossResult =
    result?.kind === "cross-section" ? (result as CrossSectionResult) : null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-cyan-600/10 blur-[100px]" />

      <header className="relative border-b border-white/[0.06] bg-void/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              AP 微积分 BC · 旋转体与截面法
            </p>
            <h1 className="bg-gradient-to-r from-violet-200 via-white to-cyan-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              RevolveCalc AI
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-400 sm:text-lg">
              旋转体体积（垫圈法、柱壳法）与截面法求体积。切换模式后输入曲线与区间，
              查看分步解答、定积分与三维可视化。
            </p>
          </motion.div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <InputPanel
            form={form}
            onChange={setForm}
            onCalculate={runCalculate}
            onExample={loadExample}
            loading={loading}
            error={error}
          />

          <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-card backdrop-blur-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-300/90">
              {isRevolution ? "三维旋转体" : "截面法可视化"}
            </h2>
            {isRevolution ? (
              revolveInput ? (
              <SolidVisualization3D
                revolveInput={revolveInput}
                result={revolutionResult}
              />
              ) : (
                <div className="flex h-[400px] items-center justify-center rounded-2xl border border-white/5 bg-surface/50 px-6 text-center text-sm text-slate-400">
                  请填写有效的函数、区间与旋转轴方程以预览三维旋转体。
                </div>
              )
            ) : (
              <CrossSectionVisualization3D
                fExpr={form.fExpr}
                gExpr={form.gExpr}
                a={aNum}
                b={bNum}
                shape={form.crossSectionShape}
                rectangleK={rectK}
                result={crossResult}
              />
            )}
          </div>
        </div>

        <div className="mt-10 space-y-10">
          <HistoryPanel
            entries={historyEntries}
            ready={historyReady}
            onReload={reloadFromHistory}
            onDelete={deleteEntry}
            onClearAll={clearHistory}
          />
          <SolutionPanel result={result} surfaceArea={surfaceArea} />
        </div>
      </div>


      <footer className="border-t border-white/[0.04] py-8 text-center text-xs text-slate-600">
        RevolveCalc AI · AP 微积分 BC 旋转体与截面法
      </footer>
    </div>
  );
}
