import { create, all, type MathNode } from "mathjs";
import type { AxisMode, RevolveInput } from "@/types/revolve";
import type { EvalFn } from "./mathParser";
import { formatExprForDisplay, normalizeExpr, parseFunction } from "./mathParser";

const math = create(all, {});

export interface HorizontalAxis {
  kind: "horizontal";
  label: string;
  h: EvalFn;
}

export interface VerticalAxis {
  kind: "vertical";
  label: string;
  k: number;
}

export type RevolutionAxis = HorizontalAxis | VerticalAxis;

function nodeUsesSymbol(node: MathNode, symbol: string): boolean {
  let found = false;
  node.traverse((n) => {
    if (found) return;
    if (math.isSymbolNode(n) && n.name === symbol) found = true;
  });
  return found;
}

function exprUsesSymbol(expr: string, symbol: string): boolean {
  try {
    return nodeUsesSymbol(math.parse(normalizeExpr(expr)), symbol);
  } catch {
    return false;
  }
}

function parseVerticalConstant(rhs: string): number {
  const normalized = normalizeExpr(rhs);
  try {
    const node = math.parse(normalized);
    if (nodeUsesSymbol(node, "x") || nodeUsesSymbol(node, "y")) {
      throw new Error("当前仅支持 x = 常数 的垂直旋转轴，例如 x = -3。");
    }
    const value = node.compile().evaluate({});
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`无法将 "${rhs}" 解析为常数。`);
    }
    return value;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error(`无法解析垂直轴方程 x = ${rhs}。`);
  }
}

export function parseCustomAxisEquation(raw: string): RevolutionAxis {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("请输入旋转轴方程。");
  }

  const match = trimmed.match(/^\s*(y|x)\s*=\s*(.+)$/i);
  if (!match) {
    throw new Error(
      "请使用 y = ... 或 x = ... 格式，例如 y = 2、y = x、y = sin(x)、x = -3。"
    );
  }

  const side = match[1].toLowerCase();
  const rhs = match[2].trim();

  if (side === "y") {
    if (exprUsesSymbol(rhs, "y")) {
      throw new Error("水平旋转轴请写成 y = f(x) 的形式，右侧只含 x。");
    }
    const h = parseFunction(rhs);
    const label = `y = ${formatExprForDisplay(rhs)}`;
    return { kind: "horizontal", label, h };
  }

  const k = parseVerticalConstant(rhs);
  return { kind: "vertical", label: `x = ${formatExprForDisplay(rhs)}`, k };
}

export function resolveRevolutionAxis(input: RevolveInput): RevolutionAxis {
  switch (input.axisMode) {
    case "x-axis":
      return { kind: "horizontal", label: "x 轴 (y = 0)", h: () => 0 };
    case "y=k": {
      const k = input.k!;
      return {
        kind: "horizontal",
        label: `y = ${k}`,
        h: () => k,
      };
    }
    case "custom":
      if (!input.customAxisExpr?.trim()) {
        throw new Error("请输入自定义旋转轴方程。");
      }
      return parseCustomAxisEquation(input.customAxisExpr);
    case "y-axis":
      return { kind: "vertical", label: "y 轴 (x = 0)", k: 0 };
    case "x=k":
      return { kind: "vertical", label: `x = ${input.k!}`, k: input.k! };
    default:
      throw new Error("不支持的旋转轴类型。");
  }
}

export function validateRevolutionAxisInput(input: RevolveInput): void {
  if (input.a >= input.b) {
    throw new Error("下限 a 必须小于上限 b（a < b）。");
  }

  if (
    (input.axisMode === "y=k" || input.axisMode === "x=k") &&
    (input.k === undefined || Number.isNaN(input.k))
  ) {
    throw new Error("请为旋转轴输入 k 的值。");
  }

  const axis = resolveRevolutionAxis(input);
  const sampleCount = 24;
  const step = (input.b - input.a) / sampleCount;
  for (let i = 0; i <= sampleCount; i++) {
    const x = input.a + i * step;
    if (axis.kind === "horizontal") axis.h(x);
  }
}

export function axisModeUsesCustomK(mode: AxisMode): boolean {
  return mode === "y=k" || mode === "x=k";
}
