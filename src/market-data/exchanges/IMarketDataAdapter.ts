import { Exchange } from "../../algo-engine/models/Exchange.js";
import { EventEmitter } from "../../utils/EventEmitter.js";
import { binarySearch } from "../../utils/binary-search.js";
import { OrderBook } from "../OrderBook.js";
import { Bar } from "../models/Bar.js";
import { OrderBookUpdate } from "../models/OrderBookUpdate.js";
import { Quote } from "../models/Quote.js";
import { Trade } from "../models/Trade.js";

type QuoteEventForSymbol = {
  symbol: string;
  quote: Quote;
};

type TradeEventForSymbol = {
  symbol: string;
  trade: Trade;
};

export abstract class IMarketDataAdapter {
  quoteEmitter = new EventEmitter<QuoteEventForSymbol>();
  tradeEmitter = new EventEmitter<TradeEventForSymbol>();

  constructor(
    private orderBooks: Map<string, OrderBook>,
    private cryptoBars: Map<string, Bar[]>,
    private quotes: Map<string, Quote[]>,
    private trades: Map<string, Trade[]>
  ) {}

  abstract get exchanges(): Exchange[];

  protected addBar(symbol: string, bar: Bar) {
    if (!this.cryptoBars.has(symbol)) {
      this.cryptoBars.set(symbol, []);
    }

    this.cryptoBars.get(symbol)!.push(bar);
  }

  protected replaceBar(symbol: string, bar: Bar) {
    if (!this.cryptoBars.has(symbol)) {
      this.cryptoBars.set(symbol, []);
    }

    this.cryptoBars.get(symbol)![this.cryptoBars.get(symbol)!.length - 1] = bar;
  }

  protected addTrade(symbol: string, trade: Trade) {
    if (!this.trades.has(symbol)) {
      this.trades.set(symbol, []);
    }

    this.trades.get(symbol)!.push(trade);
    this.tradeEmitter.emit({ symbol, trade });
  }

  protected addQuote(symbol: string, quote: Quote) {
    if (!this.quotes.has(symbol)) {
      this.quotes.set(symbol, []);
    }

    this.quotes.get(symbol)!.push(quote);
    this.quoteEmitter.emit({ symbol, quote });
  }

  protected updateOrderBook(symbol: string, orderBook: OrderBookUpdate) {
    if (!this.orderBooks.has(symbol)) {
      this.orderBooks.set(symbol, new OrderBook());
    }

    this.orderBooks.get(symbol)!.update(orderBook);
  }

  getBars(symbol: string) {
    return this.cryptoBars.get(symbol) || [];
  }

  getLatestTrades(symbol: string, from: Date) {
    const trades = this.trades.get(symbol);
    if (trades == null || trades.length === 0) {
      return [];
    }
    const idx = binarySearch(trades, (t) => t.timestamp >= from);
    return trades.slice(idx);
  }

  getLatestQuotes(symbol: string, from: Date) {
    const quotes = this.quotes.get(symbol);
    if (quotes == null || quotes.length === 0) {
      return [];
    }
    const idx = binarySearch(quotes, (q) => q.timestamp >= from);
    return quotes.slice(idx);
  }

  getOrderBook(symbol: string) {
    return this.orderBooks.get(symbol);
  }
}
