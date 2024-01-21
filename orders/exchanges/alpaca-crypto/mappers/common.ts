import { BidirectionalMap } from "../../../../utils/BidirectionalMap";
import { OrderSide } from "../../models/OrderSide";
import { OrderTimeInForce } from "../../models/OrderTimeInForce";
import { OrderType } from "../../models/OrderType";
import { OrderUpdateEventType } from "../../models/OrderUpdateEvent";
import { AlpacaOrderUpdate } from "../entities/AlpacaOrderUpdate";
import { AlpacaPlaceOrderRequest } from "./AlpacaPlaceOrderMapper";

export namespace AlpacaMappers {
  const evtTypeMap = new BidirectionalMap<
    OrderUpdateEventType,
    AlpacaOrderUpdate["event"]
  >([
    [OrderUpdateEventType.New, "new"],
    [OrderUpdateEventType.Cancel, "canceled"],
    [OrderUpdateEventType.Fill, "fill"],
    [OrderUpdateEventType.PartialFill, "partial_fill"],
  ]);

  export const fromAlpacaEvtType = (
    evt: AlpacaOrderUpdate["event"]
  ): OrderUpdateEventType => {
    if (!evtTypeMap.hasValue(evt)) {
      throw new Error(`Unknown event type: ${evt}`);
    }

    return evtTypeMap.getKey(evt)!;
  };

  const sideMap = new BidirectionalMap<
    OrderSide,
    AlpacaPlaceOrderRequest["side"]
  >([
    [OrderSide.Buy, "buy"],
    [OrderSide.Sell, "sell"],
  ]);

  export const toAlpacaOrderSide = (
    side: OrderSide
  ): AlpacaPlaceOrderRequest["side"] => {
    if (!sideMap.hasKey(side)) {
      throw new Error("Invalid side");
    }

    return sideMap.getValue(side)!;
  };

  const orderTypeMap = new BidirectionalMap<
    OrderType,
    AlpacaPlaceOrderRequest["type"]
  >([
    [OrderType.Market, "market"],
    [OrderType.Limit, "limit"],
    [OrderType.Stop, "stop"],
    [OrderType.StopLimit, "stop_limit"],
    [OrderType.TrailingStop, "trailing_stop"],
  ]);

  export const toAlpacaOrderType = (
    type: OrderType
  ): AlpacaPlaceOrderRequest["type"] => {
    if (!orderTypeMap.hasKey(type)) {
      throw new Error("Invalid order type");
    }

    return orderTypeMap.getValue(type)!;
  };

  const timeInForceMap = new BidirectionalMap<
    OrderTimeInForce,
    AlpacaPlaceOrderRequest["time_in_force"]
  >([
    [OrderTimeInForce.GoodTillDay, "day"],
    [OrderTimeInForce.GoodTillCancel, "gtc"],
    [OrderTimeInForce.ImmediateOrCancel, "ioc"],
    [OrderTimeInForce.FillOrKill, "fok"],
  ]);

  export const toAlpacaTimeInForce = (
    tif: OrderTimeInForce
  ): AlpacaPlaceOrderRequest["time_in_force"] => {
    if (!timeInForceMap.hasKey(tif)) {
      throw new Error("Invalid time in force");
    }

    return timeInForceMap.getValue(tif)!;
  };
}