import Alpaca from "@alpacahq/alpaca-trade-api";
import { AlgoDecision } from "../algo-engine/AlgoDecision";
import { OrderUpdate } from "../entities/OrderUpdate";

interface StateChange {}

export class OrderManager {
  private constructor(
    private alpaca: Alpaca,
    private orderUpdates: OrderUpdate[]
  ) {}

  static create(alpaca: Alpaca): Promise<OrderManager> {
    const inst = new OrderManager(alpaca, []);

    return new Promise((resolve, reject) => {
      alpaca.trade_ws.onConnect(() => {
        console.log("Connected to trade websocket");
        alpaca.trade_ws.subscribe(["trade_updates"]);
        resolve(inst);
      });
      alpaca.trade_ws.onError((err: Error) => {
        console.log("Error from trade websocket", err);
        reject(err);
      });
      alpaca.trade_ws.onOrderUpdate((orderUpdate: OrderUpdate) => {
        inst.orderUpdates.push(orderUpdate);
      });
      alpaca.trade_ws.onStateChange((state: StateChange) => {
        console.log("State change received", state);
      });
      alpaca.trade_ws.onDisconnect(() => {
        console.log("Disconnected from trade websocket");
      });
      alpaca.trade_ws.connect();
    });
  }

  dequeueOrderUpdates(): OrderUpdate[] {
    const orderUpdates = this.orderUpdates;
    this.orderUpdates = [];
    return orderUpdates;
  }

  perform(algoDecision: AlgoDecision) {
    if (algoDecision instanceof AlgoDecision.LimitBuy) {
      this.placeOrder({
        symbol: algoDecision.symbol,
        qty: algoDecision.quantity,
        side: "buy",
        type: "limit",
        limit_price: algoDecision.price,
        time_in_force: "gtc",
      });
      return;
    }

    if (algoDecision instanceof AlgoDecision.LimitSell) {
      this.placeOrder({
        symbol: algoDecision.symbol,
        qty: algoDecision.quantity,
        side: "sell",
        type: "limit",
        limit_price: algoDecision.price,
        time_in_force: "gtc",
      });
      return;
    }

    if (algoDecision instanceof AlgoDecision.StopLimitBuy) {
      this.placeOrder({
        symbol: algoDecision.symbol,
        qty: algoDecision.quantity,
        side: "buy",
        type: "stop_limit",
        limit_price: algoDecision.limitPrice,
        stop_price: algoDecision.stopPrice,
        time_in_force: "gtc",
      });
      return;
    }

    if (algoDecision instanceof AlgoDecision.StopLimitSell) {
      this.placeOrder({
        symbol: algoDecision.symbol,
        qty: algoDecision.quantity,
        side: "sell",
        type: "stop_limit",
        limit_price: algoDecision.limitPrice,
        stop_price: algoDecision.stopPrice,
        time_in_force: "gtc",
      });
      return;
    }

    if (algoDecision instanceof AlgoDecision.UpdateLimitPrice) {
      this.patchOrder({
        client_order_id: algoDecision.orderId,
        limit_price: algoDecision.newLimitPrice,
      });
      return;
    }

    throw new Error("Unknown algo decision");
  }

  placeOrder(options: {
    symbol: string;
    qty?: number;
    notional?: number;
    side: "buy" | "sell";
    type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
    time_in_force: "day" | "gtc" | "opg" | "ioc";
    limit_price?: number;
    stop_price?: number;
    client_order_id?: string;
    extended_hours?: boolean;
    order_class?: string;
    take_profit?: object; // TODO
    stop_loss?: object; // TODO
    trail_price?: string;
    trail_percent?: string;
  }) {
    this.alpaca.createOrder(options);
  }

  patchOrder(options: {
    qty?: number;
    time_in_force?: "day" | "gtc" | "opg" | "ioc";
    limit_price?: number;
    stop_price?: number;
    trail?: string;
    client_order_id: string;
  }) {
    this.alpaca.replaceOrder(options.client_order_id, options);
  }
}
