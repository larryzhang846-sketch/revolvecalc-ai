export interface SurfaceAreaCurvePart {
  curveLabel: "f" | "g";
  exprDisp: string;
  radiusDesc: string;
  radiusLatex: string;
  derivativeDesc: string;
  derivativeLatex: string;
  integrandLatex: string;
  fullIntegralLatex: string;
  evaluatedLatex: string;
  partialArea: number;
}

export interface SurfaceAreaSuccess {
  status: "ok";
  formulaLatex: string;
  totalArea: number;
  curves: SurfaceAreaCurvePart[];
  fullIntegralLatex: string;
  evaluatedLatex: string;
  explanation: string;
}

export interface SurfaceAreaMessage {
  status: "unsupported-axis" | "cross-section";
  message: string;
}

export type SurfaceAreaOutcome = SurfaceAreaSuccess | SurfaceAreaMessage;
