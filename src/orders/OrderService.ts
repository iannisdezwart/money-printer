import { AlgoDecision } from "../algo-engine/AlgoDecision";
import { Exchange } from "../algo-engine/models/Exchange";
import { ClientOrderIdGenerator } from "./ClientOrderIdGenerator";
import { ITradeAdapter } from "./exchanges/ITradeAdapter";
import { OrderUpdateEvent } from "./exchanges/models/OrderUpdateEvent";
import { PatchOrderRequest } from "./exchanges/models/PatchOrderRequest";
import { PlaceOrderRequest } from "./exchanges/models/PlaceOrderRequest";
import { OrderSide } from "./models/OrderSide";
import { OrderTimeInForce } from "./models/OrderTimeInForce";
import { OrderType } from "./models/OrderType";
import { OpenOrders } from "./open-orders/OpenOrders";

export class OrderService {
  private orderUpdateEvents: OrderUpdateEvent[] = [];
  private clientOrderIdGenerator = new ClientOrderIdGenerator();

  constructor(
    private tradeAdapters: Map<Exchange, ITradeAdapter>,
    private openOrders: OpenOrders
  ) {}

  private async init() {
    this.tradeAdapters.forEach((adapter) => {
      adapter.addOrderUpdateListener((event) => {
        this.openOrders.handleOrderUpdate(event);
        this.orderUpdateEvents.push(event);
      });
    });

    return this;
  }

  static async create(tradeAdapters: ITradeAdapter[]) {
    const openOrders = await OpenOrders.create();
    return new OrderService(
      new Map(
        tradeAdapters
          .map((tradeAdapter) =>
            tradeAdapter.exchanges.map(
              (exchange) => <[Exchange, ITradeAdapter]>[exchange, tradeAdapter]
            )
          )
          .flat()
      ),
      openOrders
    ).init();
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

  private getTradeAdapterByExchange(exchange: Exchange) {
    if (!this.tradeAdapters.has(exchange)) {
      throw new Error(`No trade adapter for ${exchange}`);
    }

    return this.tradeAdapters.get(exchange)!;
  }

  private getTradeAdapterByClientOrderId(clientOrderId: string) {
    const order = this.openOrders.getOrder(clientOrderId);
    if (!order) {
      throw new Error(`No order with client order id ${clientOrderId}`);
    }

    return this.getTradeAdapterByExchange(order.symbol.exchange);
  }

  placeOrder(req: PlaceOrderRequest) {
    console.log("Placing order:", req);
    return this.getTradeAdapterByExchange(req.symbol.exchange).placeOrder(req);
  }

  patchOrder(req: PatchOrderRequest) {
    console.log("Patching order:", req);
    this.getTradeAdapterByClientOrderId(req.clientOrderId).patchOrder(req);
  }
}
