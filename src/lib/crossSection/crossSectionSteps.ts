import type { CrossSectionInput, SolutionStep } from "@/types/revolve";
import type { ShapeFormula } from "./areaFormulas";
import { formatNumber } from "@/lib/revolve/integration";

interface CrossStepContext {
  input: CrossSectionInput;
  fDisp: string;
  gDisp: string;
  formula: ShapeFormula;
  volume: number;
  fullIntegralLatex: string;
  evaluatedLatex: string;
  rectangleK: number;
}

export function buildCrossSectionSteps(ctx: CrossStepContext): SolutionStep[] {
  const { input, formula } = ctx;

  return [
    {
      number: 1,
      title: "确定两条曲线",
      body: `区域由 f(x) = ${ctx.fDisp} 与 g(x) = ${ctx.gDisp} 围成。`,
      latex: `f(x) = ${ctx.fDisp},\\quad g(x) = ${ctx.gDisp}`,
    },
    {
      number: 2,
      title: "确定积分区间",
      body: `体积由 x = ${input.a} 到 x = ${input.b} 上各截面的面积叠加得到。`,
      latex: `${input.a} \\le x \\le ${input.b}`,
    },
    {
      number: 3,
      title: "确定底边长度",
      body: `在 x 处，垂直于 x 轴的底边长度为两曲线之差的绝对值。这不是旋转体，没有旋转轴。`,
      latex: "\\text{base}(x) = \\bigl|f(x)-g(x)\\bigr|",
    },
    {
      number: 4,
      title: "选择截面形状",
      body: `已选截面：${formula.label}。${formula.coeffDescription}`,
    },
    {
      number: 5,
      title: "写出截面面积 A(x)",
      body: `将底边代入截面面积公式。`,
      latex: ctx.formula.areaLatex,
    },
    {
      number: 6,
      title: "建立定积分",
      body: `截面法体积公式：V = ∫ A(x) dx。`,
      latex: ctx.fullIntegralLatex,
    },
    {
      number: 7,
      title: "计算积分",
      body: `在 [${input.a}, ${input.b}] 上使用数值积分（辛普森法则）求值。`,
      latex: ctx.evaluatedLatex,
    },
    {
      number: 8,
      title: "最终体积",
      body: `立体体积约为 ${formatNumber(ctx.volume)} 立方单位。`,
      latex: `V \\approx ${formatNumber(ctx.volume)}`,
    },
  ];
}
