import Alpaca from "@alpacahq/alpaca-trade-api/dist/alpaca-trade-api.js";
import { createWriteStream } from "fs";
import { Asset } from "../../../algo-engine/models/Asset.js";
import { Exchange } from "../../../algo-engine/models/Exchange.js";
import { OrderBook } from "../../OrderBook.js";
import { Bar } from "../../models/Bar.js";
import { Quote } from "../../models/Quote.js";
import { Trade } from "../../models/Trade.js";
import { IMarketDataAdapter } from "../IMarketDataAdapter.js";
import { AlpacaUsEquityMarketDataMapper } from "./mappers/AlpacaUsEquityMarketDataMapper.js";

export class AlpacaUsEquityMarketDataAdapter extends IMarketDataAdapter {
  private static exchanges = [Exchange.AlpacaUsEquity];

  override get exchanges() {
    return AlpacaUsEquityMarketDataAdapter.exchanges;
  }

  private static alpacaUsEquityMarketDataMapper =
    new AlpacaUsEquityMarketDataMapper();

  private constructor(
    private alpaca: Alpaca,
    private symbols: string[],
    orderBooks: Map<string, OrderBook>,
    cryptoBars: Map<string, Bar[]>,
    quotes: Map<string, Quote[]>,
    trades: Map<string, Trade[]>
  ) {
    super(orderBooks, cryptoBars, quotes, trades);
  }

  private static async fetchLatestBars(
    alpaca: Alpaca,
    symbols: string[]
  ): Promise<Map<string, Bar[]>> {
    return AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaBars(
      await alpaca.getMultiBarsV2(symbols, {
        timeframe: "1Min",
        start: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
        feed: "iex",
      })
    );
  }

  private static async fetchLatestQuotes(
    alpaca: Alpaca,
    symbols: string[]
  ): Promise<Map<string, Quote[]>> {
    return AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaQuotes(
      await alpaca.getLatestQuotes(symbols)
    );
  }

  private async init() {
    return new Promise<AlpacaUsEquityMarketDataAdapter>((resolve, reject) => {
      this.alpaca.data_stream_v2.onConnect(() => {
        console.log("Connected to AlpacaUsEquity websocket");
        this.alpaca.data_stream_v2.subscribe({
          bars: this.symbols,
          // dailyBars: this.symbols,
          updatedBars: this.symbols,
          quotes: this.symbols,
          trades: this.symbols,
          statuses: this.symbols,
          lulds: this.symbols,
        });
        resolve(this);
      });
      this.alpaca.data_stream_v2.onError((err) => {
        console.log("Error from AlpacaUsEquity websocket", err);
        reject(err);
      });
      this.alpaca.data_stream_v2.onStockDailyBar((bar) => {
        console.log("AlpacaUsEquity daily bar received", bar);
      });
      this.alpaca.data_stream_v2.onStockBar((bar) => {
        this.addBar(
          bar.Symbol,
          AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaBar(
            bar
          )
        );
        console.log("US Equity bar received", bar);
        console.log("US Equity bars", this.getBars(bar.Symbol));
      });
      this.alpaca.data_stream_v2.onStockUpdatedBar((bar) => {
        this.replaceBar(
          bar.Symbol,
          AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaBar(
            bar
          )
        );

        console.log("AlpacaUsEquity updated bar received", bar);
        console.log("US Equity bars", this.getBars(bar.Symbol));
      });
      this.alpaca.data_stream_v2.onStockQuote((quote) => {
        this.addQuote(
          quote.Symbol,
          AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaQuote(
            quote
          )
        );
        // console.log("AlpacaUsEquity quote received", quote);
      });
      this.alpaca.data_stream_v2.onStockTrade((trade) => {
        this.addTrade(
          trade.Symbol,
          AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaTrade(
            trade
          )
        );
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

  static async create(
    alpaca: Alpaca,
    assets: Asset[]
  ): Promise<AlpacaUsEquityMarketDataAdapter> {
    const allAssets = await alpaca.getAssets({
      status: "active",
      asset_class: "us_equity", // TODO
    });
    createWriteStream("AlpacaUsEquityAssets.json").write(
      JSON.stringify(allAssets, null, 2)
    );

    const symbols = assets
      .filter((asset) =>
        AlpacaUsEquityMarketDataAdapter.exchanges.includes(asset.exchange)
      )
      .map((asset) => asset.symbol);

    const bars = await AlpacaUsEquityMarketDataAdapter.fetchLatestBars(
      alpaca,
      symbols
    );
    console.log("AlpacaUsEquity: Bars", bars);

    const quotes = await AlpacaUsEquityMarketDataAdapter.fetchLatestQuotes(
      alpaca,
      symbols
    );
    console.log("AlpacaUsEquity: Quotes", quotes);

    return new AlpacaUsEquityMarketDataAdapter(
      alpaca,
      symbols,
      new Map(),
      bars,
      quotes,
      new Map(),
    ).init();
  }
}
