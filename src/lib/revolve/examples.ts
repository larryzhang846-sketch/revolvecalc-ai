import type { ExampleProblem } from "@/types/revolve";

export const REVOLUTION_EXAMPLES: ExampleProblem[] = [
  {
    id: "ex1",
    label: "抛物线与水平线",
    fExpr: "4",
    gExpr: "x^2",
    a: 0,
    b: 2,
    mode: "revolution",
    axisMode: "x-axis",
  },
  {
    id: "ex2",
    label: "直线 y = x 围成的三角形",
    fExpr: "x",
    gExpr: "0",
    a: 0,
    b: 3,
    mode: "revolution",
    axisMode: "x-axis",
  },
  {
    id: "ex3",
    label: "根号曲线绕 y 轴",
    fExpr: "sqrt(x)",
    gExpr: "0",
    a: 0,
    b: 4,
    mode: "revolution",
    axisMode: "y-axis",
  },
];

/** @deprecated use REVOLUTION_EXAMPLES */
export const EXAMPLE_PROBLEMS = REVOLUTION_EXAMPLES;
