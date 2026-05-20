"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { parseFunction } from "@/lib/revolve/mathParser";

interface RegionGraph2DProps {
  fExpr: string;
  gExpr: string;
  a: number;
  b: number;
  /** Sample x positions to mark cross-section slices */
  sliceMarkers?: number[];
}

export function RegionGraph2D({
  fExpr,
  gExpr,
  a,
  b,
  sliceMarkers,
}: RegionGraph2DProps) {
  const chartData = useMemo(() => {
    try {
      const f = parseFunction(fExpr);
      const g = parseFunction(gExpr);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const span = hi - lo || 1;
      const pad = span * 0.08;
      const xMin = lo - pad;
      const xMax = hi + pad;
      const steps = 80;
      const dx = (xMax - xMin) / steps;
      const points: {
        x: number;
        f: number;
        g: number;
        region: [number, number];
      }[] = [];

      let yMin = Infinity;
      let yMax = -Infinity;

      for (let i = 0; i <= steps; i++) {
        const x = xMin + i * dx;
        const fv = f(x);
        const gv = g(x);
        const ymin = Math.min(fv, gv);
        const ymax = Math.max(fv, gv);
        yMin = Math.min(yMin, ymin, fv, gv);
        yMax = Math.max(yMax, ymax, fv, gv);
        const inInterval = x >= lo && x <= hi;
        points.push({
          x: Number(x.toFixed(4)),
          f: fv,
          g: gv,
          region: inInterval ? [ymin, ymax] : [ymin, ymin],
        });
      }

      const yPad = (yMax - yMin) * 0.15 || 1;
      return {
        points,
        xDomain: [xMin, xMax] as [number, number],
        yDomain: [yMin - yPad, yMax + yPad] as [number, number],
        interval: [lo, hi] as [number, number],
      };
    } catch {
      return null;
    }
  }, [fExpr, gExpr, a, b]);

  if (!chartData) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-white/5 bg-surface/50 text-xs text-slate-400">
        请输入有效函数以显示区域图。
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData.points}
          margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
        >
          <defs>
            <linearGradient id="region2dFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <XAxis
            dataKey="x"
            type="number"
            domain={chartData.xDomain}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
          />
          <YAxis
            domain={chartData.yDomain}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
          />
          <Tooltip
            contentStyle={{
              background: "#12121f",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              fontSize: 11,
            }}
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value);
              const label =
                name === "f" ? "f(x)" : name === "g" ? "g(x)" : String(name);
              return [Number.isFinite(n) ? n.toFixed(3) : "—", label];
            }}
            labelFormatter={(label) => `x = ${label}`}
          />
          <ReferenceLine
            x={chartData.interval[0]}
            stroke="rgba(6,182,212,0.4)"
            strokeDasharray="4 4"
          />
          <ReferenceLine
            x={chartData.interval[1]}
            stroke="rgba(6,182,212,0.4)"
            strokeDasharray="4 4"
          />
          {sliceMarkers?.map((sx) => (
            <ReferenceLine
              key={sx}
              x={sx}
              stroke="rgba(251,191,36,0.5)"
              strokeDasharray="2 3"
            />
          ))}
          <Area
            type="monotone"
            dataKey="region"
            fill="url(#region2dFill)"
            stroke="none"
          />
          <Line type="monotone" dataKey="f" stroke="#22d3ee" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="g" stroke="#a78bfa" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
