"use client";

import { REVOLUTION_EXAMPLES } from "@/lib/revolve/examples";
import { CROSS_SECTION_EXAMPLES } from "@/lib/crossSection/crossSectionExamples";
import { AXIS_MODE_ZH } from "@/lib/revolve/labels";
import type {
  AxisMode,
  CalculationMode,
  CrossSectionShape,
  ExampleProblem,
} from "@/types/revolve";

export interface InputFormState {
  calculationMode: CalculationMode;
  fExpr: string;
  gExpr: string;
  a: string;
  b: string;
  axisMode: AxisMode;
  k: string;
  customAxisExpr: string;
  crossSectionShape: CrossSectionShape;
  rectangleK: string;
}

interface InputPanelProps {
  form: InputFormState;
  onChange: (form: InputFormState) => void;
  onCalculate: () => void;
  onExample: (ex: ExampleProblem) => void;
  loading?: boolean;
  error?: string | null;
}

const MODE_OPTIONS: { value: CalculationMode; label: string; desc: string }[] = [
  {
    value: "revolution",
    label: "旋转体体积",
    desc: "垫圈法 / 柱壳法 · 需选择旋转轴",
  },
  {
    value: "cross-section",
    label: "截面法求体积",
    desc: "V = ∫ A(x) dx · 无旋转轴",
  },
];

const AXIS_OPTIONS: { value: AxisMode; label: string }[] = [
  { value: "x-axis", label: "x 轴 (y = 0)" },
  { value: "y-axis", label: "y 轴 (x = 0)" },
  { value: "y=k", label: "水平线 y = k" },
  { value: "x=k", label: "垂直线 x = k" },
  { value: "custom", label: "自定义旋转轴" },
];

const CROSS_SHAPE_OPTIONS: {
  value: CrossSectionShape;
  label: string;
}[] = [
  { value: "square", label: "正方形" },
  { value: "semicircle", label: "半圆" },
  { value: "equilateral", label: "等边三角形" },
  { value: "rectangle", label: "矩形" },
];

export function InputPanel({
  form,
  onChange,
  onCalculate,
  onExample,
  loading,
  error,
}: InputPanelProps) {
  const set = (patch: Partial<InputFormState>) => onChange({ ...form, ...patch });
  const isRevolution = form.calculationMode === "revolution";
  const examples = isRevolution ? REVOLUTION_EXAMPLES : CROSS_SECTION_EXAMPLES;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-card backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-violet-300/90">
          计算模式
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set({ calculationMode: opt.value })}
              className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                form.calculationMode === opt.value
                  ? "border-violet-500/50 bg-violet-500/15 text-violet-100 shadow-glow"
                  : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-violet-500/25"
              }`}
            >
              <span className="block font-medium">{opt.label}</span>
              <span className="mt-0.5 block text-xs opacity-80">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-card backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-violet-300/90">
          函数与区间
        </h2>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">第一个函数 f(x)</span>
            <input
              type="text"
              value={form.fExpr}
              onChange={(e) => set({ fExpr: e.target.value })}
              placeholder="例如 x^2"
              className="input-field font-mono"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">第二个函数 g(x)</span>
            <input
              type="text"
              value={form.gExpr}
              onChange={(e) => set({ gExpr: e.target.value })}
              placeholder="例如 4"
              className="input-field font-mono"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-300">下限 a</span>
              <input
                type="number"
                value={form.a}
                onChange={(e) => set({ a: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-300">上限 b</span>
              <input
                type="number"
                value={form.b}
                onChange={(e) => set({ b: e.target.value })}
                className="input-field"
              />
            </label>
          </div>
        </div>
      </div>

      {isRevolution ? (
        <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-card backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-violet-300/90">
            旋转轴
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {AXIS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set({ axisMode: opt.value })}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-all duration-200 sm:text-sm ${
                  opt.value === "custom" ? "col-span-2" : ""
                } ${
                  form.axisMode === opt.value
                    ? "border-violet-500/50 bg-violet-500/15 text-violet-100 shadow-glow"
                    : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-violet-500/25 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {(form.axisMode === "y=k" || form.axisMode === "x=k") && (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm text-slate-300">常数 k 的值</span>
              <input
                type="number"
                value={form.k}
                onChange={(e) => set({ k: e.target.value })}
                placeholder={form.axisMode === "y=k" ? "例如 3" : "例如 -1"}
                className="input-field"
              />
            </label>
          )}

          {form.axisMode === "custom" && (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm text-slate-300">
                旋转轴方程
              </span>
              <input
                type="text"
                value={form.customAxisExpr}
                onChange={(e) => set({ customAxisExpr: e.target.value })}
                placeholder="例如 y = 2、y = sin(x)、x = -3"
                className="input-field font-mono"
              />
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                支持 y = f(x)（垫圈法）或 x = 常数（柱壳法），如 y = x、y = 2、x = -3。
              </p>
            </label>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-6 shadow-card backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-300/90">
            截面形状
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {CROSS_SHAPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set({ crossSectionShape: opt.value })}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-all duration-200 sm:text-sm ${
                  form.crossSectionShape === opt.value
                    ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100 shadow-glow"
                    : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-cyan-500/25"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {form.crossSectionShape === "rectangle" && (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm text-slate-300">
                高度系数 k（高 = k · base(x)）
              </span>
              <input
                type="number"
                min="0.01"
                step="0.1"
                value={form.rectangleK}
                onChange={(e) => set({ rectangleK: e.target.value })}
                placeholder="例如 1.5"
                className="input-field"
              />
            </label>
          )}

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            底边长度 base(x) = |f(x) − g(x)|，截面垂直于 x 轴，不绕任何轴旋转。
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onCalculate}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? "计算中…" : "计算体积"}
      </button>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
          例题速览
        </p>
        <div className="flex flex-col gap-2">
          {examples.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => onExample(ex)}
              className="rounded-xl border border-white/[0.06] px-4 py-2.5 text-left text-sm text-slate-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-100"
            >
              <span className="font-medium text-violet-200">{ex.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                f(x)={ex.fExpr}, g(x)={ex.gExpr}, [{ex.a}, {ex.b}]
                {ex.mode === "revolution" && ex.axisMode
                  ? `, ${
                      ex.axisMode === "custom" && ex.customAxisExpr
                        ? ex.customAxisExpr
                        : AXIS_MODE_ZH[ex.axisMode]
                    }`
                  : ex.crossShape
                    ? `, ${CROSS_SHAPE_OPTIONS.find((o) => o.value === ex.crossShape)?.label}`
                    : ""}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
