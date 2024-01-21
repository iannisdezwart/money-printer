import { PlaceOrderRequest } from "../../models/PlaceOrderRequest";
import { AlpacaMappers } from "./common";

export interface AlpacaPlaceOrderRequest {
  symbol: string;
  qty?: number;
  notional?: number;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  time_in_force: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price?: number;
  stop_price?: number;
  client_order_id?: string;
  extended_hours?: boolean;
  order_class?: string;
  take_profit?: object;
  stop_loss?: object;
  trail_price?: string;
  trail_percent?: string;
}

export class AlpacaPlaceOrderMapper {

  toAlpacaPlaceOrderRequest(req: PlaceOrderRequest): AlpacaPlaceOrderRequest {
    return {
      symbol: req.symbol,
      qty: req.qty,
      side: AlpacaMappers.toAlpacaOrderSide(req.side),
      type: AlpacaMappers.toAlpacaOrderType(req.type),
      time_in_force: AlpacaMappers.toAlpacaTimeInForce(req.timeInForce),
    };
  }
}
