import type { RevolveInput, VolumeResult } from "@/types/revolve";
import {
  resolveRevolutionAxis,
  validateRevolutionAxisInput,
  type HorizontalAxis,
  type VerticalAxis,
} from "./axisParser";
import { generateAIExplanation } from "./aiExplanation";
import { integrateSimpson, formatNumber } from "./integration";
import { parseFunction, formatExprForDisplay } from "./mathParser";
import { washerRadiiHorizontal, washerRadiiXAxis } from "./radii";
import { buildSteps } from "./stepsGenerator";

export function calculateVolume(input: RevolveInput): VolumeResult {
  validateRevolutionAxisInput(input);
  const axis = resolveRevolutionAxis(input);
  const f = parseFunction(input.fExpr);
  const g = parseFunction(input.gExpr);

  const sampleCount = 48;
  const step = (input.b - input.a) / sampleCount;
  for (let i = 0; i <= sampleCount; i++) {
    const x = input.a + i * step;
    f(x);
    g(x);
  }

  let warning: string | undefined =
    "本版本最适合函数以 x 表示、且积分区间为 x 值的情形。";
  if (input.axisMode === "custom") {
    warning += " 自定义轴请写成 y = f(x)（如 y = 2、y = sin(x)）或 x = 常数（如 x = -3）。";
  }

  if (axis.kind === "horizontal") {
    if (input.axisMode === "x-axis") {
      return computeWasherXAxis(input, f, g, warning);
    }
    return computeWasherHorizontalAxis(input, f, g, axis, warning);
  }

  if (input.axisMode === "y-axis") {
    return computeShellYAxis(input, f, g, warning);
  }

  return computeShellVerticalAxis(input, f, g, axis, warning);
}

function computeWasherXAxis(
  input: RevolveInput,
  f: (x: number) => number,
  g: (x: number) => number,
  warning?: string
): VolumeResult {
  const integrand = (x: number) => {
    const fv = f(x);
    const gv = g(x);
    const { R, r } = washerRadiiXAxis(fv, gv);
    return Math.PI * (R * R - r * r);
  };

  const volume = integrateSimpson(integrand, input.a, input.b);

  const outerRadiusDesc =
    "从 x 轴到该截面较远曲线（上边界）的距离";
  const innerRadiusDesc =
    "从 x 轴到该截面较近曲线（下边界）的距离";

  const outerRadiusLatex = "R(x) = \\text{distance from } x\\text{-axis to outer curve}";
  const innerRadiusLatex = "r(x) = \\text{distance from } x\\text{-axis to inner curve}";

  const fDisp = formatExprForDisplay(input.fExpr);
  const gDisp = formatExprForDisplay(input.gExpr);

  const integrandLatex = "\\pi\\left[R(x)^2 - r(x)^2\\right]";
  const fullIntegralLatex = `V = \\pi\\int_{${input.a}}^{${input.b}} \\left[R(x)^2 - r(x)^2\\right]\\,dx`;
  const evaluatedLatex = `V \\approx ${formatNumber(volume)}`;

  const steps = buildSteps({
    input,
    method: "washer",
    outerRadiusDesc,
    innerRadiusDesc,
    integrandLatex,
    fullIntegralLatex,
    evaluatedLatex,
    fDisp,
    gDisp,
    volume,
  });

  return {
    kind: "revolution",
    volume,
    method: "washer",
    steps,
    integral: {
      method: "washer",
      variable: "x",
      bounds: [input.a, input.b],
      integrandLatex,
      fullIntegralLatex,
      evaluatedLatex,
    },
    outerRadiusDesc,
    innerRadiusDesc,
    outerRadiusLatex,
    innerRadiusLatex,
    aiExplanation: generateAIExplanation(
      input,
      "washer",
      outerRadiusDesc,
      innerRadiusDesc,
      volume,
      warning
    ),
    warning,
    graphMeta: {
      axisLabel: "x 轴 (y = 0)",
      axisValue: 0,
      methodLabel: "垫圈 / 圆盘法",
    },
  };
}

function computeWasherHorizontalAxis(
  input: RevolveInput,
  f: (x: number) => number,
  g: (x: number) => number,
  axis: HorizontalAxis,
  warning?: string
): VolumeResult {
  const integrand = (x: number) => {
    const fv = f(x);
    const gv = g(x);
    const hx = axis.h(x);
    const { R, r } = washerRadiiHorizontal(fv, gv, hx);
    return Math.PI * (R * R - r * r);
  };

  const volume = integrateSimpson(integrand, input.a, input.b);

  const outerRadiusDesc = `从旋转轴 ${axis.label} 到该截面较远曲线的距离`;
  const innerRadiusDesc = `从旋转轴 ${axis.label} 到该截面较近曲线的距离`;

  const outerRadiusLatex = `R(x) = \\text{dist from } ${axis.label} \\text{ to outer curve}`;
  const innerRadiusLatex = `r(x) = \\text{dist from } ${axis.label} \\text{ to inner curve}`;

  const fDisp = formatExprForDisplay(input.fExpr);
  const gDisp = formatExprForDisplay(input.gExpr);

  const integrandLatex = "\\pi\\left[R(x)^2 - r(x)^2\\right]";
  const fullIntegralLatex = `V = \\pi\\int_{${input.a}}^{${input.b}} \\left[R(x)^2 - r(x)^2\\right]\\,dx`;
  const evaluatedLatex = `V \\approx ${formatNumber(volume)}`;

  const steps = buildSteps({
    input,
    method: "washer",
    outerRadiusDesc,
    innerRadiusDesc,
    integrandLatex,
    fullIntegralLatex,
    evaluatedLatex,
    fDisp,
    gDisp,
    volume,
    axisExtra: axis.label,
  });

  const midX = (input.a + input.b) / 2;

  return {
    kind: "revolution",
    volume,
    method: "washer",
    steps,
    integral: {
      method: "washer",
      variable: "x",
      bounds: [input.a, input.b],
      integrandLatex,
      fullIntegralLatex,
      evaluatedLatex,
    },
    outerRadiusDesc,
    innerRadiusDesc,
    outerRadiusLatex,
    innerRadiusLatex,
    aiExplanation: generateAIExplanation(
      input,
      "washer",
      outerRadiusDesc,
      innerRadiusDesc,
      volume,
      warning,
      axis.label
    ),
    warning,
    graphMeta: {
      axisLabel: axis.label,
      axisValue: axis.h(midX),
      methodLabel: "垫圈 / 圆盘法",
    },
  };
}

function computeShellYAxis(
  input: RevolveInput,
  f: (x: number) => number,
  g: (x: number) => number,
  warning?: string
): VolumeResult {
  const integrand = (x: number) => {
    const height = Math.abs(f(x) - g(x));
    return 2 * Math.PI * Math.abs(x) * height;
  };

  const volume = integrateSimpson(integrand, input.a, input.b);

  const outerRadiusDesc = "从 y 轴到 x 处切片的水平距离（半径 = |x|）";
  const innerRadiusDesc = "柱壳法每个切片只需一个半径，不设内半径";

  const outerRadiusLatex = "p(x) = |x|";
  const innerRadiusLatex = "h(x) = |f(x) - g(x)|";

  const fDisp = formatExprForDisplay(input.fExpr);
  const gDisp = formatExprForDisplay(input.gExpr);

  const integrandLatex = "2\\pi \\cdot |x| \\cdot |f(x)-g(x)|";
  const fullIntegralLatex = `V = 2\\pi\\int_{${input.a}}^{${input.b}} x\\,\\bigl|f(x)-g(x)\\bigr|\\,dx`;
  const evaluatedLatex = `V \\approx ${formatNumber(volume)}`;

  const steps = buildSteps({
    input,
    method: "shell",
    outerRadiusDesc,
    innerRadiusDesc,
    integrandLatex,
    fullIntegralLatex,
    evaluatedLatex,
    fDisp,
    gDisp,
    volume,
    shellHeight: "|f(x) − g(x)|",
    shellRadius: "|x|",
  });

  return {
    kind: "revolution",
    volume,
    method: "shell",
    steps,
    integral: {
      method: "shell",
      variable: "x",
      bounds: [input.a, input.b],
      integrandLatex,
      fullIntegralLatex,
      evaluatedLatex,
    },
    outerRadiusDesc,
    innerRadiusDesc,
    outerRadiusLatex,
    innerRadiusLatex,
    aiExplanation: generateAIExplanation(
      input,
      "shell",
      outerRadiusDesc,
      innerRadiusDesc,
      volume,
      warning
    ),
    warning,
    graphMeta: {
      axisLabel: "y 轴 (x = 0)",
      axisValue: 0,
      methodLabel: "柱壳法",
    },
  };
}

function computeShellVerticalAxis(
  input: RevolveInput,
  f: (x: number) => number,
  g: (x: number) => number,
  axis: VerticalAxis,
  warning?: string
): VolumeResult {
  const k = axis.k;
  const integrand = (x: number) => {
    const height = Math.abs(f(x) - g(x));
    return 2 * Math.PI * Math.abs(x - k) * height;
  };

  const volume = integrateSimpson(integrand, input.a, input.b);

  const outerRadiusDesc = `从旋转轴 ${axis.label} 到切片的水平距离（半径 = |x − ${k}|）`;
  const innerRadiusDesc = "柱壳法每个切片只需一个半径，不设内半径";

  const outerRadiusLatex = `p(x) = |x - ${k}|`;
  const innerRadiusLatex = "h(x) = |f(x) - g(x)|";

  const fDisp = formatExprForDisplay(input.fExpr);
  const gDisp = formatExprForDisplay(input.gExpr);

  const integrandLatex = `2\\pi \\cdot |x-${k}| \\cdot |f(x)-g(x)|`;
  const fullIntegralLatex = `V = 2\\pi\\int_{${input.a}}^{${input.b}} |x-${k}|\\,\\bigl|f(x)-g(x)\\bigr|\\,dx`;
  const evaluatedLatex = `V \\approx ${formatNumber(volume)}`;

  const steps = buildSteps({
    input,
    method: "shell",
    outerRadiusDesc,
    innerRadiusDesc,
    integrandLatex,
    fullIntegralLatex,
    evaluatedLatex,
    fDisp,
    gDisp,
    volume,
    axisExtra: axis.label,
    shellHeight: "|f(x) − g(x)|",
    shellRadius: `|x − ${k}|`,
  });

  return {
    kind: "revolution",
    volume,
    method: "shell",
    steps,
    integral: {
      method: "shell",
      variable: "x",
      bounds: [input.a, input.b],
      integrandLatex,
      fullIntegralLatex,
      evaluatedLatex,
    },
    outerRadiusDesc,
    innerRadiusDesc,
    outerRadiusLatex,
    innerRadiusLatex,
    aiExplanation: generateAIExplanation(
      input,
      "shell",
      outerRadiusDesc,
      innerRadiusDesc,
      volume,
      warning,
      axis.label
    ),
    warning,
    graphMeta: {
      axisLabel: axis.label,
      axisValue: k,
      methodLabel: "柱壳法",
    },
  };
}
