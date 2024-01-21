import { AbortOrderRequest } from "./models/AbortOrderRequest";
import { OrderUpdateEventHandler } from "./models/OrderUpdateEvent";
import { PatchOrderRequest } from "./models/PatchOrderRequest";
import { PlaceOrderRequest } from "./models/PlaceOrderRequest";

export abstract class IExchange {
  onOrderUpdate?: OrderUpdateEventHandler;
  addOrderUpdateListener(onOrderUpdate: OrderUpdateEventHandler): void {
    this.onOrderUpdate = onOrderUpdate;
  }

  abstract placeOrder(req: PlaceOrderRequest): void;
  abstract patchOrder(req: PatchOrderRequest): void;
  abstract abortOrder(req: AbortOrderRequest): void;
}
