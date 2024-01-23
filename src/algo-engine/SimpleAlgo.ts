import { MarketDataService } from "../market-data/MarketDataService.js";
import { OrderUpdateEvent } from "../orders/exchanges/models/OrderUpdateEvent.js";
import { OrderStatus } from "../orders/models/OrderStatus.js";
import { PositionService } from "../positions/PositionService.js";
import { Algo } from "./Algo.js";
import { AlgoDecision } from "./AlgoDecision.js";

enum SimpleAlgoState {
  Out,
  Entering,
  In,
  Exiting,
}

export type SimpleAlgoParams = {
  lookbackPeriodMs: number;
  maxSpread: number;

  enterParams: {
    tradeQty: number;

    jumpSize: number;
    jumpContUpOffs: number;
    jumpContUpSize: number;
    jumpContUpStop: number;
    jumpContDnOffs: number;
    jumpContDnSize: number;
    jumpContDnStop: number;

    fallSize: number;
    fallContUpOffs: number;
    fallContUpSize: number;
    fallContUpStop: number;
    fallContDnOffs: number;
    fallContDnSize: number;
    fallContDnStop: number;
  };
};

export class SimpleAlgo extends Algo {
  constructor(private assetId: string, private params: SimpleAlgoParams) {
    super();
  }

  private state: SimpleAlgoState = SimpleAlgoState.Out;

  private longClientOrderId?: string;
  private shortClientOrderId?: string;
  private position?: "long" | "short";

  override decide(
    orderUpdates: OrderUpdateEvent[],
    marketDataService: MarketDataService,
    positionService: PositionService
  ): AlgoDecision[] {
    switch (this.state) {
      case SimpleAlgoState.Out:
        return this.decideOut(orderUpdates, marketDataService, positionService);
      case SimpleAlgoState.Entering:
        return this.decideEntering(
          orderUpdates,
          marketDataService,
          positionService
        );
      case SimpleAlgoState.In:
        return this.decideIn(orderUpdates, marketDataService, positionService);
      case SimpleAlgoState.Exiting:
        return this.decideExiting(
          orderUpdates,
          marketDataService,
          positionService
        );
    }
  }

  private decideOut(
    orderUpdates: OrderUpdateEvent[],
    marketDataService: MarketDataService,
    positionService: PositionService
  ) {
    // const TRADE_QTY = 1;

    // const JUMP_SIZE = 0.06;
    // const JUMP_CONT_UP_OFFS = 0.03;
    // const JUMP_CONT_UP_SIZE = 0.03;
    // const JUMP_CONT_UP_STOP = 0.03;
    // const JUMP_CONT_DN_OFFS = 0.03;
    // const JUMP_CONT_DN_SIZE = 0.03;
    // const JUMP_CONT_DN_STOP = 0.03;

    // const FALL_SIZE = 0.06;
    // const FALL_CONT_UP_OFFS = 0.03;
    // const FALL_CONT_UP_SIZE = 0.03;
    // const FALL_CONT_UP_STOP = 0.03;
    // const FALL_CONT_DN_OFFS = 0.03;
    // const FALL_CONT_DN_SIZE = 0.03;
    // const FALL_CONT_DN_STOP = 0.03;

    const quotes = marketDataService
      .getLatestQuotes(
        this.assetId,
        new Date(Date.now() - this.params.lookbackPeriodMs)
      )
      .filter(
        (quote) => quote.askPrice - quote.bidPrice <= this.params.maxSpread
      );

    if (quotes.length === 0) {
      return [];
    }

    const highBid = Math.max(...quotes.map((quote) => quote.bidPrice));
    const highAsk = Math.max(...quotes.map((quote) => quote.askPrice));
    const lowBid = Math.min(...quotes.map((quote) => quote.bidPrice));
    const lowAsk = Math.min(...quotes.map((quote) => quote.askPrice));
    const lastBid = quotes[quotes.length - 1]?.bidPrice;
    const lastAsk = quotes[quotes.length - 1]?.askPrice;

    console.log("lastBid", lastBid);
    console.log("lastBid - lowBid", lastBid - lowBid);
    console.log("lastBid - highBid", lastBid - highBid);
    console.log("lastAsk", lastAsk);
    console.log("lastAsk - lowAsk", lastAsk - lowAsk);
    console.log("lastAsk - highAsk", lastAsk - highAsk);

    if (
      lastBid >= lowBid + this.params.enterParams.jumpSize &&
      lastAsk >= lowAsk + this.params.enterParams.jumpSize
    ) {
      console.log("[SimpleAlgo]: Jump detected, entering...");

      this.state = SimpleAlgoState.Entering;

      return [
        new AlgoDecision.TwoLeggedLimitSell(
          this.assetId,
          this.params.enterParams.tradeQty,
          lastAsk + this.params.enterParams.jumpContUpOffs,
          lastAsk +
            this.params.enterParams.jumpContUpOffs -
            this.params.enterParams.jumpContUpSize,
          lastAsk +
            this.params.enterParams.jumpContUpOffs +
            this.params.enterParams.jumpContUpStop
        ),
      ];
    }

    if (
      lastBid <= highBid - this.params.enterParams.fallSize &&
      lastAsk <= highAsk - this.params.enterParams.fallSize
    ) {
      console.log("[SimpleAlgo]: Fall detected, entering...");

      this.state = SimpleAlgoState.Entering;

      return [
        new AlgoDecision.TwoLeggedLimitBuy(
          this.assetId,
          this.params.enterParams.tradeQty,
          lastBid - this.params.enterParams.fallContDnOffs,
          lastBid -
            this.params.enterParams.fallContDnOffs +
            this.params.enterParams.fallContDnSize,
          lastBid -
            this.params.enterParams.fallContDnOffs -
            this.params.enterParams.fallContDnStop
        ),
      ];
    }

    return [];
  }

  private decideEntering(
    orderUpdates: OrderUpdateEvent[],
    marketDataService: MarketDataService,
    positionService: PositionService
  ) {
    if (orderUpdates.length === 0) {
      return [];
    }

    orderUpdates.forEach((orderUpdate) => {
      if (
        orderUpdate.clientOrderId == this.shortClientOrderId &&
        this.position == "long" &&
        orderUpdate.orderStatus != OrderStatus.Cancelled
      ) {
        console.error(
          "[SimpleAlgo]: Got an order for short while long",
          orderUpdate
        );
      }

      if (
        orderUpdate.clientOrderId == this.longClientOrderId &&
        this.position == "short" &&
        orderUpdate.orderStatus != OrderStatus.Cancelled
      ) {
        console.error(
          "[SimpleAlgo]: Got an order for long while short",
          orderUpdate
        );
      }

      if (
        orderUpdate.clientOrderId == this.longClientOrderId &&
        orderUpdate.orderStatus == OrderStatus.PartiallyFilled
      ) {
        this.position = "long";
      }

      if (
        orderUpdate.clientOrderId == this.shortClientOrderId &&
        orderUpdate.orderStatus == OrderStatus.PartiallyFilled
      ) {
        this.position = "short";
      }

      if (
        orderUpdate.clientOrderId == this.longClientOrderId &&
        orderUpdate.orderStatus == OrderStatus.Filled
      ) {
        this.position = "long";

        console.log("[SimpleAlgo]: In long");
        this.state = SimpleAlgoState.In;
      }

      if (
        orderUpdate.clientOrderId == this.shortClientOrderId &&
        orderUpdate.orderStatus == OrderStatus.Filled
      ) {
        this.position = "short";

        console.log("[SimpleAlgo]: In short");
        this.state = SimpleAlgoState.In;
      }
    });

    // TODO: handle timeout & partial fill

    return [];
  }

  private decideIn(
    orderUpdates: OrderUpdateEvent[],
    marketDataService: MarketDataService,
    positionService: PositionService
  ) {
    if (orderUpdates.length === 0) {
      return [];
    }

    orderUpdates.forEach((orderUpdate) => {});

    return [];
  }

  private decideExiting(
    orderUpdates: OrderUpdateEvent[],
    marketDataService: MarketDataService,
    positionService: PositionService
  ) {
    if (orderUpdates.length === 0) {
      return [];
    }

    const lastOrderUpdate = orderUpdates[orderUpdates.length - 1];

    if (lastOrderUpdate.orderStatus == OrderStatus.Filled) {
      console.log("[SimpleAlgo]: Exited");

      this.state = SimpleAlgoState.Out;

      this.longClientOrderId = undefined;
      this.shortClientOrderId = undefined;
      this.position = undefined;

      return [];
    }

    // TODO: handle timeout & partial fill

    return [];
  }
}
