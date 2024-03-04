import { binarySearch } from "../../utils/binary-search.js";
import { IMarketAnalyzer } from "../IMarketAnalyzer.js";
import { Analysis } from "../analyses/Analyis.js";

export type AnalyisBuffererOptions = {
  maxBufferSize?: number;
  maxBufferTimeMs?: number;
};

export class AnalysisBufferer<T extends Analysis> {
  private analysisBuffer: T[] = [];

  private constructor(private analyzer: IMarketAnalyzer<T>) {}

  private init() {
    this.analyzer.onAnalysis((analysis) => {
      this.analysisBuffer.push(analysis);
    });

    return this;
  }

  static create<T extends Analysis>(analyzer: IMarketAnalyzer<T>) {
    return new AnalysisBufferer(analyzer).init();
  }

  getLatestAnalysisLimit(limit: number) {
    return this.analysisBuffer.slice(-limit);
  }

  getLatestAnalysisSince(from: Date) {
    return this.analysisBuffer.slice(
      binarySearch(
        this.analysisBuffer,
        (analysis) => analysis.timestamp.getTime() >= from.getTime()
      )
    );
  }
}
