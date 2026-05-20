"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { AxisMode, VolumeResult } from "@/types/revolve";
import { parseFunction } from "@/lib/revolve/mathParser";
import { buildSolidGeometry, solidBoundingSize } from "@/lib/revolve/solidMesh";

interface SolidVisualization3DProps {
  fExpr: string;
  gExpr: string;
  a: number;
  b: number;
  axisMode: AxisMode;
  k?: number;
  result?: VolumeResult | null;
}

function SolidMesh({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color="#8b5cf6"
        metalness={0.15}
        roughness={0.35}
        transparent
        opacity={0.88}
        side={THREE.DoubleSide}
        emissive="#4c1d95"
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

function AxisGuide({
  axisMode,
  k = 0,
  extent,
}: {
  axisMode: AxisMode;
  k?: number;
  extent: number;
}) {
  const len = extent * 1.4;
  let points: [number, number, number][] = [];

  switch (axisMode) {
    case "x-axis":
      points = [
        [-len, 0, 0],
        [len, 0, 0],
      ];
      break;
    case "y-axis":
      points = [
        [0, -len, 0],
        [0, len, 0],
      ];
      break;
    case "y=k":
      points = [
        [-len, k, 0],
        [len, k, 0],
      ];
      break;
    case "x=k":
      points = [
        [k, -len, 0],
        [k, len, 0],
      ];
      break;
  }

  return (
    <Line
      points={points}
      color="#fbbf24"
      lineWidth={2}
      dashed
      dashSize={0.15}
      gapSize={0.1}
    />
  );
}

function Scene({
  geometry,
  axisMode,
  k,
  extent,
}: {
  geometry: THREE.BufferGeometry;
  axisMode: AxisMode;
  k?: number;
  extent: number;
}) {
  const dist = extent * 2.2;

  return (
    <>
      <color attach="background" args={["#0a0a14"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} castShadow />
      <directionalLight position={[-4, -2, -5]} intensity={0.35} color="#22d3ee" />
      <SolidMesh geometry={geometry} />
      <AxisGuide axisMode={axisMode} k={k} extent={extent} />
      <gridHelper args={[extent * 3, 16, "#334155", "#1e293b"]} position={[0, -extent * 0.01, 0]} />
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

export function SolidVisualization3D({
  fExpr,
  gExpr,
  a,
  b,
  axisMode,
  k,
  result,
}: SolidVisualization3DProps) {
  const meshData = useMemo(() => {
    try {
      const f = parseFunction(fExpr);
      const g = parseFunction(gExpr);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const kVal = k ?? 0;
      const geometry = buildSolidGeometry(f, g, lo, hi, axisMode, kVal);
      const extent = solidBoundingSize(f, g, lo, hi, axisMode, kVal);
      return { geometry, extent, error: null as string | null };
    } catch (e) {
      return {
        geometry: null,
        extent: 4,
        error: e instanceof Error ? e.message : "无法生成三维模型",
      };
    }
  }, [fExpr, gExpr, a, b, axisMode, k]);

  if (meshData.error || !meshData.geometry) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-white/5 bg-surface/50 text-sm text-slate-400">
        {meshData.error ?? "请输入有效函数以查看旋转体。"}
      </div>
    );
  }

  const dist = meshData.extent * 2.2;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-violet-500/60" />
          旋转体表面
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-6 border-t border-dashed border-amber-400" />
          旋转轴
        </span>
        <span className="text-slate-500">拖动旋转 · 滚轮缩放</span>
      </div>

      <div className="h-[400px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a14]">
        <Canvas
          camera={{ position: [dist * 0.85, dist * 0.55, dist * 0.85], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene
              geometry={meshData.geometry}
              axisMode={axisMode}
              k={k}
              extent={meshData.extent}
            />
          </Suspense>
        </Canvas>
      </div>

      {result && (
        <p className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-slate-400">
          <span className="font-medium text-violet-300">方法：</span>
          {result.graphMeta.methodLabel}
          <span className="mx-2 text-slate-600">·</span>
          <span className="font-medium text-amber-300/90">旋转轴：</span>
          {result.graphMeta.axisLabel}
        </p>
      )}
    </div>
  );
}
