import { AlgoDecision } from "../algo-engine/AlgoDecision";
import { ClientOrderIdGenerator } from "./ClientOrderIdGenerator";
import { OpenOrders } from "./OpenOrders";
import { IExchange } from "./exchanges/IExchange";
import { OrderSide } from "./exchanges/models/OrderSide";
import { OrderTimeInForce } from "./exchanges/models/OrderTimeInForce";
import { OrderType } from "./exchanges/models/OrderType";
import { OrderUpdateEvent } from "./exchanges/models/OrderUpdateEvent";
import { PatchOrderRequest } from "./exchanges/models/PatchOrderRequest";
import { PlaceOrderRequest } from "./exchanges/models/PlaceOrderRequest";

export class OrderService {
  private orderUpdateEvents: OrderUpdateEvent[] = [];
  private clientOrderIdGenerator = new ClientOrderIdGenerator();

  constructor(private exchanges: IExchange[], private openOrders: OpenOrders) {}

  private async init() {
    this.exchanges.forEach((exchange) => {
      exchange.addOrderUpdateListener((event) => {
        this.openOrders.update(event);
        this.orderUpdateEvents.push(event);
      });
    });

    return this;
  }

  static async create(exchanges: IExchange[]): Promise<OrderService> {
    const openOrders = await OpenOrders.create();
    const inst = new OrderService(exchanges, openOrders);
    return await inst.init();
  }

  private routeBySymbol(symbol: string): IExchange {
    // TODO
    return this.exchanges[0];
  }

  private routeByClientOrderId(clientOrderId: string): IExchange {
    // TODO
    return this.exchanges[0];
  }

  dequeueOrderUpdates(): OrderUpdateEvent[] {
    const orderUpdateEvents = this.orderUpdateEvents;
    this.orderUpdateEvents = [];
    return orderUpdateEvents;
  }

  perform(algoDecision: AlgoDecision) {
    if (algoDecision instanceof AlgoDecision.LimitBuy) {
      this.placeOrder({
        clientOrderId: this.clientOrderIdGenerator.generate(),
        symbol: algoDecision.symbol,
        qty: algoDecision.quantity,
        side: OrderSide.Buy,
        type: OrderType.Limit,
        limitPrice: algoDecision.price,
        timeInForce: OrderTimeInForce.GoodTillCancel,
      });
      return;
    }

    if (algoDecision instanceof AlgoDecision.LimitSell) {
      this.placeOrder({
        clientOrderId: this.clientOrderIdGenerator.generate(),
        symbol: algoDecision.symbol,
        qty: algoDecision.quantity,
        side: OrderSide.Sell,
        type: OrderType.Limit,
        limitPrice: algoDecision.price,
        timeInForce: OrderTimeInForce.GoodTillCancel,
      });
      return;
    }

    if (algoDecision instanceof AlgoDecision.StopLimitBuy) {
      this.placeOrder({
        clientOrderId: this.clientOrderIdGenerator.generate(),
        symbol: algoDecision.symbol,
        qty: algoDecision.quantity,
        side: OrderSide.Buy,
        type: OrderType.StopLimit,
        limitPrice: algoDecision.limitPrice,
        stopPrice: algoDecision.stopPrice,
        timeInForce: OrderTimeInForce.GoodTillCancel,
      });
      return;
    }

    if (algoDecision instanceof AlgoDecision.StopLimitSell) {
      this.placeOrder({
        clientOrderId: this.clientOrderIdGenerator.generate(),
        symbol: algoDecision.symbol,
        qty: algoDecision.quantity,
        side: OrderSide.Sell,
        type: OrderType.StopLimit,
        limitPrice: algoDecision.limitPrice,
        stopPrice: algoDecision.stopPrice,
        timeInForce: OrderTimeInForce.GoodTillCancel,
      });
      return;
    }

    if (algoDecision instanceof AlgoDecision.UpdateLimitPrice) {
      this.patchOrder({
        clientOrderId: algoDecision.clientOrderId,
        newLimitPrice: algoDecision.newLimitPrice,
      });
      return;
    }

    throw new Error("Unknown algo decision");
  }

  placeOrder(req: PlaceOrderRequest) {
    const exchange = this.routeBySymbol(req.symbol);
    exchange.placeOrder(req);
  }

  patchOrder(req: PatchOrderRequest) {
    const exchange = this.routeByClientOrderId(req.clientOrderId);
    exchange.patchOrder(req);
  }
}
