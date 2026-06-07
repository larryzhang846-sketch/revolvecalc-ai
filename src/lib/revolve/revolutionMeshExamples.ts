/**
 * Reference cases for revolution 3D mesh generation.
 * Run: npx tsx src/lib/revolve/revolutionMeshExamples.ts
 */
import { resolveRevolutionAxis } from "./axisParser";
import { parseFunction } from "./mathParser";
import {
  analyzeRevolutionRegion,
  findFunctionIntersections,
  sampleRegionAt,
  verticalBoundaryAt,
  horizontalBoundaryAt,
} from "./revolutionRegion";
import { buildRevolutionMeshes } from "./solidMesh";

export interface RevolutionMeshExample {
  id: string;
  label: string;
  fExpr: string;
  gExpr: string;
  a: number;
  b: number;
  axisMode: "x-axis" | "y-axis" | "y=k" | "x=k";
  k?: number;
  expect: string;
}

export const REVOLUTION_MESH_EXAMPLES: RevolutionMeshExample[] = [
  {
    id: "A",
    label: "Cylinder outside, curved hollow inside",
    fExpr: "4",
    gExpr: "x^3",
    a: 0,
    b: 1.5874,
    axisMode: "x-axis",
    expect: "washer with outer R=4 and inner r=x^3",
  },
  {
    id: "B",
    label: "Cone-like solid",
    fExpr: "x",
    gExpr: "0",
    a: 0,
    b: 4,
    axisMode: "x-axis",
    expect: "cone revolving y=x around x-axis",
  },
  {
    id: "C",
    label: "Smooth curved solid",
    fExpr: "sqrt(x)",
    gExpr: "0",
    a: 0,
    b: 4,
    axisMode: "x-axis",
    expect: "curved surface from sqrt(x)",
  },
  {
    id: "D",
    label: "Shell solid with changing height (crossing inside interval)",
    fExpr: "4",
    gExpr: "x^2 + 3",
    a: 0,
    b: 2,
    axisMode: "y-axis",
    expect: "height varies: 1 at x=0, 0 at x=1, 3 at x=2 — not a constant cylinder",
  },
  {
    id: "E",
    label: "Shell solid with varying height",
    fExpr: "4",
    gExpr: "x^2",
    a: 0,
    b: 2,
    axisMode: "y-axis",
    expect: "height = 4 - x^2 decreases along x",
  },
];

function validateExample(ex: RevolutionMeshExample): {
  ok: boolean;
  messages: string[];
} {
  const messages: string[] = [];
  try {
    const f = parseFunction(ex.fExpr);
    const g = parseFunction(ex.gExpr);
    const axis = resolveRevolutionAxis({
      fExpr: ex.fExpr,
      gExpr: ex.gExpr,
      a: ex.a,
      b: ex.b,
      axisMode: ex.axisMode,
      k: ex.k,
    });
    const lo = Math.min(ex.a, ex.b);
    const hi = Math.max(ex.a, ex.b);
    const analysis = analyzeRevolutionRegion(f, g, lo, hi, axis);
    const { solid } = buildRevolutionMeshes(f, g, lo, hi, axis, {}, false);

    if (!solid) {
      messages.push("FAIL: no mesh generated");
      return { ok: false, messages };
    }

    const pos = solid.getAttribute("position");
    if (!pos || pos.count < 100) {
      messages.push("FAIL: mesh too small or empty");
      return { ok: false, messages };
    }

    if (analysis.method === "shell") {
      messages.push(`OK: closed shell solid, ${pos.count} verts`);
    }

    if (ex.id === "D") {
      const roots = findFunctionIntersections(f, g, lo, hi);
      if (roots.length === 0) {
        messages.push("FAIL: expected intersection near x=1");
      } else {
        messages.push(`OK: intersection at x ≈ ${roots[0].toFixed(3)}`);
      }
      const h0 = sampleRegionAt(lo, f, g)?.height ?? 0;
      const h2 = sampleRegionAt(hi, f, g)?.height ?? 0;
      if (Math.abs(h0 - h2) < 0.01) {
        messages.push("FAIL: height should differ at endpoints");
      } else {
        messages.push(`OK: height at a=${h0.toFixed(2)}, at b=${h2.toFixed(2)}`);
      }
      if (!analysis.heightVaries) {
        messages.push("FAIL: heightVaries should be true");
      }
    }

    if (ex.id === "E") {
      const mid = verticalBoundaryAt((lo + hi) / 2, f, g, axis as Extract<typeof axis, { kind: "vertical" }>);
      const end = verticalBoundaryAt(hi, f, g, axis as Extract<typeof axis, { kind: "vertical" }>);
      if (mid && end && mid.height <= end.height) {
        messages.push("FAIL: height should decrease from mid to b for f=4, g=x^2");
      } else {
        messages.push(`OK: shell height mid=${mid?.height.toFixed(2)} end=${end?.height.toFixed(2)}`);
      }
    }

    if (ex.axisMode === "x-axis" && ex.id === "A") {
      const mid = horizontalBoundaryAt(
        (lo + hi) / 2,
        f,
        g,
        axis as Extract<typeof axis, { kind: "horizontal" }>,
        lo,
        hi
      );
      if (!mid?.hasHole) {
        messages.push("FAIL: should have inner hole");
      } else {
        messages.push(`OK: R=${mid.outerRadius.toFixed(2)} r=${mid.innerRadius.toFixed(3)}`);
      }
    }

    messages.push(`mesh vertices: ${pos.count}`);
    messages.push(`method: ${analysis.method}`);
    return { ok: !messages.some((m) => m.startsWith("FAIL")), messages };
  } catch (e) {
    messages.push(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    return { ok: false, messages };
  }
}

export function runRevolutionMeshExamples(): void {
  console.log("Revolution mesh examples\n");
  for (const ex of REVOLUTION_MESH_EXAMPLES) {
    const { ok, messages } = validateExample(ex);
    console.log(`${ok ? "✓" : "✗"} [${ex.id}] ${ex.label}`);
    for (const m of messages) console.log(`    ${m}`);
    console.log(`    expect: ${ex.expect}\n`);
  }
}
