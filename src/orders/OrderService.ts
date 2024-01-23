import { AlgoDecision } from "../algo-engine/AlgoDecision.js";
import { Asset } from "../algo-engine/models/Asset.js";
import { Exchange } from "../algo-engine/models/Exchange.js";
import { ClientOrderIdGenerator } from "./ClientOrderIdGenerator.js";
import { ITradeAdapter } from "./exchanges/ITradeAdapter.js";
import { OrderUpdateEvent } from "./exchanges/models/OrderUpdateEvent.js";
import { PatchOrderRequest } from "./exchanges/models/PatchOrderRequest.js";
import { PlaceOrderRequest } from "./exchanges/models/PlaceOrderRequest.js";
import { OrderSide } from "./models/OrderSide.js";
import { OrderTimeInForce } from "./models/OrderTimeInForce.js";
import { OrderType } from "./models/OrderType.js";
import { OpenOrders } from "./open-orders/OpenOrders.js";

export class OrderService {
  private orderUpdateEvents: OrderUpdateEvent[] = [];
  private clientOrderIdGenerator = new ClientOrderIdGenerator();

  constructor(
    private tradeAdapters: Map<Exchange, ITradeAdapter>,
    private openOrders: OpenOrders,
    private assets: Map<string, Asset>
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

  static async create(
    tradeAdapters: ITradeAdapter[],
    assets: Map<string, Asset>
  ) {
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
      openOrders,
      assets
    ).init();
  }

  dequeueOrderUpdates(): OrderUpdateEvent[] {
    const orderUpdateEvents = this.orderUpdateEvents;
    this.orderUpdateEvents = [];
    return orderUpdateEvents;
  }

  perform(algoDecision: AlgoDecision) {
    if (algoDecision instanceof AlgoDecision.LimitBuy) {
      const clientOrderId = this.clientOrderIdGenerator.generate();
      this.placeOrder({
        clientOrderId,
        assetId: algoDecision.assetId,
        qty: algoDecision.quantity,
        side: OrderSide.Buy,
        type: OrderType.Limit,
        limitPrice: algoDecision.price,
        timeInForce: OrderTimeInForce.GoodTillCancel,
      });
      algoDecision.callback?.(clientOrderId);
      return;
    }

    if (algoDecision instanceof AlgoDecision.LimitSell) {
      const clientOrderId = this.clientOrderIdGenerator.generate();
      this.placeOrder({
        clientOrderId,
        assetId: algoDecision.assetId,
        qty: algoDecision.quantity,
        side: OrderSide.Sell,
        type: OrderType.Limit,
        limitPrice: algoDecision.price,
        timeInForce: OrderTimeInForce.GoodTillCancel,
      });
      algoDecision.callback?.(clientOrderId);
      return;
    }

    if (algoDecision instanceof AlgoDecision.StopLimitBuy) {
      const clientOrderId = this.clientOrderIdGenerator.generate();
      this.placeOrder({
        clientOrderId,
        assetId: algoDecision.assetId,
        qty: algoDecision.quantity,
        side: OrderSide.Buy,
        type: OrderType.StopLimit,
        limitPrice: algoDecision.limitPrice,
        stopPrice: algoDecision.stopPrice,
        timeInForce: OrderTimeInForce.GoodTillCancel,
      });
      algoDecision.callback?.(clientOrderId);
      return;
    }

    if (algoDecision instanceof AlgoDecision.StopLimitSell) {
      const clientOrderId = this.clientOrderIdGenerator.generate();
      this.placeOrder({
        clientOrderId,
        assetId: algoDecision.assetId,
        qty: algoDecision.quantity,
        side: OrderSide.Sell,
        type: OrderType.StopLimit,
        limitPrice: algoDecision.limitPrice,
        stopPrice: algoDecision.stopPrice,
        timeInForce: OrderTimeInForce.GoodTillCancel,
      });
      algoDecision.callback?.(clientOrderId);
      return;
    }

    if (algoDecision instanceof AlgoDecision.TwoLeggedLimitBuy) {
      const clientOrderId = this.clientOrderIdGenerator.generate();
      this.placeOrder({
        clientOrderId,
        assetId: algoDecision.assetId,
        qty: algoDecision.quantity,
        side: OrderSide.Buy,
        type: OrderType.Limit,
        limitPrice: algoDecision.limitPrice,
        timeInForce: OrderTimeInForce.GoodTillCancel,
        takeProfitPrice: algoDecision.takeProfitPrice,
        stopLossPrice: algoDecision.stopLossPrice,
      });
      algoDecision.callback?.(clientOrderId);
      return;
    }

    if (algoDecision instanceof AlgoDecision.TwoLeggedLimitSell) {
      const clientOrderId = this.clientOrderIdGenerator.generate();
      this.placeOrder({
        clientOrderId,
        assetId: algoDecision.assetId,
        qty: algoDecision.quantity,
        side: OrderSide.Sell,
        type: OrderType.Limit,
        limitPrice: algoDecision.limitPrice,
        timeInForce: OrderTimeInForce.GoodTillCancel,
        takeProfitPrice: algoDecision.takeProfitPrice,
        stopLossPrice: algoDecision.stopLossPrice,
      });
      algoDecision.callback?.(clientOrderId);
      return;
    }

    if (algoDecision instanceof AlgoDecision.LimitStopLossBuy) {
      const clientOrderId = this.clientOrderIdGenerator.generate();
      this.placeOrder({
        clientOrderId,
        assetId: algoDecision.assetId,
        qty: algoDecision.quantity,
        side: OrderSide.Buy,
        type: OrderType.Limit,
        limitPrice: algoDecision.limitPrice,
        timeInForce: OrderTimeInForce.GoodTillCancel,
        stopLossPrice: algoDecision.stopLossPrice,
      });
      algoDecision.callback?.(clientOrderId);
      return;
    }

    if (algoDecision instanceof AlgoDecision.LimitStopLossSell) {
      const clientOrderId = this.clientOrderIdGenerator.generate();
      this.placeOrder({
        clientOrderId,
        assetId: algoDecision.assetId,
        qty: algoDecision.quantity,
        side: OrderSide.Sell,
        type: OrderType.Limit,
        limitPrice: algoDecision.limitPrice,
        timeInForce: OrderTimeInForce.GoodTillCancel,
        stopLossPrice: algoDecision.stopLossPrice,
      });
      algoDecision.callback?.(clientOrderId);
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

  private getTradeAdapterByAssetId(assetId: string) {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`No asset for asset ${assetId}`);
    }

    const tradeAdapter = this.tradeAdapters.get(asset.exchange);
    if (tradeAdapter == null) {
      throw new Error(`No trade adapter for ${asset.exchange}`);
    }

    return tradeAdapter;
  }

  private getTradeAdapterByClientOrderId(clientOrderId: string) {
    const order = this.openOrders.getOrder(clientOrderId);
    if (!order) {
      throw new Error(`No order with client order id ${clientOrderId}`);
    }

    return this.getTradeAdapterByAssetId(order.assetId);
  }

  placeOrder(req: PlaceOrderRequest) {
    console.log("Placing order:", req);
    this.openOrders.trackOrder(req);
    return this.getTradeAdapterByAssetId(req.assetId).placeOrder(req);
  }

  patchOrder(req: PatchOrderRequest) {
    console.log("Patching order:", req);
    this.getTradeAdapterByClientOrderId(req.clientOrderId).patchOrder(req);
  }
}
