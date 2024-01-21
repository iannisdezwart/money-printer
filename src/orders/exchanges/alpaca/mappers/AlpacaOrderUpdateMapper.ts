import { OrderStatus } from "../../../models/OrderStatus";
import { OrderUpdateEvent } from "../../models/OrderUpdateEvent";
import { AlpacaOrderUpdate } from "../entities/AlpacaOrderUpdate";

export class AlpacaOrderUpdateMapper {
  private fromAlpacaNewOrder(orderUpdate: AlpacaOrderUpdate): OrderUpdateEvent {
    return {
      orderStatus: OrderStatus.New,
      clientOrderId: orderUpdate.order.client_order_id,
      externalExecutionId: orderUpdate.execution_id,
      timestamp: new Date(orderUpdate.timestamp),
    };
  }

  private fromAlpacaFilledOrder(
    orderUpdate: AlpacaOrderUpdate
  ): OrderUpdateEvent {
    return {
      orderStatus: OrderStatus.Filled,
      clientOrderId: orderUpdate.order.client_order_id,
      externalExecutionId: orderUpdate.execution_id,
      timestamp: new Date(orderUpdate.timestamp),
      filledQty: parseFloat(orderUpdate.order.filled_qty),
      filledAvgPrice: parseFloat(orderUpdate.order.filled_avg_price || ""),
    };
  }

  private fromAlpacaPartiallyFilledOrder(
    orderUpdate: AlpacaOrderUpdate
  ): OrderUpdateEvent {
    return {
      orderStatus: OrderStatus.PartiallyFilled,
      clientOrderId: orderUpdate.order.client_order_id,
      externalExecutionId: orderUpdate.execution_id,
      timestamp: new Date(orderUpdate.timestamp),
      filledQty: parseFloat(orderUpdate.order.filled_qty),
      filledAvgPrice: parseFloat(orderUpdate.order.filled_avg_price || ""),
    };
  }

  private fromAlpacaCancelledOrder(
    orderUpdate: AlpacaOrderUpdate
  ): OrderUpdateEvent {
    return {
      orderStatus: OrderStatus.Cancelled,
      clientOrderId: orderUpdate.order.client_order_id,
      externalExecutionId: orderUpdate.execution_id,
      timestamp: new Date(orderUpdate.timestamp),
    };
  }

  private fromAlpacaRejectedOrder(
    orderUpdate: AlpacaOrderUpdate
  ): OrderUpdateEvent {
    return {
      orderStatus: OrderStatus.Rejected,
      clientOrderId: orderUpdate.order.client_order_id,
      externalExecutionId: orderUpdate.execution_id,
      timestamp: new Date(orderUpdate.timestamp),
    };
  }

  fromAlpacaOrderUpdate(orderUpdate: AlpacaOrderUpdate): OrderUpdateEvent {
    switch (orderUpdate.event) {
      case "new":
        return this.fromAlpacaNewOrder(orderUpdate);
      case "fill":
        return this.fromAlpacaFilledOrder(orderUpdate);
      case "partial_fill":
        return this.fromAlpacaPartiallyFilledOrder(orderUpdate);
      case "canceled":
        return this.fromAlpacaCancelledOrder(orderUpdate);
      case "rejected":
        return this.fromAlpacaRejectedOrder(orderUpdate);
      default:
        // TODO: Handle other order update events.
        throw new Error(`Unknown order update event: ${orderUpdate.event}`);
    }
  }
}
