import { Socket, Server as SocketIoServer } from "socket.io";
import { MomentumAnalyzer } from "../../../analysis/analyzers/MomentumAnalyzer.js";
import {
  MarketDataService,
  QuoteEvent,
  TradeEvent,
} from "../../../market-data/MarketDataService.js";

export type SubscribeRequest = {
  assetId: string;
};

export class WsMarketDataService {
  private constructor(
    private socketIoServer: SocketIoServer,
    private marketDataService: MarketDataService
  ) {}

  private async init() {
    this.marketDataService.quoteEmitter.addEventListener(
      (quote: QuoteEvent) => {
        this.socketIoServer
          .to(`market-data:${quote.assetId}`)
          .emit("quote", quote);
      }
    );
    this.marketDataService.tradeEmitter.addEventListener(
      (trade: TradeEvent) => {
        this.socketIoServer
          .to(`market-data:${trade.assetId}`)
          .emit("trade", trade);
      }
    );
    this.marketDataService.analysisEmitter.addEventListener((analysis) => {
      if (analysis.analyzerId === MomentumAnalyzer.name) {
        this.socketIoServer
          .to(`market-data:${analysis.assetId}`)
          .emit("analysis", analysis);
      }
    });

    return this;
  }

  subscribe(socket: Socket, data: SubscribeRequest) {
    console.log(
      `[WsMarketDataService]: ${socket.id} subscribed to market-data:${data.assetId}`
    );
    socket.join(`market-data:${data.assetId}`);

    // Send last minute of quotes.
    this.marketDataService
      .getLatestQuotes(data.assetId, new Date(Date.now() - 1000 * 60))
      .map<QuoteEvent>((quote) => {
        return {
          assetId: data.assetId,
          quote: quote,
        };
      })
      .forEach((quote) => {
        socket.emit("quote", quote);
      });

    // Send last minute of trades.
    this.marketDataService
      .getLatestTrades(data.assetId, new Date(Date.now() - 1000 * 60))
      .map<TradeEvent>((trade) => {
        return {
          assetId: data.assetId,
          trade: trade,
        };
      })
      .forEach((trade) => {
        socket.emit("trade", trade);
      });
  }

  static async create(
    socketIoServer: SocketIoServer,
    marketDataService: MarketDataService
  ) {
    return await new WsMarketDataService(
      socketIoServer,
      marketDataService
    ).init();
  }
}
