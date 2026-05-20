"use client";

import { motion } from "framer-motion";
import { MathLatex } from "./MathLatex";
import type { SurfaceAreaOutcome } from "@/types/surfaceArea";
import { formatNumber } from "@/lib/revolve/integration";

interface SurfaceAreaPanelProps {
  outcome: SurfaceAreaOutcome | null;
}

export function SurfaceAreaPanel({ outcome }: SurfaceAreaPanelProps) {
  if (!outcome) return null;

  if (outcome.status !== "ok") {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-card">
        <h3 className="mb-3 text-lg font-semibold text-white">表面积计算</h3>
        <p className="text-sm leading-relaxed text-slate-400">{outcome.message}</p>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-card/80 p-6 shadow-card"
    >
      <h3 className="mb-5 text-lg font-semibold text-emerald-100">表面积计算</h3>

      <div className="space-y-5">
        <div className="rounded-lg bg-white/[0.03] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
            公式
          </p>
          <MathLatex math={outcome.formulaLatex} block />
          <p className="mt-2 text-xs text-slate-500">
            两条曲线分别旋转，表面积相加：S = S<sub>f</sub> + S<sub>g</sub>
          </p>
        </div>

        {outcome.curves.map((curve) => (
          <motion.div
            key={curve.curveLabel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <p className="text-sm font-medium text-emerald-200/90">
              曲线 {curve.curveLabel}(x) = {curve.exprDisp}
            </p>

            <div className="rounded-lg bg-white/[0.03] p-3">
              <p className="mb-2 text-xs text-slate-500">旋转半径</p>
              <p className="mb-2 text-sm text-slate-400">{curve.radiusDesc}</p>
              <MathLatex math={curve.radiusLatex} block />
            </div>

            <div className="rounded-lg bg-white/[0.03] p-3">
              <p className="mb-2 text-xs text-slate-500">导数</p>
              <p className="mb-2 text-sm text-slate-400">{curve.derivativeDesc}</p>
              <MathLatex math={curve.derivativeLatex} block />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-lg bg-white/[0.03] p-3"
            >
              <p className="mb-2 text-xs text-slate-500">被积函数</p>
              <MathLatex math={curve.integrandLatex} block />
            </motion.div>

            <div className="rounded-lg bg-white/[0.03] p-3">
              <p className="mb-2 text-xs text-slate-500">积分设置</p>
              <MathLatex math={curve.fullIntegralLatex} block />
              <div className="mt-2">
                <MathLatex math={curve.evaluatedLatex} block />
              </div>
            </div>
          </motion.div>
        ))}

        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-200/90">
            总表面积
          </p>
          <MathLatex math={outcome.fullIntegralLatex} block />
          <p className="mt-3 text-3xl font-bold text-white">
            {formatNumber(outcome.totalArea)}
            <span className="ml-2 text-base font-normal text-slate-400">单位²</span>
          </p>
          <div className="mt-2">
            <MathLatex math={outcome.evaluatedLatex} block />
          </div>
        </div>

        <div className="rounded-lg bg-white/[0.03] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
            说明
          </p>
          <p className="text-sm leading-relaxed text-slate-300">
            {outcome.explanation}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
