import { MarketDataService } from "../market-data/MarketDataService";
import { OrderUpdateEvent } from "../orders/exchanges/models/OrderUpdateEvent";
import { OrderStatus } from "../orders/models/OrderStatus";
import { PositionService } from "../positions/PositionService";
import { Algo } from "./Algo";
import { AlgoDecision } from "./AlgoDecision";
import { AssetSymbol } from "./models/AssetSymbol";

enum SimpleAlgoState {
  Out,
  Entering,
  In,
  Exiting,
}

export class SimpleAlgo extends Algo {
  constructor(private symbol: AssetSymbol) {
    super();
  }

  private state: SimpleAlgoState = SimpleAlgoState.Out;

  private side?: "long" | "short";
  private inPrice?: number;
  private stopPrice?: number;
  private takeProfitPrice?: number;
  private clientOrderId?: string;

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
    const lastFiveMinuteBars = marketDataService.getBars(this.symbol).slice(-5);

    const numPositiveBars = lastFiveMinuteBars.filter(
      (bar) => !bar.isRed
    ).length;
    const numNegativeBars = lastFiveMinuteBars.filter(
      (bar) => !bar.isGreen
    ).length;

    const openingPrice = lastFiveMinuteBars[0].open;
    const closingPrice = lastFiveMinuteBars[4].close;
    const lowPrice = Math.min(...lastFiveMinuteBars.map((bar) => bar.low));
    const highPrice = Math.max(...lastFiveMinuteBars.map((bar) => bar.high));
    const priceChangeRatio = closingPrice / openingPrice;

    console.log("[SimpleAlgo]: listening");
    console.log("[SimpleAlgo]: numPositiveBars", numPositiveBars);
    console.log("[SimpleAlgo]: numNegativeBars", numNegativeBars);
    console.log(
      "[SimpleAlgo]: lastBar",
      lastFiveMinuteBars[4].isGreen ? "green" : "red"
    );
    console.log("[SimpleAlgo]: openingPrice", openingPrice);
    console.log("[SimpleAlgo]: closingPrice", closingPrice);
    console.log(
      "[SimpleAlgo]: highest bid",
      marketDataService.getOrderBook(this.symbol)!.getBids()[0].price
    );
    console.log(
      "[SimpleAlgo]: lowest ask",
      marketDataService.getOrderBook(this.symbol)!.getAsks()[0].price
    );
    console.log("[SimpleAlgo]: priceChangeRatio", priceChangeRatio);
    if (lastFiveMinuteBars[4].isGreen) {
      console.log(
        "[SimpleAlgo]: long conditions",
        numNegativeBars >= 3,
        lastFiveMinuteBars[4].isGreen,
        priceChangeRatio >= 0.98,
        marketDataService.getOrderBook(this.symbol)!.getAsks()[0].price *
          0.998 <=
          closingPrice
      );
    }
    // if (barIsRed(lastFiveMinuteBars[4])) {
    //   console.log(
    //     "[SimpleAlgo]: short conditions",
    //     numPositiveBars >= 3,
    //     barIsRed(lastFiveMinuteBars[4]),
    //     priceChangeRatio <= 1.02,
    //     marketDataService.getOrderBook(this.symbol)!.getBids()[0].price >= closingPrice
    //   );
    // }

    if (
      numNegativeBars >= 3 &&
      lastFiveMinuteBars[4].isGreen &&
      priceChangeRatio >= 0.98 &&
      marketDataService.getOrderBook(this.symbol)!.getAsks()[0].price * 0.998 <=
        closingPrice
    ) {
      this.side = "long";
      this.inPrice = marketDataService
        .getOrderBook(this.symbol)!
        .getAsks()[0].price;
      this.stopPrice = this.inPrice * 0.995;
      this.takeProfitPrice = this.inPrice * 1.01;
      console.log("Entering long");
      this.state = SimpleAlgoState.Entering;

      return [
        new AlgoDecision.StopLimitBuy(
          this.symbol,
          0.1,
          this.inPrice,
          this.stopPrice
        ),
      ];
    }

    // if (
    //   numPositiveBars >= 3 &&
    //   barIsRed(lastFiveMinuteBars[4]) &&
    //   priceChangeRatio <= 1.02 &&
    //   marketDataService.getOrderBook(this.symbol)!.getBids()[0].price >= closingPrice
    // ) {
    //   this.side = "short";
    //   this.inPrice = lastFiveMinuteBars[4].Close;
    //   this.stopPrice = this.inPrice * 1.005;
    //   this.takeProfitPrice = this.inPrice * 0.99;
    //   console.log("[SimpleAlgo]: Entering short");
    //   this.state = SimpleAlgoState.Entering;

    //   return [
    //     new AlgoDecision.StopLimitSell(
    //       this.symbol,
    //       0.1,
    //       this.inPrice,
    //       this.stopPrice
    //     ),
    //   ];
    // }

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

    const lastOrderUpdate = orderUpdates[orderUpdates.length - 1];

    if (lastOrderUpdate.orderStatus == OrderStatus.Filled) {
      console.log("[SimpleAlgo]: Entered");
      this.state = SimpleAlgoState.In;
      this.clientOrderId = lastOrderUpdate.clientOrderId;

      if (this.side! == "long") {
        return [new AlgoDecision.LimitSell(this.symbol, 0.1, this.stopPrice!)];
      } else {
        return [new AlgoDecision.LimitBuy(this.symbol, 0.1, this.stopPrice!)];
      }
    }

    // TODO: handle timeout & partial fill

    return [];
  }

  private decideIn(
    orderUpdates: OrderUpdateEvent[],
    marketDataService: MarketDataService,
    positionService: PositionService
  ) {
    const currentPrice =
      this.side == "long"
        ? marketDataService.getOrderBook(this.symbol)!.getAsks()[0].price
        : marketDataService.getOrderBook(this.symbol)!.getBids()[0].price;

    // Exit

    if (this.side === "long" && currentPrice >= this.takeProfitPrice!) {
      console.log("[SimpleAlgo]: Exiting long");
      this.state = SimpleAlgoState.Exiting;

      return [
        new AlgoDecision.LimitSell(this.symbol, 0.1, currentPrice * 0.999),
      ];
    }

    // if (this.side === "short" && currentPrice <= this.takeProfitPrice!) {
    //   console.log("[SimpleAlgo]: Exiting short");
    //   this.state = SimpleAlgoState.Exiting;

    //   return [new AlgoDecision.LimitBuy(this.symbol, 0.1, currentPrice * 1.001)];
    // }

    // Update prices

    const bars = marketDataService.getBars(this.symbol);
    const lastBar = bars.slice(-1)[0];

    if (
      this.side === "long" &&
      lastBar.isGreen &&
      lastBar.high > this.takeProfitPrice!
    ) {
      this.takeProfitPrice = lastBar.high;
      this.stopPrice = this.takeProfitPrice * 0.995;

      return [
        new AlgoDecision.UpdateLimitPrice(
          this.symbol,
          this.clientOrderId!,
          0.1,
          this.stopPrice!
        ),
      ];
    }

    // if (
    //   this.side === "short" &&
    //   barIsRed(lastBar) &&
    //   lastBar.Low < this.takeProfitPrice!
    // ) {
    //   this.takeProfitPrice = lastBar.Low;
    //   this.stopPrice = this.takeProfitPrice * 1.005;

    //   return [
    //     new AlgoDecision.UpdateLimitPrice(
    //       this.symbol,
    //       this.orderId!,
    //       0.1,
    //       this.stopPrice!
    //     ),
    //   ];
    // }

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
      this.side = undefined;
      this.inPrice = undefined;
      this.stopPrice = undefined;
      this.takeProfitPrice = undefined;
      this.clientOrderId = undefined;

      return [];
    }

    // TODO: handle timeout & partial fill

    return [];
  }
}
