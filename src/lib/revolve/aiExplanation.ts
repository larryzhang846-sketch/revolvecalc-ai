import type { RevolveInput, VolumeMethod } from "@/types/revolve";
import { formatExprForDisplay } from "./mathParser";

export function generateAIExplanation(
  input: RevolveInput,
  method: VolumeMethod,
  outerDesc: string,
  innerDesc: string,
  volume: number,
  warning?: string,
  axisLabel?: string
): string {
  const f = formatExprForDisplay(input.fExpr);
  const g = formatExprForDisplay(input.gExpr);
  const interval = `x = ${input.a} 到 x = ${input.b}`;

  let axisPhrase = axisLabel ?? "";
  if (!axisPhrase) {
    switch (input.axisMode) {
      case "x-axis":
        axisPhrase = "x 轴";
        break;
      case "y-axis":
        axisPhrase = "y 轴";
        break;
      case "y=k":
        axisPhrase = `水平线 y = ${input.k}`;
        break;
      case "x=k":
        axisPhrase = `垂直线 x = ${input.k}`;
        break;
      case "custom":
        axisPhrase = input.customAxisExpr?.trim() || "自定义旋转轴";
        break;
    }
  }

  const methodName = method === "washer" ? "垫圈" : "柱壳";
  const methodDetail =
    method === "washer"
      ? `外半径${outerDesc}，内半径${innerDesc}。将两半径平方后相减，再对 x 积分并乘以 π。`
      : `每个柱壳的半径等于切片到旋转轴的水平距离，高度等于两曲线之间的竖直距离。用 2π × 半径 × 高度 对 x 积分。`;

  const intro = `在 ${interval} 上，f(x) = ${f} 与 g(x) = ${g} 之间的区域绕${axisPhrase}旋转，因此使用${methodName}法。`;

  const body = `${methodDetail} 建立定积分并求值后，旋转体体积约为 ${volume.toFixed(4)} 立方单位。`;

  const tip =
    method === "washer"
      ? "可以想象垂直于旋转轴的一叠垫圈——每个截面像带孔的圆盘。"
      : "可以想象绕轴套在一起的圆柱壳——绕竖直轴旋转时这往往更直观。";

  const warn = warning ? ` 提示：${warning}` : "";

  return `${intro} ${body} ${tip}${warn}`;
}
