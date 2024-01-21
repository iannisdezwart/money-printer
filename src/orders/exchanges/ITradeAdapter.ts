import { Exchange } from "../../algo-engine/models/Exchange";
import { AbortOrderRequest } from "./models/AbortOrderRequest";
import { OrderUpdateEvent } from "./models/OrderUpdateEvent";
import { PatchOrderRequest } from "./models/PatchOrderRequest";
import { PlaceOrderRequest } from "./models/PlaceOrderRequest";

export abstract class ITradeAdapter {
  abstract get exchanges(): Exchange[];

  onOrderUpdate?: OrderUpdateEvent.Handler;
  addOrderUpdateListener(onOrderUpdate: OrderUpdateEvent.Handler): void {
    this.onOrderUpdate = onOrderUpdate;
  }

  abstract placeOrder(req: PlaceOrderRequest): void;
  abstract patchOrder(req: PatchOrderRequest): void;
  abstract abortOrder(req: AbortOrderRequest): void;
}
