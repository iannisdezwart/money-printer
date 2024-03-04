import { Asset } from "../../../algo-engine/models/Asset.js";
import { Exchange } from "../../../algo-engine/models/Exchange.js";
import { OrderBook } from "../../OrderBook.js";
import { Bar } from "../../models/Bar.js";
import { Quote } from "../../models/Quote.js";
import { Trade } from "../../models/Trade.js";
import { IMarketDataAdapter } from "../IMarketDataAdapter.js";
import { IAlpacaUsEquityMarketDataStreamSource } from "./data-stream/IAlpacaUsEquityMarketDataStreamSource.js";
import { AlpacaUsEquityMarketDataMapper } from "./mappers/AlpacaUsEquityMarketDataMapper.js";

export class AlpacaUsEquityMarketDataAdapter extends IMarketDataAdapter {
  private static exchanges = [Exchange.AlpacaUsEquity];

  override get exchanges() {
    return AlpacaUsEquityMarketDataAdapter.exchanges;
  }

  private static alpacaUsEquityMarketDataMapper =
    new AlpacaUsEquityMarketDataMapper();

  private constructor(
    private dataStreamSource: IAlpacaUsEquityMarketDataStreamSource,
    private symbols: string[],
    orderBooks: Map<string, OrderBook>,
    cryptoBars: Map<string, Bar[]>,
    quotes: Map<string, Quote[]>,
    trades: Map<string, Trade[]>
  ) {
    super(orderBooks, cryptoBars, quotes, trades);
  }

  private async init() {
    this.dataStreamSource.onStockBar((bar) => {
      this.addBar(
        bar.Symbol,
        AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaBar(
          bar
        )
      );
      console.log("US Equity bar received", bar);
      console.log("US Equity bars", this.getBars(bar.Symbol));
    });

    this.dataStreamSource.onStockBarUpdate((bar) => {
      this.replaceBar(
        bar.Symbol,
        AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaBar(
          bar
        )
      );

      console.log("AlpacaUsEquity updated bar received", bar);
      console.log("US Equity bars", this.getBars(bar.Symbol));
    });

    this.dataStreamSource.onQuote((quote) => {
      this.addQuote(
        quote.Symbol,
        AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaQuote(
          quote
        )
      );
    });

    this.dataStreamSource.onTrade((trade) => {
      this.addTrade(
        trade.Symbol,
        AlpacaUsEquityMarketDataAdapter.alpacaUsEquityMarketDataMapper.fromAlpacaTrade(
          trade
        )
      );
    });

    await this.dataStreamSource.subscribe(this.symbols);

    return this;
  }

  static async create(
    dataStreamSource: IAlpacaUsEquityMarketDataStreamSource,
    assets: Asset[]
  ): Promise<AlpacaUsEquityMarketDataAdapter> {
    const symbols = assets
      .filter((asset) =>
        AlpacaUsEquityMarketDataAdapter.exchanges.includes(asset.exchange)
      )
      .map((asset) => asset.symbol);

    return new AlpacaUsEquityMarketDataAdapter(
      dataStreamSource,
      symbols,
      new Map(),
      new Map(),
      new Map(),
      new Map()
    ).init();
  }
}
