import { MarketDataService } from "../market-data/MarketDataService.js";
import { EventEmitter } from "../utils/EventEmitter.js";

export abstract class IMarketAnalyzer<Analysis> {
  private analysisEventEmitter = new EventEmitter<Analysis>();

  protected constructor(private marketDataService: MarketDataService) {}

  abstract run(): void;

  onAnalysis(callback: (analysis: Analysis) => void) {
    this.analysisEventEmitter.addEventListener(callback);
  }

  protected emitAnalysis(analysis: Analysis) {
    this.analysisEventEmitter.emit(analysis);
  }
}
