"use client";

import { motion } from "framer-motion";
import { MathLatex } from "./MathLatex";
import { SurfaceAreaPanel } from "./SurfaceAreaPanel";
import type { CalculationResult } from "@/types/revolve";
import type { SurfaceAreaOutcome } from "@/types/surfaceArea";
import { formatNumber } from "@/lib/revolve/integration";

interface SolutionPanelProps {
  result: CalculationResult | null;
  surfaceArea: SurfaceAreaOutcome | null;
}

export function SolutionPanel({ result, surfaceArea }: SolutionPanelProps) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-10 text-center text-slate-500">
        点击 <span className="text-violet-300">计算体积</span>{" "}
        查看分步解答、积分设置与 AI 讲解。
      </div>
    );
  }

  const isCross = result.kind === "cross-section";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {result.warning && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
          {result.warning}
        </p>
      )}

      {isCross && (
        <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 shadow-card">
          <h3 className="mb-4 text-lg font-semibold text-cyan-100">
            截面法求体积
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white/[0.03] p-3">
              <p className="mb-1 text-xs text-slate-500">底边长度</p>
              <MathLatex math={result.baseLatex} block />
            </div>

            <div className="rounded-lg bg-white/[0.03] p-3">
              <p className="mb-1 text-xs text-slate-500">
                截面形状 · {result.shapeLabel}
              </p>
              <MathLatex math={result.areaLatex} block />
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-card">
        <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-sm text-violet-300">
            1–8
          </span>
          分步解答
        </h3>

        <ol className="space-y-4">
          {result.steps.map((step, i) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-bold text-white">
                  {step.number}
                </span>
                <span className="font-medium text-slate-100">
                  {step.title}
                </span>
              </div>

              <p className="mt-2 pl-8 text-sm leading-relaxed text-slate-400">
                {step.body}
              </p>

              {step.latex && (
                <div className="mt-3 pl-8 text-slate-200">
                  <MathLatex math={step.latex} block />
                </div>
              )}
            </motion.li>
          ))}
        </ol>
      </section>

      <SurfaceAreaPanel outcome={surfaceArea} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-300/90">
            积分设置
          </h3>

          <p className="mb-3 text-sm text-slate-400">
            方法：{" "}
            <span className="font-medium text-violet-200">
              {isCross
                ? "截面法"
                : result.integral.method === "washer"
                  ? "垫圈 / 圆盘法"
                  : "柱壳法"}
            </span>{" "}
            · 积分变量：d{result.integral.variable}
          </p>

          <MathLatex math={result.integral.fullIntegralLatex} block />

          <div className="mt-4 rounded-lg bg-white/[0.03] p-3">
            <p className="mb-2 text-xs text-slate-500">被积函数</p>
            <MathLatex math={result.integral.integrandLatex} block />
          </div>
        </section>

        <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-6 shadow-glow">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-violet-200">
            最终答案
          </h3>

          <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {formatNumber(result.volume)}
            <span className="ml-2 text-lg font-normal text-slate-400">
              单位³
            </span>
          </p>

          <div className="mt-4">
            <MathLatex math={result.integral.evaluatedLatex} block />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-violet-950/50 to-slate-900/80 p-6 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-400" />
          </span>

          <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-200">
            AI 讲解
          </h3>

          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium uppercase text-violet-300">
            模拟
          </span>
        </div>

        <p className="text-sm leading-relaxed text-slate-300">
          {result.aiExplanation}
        </p>
      </section>
    </motion.div>
  );
}