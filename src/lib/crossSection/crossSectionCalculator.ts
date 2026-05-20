import type { CrossSectionInput, CrossSectionResult } from "@/types/revolve";
import { integrateSimpson, formatNumber } from "@/lib/revolve/integration";
import { parseFunction, formatExprForDisplay } from "@/lib/revolve/mathParser";
import { getShapeFormula } from "./areaFormulas";
import { buildCrossSectionSteps } from "./crossSectionSteps";
import { generateCrossSectionAIExplanation } from "./crossSectionAiExplanation";

export function calculateCrossSectionVolume(
  input: CrossSectionInput
): CrossSectionResult {
  if (input.a >= input.b) {
    throw new Error("下限 a 必须小于上限 b（a < b）。");
  }

  if (input.shape === "rectangle") {
    const k = input.rectangleK;
    if (k === undefined || Number.isNaN(k) || k <= 0) {
      throw new Error("矩形截面请输入大于 0 的高度系数 k。");
    }
  }

  const f = parseFunction(input.fExpr);
  const g = parseFunction(input.gExpr);
  const rectangleK = input.rectangleK ?? 1;
  const formula = getShapeFormula(input.shape, rectangleK);

  const integrand = (x: number) => {
    const base = Math.abs(f(x) - g(x));
    return formula.areaFn(base, rectangleK);
  };

  const volume = integrateSimpson(integrand, input.a, input.b);

  const fDisp = formatExprForDisplay(input.fExpr);
  const gDisp = formatExprForDisplay(input.gExpr);
  const baseLatex = "\\text{base}(x) = \\bigl|f(x)-g(x)\\bigr|";
  const fullIntegralLatex = `V = \\int_{${input.a}}^{${input.b}} A(x)\\,dx`;
  const evaluatedLatex = `V \\approx ${formatNumber(volume)}`;

  const warning =
    "截面法不需要旋转轴；请确保函数以 x 表示，且积分区间为 x 值。";

  const steps = buildCrossSectionSteps({
    input,
    fDisp,
    gDisp,
    formula,
    volume,
    fullIntegralLatex,
    evaluatedLatex,
    rectangleK,
  });

  return {
    kind: "cross-section",
    volume,
    steps,
    integral: {
      method: "cross-section",
      variable: "x",
      bounds: [input.a, input.b],
      integrandLatex: formula.integrandLatex,
      fullIntegralLatex: `V = \\int_{${input.a}}^{${input.b}} ${formula.integrandLatex}\\,dx`,
      evaluatedLatex,
    },
    shape: input.shape,
    shapeLabel: formula.label,
    baseLatex,
    areaLatex: formula.areaLatex,
    areaDesc: formula.coeffDescription,
    aiExplanation: generateCrossSectionAIExplanation(
      input,
      formula,
      volume,
      warning
    ),
    warning,
  };
}
