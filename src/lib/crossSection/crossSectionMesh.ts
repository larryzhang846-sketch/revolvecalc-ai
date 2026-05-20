import * as THREE from "three";
import type { CrossSectionShape } from "@/types/revolve";
import type { EvalFn } from "@/lib/revolve/mathParser";

function pushQuad(
  positions: number[],
  indices: number[],
  v0: THREE.Vector3,
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  v3: THREE.Vector3
) {
  const base = positions.length / 3;
  [v0, v1, v2, v3].forEach((v) => positions.push(v.x, v.y, v.z));
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function pushTriangle(
  positions: number[],
  indices: number[],
  v0: THREE.Vector3,
  v1: THREE.Vector3,
  v2: THREE.Vector3
) {
  const base = positions.length / 3;
  [v0, v1, v2].forEach((v) => positions.push(v.x, v.y, v.z));
  indices.push(base, base + 1, base + 2);
}

/** Base region in the xy plane at z = 0 */
function pushBaseRegion(
  positions: number[],
  indices: number[],
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  segments: number
) {
  for (let i = 0; i < segments; i++) {
    const x0 = a + (i / segments) * (b - a);
    const x1 = a + ((i + 1) / segments) * (b - a);
    const y0a = f(x0);
    const y0b = g(x0);
    const y1a = f(x1);
    const y1b = g(x1);
    const top0 = Math.max(y0a, y0b);
    const bot0 = Math.min(y0a, y0b);
    const top1 = Math.max(y1a, y1b);
    const bot1 = Math.min(y1a, y1b);
    pushQuad(
      positions,
      indices,
      new THREE.Vector3(x0, bot0, 0),
      new THREE.Vector3(x1, bot1, 0),
      new THREE.Vector3(x1, top1, 0),
      new THREE.Vector3(x0, top0, 0)
    );
  }
}

function pushSquareSlice(
  positions: number[],
  indices: number[],
  x: number,
  yc: number,
  base: number,
  thickness: number
) {
  const h = base / 2;
  const t = thickness / 2;
  const y0 = yc - h;
  const y1 = yc + h;
  const faces = [
    [
      new THREE.Vector3(x - t, y0, 0),
      new THREE.Vector3(x + t, y0, 0),
      new THREE.Vector3(x + t, y1, 0),
      new THREE.Vector3(x - t, y1, 0),
    ],
    [
      new THREE.Vector3(x - t, y0, base),
      new THREE.Vector3(x + t, y0, base),
      new THREE.Vector3(x + t, y1, base),
      new THREE.Vector3(x - t, y1, base),
    ],
    [
      new THREE.Vector3(x - t, y0, 0),
      new THREE.Vector3(x - t, y0, base),
      new THREE.Vector3(x - t, y1, base),
      new THREE.Vector3(x - t, y1, 0),
    ],
    [
      new THREE.Vector3(x + t, y0, 0),
      new THREE.Vector3(x + t, y1, 0),
      new THREE.Vector3(x + t, y1, base),
      new THREE.Vector3(x + t, y0, base),
    ],
    [
      new THREE.Vector3(x - t, y1, 0),
      new THREE.Vector3(x + t, y1, 0),
      new THREE.Vector3(x + t, y1, base),
      new THREE.Vector3(x - t, y1, base),
    ],
    [
      new THREE.Vector3(x - t, y0, 0),
      new THREE.Vector3(x - t, y0, base),
      new THREE.Vector3(x + t, y0, base),
      new THREE.Vector3(x + t, y0, 0),
    ],
  ];
  for (const f of faces) {
    pushQuad(positions, indices, f[0], f[1], f[2], f[3]);
  }
}

function pushSemicircleSlice(
  positions: number[],
  indices: number[],
  x: number,
  yc: number,
  base: number,
  segments: number,
  thickness: number
) {
  const t = thickness / 2;
  const y0 = yc - base / 2;
  const y1 = yc + base / 2;
  const center = new THREE.Vector3(x, yc, 0);

  for (let j = 0; j < segments; j++) {
    const a0 = (j / segments) * Math.PI;
    const a1 = ((j + 1) / segments) * Math.PI;
    const r = base / 2;
    const p0 = new THREE.Vector3(x, yc + r * Math.cos(a0), r * Math.sin(a0));
    const p1 = new THREE.Vector3(x, yc + r * Math.cos(a1), r * Math.sin(a1));
    pushTriangle(positions, indices, center, p0, p1);

    const p0b = new THREE.Vector3(x - t, yc + r * Math.cos(a0), r * Math.sin(a0));
    const p1b = new THREE.Vector3(x - t, yc + r * Math.cos(a1), r * Math.sin(a1));
    const p0f = new THREE.Vector3(x + t, yc + r * Math.cos(a0), r * Math.sin(a0));
    const p1f = new THREE.Vector3(x + t, yc + r * Math.cos(a1), r * Math.sin(a1));
    pushQuad(positions, indices, p0b, p1b, p1f, p0f);
  }

  pushQuad(
    positions,
    indices,
    new THREE.Vector3(x - t, y0, 0),
    new THREE.Vector3(x + t, y0, 0),
    new THREE.Vector3(x + t, y1, 0),
    new THREE.Vector3(x - t, y1, 0)
  );
}

function pushTriangleSlice(
  positions: number[],
  indices: number[],
  x: number,
  yc: number,
  base: number,
  thickness: number
) {
  const t = thickness / 2;
  const h = (Math.sqrt(3) / 2) * base;
  const y0 = yc - base / 2;
  const y1 = yc + base / 2;
  const apex = new THREE.Vector3(x, yc, h);
  const bl = new THREE.Vector3(x, y0, 0);
  const br = new THREE.Vector3(x, y1, 0);

  pushTriangle(positions, indices, bl, br, apex);

  const blb = new THREE.Vector3(x - t, y0, 0);
  const brb = new THREE.Vector3(x - t, y1, 0);
  const apb = new THREE.Vector3(x - t, yc, h);
  const blf = new THREE.Vector3(x + t, y0, 0);
  const brf = new THREE.Vector3(x + t, y1, 0);
  const apf = new THREE.Vector3(x + t, yc, h);
  pushQuad(positions, indices, blb, brb, apb, blb);
  pushQuad(positions, indices, blf, apf, brf, blf);
  pushQuad(positions, indices, blb, blf, apf, apb);
  pushQuad(positions, indices, brb, apb, apf, brf);
}

function pushRectangleSliceFixed(
  positions: number[],
  indices: number[],
  x: number,
  yc: number,
  base: number,
  rectK: number,
  thickness: number
) {
  const height = rectK * base;
  const t = thickness / 2;
  const half = base / 2;
  const y0 = yc - half;
  const y1 = yc + half;

  const faces = [
    [
      new THREE.Vector3(x - t, y0, 0),
      new THREE.Vector3(x + t, y0, 0),
      new THREE.Vector3(x + t, y1, 0),
      new THREE.Vector3(x - t, y1, 0),
    ],
    [
      new THREE.Vector3(x - t, y0, height),
      new THREE.Vector3(x + t, y0, height),
      new THREE.Vector3(x + t, y1, height),
      new THREE.Vector3(x - t, y1, height),
    ],
    [
      new THREE.Vector3(x - t, y0, 0),
      new THREE.Vector3(x - t, y0, height),
      new THREE.Vector3(x - t, y1, height),
      new THREE.Vector3(x - t, y1, 0),
    ],
    [
      new THREE.Vector3(x + t, y0, 0),
      new THREE.Vector3(x + t, y1, 0),
      new THREE.Vector3(x + t, y1, height),
      new THREE.Vector3(x + t, y0, height),
    ],
    [
      new THREE.Vector3(x - t, y1, 0),
      new THREE.Vector3(x + t, y1, 0),
      new THREE.Vector3(x + t, y1, height),
      new THREE.Vector3(x - t, y1, height),
    ],
    [
      new THREE.Vector3(x - t, y0, 0),
      new THREE.Vector3(x - t, y0, height),
      new THREE.Vector3(x + t, y0, height),
      new THREE.Vector3(x + t, y0, 0),
    ],
  ];
  for (const f of faces) {
    pushQuad(positions, indices, f[0], f[1], f[2], f[3]);
  }
}

export function buildCrossSectionGeometry(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  shape: CrossSectionShape,
  rectangleK = 1,
  sliceCount = 6
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const span = b - a;
  const thickness = span * 0.04;

  pushBaseRegion(positions, indices, f, g, a, b, 40);

  for (let s = 0; s < sliceCount; s++) {
    const x = a + ((s + 0.5) / sliceCount) * span;
    const fv = f(x);
    const gv = g(x);
    const ymin = Math.min(fv, gv);
    const ymax = Math.max(fv, gv);
    const base = ymax - ymin;
    if (base < 1e-6) continue;
    const yc = (ymin + ymax) / 2;

    switch (shape) {
      case "square":
        pushSquareSlice(positions, indices, x, yc, base, thickness);
        break;
      case "semicircle":
        pushSemicircleSlice(positions, indices, x, yc, base, 20, thickness);
        break;
      case "equilateral":
        pushTriangleSlice(positions, indices, x, yc, base, thickness);
        break;
      case "rectangle":
        pushRectangleSliceFixed(
          positions,
          indices,
          x,
          yc,
          base,
          rectangleK,
          thickness
        );
        break;
    }
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

export function crossSectionBoundingSize(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  rectangleK = 1
): number {
  let maxVal = 2;
  const samples = 24;
  for (let i = 0; i <= samples; i++) {
    const x = a + (i / samples) * (b - a);
    const fv = f(x);
    const gv = g(x);
    maxVal = Math.max(maxVal, Math.abs(fv), Math.abs(gv), Math.abs(fv - gv) * rectangleK);
  }
  return Math.max(maxVal, (b - a)) * 1.2;
}
