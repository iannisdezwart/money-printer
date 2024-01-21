import { PatchOrderRequest } from "../../models/PatchOrderRequest";
import { AlpacaMappers } from "./common";

export interface AlpacaPatchOrderRequest {
  qty?: number;
  time_in_force?: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price?: number;
  stop_price?: number;
  trail?: string;
  client_order_id?: string;
}

export class AlpacaPatchOrderMapper {
  toAlpacaPatchOrderRequest(req: PatchOrderRequest): AlpacaPatchOrderRequest {
    const mappedReq: AlpacaPatchOrderRequest = {};

    if (req.newQty) {
      mappedReq.qty = req.newQty;
    }

    if (req.newTimeInForce) {
      mappedReq.time_in_force = AlpacaMappers.toAlpacaTimeInForce(
        req.newTimeInForce
      );
    }

    if (req.newLimitPrice) {
      mappedReq.limit_price = req.newLimitPrice;
    }

    if (req.newStopPrice) {
      mappedReq.stop_price = req.newStopPrice;
    }

    return mappedReq;
  }
}
