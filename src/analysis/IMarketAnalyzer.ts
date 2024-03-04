import {
  MarketDataService,
  QuoteEvent,
  TradeEvent,
} from "../market-data/MarketDataService.js";
import { EventEmitter } from "../utils/EventEmitter.js";

export abstract class IMarketAnalyzer<Analysis> {
  private analysisEventEmitter = new EventEmitter<Analysis>();

  abstract onQuote(
    quote: QuoteEvent,
    marketDataService: MarketDataService
  ): void;

  abstract onTrade(
    trade: TradeEvent,
    marketDataService: MarketDataService
  ): void;

  onAnalysis(callback: (analysis: Analysis) => void) {
    this.analysisEventEmitter.addEventListener(callback);
  }

  protected emitAnalysis(analysis: Analysis) {
    this.analysisEventEmitter.emit(analysis);
  }
}
