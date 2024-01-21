import Alpaca from "@alpacahq/alpaca-trade-api";
import { CryptoBar } from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2";
import { createWriteStream } from "fs";
import { OrderBook, OrderBookUpdate } from "./OrderBook";

export class MarketDataService {
  private constructor(
    private alpaca: Alpaca,
    private orderBooks: Map<string, OrderBook>,
    private cryptoBars: Map<string, CryptoBar[]>
  ) {}

  private static async fetchLatestBars(
    alpaca: Alpaca,
    symbols: string[]
  ): Promise<Map<string, CryptoBar[]>> {
    return await alpaca.getCryptoBars(symbols, {
      timeframe: "1Min",
      start: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
    });
  }

  static async create(alpaca: Alpaca, symbols: string[]): Promise<MarketDataService> {
    const assets = await alpaca.getAssets({
      status: "active",
    });
    createWriteStream("assets.json").write(JSON.stringify(assets, null, 2));

    const bars = await MarketDataService.fetchLatestBars(alpaca, symbols);
    console.log("Bars", bars);

    const inst = new MarketDataService(alpaca, new Map(), bars);

    return new Promise((resolve, reject) => {
      alpaca.crypto_stream_v1beta3.onConnect(() => {
        console.log("Connected to crypto websocket");
        alpaca.crypto_stream_v1beta3.subscribe({
          bars: symbols,
          // dailyBars: symbols,
          updatedBars: symbols,
          orderbooks: symbols,
          quotes: symbols,
          trades: symbols,
        });
        resolve(inst);
      });
      alpaca.crypto_stream_v1beta3.onError((err: Error) => {
        console.log("Error from crypto websocket", err);
        reject(err);
      });
      alpaca.crypto_stream_v1beta3.onCryptoBar((_bar) => {
        const bar = _bar as CryptoBar & { S: string };

        if (!inst.cryptoBars.has(bar.S)) {
          inst.cryptoBars.set(bar.S, []);
        }

        inst.cryptoBars.get(bar.S)!.push(bar);
        console.log("Crypto bar received", bar);
        console.log("Crypto bars", inst.cryptoBars);
      });
      alpaca.crypto_stream_v1beta3.onCryptoDailyBar((bar) => {
        console.log("Crypto daily bar received", bar);
      });
      alpaca.crypto_stream_v1beta3.onCryptoUpdatedBar((_bar) => {
        const bar = _bar as CryptoBar & { S: string };

        if (!inst.cryptoBars.has(bar.S)) {
          inst.cryptoBars.set(bar.S, []);
        }

        inst.cryptoBars.get(bar.S)![inst.cryptoBars.get(bar.S)!.length - 1] =
          bar;
        console.log("Crypto updated bar received", bar);
      });
      alpaca.crypto_stream_v1beta3.onCryptoOrderbook((_orderBook) => {
        const orderBook = _orderBook as OrderBookUpdate;

        if (!inst.orderBooks.has(orderBook.S)) {
          inst.orderBooks.set(orderBook.S, new OrderBook());
        }

        inst.orderBooks.get(orderBook.S)!.update(orderBook);
        console.log(
          "Crypto orderbook received",
          orderBook,
          "updated internal to",
          inst.orderBooks.get(orderBook.S)
        );
      });
      alpaca.crypto_stream_v1beta3.onCryptoQuote((quote) => {
        console.log("Crypto quote received", quote);
      });
      alpaca.crypto_stream_v1beta3.onCryptoTrade((trade) => {
        console.log("Crypto trade received", trade);
      });
      alpaca.crypto_stream_v1beta3.onDisconnect(() => {
        console.log("Disconnected from crypto websocket");
      });
      alpaca.crypto_stream_v1beta3.connect();
    });
  }

  getBars(symbol: string): CryptoBar[] {
    return this.cryptoBars.get(symbol) || [];
  }

  getOrderBook(symbol: string): OrderBook | undefined {
    return this.orderBooks.get(symbol);
  }
}
