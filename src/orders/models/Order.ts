import { OrderSide } from "./OrderSide.js";
import { OrderStatus } from "./OrderStatus.js";
import { OrderTimeInForce } from "./OrderTimeInForce.js";
import { OrderType } from "./OrderType.js";

export type Order = {
  clientOrderId: string;
  assetId: string;
  qty: number;
  filledQty: number;
  filledAvgPrice: number;
  type: OrderType;
  side: OrderSide;
  timeInForce: OrderTimeInForce;
  status: OrderStatus;
  limitPrice?: number;
  stopPrice?: number;
};
