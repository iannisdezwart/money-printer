import { IMarketAnalyzer } from "../IMarketAnalyzer.js";

export type MomentumAnalysis = {
    momentum: number;
    date: Date;
};

export class MomentumAnalyzer extends IMarketAnalyzer<MomentumAnalysis> {
    
}
