import { Exchange } from "./Exchange.js";

export type Asset = {
  id: string;
  exchange: Exchange;
  symbol: string;
  qtyDecimals: number;
  priceDecimals: number;
};
