import type { RevolveInput } from "@/types/revolve";
import type {
  SurfaceAreaCurvePart,
  SurfaceAreaOutcome,
} from "@/types/surfaceArea";
import { integrateSimpson, formatNumber } from "./integration";
import {
  formatExprForDisplay,
  normalizeExpr,
  parseFunction,
} from "./mathParser";
import { generateSurfaceAreaExplanation } from "./surfaceAreaExplanation";
import { create, all, type MathNode } from "mathjs";

const math = create(all, {});

const CROSS_SECTION_MSG = "截面法表面积暂不支持。";
const UNSUPPORTED_AXIS_MSG = "当前版本暂不支持该旋转轴的表面积计算。";

const FORMULA_LATEX =
  "S = 2\\pi \\int_a^b R(x)\\,\\sqrt{1 + \\left(\\frac{dy}{dx}\\right)^2}\\,dx";

function parseDerivative(expr: string): (x: number) => number {
  const normalized = normalizeExpr(expr);
  let node: MathNode;
  try {
    node = math.parse(normalized);
  } catch {
    throw new Error(`无法对 "${expr}" 求导，请检查表达式。`);
  }

  let derivative: MathNode;
  try {
    derivative = math.derivative(node, "x");
  } catch {
    throw new Error(`无法对 "${expr}" 求导，请检查表达式。`);
  }

  const compiled = derivative.compile();

  return (x: number) => {
    const value = compiled.evaluate({ x });
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`在 x = ${x} 处导数不是实数，请检查表达式。`);
    }
    return value;
  };
}

function derivativeExprString(expr: string): string {
  const normalized = normalizeExpr(expr);
  const node = math.parse(normalized);
  const derivative = math.derivative(node, "x");
  return formatExprForDisplay(derivative.toString());
}

function radiusAt(
  y: number,
  axisMode: RevolveInput["axisMode"],
  k?: number
): number {
  if (axisMode === "x-axis") return Math.abs(y);
  return Math.abs(y - k!);
}

function radiusDescription(
  curveLabel: string,
  axisMode: RevolveInput["axisMode"],
  k?: number
): string {
  if (axisMode === "x-axis") {
    return `${curveLabel}(x) 到 x 轴的距离：R(x) = |${curveLabel}(x)|`;
  }
  return `${curveLabel}(x) 到直线 y = ${k} 的距离：R(x) = |${curveLabel}(x) − ${k}|`;
}

function radiusLatex(
  curveLabel: string,
  axisMode: RevolveInput["axisMode"],
  k?: number
): string {
  if (axisMode === "x-axis") {
    return `R_{${curveLabel}}(x) = \\left|${curveLabel}(x)\\right|`;
  }
  return `R_{${curveLabel}}(x) = \\left|${curveLabel}(x) - ${k}\\right|`;
}

function derivativeLatex(curveLabel: string, expr: string): string {
  const disp = formatExprForDisplay(expr);
  const dStr = derivativeExprString(expr);
  return `\\frac{d}{dx}\\left(${disp}\\right) = ${dStr}`;
}

function integrandLatex(
  curveLabel: string,
  axisMode: RevolveInput["axisMode"],
  k?: number
): string {
  const r =
    axisMode === "x-axis"
      ? `\\left|${curveLabel}(x)\\right|`
      : `\\left|${curveLabel}(x) - ${k}\\right|`;
  return `2\\pi \\cdot ${r} \\cdot \\sqrt{1 + \\left(\\frac{d${curveLabel}}{dx}\\right)^2}`;
}

function computeCurveSurface(
  expr: string,
  curveLabel: "f" | "g",
  input: RevolveInput,
  yFn: (x: number) => number,
  dydx: (x: number) => number
): SurfaceAreaCurvePart {
  const k = input.k;
  const integrand = (x: number) => {
    const y = yFn(x);
    const slope = dydx(x);
    const r = radiusAt(y, input.axisMode, k);
    return 2 * Math.PI * r * Math.sqrt(1 + slope * slope);
  };

  const partialArea = integrateSimpson(integrand, input.a, input.b);
  const disp = formatExprForDisplay(expr);

  return {
    curveLabel,
    exprDisp: disp,
    radiusDesc: radiusDescription(curveLabel, input.axisMode, k),
    radiusLatex: radiusLatex(curveLabel, input.axisMode, k),
    derivativeDesc: `${curveLabel}'(x) 为 ${curveLabel}(x) = ${disp} 对 x 的导数`,
    derivativeLatex: derivativeLatex(curveLabel, expr),
    integrandLatex: integrandLatex(curveLabel, input.axisMode, k),
    fullIntegralLatex: `S_{${curveLabel}} = 2\\pi\\int_{${input.a}}^{${input.b}} R_{${curveLabel}}(x)\\,\\sqrt{1 + \\left(\\frac{d${curveLabel}}{dx}\\right)^2}\\,dx`,
    evaluatedLatex: `S_{${curveLabel}} \\approx ${formatNumber(partialArea)}`,
    partialArea,
  };
}

export function calculateSurfaceArea(
  input: RevolveInput
): SurfaceAreaOutcome {
  if (input.axisMode === "y-axis" || input.axisMode === "x=k") {
    return { status: "unsupported-axis", message: UNSUPPORTED_AXIS_MSG };
  }

  if (
    input.axisMode === "y=k" &&
    (input.k === undefined || Number.isNaN(input.k))
  ) {
    throw new Error("请为自定义旋转轴输入 k 的值。");
  }

  if (input.a >= input.b) {
    throw new Error("下限 a 必须小于上限 b（a < b）。");
  }

  const f = parseFunction(input.fExpr);
  const g = parseFunction(input.gExpr);
  const fPrime = parseDerivative(input.fExpr);
  const gPrime = parseDerivative(input.gExpr);

  const sampleCount = 48;
  const step = (input.b - input.a) / sampleCount;
  for (let i = 0; i <= sampleCount; i++) {
    const x = input.a + i * step;
    f(x);
    g(x);
    fPrime(x);
    gPrime(x);
  }

  const curveF = computeCurveSurface(
    input.fExpr,
    "f",
    input,
    f,
    fPrime
  );
  const curveG = computeCurveSurface(
    input.gExpr,
    "g",
    input,
    g,
    gPrime
  );

  const totalArea = curveF.partialArea + curveG.partialArea;
  const fDisp = formatExprForDisplay(input.fExpr);
  const gDisp = formatExprForDisplay(input.gExpr);

  return {
    status: "ok",
    formulaLatex: FORMULA_LATEX,
    totalArea,
    curves: [curveF, curveG],
    fullIntegralLatex: `S = S_f + S_g = ${curveF.fullIntegralLatex} + ${curveG.fullIntegralLatex}`,
    evaluatedLatex: `S \\approx ${formatNumber(totalArea)}`,
    explanation: generateSurfaceAreaExplanation(
      input,
      fDisp,
      gDisp,
      totalArea
    ),
  };
}

export function surfaceAreaForCrossSection(): SurfaceAreaOutcome {
  return { status: "cross-section", message: CROSS_SECTION_MSG };
}
