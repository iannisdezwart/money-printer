import { Asset } from "../algo-engine/models/Asset.js";
import { Exchange } from "../algo-engine/models/Exchange.js";
import { EventEmitter } from "../utils/EventEmitter.js";
import { OrderBook } from "./OrderBook.js";
import { IMarketDataAdapter } from "./exchanges/IMarketDataAdapter.js";
import { Bar } from "./models/Bar.js";
import { Quote } from "./models/Quote.js";
import { Trade } from "./models/Trade.js";

export type QuoteEvent = {
  assetId: string;
  quote: Quote;
};

export type TradeEvent = {
  assetId: string;
  trade: Trade;
};
export class MarketDataService {
  quoteEmitter = new EventEmitter<QuoteEvent>();
  tradeEmitter = new EventEmitter<TradeEvent>();

  private constructor(
    private marketDataAdapters: Map<Exchange, IMarketDataAdapter>,
    private assetsById: Map<string, Asset>,
    private assetsByExchange: Map<Exchange, Asset[]>
  ) {}

  private async init() {
    const assetsForMarketDataAdapterPlusSymbol = (
      adapter: IMarketDataAdapter,
      symbol: string
    ) =>
      adapter.exchanges
        .map((exchange) => this.assetsByExchange.get(exchange) || [])
        .flat()
        .filter((asset) => asset.symbol === symbol);

    this.marketDataAdapters.forEach((adapter) => {
      adapter.quoteEmitter.addEventListener((quote) => {
        const assets = assetsForMarketDataAdapterPlusSymbol(
          adapter,
          quote.symbol
        );
        if (assets.length !== 1) {
          throw new Error(
            `Expected 1 asset for symbol ${quote.symbol}, found ${assets.length}`
          );
        }

        this.quoteEmitter.emit({
          assetId: assets[0].id,
          quote: quote.quote,
        });
      });

      adapter.tradeEmitter.addEventListener((trade) => {
        const assets = assetsForMarketDataAdapterPlusSymbol(
          adapter,
          trade.symbol
        );

        if (assets.length !== 1) {
          throw new Error(
            `Expected 1 asset for symbol ${trade.symbol}, found ${assets.length}`
          );
        }

        this.tradeEmitter.emit({
          assetId: assets[0].id,
          trade: trade.trade,
        });
      });
    });

    return this;
  }

  static createAssetsByExchangeMap(assets: Asset[]) {
    const map = new Map<Exchange, Asset[]>();
    assets.forEach((asset) => {
      if (!map.has(asset.exchange)) {
        map.set(asset.exchange, []);
      }

      map.get(asset.exchange)!.push(asset);
    });
    return map;
  }

  static async create(
    marketDataAdapters: IMarketDataAdapter[],
    assets: Asset[]
  ) {
    return await new MarketDataService(
      new Map(
        marketDataAdapters
          .map((adapter) =>
            adapter.exchanges.map(
              (exchange) => <[Exchange, IMarketDataAdapter]>[exchange, adapter]
            )
          )
          .flat()
      ),
      new Map(assets.map((asset) => [asset.id, asset])),
      this.createAssetsByExchangeMap(assets)
    ).init();
  }

  private getMarketDataAdapterFor(assetId: string): IMarketDataAdapter {
    const asset = this.assetsById.get(assetId);
    if (asset == null) {
      throw new Error(`No asset for ${assetId}`);
    }

    const marketDataAdapter = this.marketDataAdapters.get(asset.exchange);
    if (marketDataAdapter == null) {
      throw new Error(`No market data adapter for ${asset.exchange}`);
    }

    return marketDataAdapter;
  }

  getBars(assetId: string): Bar[] {
    return this.getMarketDataAdapterFor(assetId).getBars(assetId);
  }

  getLatestTrades(assetId: string, from: Date) {
    return this.getMarketDataAdapterFor(assetId).getLatestTrades(assetId, from);
  }

  getLatestQuotes(assetId: string, from: Date) {
    return this.getMarketDataAdapterFor(assetId).getLatestQuotes(assetId, from);
  }

  getOrderBook(assetId: string): OrderBook | undefined {
    return this.getMarketDataAdapterFor(assetId).getOrderBook(assetId);
  }
}
