import { BidirectionalMap } from "../../../../utils/BidirectionalMap.js";
import { OrderSide } from "../../../models/OrderSide.js";
import { OrderStatus } from "../../../models/OrderStatus.js";
import { OrderTimeInForce } from "../../../models/OrderTimeInForce.js";
import { OrderType } from "../../../models/OrderType.js";
import { AlpacaOrder } from "../entities/AlpacaOrderUpdate.js";
import { AlpacaPlaceOrderRequest } from "./AlpacaPlaceOrderMapper.js";

export namespace AlpacaMappers {
  const statusMap = new BidirectionalMap<OrderStatus, AlpacaOrder["status"]>([
    [OrderStatus.New, "new"],
    [OrderStatus.Cancelled, "canceled"],
    [OrderStatus.Filled, "filled"],
    [OrderStatus.PartiallyFilled, "partially_filled"],
  ]);

  export const fromAlpacaOrderStatus = (
    evt: AlpacaOrder["status"]
  ): OrderStatus => {
    if (!statusMap.hasValue(evt)) {
      throw new Error(`Unknown event type: ${evt}`);
    }

    return statusMap.getKey(evt)!;
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
