import type {
  AxisMode,
  CalculationMode,
  CrossSectionShape,
} from "@/types/revolve";

/** 保存在 localStorage 中的单次计算记录 */
export interface CalculationHistoryEntry {
  id: string;
  calculationMode: CalculationMode;
  fExpr: string;
  gExpr: string;
  a: number;
  b: number;
  /** 旋转体：旋转轴描述；截面法：截面形状描述 */
  modeDetailLabel: string;
  volume: number;
  createdAt: string;
  axisMode?: AxisMode;
  k?: number;
  crossSectionShape?: CrossSectionShape;
  rectangleK?: number;
}
