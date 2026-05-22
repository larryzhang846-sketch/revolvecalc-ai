import type { RevolveInput } from "@/types/revolve";
import { resolveRevolutionAxis } from "./axisParser";
import { formatExprForDisplay } from "./mathParser";
import { formatNumber } from "./integration";

export function generateSurfaceAreaExplanation(
  input: RevolveInput,
  fDisp: string,
  gDisp: string,
  totalArea: number
): string {
  const interval = `x = ${input.a} 到 x = ${input.b}`;
  const axis = resolveRevolutionAxis(input);
  const axisPhrase = axis.kind === "horizontal" ? axis.label : "旋转轴";

  const radiusNote =
    axis.kind === "horizontal"
      ? `每条曲线到旋转轴 ${axis.label} 在 x 处的距离 |y − (${axis.label})| 作为旋转半径`
      : "每条曲线到旋转轴的距离作为旋转半径";

  return (
    `在 ${interval} 上，将 f(x) = ${fDisp} 与 g(x) = ${gDisp} 分别视为两条边界曲线，` +
    `绕${axisPhrase}旋转。表面积公式 S = 2π ∫ R(x)√(1 + (dy/dx)²) dx 中，${radiusNote}。` +
    `对 f 与 g 各自建立积分后相加（不是对区域边界做差），总表面积约为 ${formatNumber(totalArea)} 平方单位。` +
    ` √(1 + (dy/dx)²) 来自弧长元素，表示沿曲线旋转时母线长度的贡献。`
  );
}
