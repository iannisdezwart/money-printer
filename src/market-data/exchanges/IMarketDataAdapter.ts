import { Exchange } from "../../algo-engine/models/Exchange";
import { OrderBook } from "../OrderBook";
import { Bar } from "../models/Bar";
import { OrderBookUpdate } from "../models/OrderBookUpdate";

export abstract class IMarketDataAdapter {
  constructor(
    private orderBooks: Map<string, OrderBook>,
    private cryptoBars: Map<string, Bar[]>
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

  protected updateOrderBook(symbol: string, orderBook: OrderBookUpdate) {
    if (!this.orderBooks.has(symbol)) {
      this.orderBooks.set(symbol, new OrderBook());
    }

    this.orderBooks.get(symbol)!.update(orderBook);
  }

  getBars(symbol: string) {
    return this.cryptoBars.get(symbol) || [];
  }

  getOrderBook(symbol: string) {
    return this.orderBooks.get(symbol);
  }
}
