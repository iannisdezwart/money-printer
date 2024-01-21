import { OrderSide } from "./OrderSide";
import { OrderTimeInForce } from "./OrderTimeInForce";
import { OrderType } from "./OrderType";

export type PlaceOrderRequest = {
  symbol: string;
  clientOrderId: string;
  type: OrderType;
  side: OrderSide;
  qty?: number;
  timeInForce: OrderTimeInForce;
  limitPrice?: number;
  stopPrice?: number;
};
