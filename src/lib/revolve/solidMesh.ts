import * as THREE from "three";
import type { RevolutionAxis } from "./axisParser";
import type { EvalFn } from "./mathParser";
import {
  analyzeRevolutionRegion,
  horizontalBoundaryAt,
  resolveRevolutionMeshMethod,
  sampleRegionAt,
  verticalBoundaryAt,
  type RevolutionMeshMethod,
} from "./revolutionRegion";

export type { RevolutionMeshMethod, RevolutionRegionAnalysis } from "./revolutionRegion";
export {
  analyzeRevolutionRegion,
  findFunctionIntersections,
  sampleRegionAt,
} from "./revolutionRegion";

export type SolidViewMode = "solid" | "transparent" | "cutaway";

export interface SolidMeshBuildOptions {
  method?: RevolutionMeshMethod;
  thetaSpan?: number;
  segmentsX?: number;
  segmentsTheta?: number;
}

export interface RevolutionMeshResult {
  solid: THREE.BufferGeometry | null;
  sliceOverlay: THREE.BufferGeometry | null;
  analysis: ReturnType<typeof analyzeRevolutionRegion>;
}

const SMOOTH_SEG_X = 80;
const SMOOTH_SEG_THETA = 72;
const SLICE_COUNT = 10;
const SLICE_SEG_THETA = 28;
const CUTAWAY_THETA = Math.PI * 1.55;

function mapPoint(
  x: number,
  y: number,
  theta: number,
  axis: RevolutionAxis
): THREE.Vector3 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);

  if (axis.kind === "horizontal") {
    const hx = axis.h(x);
    const dy = y - hx;
    return new THREE.Vector3(x, hx + dy * c, dy * s);
  }

  const dx = x - axis.k;
  return new THREE.Vector3(axis.k + dx * c, y, dx * s);
}

function finalizeGeometry(
  positions: number[],
  indices: number[]
): THREE.BufferGeometry {
  if (indices.length === 0) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0], 3)
    );
    return geometry;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function pushVerticalCurveSurface(
  positions: number[],
  indices: number[],
  yAtX: (x: number) => number,
  a: number,
  b: number,
  axis: Extract<RevolutionAxis, { kind: "vertical" }>,
  theta0: number,
  theta1: number,
  segmentsX: number,
  segmentsTheta: number,
  flipNormals = false
) {
  const grid: number[][] = [];
  const onAxisEps = 1e-6;

  for (let i = 0; i <= segmentsX; i++) {
    const x = a + (i / segmentsX) * (b - a);
    let y: number;
    try {
      y = yAtX(x);
    } catch {
      continue;
    }
    if (!Number.isFinite(y)) continue;

    const onAxis = Math.abs(x - axis.k) < onAxisEps;
    if (onAxis) {
      const p = mapPoint(x, y, 0, axis);
      grid.push([positions.length / 3]);
      positions.push(p.x, p.y, p.z);
      continue;
    }

    const row: number[] = [];
    for (let j = 0; j <= segmentsTheta; j++) {
      const theta = theta0 + (j / segmentsTheta) * (theta1 - theta0);
      const p = mapPoint(x, y, theta, axis);
      row.push(positions.length / 3);
      positions.push(p.x, p.y, p.z);
    }
    grid.push(row);
  }

  for (let i = 0; i < grid.length - 1; i++) {
    const rowA = grid[i];
    const rowB = grid[i + 1];

    const aIsAxis = rowA.length === 1;
    const bIsAxis = rowB.length === 1;

    if (aIsAxis && !bIsAxis) {
      const center = rowA[0];
      for (let j = 0; j < rowB.length - 1; j++) {
        if (flipNormals) {
          indices.push(center, rowB[j + 1], rowB[j]);
        } else {
          indices.push(center, rowB[j], rowB[j + 1]);
        }
      }
      continue;
    }

    if (!aIsAxis && bIsAxis) {
      const center = rowB[0];
      for (let j = 0; j < rowA.length - 1; j++) {
        if (flipNormals) {
          indices.push(rowA[j], rowA[j + 1], center);
        } else {
          indices.push(rowA[j], center, rowA[j + 1]);
        }
      }
      continue;
    }

    if (aIsAxis || bIsAxis) continue;

    for (let j = 0; j < segmentsTheta; j++) {
      const i0 = rowA[j];
      const i1 = rowA[j + 1];
      const i2 = rowB[j];
      const i3 = rowB[j + 1];
      if (flipNormals) {
        indices.push(i0, i1, i2, i1, i3, i2);
      } else {
        indices.push(i0, i2, i1, i1, i2, i3);
      }
    }
  }
}

/** Revolve y = yAtX(x) around the axis (washer outer/inner surfaces). */
function pushCurveSurface(
  positions: number[],
  indices: number[],
  yAtX: (x: number) => number,
  a: number,
  b: number,
  axis: RevolutionAxis,
  theta0: number,
  theta1: number,
  segmentsX: number,
  segmentsTheta: number,
  flipNormals = false
) {
  const grid: number[][] = [];

  for (let i = 0; i <= segmentsX; i++) {
    const x = a + (i / segmentsX) * (b - a);
    let y: number;
    try {
      y = yAtX(x);
    } catch {
      continue;
    }
    if (!Number.isFinite(y)) continue;

    const row: number[] = [];
    for (let j = 0; j <= segmentsTheta; j++) {
      const theta = theta0 + (j / segmentsTheta) * (theta1 - theta0);
      const p = mapPoint(x, y, theta, axis);
      row.push(positions.length / 3);
      positions.push(p.x, p.y, p.z);
    }
    if (row.length === segmentsTheta + 1) grid.push(row);
  }

  for (let i = 0; i < grid.length - 1; i++) {
    for (let j = 0; j < segmentsTheta; j++) {
      const i0 = grid[i][j];
      const i1 = grid[i][j + 1];
      const i2 = grid[i + 1][j];
      const i3 = grid[i + 1][j + 1];
      if (flipNormals) {
        indices.push(i0, i1, i2, i1, i3, i2);
      } else {
        indices.push(i0, i2, i1, i1, i2, i3);
      }
    }
  }
}

/** Annular end cap at fixed x (washer end faces). */
function pushAnnularCap(
  positions: number[],
  indices: number[],
  x: number,
  yOuter: number,
  yInner: number,
  hasHole: boolean,
  axis: RevolutionAxis,
  theta0: number,
  theta1: number,
  segmentsTheta: number
) {
  const h =
    axis.kind === "horizontal" ? axis.h(x) : (yOuter + yInner) / 2;
  const axisPt = mapPoint(x, h, 0, axis);
  const axisIdx = positions.length / 3;
  positions.push(axisPt.x, axisPt.y, axisPt.z);

  const outerRing: number[] = [];
  const innerRing: number[] = [];

  for (let j = 0; j <= segmentsTheta; j++) {
    const theta = theta0 + (j / segmentsTheta) * (theta1 - theta0);
    const po = mapPoint(x, yOuter, theta, axis);
    outerRing.push(positions.length / 3);
    positions.push(po.x, po.y, po.z);
    if (hasHole) {
      const pi = mapPoint(x, yInner, theta, axis);
      innerRing.push(positions.length / 3);
      positions.push(pi.x, pi.y, pi.z);
    }
  }

  if (hasHole) {
    for (let j = 0; j < segmentsTheta; j++) {
      indices.push(
        outerRing[j],
        outerRing[j + 1],
        innerRing[j],
        innerRing[j + 1],
        innerRing[j],
        outerRing[j + 1]
      );
    }
  } else {
    for (let j = 0; j < segmentsTheta; j++) {
      indices.push(axisIdx, outerRing[j], outerRing[j + 1]);
    }
  }
}

/** Vertical strip at fixed x from bottomY to topY, swept through theta (shell side wall / end face) */
function pushVerticalStripWall(
  positions: number[],
  indices: number[],
  x: number,
  bottomY: number,
  topY: number,
  axis: RevolutionAxis,
  theta0: number,
  theta1: number,
  segmentsY: number,
  segmentsTheta: number
) {
  if (topY - bottomY < 1e-10) return;

  const grid: number[][] = [];
  for (let j = 0; j <= segmentsY; j++) {
    const y = bottomY + (j / segmentsY) * (topY - bottomY);
    const row: number[] = [];
    for (let t = 0; t <= segmentsTheta; t++) {
      const theta = theta0 + (t / segmentsTheta) * (theta1 - theta0);
      const p = mapPoint(x, y, theta, axis);
      row.push(positions.length / 3);
      positions.push(p.x, p.y, p.z);
    }
    grid.push(row);
  }

  for (let j = 0; j < segmentsY; j++) {
    for (let t = 0; t < segmentsTheta; t++) {
      const a = grid[j][t];
      const b = grid[j][t + 1];
      const c = grid[j + 1][t];
      const d = grid[j + 1][t + 1];
      indices.push(a, c, b, b, c, d);
    }
  }
}

function xBoundaryWalls(a: number, b: number, k: number): number[] {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const eps = 1e-8;
  const walls: number[] = [];
  if (Math.abs(lo - k) > eps) walls.push(lo);
  if (Math.abs(hi - k) > eps && Math.abs(hi - lo) > eps) walls.push(hi);
  return walls;
}

function buildHorizontalWasherSolid(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: Extract<RevolutionAxis, { kind: "horizontal" }>,
  theta0: number,
  theta1: number,
  segmentsX: number,
  segmentsTheta: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  const yOuterFn = (x: number) => {
    const bnd = horizontalBoundaryAt(x, f, g, axis, a, b);
    if (!bnd) throw new Error("invalid");
    return bnd.yOuter;
  };
  const yInnerFn = (x: number) => {
    const bnd = horizontalBoundaryAt(x, f, g, axis, a, b);
    if (!bnd) throw new Error("invalid");
    return bnd.yInner;
  };

  pushCurveSurface(
    positions,
    indices,
    yOuterFn,
    a,
    b,
    axis,
    theta0,
    theta1,
    segmentsX,
    segmentsTheta
  );

  let hasInner = false;
  for (let i = 0; i <= 20; i++) {
    const x = a + (i / 20) * (b - a);
    const bnd = horizontalBoundaryAt(x, f, g, axis, a, b);
    if (bnd?.hasHole) {
      hasInner = true;
      break;
    }
  }

  if (hasInner) {
    pushCurveSurface(
      positions,
      indices,
      yInnerFn,
      a,
      b,
      axis,
      theta0,
      theta1,
      segmentsX,
      segmentsTheta,
      true
    );
  }

  for (const xCap of [a, b]) {
    const bnd = horizontalBoundaryAt(xCap, f, g, axis, a, b);
    if (!bnd) continue;
    pushAnnularCap(
      positions,
      indices,
      xCap,
      bnd.yOuter,
      bnd.yInner,
      bnd.hasHole,
      axis,
      theta0,
      theta1,
      segmentsTheta
    );
  }

  return finalizeGeometry(positions, indices);
}

/**
 * Vertical axis: closed solid from region between topY(x) and bottomY(x),
 * plus side walls at x=a / x=b. Axis-adjacent boundary is welded to the rotation axis.
 */
function buildVerticalShellSolid(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: Extract<RevolutionAxis, { kind: "vertical" }>,
  theta0: number,
  theta1: number,
  segmentsX: number,
  segmentsTheta: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);

  const topFn = (x: number) => {
    const r = sampleRegionAt(x, f, g);
    if (!r) throw new Error("invalid");
    return r.topY;
  };
  const bottomFn = (x: number) => {
    const r = sampleRegionAt(x, f, g);
    if (!r) throw new Error("invalid");
    return r.bottomY;
  };

  pushVerticalCurveSurface(
    positions,
    indices,
    topFn,
    lo,
    hi,
    axis,
    theta0,
    theta1,
    segmentsX,
    segmentsTheta
  );

  pushVerticalCurveSurface(
    positions,
    indices,
    bottomFn,
    lo,
    hi,
    axis,
    theta0,
    theta1,
    segmentsX,
    segmentsTheta,
    true
  );

  const segmentsY = Math.max(24, Math.floor(segmentsX * 0.65));
  for (const xWall of xBoundaryWalls(lo, hi, axis.k)) {
    const bnd = verticalBoundaryAt(xWall, f, g, axis);
    if (!bnd || bnd.height < 1e-10) continue;
    pushVerticalStripWall(
      positions,
      indices,
      xWall,
      bnd.bottomY,
      bnd.topY,
      axis,
      theta0,
      theta1,
      segmentsY,
      segmentsTheta
    );
  }

  return finalizeGeometry(positions, indices);
}

function buildWasherSliceOverlay(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: Extract<RevolutionAxis, { kind: "horizontal" }>,
  theta0: number,
  theta1: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const span = b - a;

  for (let s = 0; s < SLICE_COUNT; s++) {
    const x = a + ((s + 0.5) / SLICE_COUNT) * span;
    const bnd = horizontalBoundaryAt(x, f, g, axis, a, b);
    if (!bnd) continue;
    pushAnnularCap(
      positions,
      indices,
      x,
      bnd.yOuter,
      bnd.yInner,
      bnd.hasHole,
      axis,
      theta0,
      theta1,
      SLICE_SEG_THETA
    );
  }

  return finalizeGeometry(positions, indices);
}

function buildShellSliceOverlay(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: Extract<RevolutionAxis, { kind: "vertical" }>,
  theta0: number,
  theta1: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const span = b - a;
  const segmentsY = 8;

  for (let s = 0; s < SLICE_COUNT; s++) {
    const x = a + ((s + 0.5) / SLICE_COUNT) * span;
    const bnd = verticalBoundaryAt(x, f, g, axis);
    if (!bnd || bnd.height < 1e-10 || bnd.shellRadius < 1e-10) continue;

    const half = (span / SLICE_COUNT) * 0.45;
    for (const xFace of [x - half, x + half]) {
      pushVerticalStripWall(
        positions,
        indices,
        xFace,
        bnd.bottomY,
        bnd.topY,
        axis,
        theta0,
        theta1,
        segmentsY,
        SLICE_SEG_THETA
      );
    }
  }

  return finalizeGeometry(positions, indices);
}

export function buildSolidMeshOptions(
  viewMode: SolidViewMode
): SolidMeshBuildOptions {
  return {
    thetaSpan: viewMode === "cutaway" ? CUTAWAY_THETA : Math.PI * 2,
    segmentsX: SMOOTH_SEG_X,
    segmentsTheta: SMOOTH_SEG_THETA,
  };
}

export function buildRevolutionMeshes(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis,
  options: SolidMeshBuildOptions = {},
  includeSliceOverlay = false
): RevolutionMeshResult {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const analysis = analyzeRevolutionRegion(f, g, lo, hi, axis);
  const segmentsX = options.segmentsX ?? SMOOTH_SEG_X;
  const segmentsTheta = options.segmentsTheta ?? SMOOTH_SEG_THETA;
  const thetaSpan = options.thetaSpan ?? Math.PI * 2;
  const theta0 = 0;
  const theta1 = thetaSpan;

  let solid: THREE.BufferGeometry | null = null;
  let sliceOverlay: THREE.BufferGeometry | null = null;

  if (axis.kind === "horizontal") {
    solid = buildHorizontalWasherSolid(
      f,
      g,
      lo,
      hi,
      axis,
      theta0,
      theta1,
      segmentsX,
      segmentsTheta
    );
    if (includeSliceOverlay) {
      sliceOverlay = buildWasherSliceOverlay(
        f,
        g,
        lo,
        hi,
        axis,
        theta0,
        theta1
      );
    }
  } else {
    solid = buildVerticalShellSolid(
      f,
      g,
      lo,
      hi,
      axis,
      theta0,
      theta1,
      segmentsX,
      segmentsTheta
    );
    if (includeSliceOverlay) {
      sliceOverlay = buildShellSliceOverlay(
        f,
        g,
        lo,
        hi,
        axis,
        theta0,
        theta1
      );
    }
  }

  return { solid, sliceOverlay, analysis };
}

export function buildSolidGeometry(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis,
  options: SolidMeshBuildOptions = {}
): THREE.BufferGeometry {
  const result = buildRevolutionMeshes(f, g, a, b, axis, options, false);
  if (result.solid) return result.solid;
  const fallback = new THREE.BufferGeometry();
  fallback.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
  return fallback;
}

export interface SolidMeshFrame {
  extent: number;
  center: [number, number, number];
}

export function solidMeshFrame(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis
): SolidMeshFrame {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const samples = 32;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i <= samples; i++) {
    const x = lo + (i / samples) * (hi - lo);
    const region = sampleRegionAt(x, f, g);
    if (!region) continue;
    for (const theta of [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI]) {
      for (const y of [region.topY, region.bottomY]) {
        const p = mapPoint(x, y, theta, axis);
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        minZ = Math.min(minZ, p.z);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
        maxZ = Math.max(maxZ, p.z);
      }
    }
  }

  if (!Number.isFinite(minX)) {
    return { extent: 4, center: [0, 0, 0] };
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const half = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2;
  return {
    center: [cx, cy, cz],
    extent: Math.max(half * 1.35, 1.5),
  };
}

export function solidBoundingSize(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis
): number {
  return solidMeshFrame(f, g, a, b, axis).extent;
}

export function axisGuidePoints(
  axis: RevolutionAxis,
  a: number,
  b: number,
  extent: number
): [number, number, number][] {
  if (axis.kind === "vertical") {
    const len = extent * 1.4;
    return [
      [axis.k, -len, 0],
      [axis.k, len, 0],
    ];
  }

  const lo = Math.min(a, b) - extent * 0.25;
  const hi = Math.max(a, b) + extent * 0.25;
  const segments = 72;
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const x = lo + (i / segments) * (hi - lo);
    try {
      const y = axis.h(x);
      if (Number.isFinite(y)) points.push([x, y, 0]);
    } catch {
      break;
    }
  }
  return points.length >= 2 ? points : [[lo, 0, 0], [hi, 0, 0]];
}

export function sampleWasherRadiiAtMid(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis
): { R: number; r: number; x: number } | null {
  if (axis.kind !== "horizontal") return null;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const x = (lo + hi) / 2;
  const bnd = horizontalBoundaryAt(x, f, g, axis, lo, hi);
  if (!bnd) return null;
  return { R: bnd.outerRadius, r: bnd.innerRadius, x };
}

export function sampleShellAtMid(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis
): { radius: number; height: number; x: number } | null {
  if (axis.kind !== "vertical") return null;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const x = (lo + hi) / 2;
  const bnd = verticalBoundaryAt(x, f, g, axis);
  if (!bnd) return null;
  return { radius: bnd.shellRadius, height: bnd.height, x };
}

export function sampleShellHeightsAlongInterval(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number
): { x: number; height: number }[] {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const pts = [lo, lo + (hi - lo) * 0.25, (lo + hi) / 2, lo + (hi - lo) * 0.75, hi];
  return pts
    .map((x) => {
      const r = sampleRegionAt(x, f, g);
      return r ? { x, height: r.height } : null;
    })
    .filter((p): p is { x: number; height: number } => p !== null);
}
