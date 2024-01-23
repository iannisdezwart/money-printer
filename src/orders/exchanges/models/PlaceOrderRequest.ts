import { OrderSide } from "../../models/OrderSide.js";
import { OrderTimeInForce } from "../../models/OrderTimeInForce.js";
import { OrderType } from "../../models/OrderType.js";

export type PlaceOrderRequest = {
  assetId: string;
  clientOrderId: string;
  type: OrderType;
  side: OrderSide;
  qty: number;
  timeInForce: OrderTimeInForce;
  limitPrice?: number;
  stopPrice?: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
};
