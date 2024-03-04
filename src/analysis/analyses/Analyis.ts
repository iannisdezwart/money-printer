import { MomentumAnalysis } from "./MomentumAnalysis.js";

export type Analysis = MomentumAnalysis;

export type AnalysisBase = {
  timestamp: Date;
  analyzerId: string;
};
