import * as THREE from "three";
import type { AxisMode } from "@/types/revolve";
import type { EvalFn } from "./mathParser";

function mapPoint(
  x: number,
  y: number,
  theta: number,
  axisMode: AxisMode,
  k: number
): THREE.Vector3 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);

  switch (axisMode) {
    case "x-axis":
      return new THREE.Vector3(x, y * c, y * s);
    case "y-axis":
      return new THREE.Vector3(x * c, y, x * s);
    case "y=k": {
      const dy = y - k;
      return new THREE.Vector3(x, k + dy * c, dy * s);
    }
    case "x=k": {
      const dx = x - k;
      return new THREE.Vector3(k + dx * c, y, dx * s);
    }
  }
}

function pushSurface(
  positions: number[],
  indices: number[],
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  axisMode: AxisMode,
  k: number,
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
      const p = mapPoint(x, y, theta, axisMode, k);
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

function pushEndCap(
  positions: number[],
  indices: number[],
  x: number,
  f: EvalFn,
  g: EvalFn,
  axisMode: AxisMode,
  k: number,
  segmentsTheta: number
) {
  const fv = f(x);
  const gv = g(x);
  const ymin = Math.min(fv, gv);
  const ymax = Math.max(fv, gv);
  const center = mapPoint(x, (ymin + ymax) / 2, 0, axisMode, k);
  const centerIdx = positions.length / 3;
  positions.push(center.x, center.y, center.z);

  const ring: number[] = [];
  for (let j = 0; j <= segmentsTheta; j++) {
    const theta = (j / segmentsTheta) * Math.PI * 2;
    const p = mapPoint(x, ymax, theta, axisMode, k);
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
  axisMode: AxisMode,
  k = 0,
  segmentsX = 44,
  segmentsTheta = 52
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  pushSurface(positions, indices, f, g, a, b, axisMode, k, "top", segmentsX, segmentsTheta);
  pushSurface(positions, indices, f, g, a, b, axisMode, k, "bottom", segmentsX, segmentsTheta);
  pushEndCap(positions, indices, a, f, g, axisMode, k, segmentsTheta);
  pushEndCap(positions, indices, b, f, g, axisMode, k, segmentsTheta);

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
  axisMode: AxisMode,
  k = 0
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
      mapPoint(x, ymin, 0, axisMode, k),
      mapPoint(x, ymax, 0, axisMode, k),
      mapPoint(x, ymax, Math.PI / 2, axisMode, k),
    ];
    for (const p of pts) {
      maxR = Math.max(maxR, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
    }
  }
  return Math.max(maxR * 1.6, 2);
}
