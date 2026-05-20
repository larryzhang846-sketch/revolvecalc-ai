import type { ExampleProblem } from "@/types/revolve";

export const CROSS_SECTION_EXAMPLES: ExampleProblem[] = [
  {
    id: "cs1",
    label: "抛物线区域 · 正方形截面",
    fExpr: "4",
    gExpr: "x^2",
    a: 0,
    b: 2,
    mode: "cross-section",
    crossShape: "square",
  },
  {
    id: "cs2",
    label: "三角形区域 · 半圆截面",
    fExpr: "x",
    gExpr: "0",
    a: 0,
    b: 3,
    mode: "cross-section",
    crossShape: "semicircle",
  },
  {
    id: "cs3",
    label: "根号曲线 · 等边三角形截面",
    fExpr: "sqrt(x)",
    gExpr: "0",
    a: 0,
    b: 4,
    mode: "cross-section",
    crossShape: "equilateral",
  },
];
