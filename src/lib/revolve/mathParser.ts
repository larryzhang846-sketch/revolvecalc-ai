import { create, all, type MathNode } from "mathjs";

const math = create(all, {});

export type EvalFn = (x: number) => number;

export function normalizeExpr(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, "")
    .replace(/(\d)([a-zA-Z(])/g, "$1*$2")
    .replace(/\^/g, "^");
}

export function parseFunction(expr: string): EvalFn {
  const normalized = normalizeExpr(expr);
  let node: MathNode;
  try {
    node = math.parse(normalized);
  } catch {
    throw new Error(`无法解析 "${expr}"，请尝试 x^2、sqrt(x)、sin(x) 等形式。`);
  }

  const compiled = node.compile();

  return (x: number) => {
    const value = compiled.evaluate({ x });
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`在 x = ${x} 处函数值不是实数，请检查表达式。`);
    }
    return value;
  };
}

export function formatExprForDisplay(expr: string): string {
  return expr.trim().replace(/\*/g, "");
}
