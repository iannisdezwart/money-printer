import { AnalysisBase } from "./Analyis.js";

export type MomentumAnalysis = AnalysisBase & {
  assetId: string;
  bidMomentum: number;
  bidMomentumError: number;
  bidTrend: [number, Date][];
  askMomentum: number;
  askMomentumError: number;
  askTrend: [number, Date][];
  resolution: number;
};
