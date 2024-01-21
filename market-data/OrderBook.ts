import { CryptoOrderbook } from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2";

type OrderBookEntry = {
  price: number;
  qty: number;
};

export type OrderBookUpdate = CryptoOrderbook & {
  S: string;
  r: boolean;
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
    if (orderBookUpdate.r) {
      this.bids = orderBookUpdate.Bids.map((bid) => ({
        price: bid.Price,
        qty: bid.Size,
      }));
      this.asks = orderBookUpdate.Asks.map((ask) => ({
        price: ask.Price,
        qty: ask.Size,
      }));
      return;
    }

    for (const bid of orderBookUpdate.Bids) {
      const index = this.bids.findIndex((b) => b.price === bid.Price);
      if (index === -1) {
        this.bids.push({
          price: bid.Price,
          qty: bid.Size,
        });
        this.bids.sort((a, b) => b.price - a.price);
      } else {
        this.bids[index].qty = bid.Size;

        if (this.bids[index].qty === 0) {
          this.bids.splice(index, 1);
        }
      }
    }

    for (const ask of orderBookUpdate.Asks) {
      const index = this.asks.findIndex((a) => a.price === ask.Price);
      if (index === -1) {
        this.asks.push({
          price: ask.Price,
          qty: ask.Size,
        });
        this.asks.sort((a, b) => a.price - b.price);
      } else {
        this.asks[index].qty = ask.Size;

        if (this.asks[index].qty === 0) {
          this.asks.splice(index, 1);
        }
      }
    }
  }
}
