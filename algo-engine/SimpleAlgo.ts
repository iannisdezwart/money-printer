import { OrderUpdate } from "../entities/OrderUpdate";
import { MarketData } from "../market-data/MarketData";
import { PositionService } from "../positions/PositionService";
import { barIsGreen, barIsRed } from "../utils/bars";
import { Algo } from "./Algo";
import { AlgoDecision } from "./AlgoDecision";

enum SimpleAlgoState {
  Out,
  Entering,
  In,
  Exiting,
}

export class SimpleAlgo extends Algo {
  private state: SimpleAlgoState = SimpleAlgoState.Out;

  private side?: "long" | "short";
  private inPrice?: number;
  private stopPrice?: number;
  private takeProfitPrice?: number;
  private orderId?: string;

  override decide(
    orderUpdates: OrderUpdate[],
    marketData: MarketData,
    positionService: PositionService
  ): AlgoDecision[] {
    switch (this.state) {
      case SimpleAlgoState.Out:
        return this.decideOut(orderUpdates, marketData, positionService);
      case SimpleAlgoState.Entering:
        return this.decideEntering(orderUpdates, marketData, positionService);
      case SimpleAlgoState.In:
        return this.decideIn(orderUpdates, marketData, positionService);
      case SimpleAlgoState.Exiting:
        return this.decideExiting(orderUpdates, marketData, positionService);
    }
  }

  private decideOut(
    orderUpdates: OrderUpdate[],
    marketData: MarketData,
    positionService: PositionService
  ) {
    const lastFiveMinuteBars = marketData.getBars("BTC/USD").slice(-5);

    const numPositiveBars = lastFiveMinuteBars.filter(barIsGreen).length;
    const numNegativeBars = lastFiveMinuteBars.filter(barIsRed).length;

    const openingPrice = lastFiveMinuteBars[0].Open;
    const closingPrice = lastFiveMinuteBars[4].Close;
    const lowPrice = Math.min(...lastFiveMinuteBars.map((bar) => bar.Low));
    const highPrice = Math.max(...lastFiveMinuteBars.map((bar) => bar.High));
    const priceChangeRatio = closingPrice / openingPrice;

    console.log("[SimpleAlgo]: listening");
    console.log("[SimpleAlgo]: numPositiveBars", numPositiveBars);
    console.log("[SimpleAlgo]: numNegativeBars", numNegativeBars);
    console.log(
      "[SimpleAlgo]: lastBar",
      barIsGreen(lastFiveMinuteBars[4]) ? "green" : "red"
    );
    console.log("[SimpleAlgo]: openingPrice", openingPrice);
    console.log("[SimpleAlgo]: closingPrice", closingPrice);
    console.log(
      "[SimpleAlgo]: highest bid",
      marketData.getOrderBook("BTC/USD")!.getBids()[0].price
    );
    console.log(
      "[SimpleAlgo]: lowest ask",
      marketData.getOrderBook("BTC/USD")!.getAsks()[0].price
    );
    console.log("[SimpleAlgo]: priceChangeRatio", priceChangeRatio);
    if (barIsGreen(lastFiveMinuteBars[4])) {
      console.log(
        "[SimpleAlgo]: long conditions",
        numNegativeBars >= 3,
        barIsGreen(lastFiveMinuteBars[4]),
        priceChangeRatio >= 0.98,
        marketData.getOrderBook("BTC/USD")!.getAsks()[0].price * 0.998 <=
          closingPrice
      );
    }
    // if (barIsRed(lastFiveMinuteBars[4])) {
    //   console.log(
    //     "[SimpleAlgo]: short conditions",
    //     numPositiveBars >= 3,
    //     barIsRed(lastFiveMinuteBars[4]),
    //     priceChangeRatio <= 1.02,
    //     marketData.getOrderBook("BTC/USD")!.getBids()[0].price >= closingPrice
    //   );
    // }

    if (
      numNegativeBars >= 3 &&
      barIsGreen(lastFiveMinuteBars[4]) &&
      priceChangeRatio >= 0.98 &&
      marketData.getOrderBook("BTC/USD")!.getAsks()[0].price * 0.998 <=
        closingPrice
    ) {
      this.side = "long";
      this.inPrice = marketData.getOrderBook("BTC/USD")!.getAsks()[0].price;
      this.stopPrice = this.inPrice * 0.995;
      this.takeProfitPrice = this.inPrice * 1.01;
      console.log("Entering long");
      this.state = SimpleAlgoState.Entering;

      return [
        new AlgoDecision.StopLimitBuy(
          "BTC/USD",
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
    //   marketData.getOrderBook("BTC/USD")!.getBids()[0].price >= closingPrice
    // ) {
    //   this.side = "short";
    //   this.inPrice = lastFiveMinuteBars[4].Close;
    //   this.stopPrice = this.inPrice * 1.005;
    //   this.takeProfitPrice = this.inPrice * 0.99;
    //   console.log("[SimpleAlgo]: Entering short");
    //   this.state = SimpleAlgoState.Entering;

    //   return [
    //     new AlgoDecision.StopLimitSell(
    //       "BTC/USD",
    //       0.1,
    //       this.inPrice,
    //       this.stopPrice
    //     ),
    //   ];
    // }

    return [];
  }

  private decideEntering(
    orderUpdates: OrderUpdate[],
    marketData: MarketData,
    positionService: PositionService
  ) {
    if (orderUpdates.length === 0) {
      return [];
    }

    const lastOrderUpdate = orderUpdates[orderUpdates.length - 1];

    if (lastOrderUpdate.order.status === "filled") {
      console.log("[SimpleAlgo]: Entered");
      this.state = SimpleAlgoState.In;
      this.orderId = lastOrderUpdate.order.client_order_id;

      if (this.side! == "long") {
        return [new AlgoDecision.LimitSell("BTC/USD", 0.1, this.stopPrice!)];
      } else {
        return [new AlgoDecision.LimitBuy("BTC/USD", 0.1, this.stopPrice!)];
      }
    }

    // TODO: handle timeout & partial fill

    return [];
  }

  private decideIn(
    orderUpdates: OrderUpdate[],
    marketData: MarketData,
    positionService: PositionService
  ) {
    const currentPrice =
      this.side == "long"
        ? marketData.getOrderBook("BTC/USD")!.getAsks()[0].price
        : marketData.getOrderBook("BTC/USD")!.getBids()[0].price;

    // Exit

    if (this.side === "long" && currentPrice >= this.takeProfitPrice!) {
      console.log("[SimpleAlgo]: Exiting long");
      this.state = SimpleAlgoState.Exiting;

      return [new AlgoDecision.LimitSell("BTC/USD", 0.1, currentPrice * 0.999)];
    }

    // if (this.side === "short" && currentPrice <= this.takeProfitPrice!) {
    //   console.log("[SimpleAlgo]: Exiting short");
    //   this.state = SimpleAlgoState.Exiting;

    //   return [new AlgoDecision.LimitBuy("BTC/USD", 0.1, currentPrice * 1.001)];
    // }

    // Update prices

    const bars = marketData.getBars("BTC/USD");
    const lastBar = bars.slice(-1)[0];

    if (
      this.side === "long" &&
      barIsGreen(lastBar) &&
      lastBar.High > this.takeProfitPrice!
    ) {
      this.takeProfitPrice = lastBar.High;
      this.stopPrice = this.takeProfitPrice * 0.995;

      return [
        new AlgoDecision.UpdateLimitPrice(
          "BTC/USD",
          this.orderId!,
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
    //       "BTC/USD",
    //       this.orderId!,
    //       0.1,
    //       this.stopPrice!
    //     ),
    //   ];
    // }

    return [];
  }

  private decideExiting(
    orderUpdates: OrderUpdate[],
    marketData: MarketData,
    positionService: PositionService
  ) {
    if (orderUpdates.length === 0) {
      return [];
    }

    const lastOrderUpdate = orderUpdates[orderUpdates.length - 1];

    if (lastOrderUpdate.order.status === "filled") {
      console.log("[SimpleAlgo]: Exited");

      this.state = SimpleAlgoState.Out;
      this.side = undefined;
      this.inPrice = undefined;
      this.stopPrice = undefined;
      this.takeProfitPrice = undefined;
      this.orderId = undefined;

      return [];
    }

    // TODO: handle timeout & partial fill

    return [];
  }
}
