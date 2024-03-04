import {
  AlpacaBar,
  AlpacaQuote,
  AlpacaTrade,
} from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2.js";
import { EventEmitter } from "../../../../utils/EventEmitter.js";

export abstract class IAlpacaUsEquityMarketDataStreamSource {
  protected stockBarEmitter = new EventEmitter<AlpacaBar>();
  protected stockBarUpdateEmitter = new EventEmitter<AlpacaBar>();
  protected quoteEmitter = new EventEmitter<AlpacaQuote>();
  protected tradeEmitter = new EventEmitter<AlpacaTrade>();

  abstract subscribe(symbols: string[]): Promise<void>;

  protected emitStockBar(bar: AlpacaBar) {
    this.stockBarEmitter.emit(bar);
  }

  protected emitStockBarUpdate(bar: AlpacaBar) {
    this.stockBarUpdateEmitter.emit(bar);
  }

  protected emitQuote(quote: AlpacaQuote) {
    this.quoteEmitter.emit(quote);
  }

  protected emitTrade(trade: AlpacaTrade) {
    this.tradeEmitter.emit(trade);
  }

  onStockBar(callback: (bar: AlpacaBar) => void) {
    this.stockBarEmitter.addEventListener(callback);
  }

  onStockBarUpdate(callback: (bar: AlpacaBar) => void) {
    this.stockBarUpdateEmitter.addEventListener(callback);
  }

  onQuote(callback: (quote: AlpacaQuote) => void) {
    this.quoteEmitter.addEventListener(callback);
  }

  onTrade(callback: (trade: AlpacaTrade) => void) {
    this.tradeEmitter.addEventListener(callback);
  }
}
