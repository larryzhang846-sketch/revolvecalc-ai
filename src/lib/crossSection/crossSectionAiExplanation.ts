import type { CrossSectionInput } from "@/types/revolve";
import type { ShapeFormula } from "./areaFormulas";
import { formatExprForDisplay } from "@/lib/revolve/mathParser";

export function generateCrossSectionAIExplanation(
  input: CrossSectionInput,
  formula: ShapeFormula,
  volume: number,
  warning?: string
): string {
  const f = formatExprForDisplay(input.fExpr);
  const g = formatExprForDisplay(input.gExpr);

  const intro = `在 x = ${input.a} 到 x = ${input.b} 上，f(x) = ${f} 与 g(x) = ${g} 之间的区域上，垂直于 x 轴放置 ${formula.label} 截面。`;

  const base = `每个截面的底边长度为 base(x) = |f(x) − g(x)|。`;

  const area = formula.coeffDescription;

  const result = `对 A(x) 从 ${input.a} 到 ${input.b} 积分后，体积约为 ${volume.toFixed(4)} 立方单位。`;

  const tip =
    "这与旋转体不同：截面只是“站在”底边区域上，并不绕任何轴旋转。";

  const warn = warning ? ` ${warning}` : "";

  return `${intro} ${base} ${area} ${result} ${tip}${warn}`;
}
