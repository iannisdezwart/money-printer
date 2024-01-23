import { OrderStatus } from "../../models/OrderStatus.js";

export type OrderUpdateEvent =
  | OrderUpdateEvent.Sent
  | OrderUpdateEvent.New
  | OrderUpdateEvent.PartiallyFilled
  | OrderUpdateEvent.Filled
  | OrderUpdateEvent.Cancelled
  | OrderUpdateEvent.Rejected;

export namespace OrderUpdateEvent {
  export type Handler = (event: OrderUpdateEvent) => void;

  type Base = {
    clientOrderId: string;
    timestamp: Date;
    externalExecutionId: string;
  };

  export type Sent = Base & {
    orderStatus: OrderStatus.Sent;
  };

  export type New = Base & {
    orderStatus: OrderStatus.New;
  };

  export type PartiallyFilled = Base & {
    orderStatus: OrderStatus.PartiallyFilled;
    filledQty: number;
    filledAvgPrice: number;
  };

  export type Filled = Base & {
    orderStatus: OrderStatus.Filled;
    filledQty: number;
    filledAvgPrice: number;
  };

  export type Cancelled = Base & {
    orderStatus: OrderStatus.Cancelled;
  };

  export type Rejected = Base & {
    orderStatus: OrderStatus.Rejected;
  };
}
