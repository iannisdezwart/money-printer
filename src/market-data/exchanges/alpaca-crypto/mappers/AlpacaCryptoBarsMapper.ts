import {
    CryptoBar
} from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2";
import { Bar } from "../../../models/Bar";
import {
    OrderBookUpdate,
    OrderBookUpdateType,
} from "../../../models/OrderBookUpdate";
import { AlpacaCryptoOrderBook } from "../entities/AlpacaCryptoOrderBook";

export class AlpacaCryptoBarsMapper {
  fromAlpacaBar(bar: CryptoBar): Bar {
    return new Bar(
      bar.Open,
      bar.Close,
      bar.High,
      bar.Low,
      bar.Volume,
      new Date(bar.Timestamp),
      bar.VWAP
    );
  }

  fromAlpacaBars(barsMap: Map<string, CryptoBar[]>) {
    const outputMap = new Map<string, Bar[]>();
    for (const [symbol, bars] of barsMap.entries()) {
      outputMap.set(symbol, bars.map(this.fromAlpacaBar));
    }
    return outputMap;
  }

  fromAlpacaOrderBookUpdate(
    book: AlpacaCryptoOrderBook
  ): OrderBookUpdate {
    return {
      bids: book.Bids.map((bid) => ({
        price: bid.Price,
        qty: bid.Size,
      })),
      asks: book.Asks.map((ask) => ({
        price: ask.Price,
        qty: ask.Size,
      })),
      timestamp: new Date(book.Timestamp),
      type: book.r ? OrderBookUpdateType.Replace : OrderBookUpdateType.Update,
    };
  }
}
