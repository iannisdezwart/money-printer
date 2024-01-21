export enum OrderUpdateEventType {
  New,
  Fill,
  PartialFill,
  Cancel,
}

export type OrderUpdateEvent = {
  clientOrderId: string;
  eventType: OrderUpdateEventType;
  timestamp: Date;
  externalExecutionId: string;
};

export type OrderUpdateEventHandler = (event: OrderUpdateEvent) => void;
