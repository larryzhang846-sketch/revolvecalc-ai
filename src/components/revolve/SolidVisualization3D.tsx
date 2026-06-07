"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { RevolveInput, VolumeResult } from "@/types/revolve";
import { resolveRevolutionAxis } from "@/lib/revolve/axisParser";
import { parseFunction } from "@/lib/revolve/mathParser";
import {
  axisGuidePoints,
  buildRevolutionMeshes,
  buildSolidMeshOptions,
  findFunctionIntersections,
  sampleShellAtMid,
  sampleShellHeightsAlongInterval,
  sampleWasherRadiiAtMid,
  solidMeshFrame,
  type SolidViewMode,
} from "@/lib/revolve/solidMesh";
import { resolveRevolutionMeshMethod } from "@/lib/revolve/revolutionRegion";
import { RegionGraph2D } from "./RegionGraph2D";

interface SolidVisualization3DProps {
  revolveInput: RevolveInput;
  result?: VolumeResult | null;
}

function SolidSurfaceMesh({
  geometry,
  viewMode,
}: {
  geometry: THREE.BufferGeometry;
  viewMode: SolidViewMode;
}) {
  const transparent = viewMode !== "solid";
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color="#8b5cf6"
        metalness={0.12}
        roughness={0.28}
        transparent={transparent}
        opacity={transparent ? 0.52 : 0.92}
        side={THREE.DoubleSide}
        flatShading={false}
        depthWrite={!transparent}
        emissive="#4c1d95"
        emissiveIntensity={0.12}
      />
    </mesh>
  );
}

function SliceOverlayMesh({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color="#22d3ee"
        metalness={0.05}
        roughness={0.45}
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        flatShading={false}
        depthWrite={false}
        emissive="#0891b2"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

function isValidAxisPoint(
  point: [number, number, number] | undefined
): point is [number, number, number] {
  if (!point || point.length < 3) return false;
  return point.every(
    (c) => c !== undefined && typeof c === "number" && Number.isFinite(c)
  );
}

function sanitizeAxisGuidePoints(
  points: [number, number, number][]
): [number, number, number][] {
  return points.filter(isValidAxisPoint);
}

function AxisGuide({
  points,
}: {
  points: [number, number, number][];
}) {
  const validPoints = sanitizeAxisGuidePoints(points);
  if (validPoints.length < 2) return null;

  return (
    <Line
      points={validPoints}
      color="#fbbf24"
      lineWidth={2}
      dashed={validPoints.length === 2}
      dashSize={0.15}
      gapSize={0.1}
    />
  );
}

function Scene({
  solidGeometry,
  sliceOverlay,
  axisPoints,
  extent,
  center,
  viewMode,
}: {
  solidGeometry: THREE.BufferGeometry;
  sliceOverlay: THREE.BufferGeometry | null;
  axisPoints: [number, number, number][];
  extent: number;
  center: [number, number, number];
  viewMode: SolidViewMode;
}) {
  const dist = extent * 2.2;
  const [cx, cy, cz] = center;

  return (
    <>
      <color attach="background" args={["#0a0a14"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} castShadow />
      <directionalLight position={[-4, -2, -5]} intensity={0.35} color="#22d3ee" />
      <SolidSurfaceMesh geometry={solidGeometry} viewMode={viewMode} />
      {sliceOverlay && <SliceOverlayMesh geometry={sliceOverlay} />}
      <AxisGuide points={axisPoints} />
      <gridHelper
        args={[extent * 3, 16, "#334155", "#1e293b"]}
        position={[cx, cy - extent * 0.55, cz]}
      />
      <OrbitControls
        autoRotate={false}
        enablePan
        minDistance={dist * 0.35}
        maxDistance={dist * 2.5}
        target={[cx, cy, cz]}
      />
    </>
  );
}

const VIEW_MODE_OPTIONS: { value: SolidViewMode; label: string }[] = [
  { value: "solid", label: "实心" },
  { value: "transparent", label: "半透明" },
  { value: "cutaway", label: "剖切" },
];

export function SolidVisualization3D({
  revolveInput,
  result,
}: SolidVisualization3DProps) {
  const [viewMode, setViewMode] = useState<SolidViewMode>("solid");
  const [showSlicePreview, setShowSlicePreview] = useState(false);

  const lo = Math.min(revolveInput.a, revolveInput.b);
  const hi = Math.max(revolveInput.a, revolveInput.b);

  const meshData = useMemo(() => {
    try {
      const axis = resolveRevolutionAxis(revolveInput);
      const f = parseFunction(revolveInput.fExpr);
      const g = parseFunction(revolveInput.gExpr);
      const method = resolveRevolutionMeshMethod(axis);
      const meshOptions = buildSolidMeshOptions(viewMode);
      const { solid, sliceOverlay, analysis } = buildRevolutionMeshes(
        f,
        g,
        lo,
        hi,
        axis,
        meshOptions,
        showSlicePreview
      );
      const frame = solidMeshFrame(f, g, lo, hi, axis);
      const axisPoints = axisGuidePoints(axis, lo, hi, frame.extent);
      const midRadii = sampleWasherRadiiAtMid(f, g, lo, hi, axis);
      const midShell = sampleShellAtMid(f, g, lo, hi, axis);
      const shellHeights = method === "shell" ? sampleShellHeightsAlongInterval(f, g, lo, hi) : [];
      const intersections =
        method === "shell" ? findFunctionIntersections(f, g, lo, hi) : [];
      return {
        solid,
        sliceOverlay,
        analysis,
        frame,
        axisPoints,
        method,
        midRadii,
        midShell,
        shellHeights,
        intersections,
        axisLabel: axis.label,
        error: null as string | null,
      };
    } catch (e) {
      return {
        solid: null,
        sliceOverlay: null,
        analysis: { warnings: [], intersections: [], method: "washer" as const, heightVaries: false, minHeight: 0, maxHeight: 0 },
        frame: { extent: 4, center: [0, 0, 0] as [number, number, number] },
        axisPoints: [] as [number, number, number][],
        method: "washer" as const,
        midRadii: null,
        midShell: null,
        shellHeights: [] as { x: number; height: number }[],
        intersections: [] as number[],
        axisLabel: "",
        error: e instanceof Error ? e.message : "无法生成三维模型",
      };
    }
  }, [revolveInput, lo, hi, viewMode, showSlicePreview]);

  const hasMesh = meshData.solid;

  if (meshData.error || !hasMesh) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-white/5 bg-surface/50 text-sm text-slate-400">
        {meshData.error ?? "请输入有效函数以查看旋转体。"}
      </div>
    );
  }

  const dist = meshData.frame.extent * 2.2;
  const isWasher = meshData.method === "washer";
  const sliceLabel = isWasher ? "垫圈切片" : "柱壳切片";

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs text-slate-500">
          xy 平面 · 旋转前的有界区域（f 与 g 之间）
        </p>
        <RegionGraph2D
          fExpr={revolveInput.fExpr}
          gExpr={revolveInput.gExpr}
          a={lo}
          b={hi}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {VIEW_MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setViewMode(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              viewMode === opt.value
                ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-500/40"
                : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowSlicePreview((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            showSlicePreview
              ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-500/40"
              : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
          }`}
        >
          {showSlicePreview ? "隐藏" : "显示"}
          {sliceLabel}
        </button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span>
          区间 <span className="font-mono text-slate-300">[{lo}, {hi}]</span>
        </span>
        <span>
          旋转轴{" "}
          <span className="text-amber-300/90">
            {result?.graphMeta.axisLabel ?? meshData.axisLabel}
          </span>
        </span>
        {isWasher && meshData.midRadii && (
          <>
            <span>
              R(x) ≈{" "}
              <span className="font-mono text-violet-300">
                {meshData.midRadii.R.toFixed(3)}
              </span>
            </span>
            {meshData.midRadii.r > 1e-6 && (
              <span>
                r(x) ≈{" "}
                <span className="font-mono text-cyan-300">
                  {meshData.midRadii.r.toFixed(3)}
                </span>
              </span>
            )}
          </>
        )}
        {!isWasher && meshData.midShell && (
          <span>
            p(x) ≈{" "}
            <span className="font-mono text-violet-300">
              {meshData.midShell.radius.toFixed(3)}
            </span>
            {" · "}
            h(x) ≈{" "}
            <span className="font-mono text-cyan-300">
              {meshData.midShell.height.toFixed(3)}
            </span>
          </span>
        )}
      </div>

      {!isWasher && (
        <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 px-4 py-3 text-[11px] leading-relaxed text-slate-300">
          <p>
            <span className="font-medium text-violet-200">柱壳法：</span>
            半径{" "}
            <span className="font-mono text-violet-300">p(x) = |x − k|</span>
            （绕 y 轴时{" "}
            <span className="font-mono text-violet-300">p(x) = |x|</span>
            ），高度{" "}
            <span className="font-mono text-cyan-300">h(x) = |f(x) − g(x)|</span>
            。高度随 x 变化，因此整体形状不是单一圆柱。
          </p>
          {meshData.shellHeights.length > 0 && (
            <p className="mt-2 text-slate-400">
              h(x) 采样：
              {meshData.shellHeights.map(({ x, height }) => (
                <span key={x} className="ml-2 font-mono text-cyan-300/90">
                  x={x.toFixed(2)} → h={height.toFixed(2)}
                </span>
              ))}
            </p>
          )}
          {meshData.intersections.length > 0 && (
            <p className="mt-1 text-amber-200/80">
              f 与 g 在区间内相交于 x ≈{" "}
              {meshData.intersections.map((x) => x.toFixed(3)).join("、")}
              ，此处 h(x) = 0。
            </p>
          )}
        </div>
      )}

      {meshData.analysis.warnings.length > 0 && (
        <div className="space-y-1 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[11px] leading-relaxed text-amber-200/90">
          {meshData.analysis.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-violet-500/60" />
          光滑旋转体
        </span>
        {showSlicePreview && (
          <span className="flex items-center gap-2">
            <span className="h-3 w-6 rounded bg-cyan-500/35" />
            {sliceLabel}（教学叠加）
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-6 border-t border-dashed border-amber-400" />
          旋转轴
        </span>
        <span className="text-slate-500">拖动旋转 · 滚轮缩放</span>
      </div>

      <div className="h-[400px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a14]">
        <Canvas
          camera={{
            position: [
              meshData.frame.center[0] + dist * 0.85,
              meshData.frame.center[1] + dist * 0.55,
              meshData.frame.center[2] + dist * 0.85,
            ],
            fov: 45,
          }}
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene
              solidGeometry={meshData.solid!}
              sliceOverlay={meshData.sliceOverlay}
              axisPoints={meshData.axisPoints}
              extent={meshData.frame.extent}
              center={meshData.frame.center}
              viewMode={viewMode}
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
          {isWasher && (
            <>
              <span className="mx-2 text-slate-600">·</span>
              外半径 R(x)、内半径 r(x) 分别对应较远/较近曲线到旋转轴的距离
            </>
          )}
          {!isWasher && (
            <>
              <span className="mx-2 text-slate-600">·</span>
              上下边界分别为 min(f,g) 与 max(f,g) 绕轴旋转，端面 x=a / x=b 封闭
            </>
          )}
        </p>
      )}
    </div>
  );
}
