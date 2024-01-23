import { OrderTimeInForce } from "../../models/OrderTimeInForce.js";

export type PatchOrderRequest = {
  clientOrderId: string;
  newQty?: number;
  newTimeInForce?: OrderTimeInForce;
  newLimitPrice?: number;
  newStopPrice?: number;
};
