import { Asset } from "../../../../algo-engine/models/Asset.js";
import { OrderSide } from "../../../models/OrderSide.js";
import { PlaceOrderRequest } from "../../models/PlaceOrderRequest.js";
import { AlpacaMappers } from "./common.js";

export interface AlpacaPlaceOrderRequest {
  symbol: string;
  qty?: string;
  notional?: number;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  time_in_force: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price?: string;
  stop_price?: string;
  client_order_id?: string;
  extended_hours?: boolean;
  order_class?: "" | "simple" | "bracket" | "oco" | "oto";
  take_profit?: {
    limit_price?: string;
    stop_price?: string;
  };
  stop_loss?: {
    limit_price?: string;
    stop_price?: string;
  };
  trail_price?: string;
  trail_percent?: string;
}

export class AlpacaPlaceOrderMapper {
  private constructor(private assets: Map<string, Asset>) {}

  static create(assets: Map<string, Asset>) {
    return new AlpacaPlaceOrderMapper(assets);
  }

  private workOutOrderClass(req: PlaceOrderRequest) {
    if (req.takeProfitPrice != null && req.stopLossPrice != null) {
      return "bracket";
    }

    if (req.stopLossPrice != null) {
      return "oto";
    }

    return "simple";
  }

  toAlpacaPlaceOrderRequest(req: PlaceOrderRequest): AlpacaPlaceOrderRequest {
    const asset = this.assets.get(req.assetId);

    if (!asset) {
      throw new Error(`No asset found for id ${req.assetId}`);
    }

    const mapped: AlpacaPlaceOrderRequest = {
      symbol: asset.symbol,
      qty: req.qty.toFixed(asset.qtyDecimals),
      side: AlpacaMappers.toAlpacaOrderSide(req.side),
      type: AlpacaMappers.toAlpacaOrderType(req.type),
      time_in_force: AlpacaMappers.toAlpacaTimeInForce(req.timeInForce),
      limit_price: req.limitPrice?.toFixed(asset.priceDecimals),
      stop_price: req.stopPrice?.toFixed(asset.priceDecimals),
      client_order_id: req.clientOrderId,
      order_class: this.workOutOrderClass(req),
    };

    if (req.takeProfitPrice != null) {
      mapped.take_profit = {
        limit_price: req.takeProfitPrice.toFixed(asset.priceDecimals),
      };
    }

    if (req.stopLossPrice != null) {
      mapped.stop_loss = {
        limit_price: (
          req.stopLossPrice + (req.side == OrderSide.Buy ? -0.01 : +0.01)
        ).toFixed(asset.priceDecimals),
        stop_price: req.stopLossPrice.toFixed(asset.priceDecimals),
      };
    }

    return mapped;
  }
}
