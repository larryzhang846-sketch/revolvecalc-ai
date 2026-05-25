"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import type { CrossSectionResult, CrossSectionShape } from "@/types/revolve";
import { parseFunction } from "@/lib/revolve/mathParser";
import {
  buildCrossSectionBaseGeometry,
  buildCrossSectionSlicesGeometry,
  CROSS_SECTION_SLICE_COUNT,
  computeCrossSectionSceneFit,
  type CrossSectionSceneFit,
} from "@/lib/crossSection/crossSectionMesh";
import { RegionGraph2D } from "./RegionGraph2D";

type VisualStep = 1 | 2;

const SLICE_REVEAL_DURATION_MS = 2800;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface CrossSectionVisualization3DProps {
  fExpr: string;
  gExpr: string;
  a: number;
  b: number;
  shape: CrossSectionShape;
  rectangleK?: number;
  result?: CrossSectionResult | null;
}

function BaseRegionMesh({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color="#22d3ee"
        metalness={0.1}
        roughness={0.45}
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
        emissive="#0891b2"
        emissiveIntensity={0.14}
      />
    </mesh>
  );
}

function SliceSolidMesh({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color="#06b6d4"
        metalness={0.12}
        roughness={0.4}
        transparent
        opacity={0.82}
        side={THREE.DoubleSide}
        emissive="#0e7490"
        emissiveIntensity={0.16}
      />
    </mesh>
  );
}

function CrossSectionScene({
  baseGeometry,
  slicesGeometry,
  fit,
  showSlices,
}: {
  baseGeometry: THREE.BufferGeometry;
  slicesGeometry: THREE.BufferGeometry | null;
  fit: CrossSectionSceneFit;
  showSlices: boolean;
}) {
  const dist = fit.extent * 2.2;

  return (
    <>
      <color attach="background" args={["#0a0a14"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 8]} intensity={1.05} />
      <directionalLight position={[-3, 4, -6]} intensity={0.3} color="#a78bfa" />
      <group
        position={[
          fit.offset[0] * fit.scale,
          fit.offset[1] * fit.scale,
          fit.offset[2] * fit.scale,
        ]}
        scale={[fit.scale, fit.scale, fit.scale]}
      >
        <BaseRegionMesh geometry={baseGeometry} />
        {showSlices && slicesGeometry && (
          <SliceSolidMesh geometry={slicesGeometry} />
        )}
      </group>
      <gridHelper
        args={[fit.extent * 3, 16, "#334155", "#1e293b"]}
        position={[0, 0, -0.002]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <OrbitControls
        autoRotate={false}
        enablePan
        minDistance={dist * 0.35}
        maxDistance={dist * 2.5}
        target={[0, 0, 0]}
      />
    </>
  );
}

const SHAPE_LABEL_ZH: Record<CrossSectionShape, string> = {
  square: "正方形",
  semicircle: "半圆",
  equilateral: "等边三角形",
  rectangle: "矩形",
};

export function CrossSectionVisualization3D({
  fExpr,
  gExpr,
  a,
  b,
  shape,
  rectangleK = 1,
  result,
}: CrossSectionVisualization3DProps) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const [visualStep, setVisualStep] = useState<VisualStep>(1);
  const [revealedSlices, setRevealedSlices] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  const inputKey = `${fExpr}|${gExpr}|${lo}|${hi}|${shape}|${rectangleK}`;
  useEffect(() => {
    setVisualStep(1);
    setRevealedSlices(0);
    setIsRevealing(false);
  }, [inputKey]);

  const startSliceReveal = useCallback(() => {
    setVisualStep(2);
    setRevealedSlices(0);
    setIsRevealing(true);
  }, []);

  const returnToBase = useCallback(() => {
    setIsRevealing(false);
    setRevealedSlices(0);
    setVisualStep(1);
  }, []);

  useEffect(() => {
    if (!isRevealing || visualStep !== 2) return;

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SLICE_REVEAL_DURATION_MS);
      const eased = easeOutCubic(t);
      const next = Math.min(
        CROSS_SECTION_SLICE_COUNT,
        Math.floor(eased * CROSS_SECTION_SLICE_COUNT)
      );
      setRevealedSlices(next);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setRevealedSlices(CROSS_SECTION_SLICE_COUNT);
        setIsRevealing(false);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isRevealing, visualStep]);

  const sliceMarkers = useMemo(() => {
    if (visualStep === 1) return undefined;
    return Array.from(
      { length: CROSS_SECTION_SLICE_COUNT },
      (_, s) => lo + ((s + 0.5) / CROSS_SECTION_SLICE_COUNT) * (hi - lo)
    );
  }, [lo, hi, visualStep]);

  const meshData = useMemo(() => {
    try {
      const f = parseFunction(fExpr);
      const g = parseFunction(gExpr);
      const baseGeometry = buildCrossSectionBaseGeometry(f, g, lo, hi);
      const baseFit = computeCrossSectionSceneFit(
        f,
        g,
        lo,
        hi,
        shape,
        rectangleK,
        false
      );
      const solidFit = computeCrossSectionSceneFit(
        f,
        g,
        lo,
        hi,
        shape,
        rectangleK,
        true
      );
      return {
        f,
        g,
        baseGeometry,
        baseFit,
        solidFit,
        error: null as string | null,
      };
    } catch (e) {
      return {
        f: null,
        g: null,
        baseGeometry: null,
        baseFit: {
          scale: 1,
          offset: [0, 0, 0] as [number, number, number],
          extent: 2.4,
          target: [0, 0, 0] as [number, number, number],
          viewHalfX: 1.2,
          viewHalfY: 1.2,
        },
        solidFit: {
          scale: 1,
          offset: [0, 0, 0] as [number, number, number],
          extent: 2.4,
          target: [0, 0, 0] as [number, number, number],
          viewHalfX: 1.2,
          viewHalfY: 1.2,
        },
        error: e instanceof Error ? e.message : "无法生成截面模型",
      };
    }
  }, [fExpr, gExpr, lo, hi, shape, rectangleK]);

  const lastSlicesGeometry = useRef<THREE.BufferGeometry | null>(null);

  const slicesGeometry = useMemo(() => {
    if (
      visualStep !== 2 ||
      revealedSlices <= 0 ||
      meshData.error ||
      !meshData.f ||
      !meshData.g
    ) {
      return null;
    }
    return buildCrossSectionSlicesGeometry(
      meshData.f,
      meshData.g,
      lo,
      hi,
      shape,
      rectangleK,
      CROSS_SECTION_SLICE_COUNT,
      revealedSlices
    );
  }, [
    visualStep,
    revealedSlices,
    meshData,
    lo,
    hi,
    shape,
    rectangleK,
  ]);

  useEffect(() => {
    if (!slicesGeometry) return;
    const prev = lastSlicesGeometry.current;
    if (prev && prev !== slicesGeometry) {
      prev.dispose();
    }
    lastSlicesGeometry.current = slicesGeometry;
  }, [slicesGeometry]);

  useEffect(() => {
    return () => {
      lastSlicesGeometry.current?.dispose();
      lastSlicesGeometry.current = null;
    };
  }, []);

  const fit = visualStep === 1 ? meshData.baseFit : meshData.solidFit;
  const dist = fit.extent * 2.2;
  const revealProgress =
    CROSS_SECTION_SLICE_COUNT > 0
      ? revealedSlices / CROSS_SECTION_SLICE_COUNT
      : 0;
  const shapeLabel = result?.shapeLabel ?? SHAPE_LABEL_ZH[shape];

  const stepClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
      active
        ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40"
        : "bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-400"
    }`;

  const step2Class = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
      active
        ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
        : "bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-400"
    }`;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs text-slate-500">
          xy 平面 · 两曲线之间的底面区域（非旋转体）
        </p>
        <RegionGraph2D
          fExpr={fExpr}
          gExpr={gExpr}
          a={lo}
          b={hi}
          sliceMarkers={sliceMarkers}
        />
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-card/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={returnToBase}
              disabled={visualStep === 1 || isRevealing}
              className={stepClass(visualStep === 1)}
            >
              步骤 1 · 底面区域
            </button>
            <button
              type="button"
              onClick={startSliceReveal}
              disabled={
                !!meshData.error ||
                isRevealing ||
                (visualStep === 2 && revealedSlices >= CROSS_SECTION_SLICE_COUNT)
              }
              className={step2Class(visualStep === 2)}
            >
              步骤 2 · 截面立体
            </button>
          </div>

          {visualStep === 1 ? (
            <button
              type="button"
              onClick={startSliceReveal}
              disabled={!!meshData.error}
              className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50"
            >
              生成截面立体 →
            </button>
          ) : (
            <button
              type="button"
              onClick={returnToBase}
              disabled={isRevealing}
              className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              ← 返回底面
            </button>
          )}
        </div>

        {visualStep === 2 && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {isRevealing
                  ? "正在沿 x 方向逐片叠放截面…"
                  : "截面立体已生成完毕"}
              </span>
              <span className="font-mono text-violet-300/90">
                {revealedSlices} / {CROSS_SECTION_SLICE_COUNT}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"
                initial={false}
                animate={{ width: `${revealProgress * 100}%` }}
                transition={{ duration: 0.12, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <p className="text-xs leading-relaxed text-slate-500">
          {visualStep === 1
            ? "底面与上方 2D 图一致，贴在 xy 平面（z = 0）。拖动旋转 · 滚轮缩放查看。"
            : isRevealing
              ? `自左向右依次生成 ${shapeLabel} 截面薄片，模拟 ∫ A(x) dx 中 Δx → 0 的叠加过程。`
              : `在底面之上按「${shapeLabel}」截面沿 x 方向叠放完成，立体沿 z 轴向上生长。`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-3 w-5 rounded bg-cyan-500/50" />
          底面区域
        </span>
        {visualStep === 2 && (
          <span className="flex items-center gap-2">
            <span className="h-3 w-5 rounded bg-violet-500/40" />
            截面立体
            {isRevealing && (
              <span className="text-violet-300/80">（生成中）</span>
            )}
          </span>
        )}
        <span className="text-slate-500">拖动旋转 · 滚轮缩放</span>
      </div>

      {meshData.error || !meshData.baseGeometry ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl border border-white/5 bg-surface/50 text-sm text-slate-400">
          {meshData.error ?? "无法显示截面立体图"}
        </div>
      ) : (
        <div className="h-[280px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a14]">
          <Canvas
            camera={{
              position: [dist * 0.85, dist * 0.55, dist * 0.85],
              fov: 45,
            }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <CrossSectionScene
                baseGeometry={meshData.baseGeometry}
                slicesGeometry={slicesGeometry}
                fit={fit}
                showSlices={visualStep === 2 && revealedSlices > 0}
              />
            </Suspense>
          </Canvas>
        </div>
      )}

      {result && (
        <p className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3 text-xs leading-relaxed text-slate-400">
          <span className="font-medium text-cyan-300">截面法</span>
          <span className="mx-2 text-slate-600">·</span>
          截面形状：{result.shapeLabel}
          <span className="mx-2 text-slate-600">·</span>
          base(x) = |f(x) − g(x)|
        </p>
      )}
    </div>
  );
}
