import { AssetSymbol } from "../algo-engine/models/AssetSymbol";
import { Exchange } from "../algo-engine/models/Exchange";
import { OrderBook } from "./OrderBook";
import { IMarketDataAdapter } from "./exchanges/IMarketDataAdapter";
import { Bar } from "./models/Bar";

export class MarketDataService {
  private constructor(
    private marketDataAdapters: Map<Exchange, IMarketDataAdapter>
  ) {}

  static async create(marketDataAdapters: IMarketDataAdapter[]) {
    return new MarketDataService(
      new Map(marketDataAdapters.map((mda) => [mda.exchange, mda]))
    );
  }

  private getMarketDataAdapterFor(exchange: Exchange): IMarketDataAdapter {
    if (!this.marketDataAdapters.has(exchange)) {
      throw new Error(`No market data adapter for ${exchange}`);
    }

    return this.marketDataAdapters.get(exchange)!;
  }

  getBars(symbol: AssetSymbol): Bar[] {
    return this.getMarketDataAdapterFor(symbol.exchange).getBars(symbol.symbol);
  }

  getOrderBook(symbol: AssetSymbol): OrderBook | undefined {
    return this.getMarketDataAdapterFor(symbol.exchange).getOrderBook(
      symbol.symbol
    );
  }
}
