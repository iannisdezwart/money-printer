import { Exchange } from "../../algo-engine/models/Exchange.js";
import { AbortOrderRequest } from "./models/AbortOrderRequest.js";
import { OrderUpdateEvent } from "./models/OrderUpdateEvent.js";
import { PatchOrderRequest } from "./models/PatchOrderRequest.js";
import { PlaceOrderRequest } from "./models/PlaceOrderRequest.js";

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
