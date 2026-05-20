export type CalculationMode = "revolution" | "cross-section";

export type AxisMode = "x-axis" | "y-axis" | "y=k" | "x=k";

export type VolumeMethod = "washer" | "shell";

export type CrossSectionShape =
  | "square"
  | "semicircle"
  | "equilateral"
  | "rectangle";

export interface RevolveInput {
  fExpr: string;
  gExpr: string;
  a: number;
  b: number;
  axisMode: AxisMode;
  k?: number;
}

export interface CrossSectionInput {
  fExpr: string;
  gExpr: string;
  a: number;
  b: number;
  shape: CrossSectionShape;
  rectangleK?: number;
}

export interface SolutionStep {
  number: number;
  title: string;
  body: string;
  latex?: string;
}

export interface IntegralSetup {
  method: VolumeMethod | "cross-section";
  variable: "x" | "y";
  bounds: [number, number];
  integrandLatex: string;
  fullIntegralLatex: string;
  evaluatedLatex: string;
}

export interface VolumeResult {
  kind: "revolution";
  volume: number;
  volumeExact?: string;
  method: VolumeMethod;
  steps: SolutionStep[];
  integral: IntegralSetup;
  outerRadiusDesc: string;
  innerRadiusDesc: string;
  outerRadiusLatex: string;
  innerRadiusLatex: string;
  aiExplanation: string;
  warning?: string;
  graphMeta: {
    axisLabel: string;
    axisValue: number;
    methodLabel: string;
  };
}

export interface CrossSectionResult {
  kind: "cross-section";
  volume: number;
  steps: SolutionStep[];
  integral: IntegralSetup;
  shape: CrossSectionShape;
  shapeLabel: string;
  baseLatex: string;
  areaLatex: string;
  areaDesc: string;
  aiExplanation: string;
  warning?: string;
}

export type CalculationResult = VolumeResult | CrossSectionResult;

export interface ExampleProblem {
  id: string;
  label: string;
  fExpr: string;
  gExpr: string;
  a: number;
  b: number;
  mode: CalculationMode;
  axisMode?: AxisMode;
  k?: number;
  crossShape?: CrossSectionShape;
  rectangleK?: number;
}
