import { AssetSymbol } from "../../algo-engine/models/AssetSymbol";
import { OrderSide } from "./OrderSide";
import { OrderStatus } from "./OrderStatus";
import { OrderTimeInForce } from "./OrderTimeInForce";
import { OrderType } from "./OrderType";

export type Order = {
  clientOrderId: string;
  symbol: AssetSymbol;
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
