import Alpaca from "@alpacahq/alpaca-trade-api/dist/alpaca-trade-api.js";
import {
  CryptoQuote,
  CryptoTrade,
} from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2.js";
import { createWriteStream } from "fs";
import { Asset } from "../../../algo-engine/models/Asset.js";
import { Exchange } from "../../../algo-engine/models/Exchange.js";
import { OrderBook } from "../../OrderBook.js";
import { Bar } from "../../models/Bar.js";
import { Quote } from "../../models/Quote.js";
import { Trade } from "../../models/Trade.js";
import { IMarketDataAdapter } from "../IMarketDataAdapter.js";
import { AlpacaCryptoBar } from "./entities/AlpacaCryptoBar.js";
import { AlpacaCryptoOrderBook } from "./entities/AlpacaCryptoOrderBook.js";
import { AlpacaCryptoMarketDataMapper } from "./mappers/AlpacaCryptoMarketDataMapper.js";

export class AlpacaCryptoMarketDataAdapter extends IMarketDataAdapter {
  private static exchanges = [Exchange.AlpacaCrypto];

  override get exchanges() {
    return AlpacaCryptoMarketDataAdapter.exchanges;
  }

  private static alpacaCryptoMarketDataMapper =
    new AlpacaCryptoMarketDataMapper();

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
    return AlpacaCryptoMarketDataAdapter.alpacaCryptoMarketDataMapper.fromAlpacaBars(
      await alpaca.getCryptoBars(symbols, {
        timeframe: "1Min",
        start: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
      })
    );
  }

  private static async fetchLatestQuotes(
    alpaca: Alpaca,
    symbols: string[]
  ): Promise<Map<string, Quote[]>> {
    return AlpacaCryptoMarketDataAdapter.alpacaCryptoMarketDataMapper.fromAlpacaQuotes(
      await alpaca.getLatestCryptoQuotes(symbols)
    );
  }

  private async init() {
    return new Promise<AlpacaCryptoMarketDataAdapter>((resolve, reject) => {
      this.alpaca.crypto_stream_v1beta3.onConnect(() => {
        console.log("Connected to crypto websocket");
        this.alpaca.crypto_stream_v1beta3.subscribe({
          bars: this.symbols,
          // dailyBars: this.symbols,
          updatedBars: this.symbols,
          orderbooks: this.symbols,
          quotes: this.symbols,
          trades: this.symbols,
        });
        resolve(this);
      });
      this.alpaca.crypto_stream_v1beta3.onError((err: Error) => {
        console.log("Error from crypto websocket", err);
        reject(err);
      });
      this.alpaca.crypto_stream_v1beta3.onCryptoDailyBar((bar) => {
        console.log("Crypto daily bar received", bar);
      });
      this.alpaca.crypto_stream_v1beta3.onCryptoBar((_bar) => {
        const bar = _bar as AlpacaCryptoBar;

        this.addBar(
          bar.S,
          AlpacaCryptoMarketDataAdapter.alpacaCryptoMarketDataMapper.fromAlpacaBar(
            bar
          )
        );

        console.log("Crypto bar received", bar);
        console.log("Crypto bars", this.getBars(bar.S));
      });
      this.alpaca.crypto_stream_v1beta3.onCryptoUpdatedBar((_bar) => {
        const bar = _bar as AlpacaCryptoBar;

        this.replaceBar(
          bar.S,
          AlpacaCryptoMarketDataAdapter.alpacaCryptoMarketDataMapper.fromAlpacaBar(
            bar
          )
        );

        console.log("Crypto updated bar received", bar);
        console.log("Crypto bars", this.getBars(bar.S));
      });
      this.alpaca.crypto_stream_v1beta3.onCryptoOrderbook(
        (_orderBookUpdate) => {
          const orderBookUpdate = _orderBookUpdate as AlpacaCryptoOrderBook;

          this.updateOrderBook(
            orderBookUpdate.S,
            AlpacaCryptoMarketDataAdapter.alpacaCryptoMarketDataMapper.fromAlpacaOrderBookUpdate(
              orderBookUpdate
            )
          );

          // console.log(
          //   "Crypto orderbook received",
          //   orderBookUpdate,
          //   "updated internal to",
          //   this.getOrderBook(orderBookUpdate.S)
          // );
        }
      );
      this.alpaca.crypto_stream_v1beta3.onCryptoQuote((_quote) => {
        const quote = _quote as CryptoQuote & { S: string };

        this.addQuote(
          quote.S,
          AlpacaCryptoMarketDataAdapter.alpacaCryptoMarketDataMapper.fromAlpacaQuote(
            quote
          )
        );
      });
      this.alpaca.crypto_stream_v1beta3.onCryptoTrade((_trade) => {
        const trade = _trade as CryptoTrade & { Symbol: string; ID: number };

        this.addTrade(
          trade.Symbol,
          AlpacaCryptoMarketDataAdapter.alpacaCryptoMarketDataMapper.fromAlpacaTrade(
            trade
          )
        );
      });
      this.alpaca.crypto_stream_v1beta3.onDisconnect(() => {
        console.log("Disconnected from crypto websocket");
      });
      this.alpaca.crypto_stream_v1beta3.connect();
    });
  }

  static async create(
    alpaca: Alpaca,
    assets: Asset[]
  ): Promise<AlpacaCryptoMarketDataAdapter> {
    const allAssets = await alpaca.getAssets({
      status: "active",
      asset_class: "crypto", // TODO
    });
    createWriteStream("AlpacaCryptoAssets.json").write(
      JSON.stringify(allAssets, null, 2)
    );

    const symbols = assets
      .filter((asset) =>
        AlpacaCryptoMarketDataAdapter.exchanges.includes(asset.exchange)
      )
      .map((asset) => asset.symbol);

    const bars = await AlpacaCryptoMarketDataAdapter.fetchLatestBars(
      alpaca,
      symbols
    );
    console.log("AlpacaCrypto: Bars", bars);

    const quotes = await AlpacaCryptoMarketDataAdapter.fetchLatestQuotes(
      alpaca,
      symbols
    );
    console.log("AlpacaCrypto: Quotes", quotes);

    return new AlpacaCryptoMarketDataAdapter(
      alpaca,
      symbols,
      new Map(),
      bars,
      quotes,
      new Map()
    ).init();
  }
}
