import Alpaca from "@alpacahq/alpaca-trade-api/dist/alpaca-trade-api.js";
import {
  AlpacaBar,
  AlpacaQuote,
} from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2.js";
import { createWriteStream } from "fs";
import { IAlpacaUsEquityMarketDataStreamSource } from "./IAlpacaUsEquityMarketDataStreamSource.js";

export class AlpacaUsEquityMarketDataRealtimeWebsocketStream extends IAlpacaUsEquityMarketDataStreamSource {
  private constructor(private alpaca: Alpaca) {
    super();
  }

  static async create(alpaca: Alpaca) {
    return new AlpacaUsEquityMarketDataRealtimeWebsocketStream(alpaca);
  }

  private static async fetchLatestBars(
    alpaca: Alpaca,
    symbols: string[]
  ): Promise<Map<string, AlpacaBar[]>> {
    return await alpaca.getMultiBarsV2(symbols, {
      timeframe: "1Min",
      start: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
      feed: "iex",
    });
  }

  private static async fetchLatestQuotes(
    alpaca: Alpaca,
    symbols: string[]
  ): Promise<Map<string, AlpacaQuote>> {
    return await alpaca.getLatestQuotes(symbols);
  }

  private async loadInitialData(symbols: string[]) {
    const allAssets = await this.alpaca.getAssets({
      status: "active",
      asset_class: "us_equity", // TODO
    });
    createWriteStream("AlpacaUsEquityAssets.json").write(
      JSON.stringify(allAssets, null, 2)
    );

    const bars =
      await AlpacaUsEquityMarketDataRealtimeWebsocketStream.fetchLatestBars(
        this.alpaca,
        symbols
      );
    bars.forEach((barsForSymbol) =>
      barsForSymbol.forEach((bar) => this.emitStockBarUpdate(bar))
    );

    const quotes =
      await AlpacaUsEquityMarketDataRealtimeWebsocketStream.fetchLatestQuotes(
        this.alpaca,
        symbols
      );
    quotes.forEach((quote) => this.emitQuote(quote));
  }

  async subscribe(symbols: string[]): Promise<void> {
    await this.loadInitialData(symbols);

    return new Promise<void>((resolve, reject) => {
      this.alpaca.data_stream_v2.onConnect(() => {
        console.log("Connected to AlpacaUsEquity websocket");
        this.alpaca.data_stream_v2.subscribe({
          bars: symbols,
          // dailyBars: symbols,
          updatedBars: symbols,
          quotes: symbols,
          trades: symbols,
          statuses: symbols,
          lulds: symbols,
        });
        resolve();
      });
      this.alpaca.data_stream_v2.onError((err) => {
        console.log("Error from AlpacaUsEquity websocket", err);
        reject(err);
      });
      this.alpaca.data_stream_v2.onStockDailyBar((bar) => {
        console.log("AlpacaUsEquity daily bar received", bar);
      });
      this.alpaca.data_stream_v2.onStockBar((bar) => {
        this.emitStockBar(bar);
      });
      this.alpaca.data_stream_v2.onStockUpdatedBar((bar) => {
        this.emitStockBarUpdate(bar);
      });
      this.alpaca.data_stream_v2.onStockQuote((quote) => {
        this.emitQuote(quote);
      });
      this.alpaca.data_stream_v2.onStockTrade((trade) => {
        this.emitTrade(trade);
      });
      this.alpaca.data_stream_v2.onStatuses((status) => {
        console.log("AlpacaUsEquity status received", status);
      });
      this.alpaca.data_stream_v2.onLulds((luld) => {
        console.log("AlpacaUsEquity luld received", luld);
      });
      this.alpaca.data_stream_v2.connect();
    });
  }
}
