import Alpaca from "@alpacahq/alpaca-trade-api";
import { createWriteStream } from "fs";
import { Exchange } from "../../../algo-engine/models/Exchange";
import { OrderBook } from "../../OrderBook";
import { Bar } from "../../models/Bar";
import { IMarketDataAdapter } from "../IMarketDataAdapter";
import { AlpacaCryptoBar } from "./entities/AlpacaCryptoBar";
import { AlpacaCryptoOrderBook } from "./entities/AlpacaCryptoOrderBook";
import { AlpacaCryptoBarsMapper } from "./mappers/AlpacaCryptoBarsMapper";

export class AlpacaCryptoMarketDataAdapter extends IMarketDataAdapter {
  override get exchange() {
    return Exchange.AlpacaCrypto;
  }

  private static alpacaCryptoBarsMapper = new AlpacaCryptoBarsMapper();

  private constructor(
    private alpaca: Alpaca,
    private symbols: string[],
    orderBooks: Map<string, OrderBook>,
    cryptoBars: Map<string, Bar[]>
  ) {
    super(orderBooks, cryptoBars);
  }

  private static async fetchLatestBars(
    alpaca: Alpaca,
    symbols: string[]
  ): Promise<Map<string, Bar[]>> {
    return AlpacaCryptoMarketDataAdapter.alpacaCryptoBarsMapper.fromAlpacaBars(
      await alpaca.getCryptoBars(symbols, {
        timeframe: "1Min",
        start: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
      })
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
      this.alpaca.crypto_stream_v1beta3.onCryptoBar((_bar) => {
        const bar = _bar as AlpacaCryptoBar;

        if (!this.cryptoBars.has(bar.S)) {
          this.cryptoBars.set(bar.S, []);
        }

        this.cryptoBars
          .get(bar.S)!
          .push(
            AlpacaCryptoMarketDataAdapter.alpacaCryptoBarsMapper.fromAlpacaBar(
              bar
            )
          );
        console.log("Crypto bar received", bar);
        console.log("Crypto bars", this.cryptoBars);
      });
      this.alpaca.crypto_stream_v1beta3.onCryptoDailyBar((bar) => {
        console.log("Crypto daily bar received", bar);
      });
      this.alpaca.crypto_stream_v1beta3.onCryptoUpdatedBar((_bar) => {
        const bar = _bar as AlpacaCryptoBar;

        if (!this.cryptoBars.has(bar.S)) {
          this.cryptoBars.set(bar.S, []);
        }

        this.cryptoBars.get(bar.S)![this.cryptoBars.get(bar.S)!.length - 1] =
          AlpacaCryptoMarketDataAdapter.alpacaCryptoBarsMapper.fromAlpacaBar(
            bar
          );
        console.log("Crypto updated bar received", bar);
      });
      this.alpaca.crypto_stream_v1beta3.onCryptoOrderbook(
        (_orderBookUpdate) => {
          const orderBookUpdate = _orderBookUpdate as AlpacaCryptoOrderBook;

          if (!this.orderBooks.has(orderBookUpdate.S)) {
            this.orderBooks.set(orderBookUpdate.S, new OrderBook());
          }

          const mappedOrderBookUpdate =
            AlpacaCryptoMarketDataAdapter.alpacaCryptoBarsMapper.fromAlpacaOrderBookUpdate(
              orderBookUpdate
            );

          this.orderBooks.get(orderBookUpdate.S)!.update(mappedOrderBookUpdate);
          console.log(
            "Crypto orderbook received",
            orderBookUpdate,
            "updated internal to",
            this.orderBooks.get(orderBookUpdate.S)
          );
        }
      );
      this.alpaca.crypto_stream_v1beta3.onCryptoQuote((quote) => {
        console.log("Crypto quote received", quote);
      });
      this.alpaca.crypto_stream_v1beta3.onCryptoTrade((trade) => {
        console.log("Crypto trade received", trade);
      });
      this.alpaca.crypto_stream_v1beta3.onDisconnect(() => {
        console.log("Disconnected from crypto websocket");
      });
      this.alpaca.crypto_stream_v1beta3.connect();
    });
  }

  static async create(
    alpaca: Alpaca,
    symbols: string[]
  ): Promise<AlpacaCryptoMarketDataAdapter> {
    const assets = await alpaca.getAssets({
      status: "active",
    });
    createWriteStream("AlpacaCryptoAssets.json").write(
      JSON.stringify(assets, null, 2)
    );

    const bars = await AlpacaCryptoMarketDataAdapter.fetchLatestBars(
      alpaca,
      symbols
    );
    console.log("Bars", bars);

    const inst = new AlpacaCryptoMarketDataAdapter(
      alpaca,
      symbols,
      new Map(),
      bars
    );
    return await inst.init();
  }
}
