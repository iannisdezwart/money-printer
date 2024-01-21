import { OrderTimeInForce } from "../../models/OrderTimeInForce";

export type PatchOrderRequest = {
  clientOrderId: string;
  newQty?: number;
  newTimeInForce?: OrderTimeInForce;
  newLimitPrice?: number;
  newStopPrice?: number;
};
