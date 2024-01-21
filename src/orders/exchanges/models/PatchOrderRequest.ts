import { OrderTimeInForce } from "./OrderTimeInForce";

export type PatchOrderRequest = {
  clientOrderId: string;
  newQty?: number;
  newTimeInForce?: OrderTimeInForce;
  newLimitPrice?: number;
  newStopPrice?: number;
};
