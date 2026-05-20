import type { RevolveInput, SolutionStep, VolumeMethod } from "@/types/revolve";
import { formatNumber } from "./integration";

interface StepContext {
  input: RevolveInput;
  method: VolumeMethod;
  outerRadiusDesc: string;
  innerRadiusDesc: string;
  integrandLatex: string;
  fullIntegralLatex: string;
  evaluatedLatex: string;
  fDisp: string;
  gDisp: string;
  volume: number;
  axisExtra?: string;
  shellRadius?: string;
  shellHeight?: string;
}

function axisDescription(input: RevolveInput, axisExtra?: string): string {
  if (axisExtra) return axisExtra;
  switch (input.axisMode) {
    case "x-axis":
      return "x 轴（y = 0）";
    case "y-axis":
      return "y 轴（x = 0）";
    case "y=k":
      return `水平线 y = ${input.k}`;
    case "x=k":
      return `垂直线 x = ${input.k}`;
  }
}

function methodReason(method: VolumeMethod, axisMode: RevolveInput["axisMode"]): string {
  if (method === "washer") {
    if (axisMode === "x-axis" || axisMode === "y=k") {
      return "旋转轴是水平的，垂直于 x 轴的截面形成垫圈（圆环），因此对 x 积分。";
    }
    return "使用垫圈法，半径垂直于水平旋转轴测量。";
  }

  if (axisMode === "y-axis" || axisMode === "x=k") {
    return "旋转轴是竖直的，使用平行于 y 方向的圆柱壳较为方便，因此对 x 积分。";
  }
  return "旋转轴为竖直线，采用柱壳法。";
}

export function buildSteps(ctx: StepContext): SolutionStep[] {
  const { input, method } = ctx;
  const axis = axisDescription(input, ctx.axisExtra);
  const methodName = method === "washer" ? "垫圈" : "柱壳";

  const radiusStep =
    method === "washer"
      ? {
          title: "确定外半径与内半径",
          body: `在每一截面 x 处，外半径 R(x) 为${ctx.outerRadiusDesc}；内半径 r(x) 为${ctx.innerRadiusDesc}。垫圈体积为 π(R² − r²) Δx 的叠加。`,
          latex: "V = \\pi\\int_a^b \\left[R(x)^2 - r(x)^2\\right] dx",
        }
      : {
          title: "确定柱壳半径与高度",
          body: `在 x 处的竖直柱壳，半径 p(x) = ${ctx.shellRadius ?? "|x|"}，高度 h(x) = ${ctx.shellHeight ?? "|f(x) − g(x)|"}。柱壳体积约为 2π · 半径 · 高度 · Δx。`,
          latex: "V = 2\\pi\\int_a^b p(x)\\,h(x)\\,dx",
        };

  return [
    {
      number: 1,
      title: "确定两条曲线",
      body: `上、下（或外、内）边界为 f(x) = ${ctx.fDisp} 与 g(x) = ${ctx.gDisp}。在区间内的每个 x，区域介于这两条曲线的 y 值之间。`,
      latex: `f(x) = ${ctx.fDisp},\\quad g(x) = ${ctx.gDisp}`,
    },
    {
      number: 2,
      title: "确定积分区间",
      body: `仅将 x = ${input.a} 到 x = ${input.b} 之间的区域绕轴旋转。所有半径或柱壳高度均来自该 x 区间。`,
      latex: `${input.a} \\le x \\le ${input.b}`,
    },
    {
      number: 3,
      title: "确定旋转轴",
      body: `区域绕${axis}旋转。每个半径（或柱壳到轴的距离）都相对于该轴测量。`,
    },
    {
      number: 4,
      title: `选择${methodName}法`,
      body: methodReason(method, input.axisMode),
    },
    {
      number: 5,
      ...radiusStep,
    },
    {
      number: 6,
      title: "建立定积分",
      body: `将半径（或柱壳的半径与高度）代入${methodName}法公式，并使用第 2 步的积分上下限。`,
      latex: ctx.fullIntegralLatex,
    },
    {
      number: 7,
      title: "计算积分",
      body: `在区间 [${input.a}, ${input.b}] 上使用数值积分（辛普森法则）求值，这在原函数较复杂时很常见。`,
      latex: ctx.evaluatedLatex,
    },
    {
      number: 8,
      title: "最终体积",
      body: `旋转体的体积约为 ${formatNumber(ctx.volume)} 立方单位。`,
      latex: `V \\approx ${formatNumber(ctx.volume)}`,
    },
  ];
}
