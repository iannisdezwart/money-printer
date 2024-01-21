import { OrderUpdateEvent } from "./exchanges/models/OrderUpdateEvent";

export class OpenOrders {
  update(orderUpdateEvent: OrderUpdateEvent) {}

  static async create(): Promise<OpenOrders> {
    return new OpenOrders();
  }
}
