import type { CrossSectionShape } from "@/types/revolve";

export interface ShapeFormula {
  label: string;
  areaFn: (base: number, rectangleK: number) => number;
  areaLatex: string;
  integrandLatex: string;
  coeffDescription: string;
}

const SQRT3_4 = Math.sqrt(3) / 4;
const PI_8 = Math.PI / 8;

export function getShapeFormula(
  shape: CrossSectionShape,
  rectangleK = 1
): ShapeFormula {
  switch (shape) {
    case "square":
      return {
        label: "正方形",
        areaFn: (base) => base * base,
        areaLatex: "A(x) = \\bigl|f(x)-g(x)\\bigr|^2 = \\text{base}(x)^2",
        integrandLatex: "\\text{base}(x)^2",
        coeffDescription: "截面为正方形，边长等于底边长度 base(x)。",
      };
    case "semicircle":
      return {
        label: "半圆",
        areaFn: (base) => PI_8 * base * base,
        areaLatex:
          "A(x) = \\frac{1}{2}\\pi\\left(\\frac{\\text{base}(x)}{2}\\right)^2 = \\frac{\\pi}{8}\\,\\text{base}(x)^2",
        integrandLatex: "\\frac{\\pi}{8}\\,\\text{base}(x)^2",
        coeffDescription:
          "截面为半圆，直径等于 base(x)，半径为 base(x)/2。",
      };
    case "equilateral":
      return {
        label: "等边三角形",
        areaFn: (base) => SQRT3_4 * base * base,
        areaLatex:
          "A(x) = \\frac{\\sqrt{3}}{4}\\,\\text{base}(x)^2",
        integrandLatex: "\\frac{\\sqrt{3}}{4}\\,\\text{base}(x)^2",
        coeffDescription:
          "截面为等边三角形，边长等于 base(x)。",
      };
    case "rectangle":
      return {
        label: "矩形",
        areaFn: (base, k) => k * base * base,
        areaLatex: `A(x) = ${rectangleK}\\,\\text{base}(x)^2`,
        integrandLatex: `${rectangleK}\\,\\text{base}(x)^2`,
        coeffDescription: `截面为矩形，底边为 base(x)，高为 ${rectangleK}·base(x)。`,
      };
  }
}
