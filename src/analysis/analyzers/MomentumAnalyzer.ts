import {
  MarketDataService,
  QuoteEvent,
  TradeEvent,
} from "../../market-data/MarketDataService.js";
import { IMarketAnalyzer } from "../IMarketAnalyzer.js";
import { MomentumAnalysis } from "../analyses/MomentumAnalysis.js";
import {
  computePolynomial,
  curveFit,
  derivePolynomial,
} from "./util/curve-fit.js";

type CurveFitOrderMap = {
  minNumQuotes: number;
  order: number;
};

type Resolution = {
  timeWindowMs: number;
  curveFitOrderMap: CurveFitOrderMap[];
};

export class MomentumAnalyzer extends IMarketAnalyzer<MomentumAnalysis> {
  private constructor(
    private resolutions: Resolution[],
    private assetId: string,
    private maxSpread: number
  ) {
    super();
  }

  private async init(marketDataService: MarketDataService) {
    marketDataService.quoteEmitter.addEventListener((quote) => {
      if (quote.assetId !== this.assetId) {
        return;
      }

      this.onQuote(quote, marketDataService);
    });

    marketDataService.tradeEmitter.addEventListener((trade) => {
      if (trade.assetId !== this.assetId) {
        return;
      }

      this.onTrade(trade, marketDataService);
    });

    return this;
  }

  static async create(
    marketDataService: MarketDataService,
    resolutions: Resolution[],
    assetId: string,
    maxSpread: number
  ) {
    for (const resolution of resolutions) {
      if (resolution.curveFitOrderMap.length == 0) {
        throw new Error("CurveFitOrderMap cannot be of length 0");
      }

      for (let i = 1; i < resolution.curveFitOrderMap.length; i++) {
        if (
          resolution.curveFitOrderMap[i].minNumQuotes <=
          resolution.curveFitOrderMap[i - 1].minNumQuotes
        ) {
          throw new Error(
            "CurveFitOrderMap must be in strictly ascending order"
          );
        }
      }
    }

    return new MomentumAnalyzer(resolutions, assetId, maxSpread).init(
      marketDataService
    );
  }

   onQuote(
    quote: QuoteEvent,
    marketDataService: MarketDataService
  ): void {
    for (const resolution of this.resolutions) {
      const timeWindowStart = new Date(
        quote.quote.timestamp.getTime() - resolution.timeWindowMs
      );

      const quotes = marketDataService
        .getLatestQuotes(this.assetId, timeWindowStart)
        .filter((q) => q.askPrice - q.bidPrice <= this.maxSpread);

      const curveFitOrderEntry = resolution.curveFitOrderMap
        .filter((curveFitOrder) => quotes.length >= curveFitOrder.minNumQuotes)
        .slice(-1)[0];

      if (!curveFitOrderEntry) {
        continue;
      }

      const curveFitOrder = curveFitOrderEntry.order;
      console.log("num quotes", quotes.length);
      console.log("Curve fit order", curveFitOrder);

      if (quotes.length < curveFitOrder + 1) {
        console.log(quotes, curveFitOrder);
        throw new Error(
          "Number of quotes in time window must be greater than curve fit order"
        );
      }

      const timestamps = quotes.map(
        (q) =>
          q.timestamp.getTime() / 1000 - quote.quote.timestamp.getTime() / 1000
      );
      const bidPrices = quotes.map((q) => q.bidPrice - quote.quote.bidPrice);
      const askPrices = quotes.map((q) => q.askPrice - quote.quote.askPrice);

      const bidsFit = curveFit({ x: timestamps, y: bidPrices }, curveFitOrder);
      const asksFit = curveFit({ x: timestamps, y: askPrices }, curveFitOrder);
      const bidsSlope = computePolynomial(
        0,
        derivePolynomial(bidsFit.coefficients)
      );
      const asksSlope = computePolynomial(
        0,
        derivePolynomial(asksFit.coefficients)
      );
      const bidTrend: [number, Date][] = [];
      const askTrend: [number, Date][] = [];
      for (let i = -resolution.timeWindowMs; i <= 0; i += 250) {
        bidTrend.push([
          computePolynomial(i / 1000, bidsFit.coefficients) +
            quote.quote.bidPrice,
          new Date(quote.quote.timestamp.getTime() + i),
        ]);
        askTrend.push([
          computePolynomial(i / 1000, asksFit.coefficients) +
            quote.quote.askPrice,
          new Date(quote.quote.timestamp.getTime() + i),
        ]);
      }

      this.emitAnalysis({
        assetId: this.assetId,
        analyzerId: MomentumAnalyzer.name,
        bidMomentum: bidsSlope,
        bidMomentumError: bidsFit.error,
        bidTrend,
        askMomentum: asksSlope,
        askMomentumError: asksFit.error,
        askTrend,
        timestamp: quote.quote.timestamp,
        resolution: resolution.timeWindowMs,
      });
    }
  }

  override onTrade(
    trade: TradeEvent,
    marketDataService: MarketDataService
  ): void {}
}
