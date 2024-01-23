import { OrderBookUpdate, OrderBookUpdateType } from "./models/OrderBookUpdate.js";

export type OrderBookEntry = {
  price: number;
  qty: number;
};

export class OrderBook {
  private bids: OrderBookEntry[];
  private asks: OrderBookEntry[];

  constructor() {
    this.bids = [];
    this.asks = [];
  }

  getBids(): OrderBookEntry[] {
    return this.bids;
  }

  getAsks(): OrderBookEntry[] {
    return this.asks;
  }

  update(orderBookUpdate: OrderBookUpdate) {
    if (orderBookUpdate.type == OrderBookUpdateType.Replace) {
      this.bids = orderBookUpdate.bids;
      this.asks = orderBookUpdate.asks;
      return;
    }

    if (orderBookUpdate.type == OrderBookUpdateType.Update) {
      for (const bid of orderBookUpdate.bids) {
        const index = this.bids.findIndex((b) => b.price === bid.price);
        if (index === -1) {
          this.bids.push(bid);
          this.bids.sort((a, b) => b.price - a.price);
        } else {
          this.bids[index].qty = bid.qty;

          if (this.bids[index].qty === 0) {
            this.bids.splice(index, 1);
          }
        }
      }

      for (const ask of orderBookUpdate.asks) {
        const index = this.asks.findIndex((a) => a.price === ask.price);
        if (index === -1) {
          this.asks.push(ask);
          this.asks.sort((a, b) => a.price - b.price);
        } else {
          this.asks[index].qty = ask.qty;

          if (this.asks[index].qty === 0) {
            this.asks.splice(index, 1);
          }
        }
      }

      return;
    }

    throw new Error("Invalid order book update type");
  }
}
