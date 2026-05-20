"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CrossSectionResult, CrossSectionShape } from "@/types/revolve";
import { parseFunction } from "@/lib/revolve/mathParser";
import {
  buildCrossSectionGeometry,
  crossSectionBoundingSize,
} from "@/lib/crossSection/crossSectionMesh";
import { RegionGraph2D } from "./RegionGraph2D";

interface CrossSectionVisualization3DProps {
  fExpr: string;
  gExpr: string;
  a: number;
  b: number;
  shape: CrossSectionShape;
  rectangleK?: number;
  result?: CrossSectionResult | null;
}

function CrossSectionMesh({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color="#06b6d4"
        metalness={0.1}
        roughness={0.4}
        transparent
        opacity={0.82}
        side={THREE.DoubleSide}
        emissive="#0e7490"
        emissiveIntensity={0.12}
      />
    </mesh>
  );
}

function CrossSectionScene({
  geometry,
  extent,
}: {
  geometry: THREE.BufferGeometry;
  extent: number;
}) {
  const dist = extent * 2.5;
  const centerX = 0;

  return (
    <>
      <color attach="background" args={["#0a0a14"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 8]} intensity={1.05} />
      <directionalLight position={[-3, 4, -6]} intensity={0.3} color="#a78bfa" />
      <CrossSectionMesh geometry={geometry} />
      <gridHelper
        args={[extent * 3, 14, "#334155", "#1e293b"]}
        position={[centerX, -extent * 0.02, 0]}
      />
      <OrbitControls
        autoRotate={false}
        enablePan
        minDistance={dist * 0.3}
        maxDistance={dist * 2.8}
        target={[centerX, 0, extent * 0.25]}
      />
    </>
  );
}

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
  const sliceMarkers = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }, (_, s) => lo + ((s + 0.5) / count) * (hi - lo));
  }, [lo, hi]);

  const meshData = useMemo(() => {
    try {
      const f = parseFunction(fExpr);
      const g = parseFunction(gExpr);
      const geometry = buildCrossSectionGeometry(
        f,
        g,
        lo,
        hi,
        shape,
        rectangleK
      );
      const extent = crossSectionBoundingSize(f, g, lo, hi, rectangleK);
      return { geometry, extent, error: null as string | null };
    } catch (e) {
      return {
        geometry: null,
        extent: 4,
        error: e instanceof Error ? e.message : "无法生成截面模型",
      };
    }
  }, [fExpr, gExpr, lo, hi, shape, rectangleK]);

  const dist = meshData.extent * 2.5;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs text-slate-500">xy 平面 · 两曲线之间的底面区域（非旋转体）</p>
        <RegionGraph2D
          fExpr={fExpr}
          gExpr={gExpr}
          a={lo}
          b={hi}
          sliceMarkers={sliceMarkers}
        />
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-3 w-5 rounded bg-cyan-500/50" />
          底面区域
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-5 rounded bg-violet-500/40" />
          垂直于 x 轴的截面
        </span>
        <span className="text-slate-500">无旋转轴 · 拖动查看三维截面</span>
      </div>

      {meshData.error || !meshData.geometry ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl border border-white/5 bg-surface/50 text-sm text-slate-400">
          {meshData.error ?? "无法显示截面立体图"}
        </div>
      ) : (
        <div className="h-[280px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a14]">
          <Canvas
            camera={{
              position: [dist * 0.7, dist * 0.65, dist * 0.85],
              fov: 45,
            }}
            gl={{ antialias: true }}
          >
            <Suspense fallback={null}>
              <CrossSectionScene
                geometry={meshData.geometry}
                extent={meshData.extent}
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
