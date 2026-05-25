import * as THREE from "three";
import type { RevolutionAxis } from "./axisParser";
import type { EvalFn } from "./mathParser";

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

function pushSurface(
  positions: number[],
  indices: number[],
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis,
  pickY: "top" | "bottom",
  segmentsX: number,
  segmentsTheta: number
) {
  const grid: number[][] = [];

  for (let i = 0; i <= segmentsX; i++) {
    const x = a + (i / segmentsX) * (b - a);
    const fv = f(x);
    const gv = g(x);
    const y = pickY === "top" ? Math.max(fv, gv) : Math.min(fv, gv);
    const row: number[] = [];

    for (let j = 0; j <= segmentsTheta; j++) {
      const theta = (j / segmentsTheta) * Math.PI * 2;
      const p = mapPoint(x, y, theta, axis);
      row.push(positions.length / 3);
      positions.push(p.x, p.y, p.z);
    }
    grid.push(row);
  }

  for (let i = 0; i < segmentsX; i++) {
    for (let j = 0; j < segmentsTheta; j++) {
      const i0 = grid[i][j];
      const i1 = grid[i][j + 1];
      const i2 = grid[i + 1][j];
      const i3 = grid[i + 1][j + 1];
      if (pickY === "top") {
        indices.push(i0, i2, i1, i1, i2, i3);
      } else {
        indices.push(i0, i1, i2, i1, i3, i2);
      }
    }
  }
}

/** 垂直轴旋转：在 x = 常数处将竖直边（y 从下到上）扫成圆柱侧壁 */
function pushVerticalSideWall(
  positions: number[],
  indices: number[],
  x: number,
  f: EvalFn,
  g: EvalFn,
  axis: RevolutionAxis,
  segmentsY: number,
  segmentsTheta: number
) {
  if (axis.kind !== "vertical") return;

  const ymin = Math.min(f(x), g(x));
  const ymax = Math.max(f(x), g(x));
  const grid: number[][] = [];

  for (let j = 0; j <= segmentsY; j++) {
    const y = ymin + (j / segmentsY) * (ymax - ymin);
    const row: number[] = [];
    for (let t = 0; t <= segmentsTheta; t++) {
      const theta = (t / segmentsTheta) * Math.PI * 2;
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

function buildVerticalAxisSolidGeometry(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: Extract<RevolutionAxis, { kind: "vertical" }>,
  segmentsX: number,
  segmentsTheta: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const segmentsY = segmentsX;

  pushSurface(positions, indices, f, g, a, b, axis, "top", segmentsX, segmentsTheta);
  pushSurface(positions, indices, f, g, a, b, axis, "bottom", segmentsX, segmentsTheta);

  for (const xWall of xBoundaryWalls(a, b, axis.k)) {
    pushVerticalSideWall(
      positions,
      indices,
      xWall,
      f,
      g,
      axis,
      segmentsY,
      segmentsTheta
    );
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

function pushEndCap(
  positions: number[],
  indices: number[],
  x: number,
  f: EvalFn,
  g: EvalFn,
  axis: RevolutionAxis,
  segmentsTheta: number
) {
  const fv = f(x);
  const gv = g(x);
  const ymin = Math.min(fv, gv);
  const ymax = Math.max(fv, gv);
  const center = mapPoint(x, (ymin + ymax) / 2, 0, axis);
  const centerIdx = positions.length / 3;
  positions.push(center.x, center.y, center.z);

  const ring: number[] = [];
  for (let j = 0; j <= segmentsTheta; j++) {
    const theta = (j / segmentsTheta) * Math.PI * 2;
    const p = mapPoint(x, ymax, theta, axis);
    ring.push(positions.length / 3);
    positions.push(p.x, p.y, p.z);
  }

  for (let j = 0; j < segmentsTheta; j++) {
    indices.push(centerIdx, ring[j], ring[j + 1]);
  }
}

export function buildSolidGeometry(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis,
  segmentsX = 28,
  segmentsTheta = 32
): THREE.BufferGeometry {
  if (axis.kind === "vertical") {
    return buildVerticalAxisSolidGeometry(
      f,
      g,
      a,
      b,
      axis,
      segmentsX,
      segmentsTheta
    );
  }

  const positions: number[] = [];
  const indices: number[] = [];

  pushSurface(positions, indices, f, g, a, b, axis, "top", segmentsX, segmentsTheta);
  pushSurface(positions, indices, f, g, a, b, axis, "bottom", segmentsX, segmentsTheta);
  pushEndCap(positions, indices, a, f, g, axis, segmentsTheta);
  pushEndCap(positions, indices, b, f, g, axis, segmentsTheta);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function solidBoundingSize(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axis: RevolutionAxis
): number {
  const samples = 24;
  let maxR = 0;
  for (let i = 0; i <= samples; i++) {
    const x = a + (i / samples) * (b - a);
    const fv = f(x);
    const gv = g(x);
    const ymin = Math.min(fv, gv);
    const ymax = Math.max(fv, gv);
    const pts = [
      mapPoint(x, ymin, 0, axis),
      mapPoint(x, ymax, 0, axis),
      mapPoint(x, ymax, Math.PI / 2, axis),
    ];
    for (const p of pts) {
      maxR = Math.max(maxR, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
    }
  }
  return Math.max(maxR * 1.6, 2);
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
      points.push([x, axis.h(x), 0]);
    } catch {
      break;
    }
  }
  return points.length >= 2 ? points : [[lo, 0, 0], [hi, 0, 0]];
}
