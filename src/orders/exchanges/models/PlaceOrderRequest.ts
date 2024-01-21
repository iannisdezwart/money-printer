import { AssetSymbol } from "../../../algo-engine/models/AssetSymbol";
import { OrderSide } from "../../models/OrderSide";
import { OrderTimeInForce } from "../../models/OrderTimeInForce";
import { OrderType } from "../../models/OrderType";

export type PlaceOrderRequest = {
  symbol: AssetSymbol;
  clientOrderId: string;
  type: OrderType;
  side: OrderSide;
  qty: number;
  timeInForce: OrderTimeInForce;
  limitPrice?: number;
  stopPrice?: number;
};
