import { OrderUpdateEvent } from "../exchanges/models/OrderUpdateEvent.js";
import { PlaceOrderRequest } from "../exchanges/models/PlaceOrderRequest.js";
import { Order } from "../models/Order.js";
import { OrderStatus } from "../models/OrderStatus.js";

export class OpenOrders {
  constructor(private orderMap: Map<string, Order>) {}

  static async create(): Promise<OpenOrders> {
    return new OpenOrders(new Map());
  }

  getOrder(clientOrderId: string): Order | undefined {
    return this.orderMap.get(clientOrderId);
  }

  trackOrder(placeOrderRequest: PlaceOrderRequest) {
    const order: Order = {
      clientOrderId: placeOrderRequest.clientOrderId,
      assetId: placeOrderRequest.assetId,
      qty: placeOrderRequest.qty,
      filledQty: 0,
      filledAvgPrice: 0,
      type: placeOrderRequest.type,
      side: placeOrderRequest.side,
      timeInForce: placeOrderRequest.timeInForce,
      status: OrderStatus.Sent,
      limitPrice: placeOrderRequest.limitPrice,
      stopPrice: placeOrderRequest.stopPrice,
    };

    this.orderMap.set(order.clientOrderId, order);
  }

  handleOrderUpdate(orderUpdateEvent: OrderUpdateEvent) {
    const order = this.orderMap.get(orderUpdateEvent.clientOrderId);

    if (!order) {
      throw new Error(
        `Received order update untracked unknown order: ${orderUpdateEvent.clientOrderId}`
      );
    }

    order.status = orderUpdateEvent.orderStatus;

    if (orderUpdateEvent.orderStatus === OrderStatus.PartiallyFilled) {
      order.filledQty = orderUpdateEvent.filledQty;
      order.filledAvgPrice = orderUpdateEvent.filledAvgPrice;
    }

    if (orderUpdateEvent.orderStatus === OrderStatus.Filled) {
      order.filledQty = orderUpdateEvent.filledQty;
      order.filledAvgPrice = orderUpdateEvent.filledAvgPrice;
    }
  }
}
