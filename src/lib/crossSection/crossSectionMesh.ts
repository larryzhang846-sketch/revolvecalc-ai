import * as THREE from "three";
import type { CrossSectionShape } from "@/types/revolve";
import type { EvalFn } from "@/lib/revolve/mathParser";

/** 截面立体沿 x 方向的切片数量（与动画步进、2D 标记一致；较少片、Δx 更大便于观察） */
export const CROSS_SECTION_SLICE_COUNT = 10;

const BASE_REGION_SEGMENTS = 32;
const SEMICIRCLE_SLICE_SEGMENTS = 22;

/** 拟合到视口时的目标包围盒边长 */
const SCENE_FIT_EXTENT = 4.8;

/**
 * 3D layout (Three.js Y-up, 与标准 xy 函数图像一致):
 * - X: 积分变量 x
 * - Y: 曲线值 f(x)、g(x)
 * - Z: 截面高度；底面区域在 z = 0 的 xy 平面上，截面沿 +Z 向上生长
 */

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

/** 底面：z = 0 的 xy 平面上 f(x) 与 g(x) 之间的区域 */
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
  const half = base / 2;
  const y0 = yc - half;
  const y1 = yc + half;
  const t = thickness / 2;
  const h = base;

  const faces = [
    [
      new THREE.Vector3(x - t, y0, 0),
      new THREE.Vector3(x + t, y0, 0),
      new THREE.Vector3(x + t, y1, 0),
      new THREE.Vector3(x - t, y1, 0),
    ],
    [
      new THREE.Vector3(x - t, y0, h),
      new THREE.Vector3(x + t, y0, h),
      new THREE.Vector3(x + t, y1, h),
      new THREE.Vector3(x - t, y1, h),
    ],
    [
      new THREE.Vector3(x - t, y0, 0),
      new THREE.Vector3(x - t, y0, h),
      new THREE.Vector3(x - t, y1, h),
      new THREE.Vector3(x - t, y1, 0),
    ],
    [
      new THREE.Vector3(x + t, y0, 0),
      new THREE.Vector3(x + t, y1, 0),
      new THREE.Vector3(x + t, y1, h),
      new THREE.Vector3(x + t, y0, h),
    ],
    [
      new THREE.Vector3(x - t, y1, 0),
      new THREE.Vector3(x + t, y1, 0),
      new THREE.Vector3(x + t, y1, h),
      new THREE.Vector3(x - t, y1, h),
    ],
    [
      new THREE.Vector3(x - t, y0, 0),
      new THREE.Vector3(x - t, y0, h),
      new THREE.Vector3(x + t, y0, h),
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
  const r = base / 2;
  const y0 = yc - r;
  const y1 = yc + r;

  const yLeft = new THREE.Vector3(x, y0, 0);
  for (let j = 0; j < segments; j++) {
    const a0 = (j / segments) * Math.PI;
    const a1 = ((j + 1) / segments) * Math.PI;
    const p0 = new THREE.Vector3(x, yc + r * Math.cos(a0), r * Math.sin(a0));
    const p1 = new THREE.Vector3(x, yc + r * Math.cos(a1), r * Math.sin(a1));
    pushTriangle(positions, indices, yLeft, p0, p1);

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
  const half = base / 2;
  const y0 = yc - half;
  const y1 = yc + half;
  const h = (Math.sqrt(3) / 2) * base;
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

function finalizeGeometry(
  positions: number[],
  indices: number[]
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** 步骤 1：仅底面（z = 0 上 f 与 g 之间的区域） */
export function buildCrossSectionBaseGeometry(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  pushBaseRegion(positions, indices, f, g, a, b, BASE_REGION_SEGMENTS);
  return finalizeGeometry(positions, indices);
}

function appendCrossSectionSlices(
  positions: number[],
  indices: number[],
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  shape: CrossSectionShape,
  rectangleK: number,
  sliceCount: number,
  visibleSliceCount = sliceCount
) {
  const span = b - a;
  /** 薄片厚度约为切片间距的 55%，视觉上 Δx 更明显 */
  const thickness = (span / sliceCount) * 0.55;
  const slicesToDraw = Math.min(sliceCount, Math.max(0, visibleSliceCount));

  for (let s = 0; s < slicesToDraw; s++) {
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
        pushSemicircleSlice(
          positions,
          indices,
          x,
          yc,
          base,
          SEMICIRCLE_SLICE_SEGMENTS,
          thickness
        );
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
}

/** 步骤 2：底面 + 沿 x 方向、向 +Z 叠放的截面立体 */
export function buildCrossSectionGeometry(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  shape: CrossSectionShape,
  rectangleK = 1,
  sliceCount = CROSS_SECTION_SLICE_COUNT,
  visibleSliceCount = sliceCount
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  pushBaseRegion(positions, indices, f, g, a, b, BASE_REGION_SEGMENTS);
  appendCrossSectionSlices(
    positions,
    indices,
    f,
    g,
    a,
    b,
    shape,
    rectangleK,
    sliceCount,
    visibleSliceCount
  );
  return finalizeGeometry(positions, indices);
}

/** 步骤 2：仅截面薄片（不含底面），可指定已显示的切片数量 */
export function buildCrossSectionSlicesGeometry(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  shape: CrossSectionShape,
  rectangleK = 1,
  sliceCount = CROSS_SECTION_SLICE_COUNT,
  visibleSliceCount = sliceCount
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  appendCrossSectionSlices(
    positions,
    indices,
    f,
    g,
    a,
    b,
    shape,
    rectangleK,
    sliceCount,
    visibleSliceCount
  );
  return finalizeGeometry(positions, indices);
}

function maxSliceHeight(
  base: number,
  shape: CrossSectionShape,
  rectangleK: number
): number {
  switch (shape) {
    case "square":
      return base;
    case "semicircle":
      return base / 2;
    case "equilateral":
      return (Math.sqrt(3) / 2) * base;
    case "rectangle":
      return rectangleK * base;
  }
}

export interface CrossSectionSceneFit {
  scale: number;
  /** 缩放前平移：底面中心对齐，z = 0 贴在 xy 平面 */
  offset: [number, number, number];
  extent: number;
  target: [number, number, number];
  /** 缩放后底面半宽（x）、半高（y），用于步骤 1 取景 */
  viewHalfX: number;
  viewHalfY: number;
}

/** 默认相机位置：从 +Z 略偏 +Y 俯视 xy 底面，与 2D 函数图方向一致 */
export function crossSectionDefaultCameraPosition(
  fit: CrossSectionSceneFit
): [number, number, number] {
  const d = fit.extent * 2.35;
  const [tx, ty, tz] = fit.target;
  return [tx + d * 0.18, ty + d * 0.42, tz + d * 1.02];
}

export function computeCrossSectionSceneFit(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  shape: CrossSectionShape,
  rectangleK = 1,
  includeSliceHeight = true
): CrossSectionSceneFit {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const samples = 36;
  let yMin = Infinity;
  let yMax = -Infinity;
  let maxBase = 0;
  let yMidSum = 0;

  for (let i = 0; i <= samples; i++) {
    const x = lo + (i / samples) * (hi - lo);
    const fv = f(x);
    const gv = g(x);
    yMin = Math.min(yMin, fv, gv);
    yMax = Math.max(yMax, fv, gv);
    const base = Math.abs(fv - gv);
    maxBase = Math.max(maxBase, base);
    yMidSum += (fv + gv) / 2;
  }

  const width = hi - lo;
  const depth = Math.max(yMax - yMin, 0.25);
  const sliceZ = includeSliceHeight
    ? maxSliceHeight(maxBase, shape, rectangleK)
    : 0;
  const cx = (lo + hi) / 2;
  const cy = yMidSum / (samples + 1);

  const maxDim = Math.max(width, depth, sliceZ, 0.35);
  const scale = SCENE_FIT_EXTENT / maxDim;
  const scaledWidth = width * scale;
  const scaledDepth = depth * scale;
  const scaledSliceZ = sliceZ * scale;
  const extent =
    Math.max(scaledWidth, scaledDepth, scaledSliceZ, 1.2) * 0.52;

  return {
    scale,
    offset: [-cx, -cy, 0],
    extent,
    target: [
      0,
      0,
      includeSliceHeight ? scaledSliceZ * 0.38 : 0,
    ],
    viewHalfX: scaledWidth / 2,
    viewHalfY: scaledDepth / 2,
  };
}

export function crossSectionBoundingSize(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number,
  rectangleK = 1,
  includeSliceHeight = true,
  shape: CrossSectionShape = "square"
): number {
  return computeCrossSectionSceneFit(
    f,
    g,
    a,
    b,
    shape,
    rectangleK,
    includeSliceHeight
  ).extent * 2;
}

export function crossSectionSceneCenter(
  f: EvalFn,
  g: EvalFn,
  a: number,
  b: number
): [number, number, number] {
  const midX = (a + b) / 2;
  let ySum = 0;
  const samples = 12;
  for (let i = 0; i <= samples; i++) {
    const x = a + (i / samples) * (b - a);
    ySum += (f(x) + g(x)) / 2;
  }
  return [midX, ySum / (samples + 1), 0];
}
