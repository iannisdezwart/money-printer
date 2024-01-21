import { OrderBookEntry } from "../OrderBook";

export enum OrderBookUpdateType {
  Replace,
  Update,
}

export type OrderBookUpdate = {
  timestamp: Date;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  type: OrderBookUpdateType;
};
