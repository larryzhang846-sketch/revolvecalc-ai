import type { EvalFn } from "./mathParser";
import { washerRadiiHorizontal, washerRadiiXAxis } from "./radii";
import type { RevolutionAxis } from "./axisParser";

export type RevolutionMeshMethod = "washer" | "shell";

export interface RegionSample {
  topY: number;
  bottomY: number;
  height: number;
}

export interface HorizontalBoundary {
  yOuter: number;
  yInner: number;
  outerRadius: number;
  innerRadius: number;
  hasHole: boolean;
}

export interface VerticalBoundary {
  topY: number;
  bottomY: number;
  height: number;
  shellRadius: number;
}

export interface RevolutionRegionAnalysis {
  method: RevolutionMeshMethod;
  intersections: number[];
  warnings: string[];
  /** height varies along interval (shell / region not constant) */
  heightVaries: boolean;
  minHeight: number;
  maxHeight: number;
}

/** At every x: top = max(f,g), bottom = min(f,g), height = top - bottom */
export function sampleRegionAt(x: number, f: EvalFn, g: EvalFn): RegionSample | null {
  let fv: number;
  let gv: number;
  try {
    fv = f(x);
    gv = g(x);
  } catch {
    return null;
  }
  if (!Number.isFinite(fv) || !Number.isFinite(gv)) return null;
  const topY = Math.max(fv, gv);
  const bottomY = Math.min(fv, gv);
  return { topY, bottomY, height: topY - bottomY };
}

/** Find interior intersection x-values where f(x) = g(x) */
export function findFunctionIntersections(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  steps = 240
): number[] {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const roots: number[] = [];
  let prevX = lo;
  let prevDiff = diffAt(prevX, f, g);
  if (prevDiff === null) return roots;

  for (let i = 1; i <= steps; i++) {
    const x = lo + (i / steps) * (hi - lo);
    const diff = diffAt(x, f, g);
    if (diff === null) {
      prevX = x;
      prevDiff = null;
      continue;
    }
    if (prevDiff !== null && prevDiff * diff <= 0 && Math.abs(diff - prevDiff) > 1e-14) {
      const root = bisectRoot(f, g, prevX, x);
      if (root !== null) {
        const dup = roots.some((r) => Math.abs(r - root) < (hi - lo) * 0.02);
        if (!dup) roots.push(root);
      }
    }
    prevX = x;
    prevDiff = diff;
  }
  return roots.sort((u, v) => u - v);
}

function diffAt(x: number, f: EvalFn, g: EvalFn): number | null {
  try {
    const fv = f(x);
    const gv = g(x);
    if (!Number.isFinite(fv) || !Number.isFinite(gv)) return null;
    return fv - gv;
  } catch {
    return null;
  }
}

function bisectRoot(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  iterations = 48
): number | null {
  let lo = a;
  let hi = b;
  let flo = diffAt(lo, f, g);
  let fhi = diffAt(hi, f, g);
  if (flo === null || fhi === null) return null;
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if (flo * fhi > 0) return null;

  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    const fm = diffAt(mid, f, g);
    if (fm === null) return null;
    if (Math.abs(fm) < 1e-10 || hi - lo < 1e-10) return mid;
    if (flo * fm <= 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

function isXAxisHorizontal(
  axis: Extract<RevolutionAxis, { kind: "horizontal" }>,
  a: number,
  b: number
): boolean {
  const ha = axis.h(a);
  const hb = axis.h(b);
  return Math.abs(ha) < 1e-10 && Math.abs(hb) < 1e-10 && Math.abs(ha - hb) < 1e-10;
}

/** Washer boundaries: distances from horizontal axis y = h(x) or y = k */
export function horizontalBoundaryAt(
  x: number,
  f: EvalFn,
  g: EvalFn,
  axis: Extract<RevolutionAxis, { kind: "horizontal" }>,
  a: number,
  b: number
): HorizontalBoundary | null {
  const region = sampleRegionAt(x, f, g);
  if (!region) return null;

  const fv = f(x);
  const gv = g(x);
  const h = axis.h(x);
  const useXAxis = isXAxisHorizontal(axis, a, b);
  const { R, r } = useXAxis
    ? washerRadiiXAxis(fv, gv)
    : washerRadiiHorizontal(fv, gv, h);

  const dF = Math.abs(fv - h);
  const dG = Math.abs(gv - h);
  const yOuter = dF >= dG ? fv : gv;
  const yInner = dF >= dG ? gv : fv;

  return {
    yOuter,
    yInner,
    outerRadius: R,
    innerRadius: r,
    hasHole: r > 1e-6,
  };
}

/** Shell boundaries: radius = |x − k|, height = top − bottom */
export function verticalBoundaryAt(
  x: number,
  f: EvalFn,
  g: EvalFn,
  axis: Extract<RevolutionAxis, { kind: "vertical" }>
): VerticalBoundary | null {
  const region = sampleRegionAt(x, f, g);
  if (!region) return null;
  return {
    topY: region.topY,
    bottomY: region.bottomY,
    height: region.height,
    shellRadius: Math.abs(x - axis.k),
  };
}

export function resolveRevolutionMeshMethod(
  axis: RevolutionAxis
): RevolutionMeshMethod {
  return axis.kind === "vertical" ? "shell" : "washer";
}

export function analyzeRevolutionRegion(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis
): RevolutionRegionAnalysis {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const method = resolveRevolutionMeshMethod(axis);
  const intersections = findFunctionIntersections(f, g, lo, hi);
  const warnings: string[] = [];

  const samples = 48;
  let valid = 0;
  let minHeight = Infinity;
  let maxHeight = 0;
  let nanCount = 0;

  for (let i = 0; i <= samples; i++) {
    const x = lo + (i / samples) * (hi - lo);
    const region = sampleRegionAt(x, f, g);
    if (!region) {
      nanCount++;
      continue;
    }
    valid++;
    minHeight = Math.min(minHeight, region.height);
    maxHeight = Math.max(maxHeight, region.height);
  }

  if (valid === 0) {
    warnings.push("在区间 [a, b] 上无法有效采样 f(x) 与 g(x)，无法生成可靠的三维模型。");
  } else if (nanCount > 0) {
    warnings.push("部分 x 值处 f(x) 或 g(x) 无效；模型仅基于有效采样点生成。");
  }

  if (valid > 0 && maxHeight < 1e-8) {
    warnings.push("f(x) 与 g(x) 在区间内几乎重合，区域高度接近 0。");
  }

  if (intersections.length > 0) {
    warnings.push(
      `f(x) 与 g(x) 在区间内相交（约 x ≈ ${intersections.map((r) => r.toFixed(3)).join("、")}）；已自动在每一 x 处取 max/min 确定上下边界。`
    );
  }

  const heightVaries = valid > 1 && maxHeight - minHeight > 1e-6 * Math.max(maxHeight, 1);

  if (method === "shell" && valid > 0 && !heightVaries) {
    warnings.push(
      "区域高度沿 x 几乎不变；绕垂直轴的柱壳高度为常数（可能呈现圆柱形外观）。"
    );
  }

  return {
    method,
    intersections,
    warnings,
    heightVaries,
    minHeight: valid > 0 ? minHeight : 0,
    maxHeight: valid > 0 ? maxHeight : 0,
  };
}
