import {
  OrderUpdateEvent
} from "../../models/OrderUpdateEvent";
import { AlpacaOrderUpdate } from "../entities/AlpacaOrderUpdate";
import { AlpacaMappers } from "./common";

export class AlpacaOrderUpdateMapper {
  fromAlpacaOrderUpdate(orderUpdate: AlpacaOrderUpdate): OrderUpdateEvent {
    return {
      eventType: AlpacaMappers.fromAlpacaEvtType(orderUpdate.event),
      clientOrderId: orderUpdate.order.client_order_id,
      externalExecutionId: orderUpdate.execution_id,
      timestamp: new Date(orderUpdate.timestamp),
    };
  }
}
