import {
  CryptoBar,
  CryptoQuote,
  CryptoTrade,
} from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2.js";
import { Bar } from "../../../models/Bar.js";
import {
  OrderBookUpdate,
  OrderBookUpdateType,
} from "../../../models/OrderBookUpdate.js";
import { Quote } from "../../../models/Quote.js";
import { Trade } from "../../../models/Trade.js";
import { AlpacaCryptoOrderBook } from "../entities/AlpacaCryptoOrderBook.js";

export class AlpacaCryptoMarketDataMapper {
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

  fromAlpacaTrade(trade: CryptoTrade & { ID: number }): Trade {
    return {
      externalTradeId: trade.ID?.toString(),
      price: trade.Price,
      qty: trade.Size,
      timestamp: new Date(trade.Timestamp),
    };
  }

  fromAlpacaQuote(quote: CryptoQuote): Quote {
    return {
      bidPrice: quote.BidPrice,
      bidQty: quote.BidSize,
      askPrice: quote.AskPrice,
      askQty: quote.AskSize,
      timestamp: new Date(quote.Timestamp),
    };
  }

  fromAlpacaQuotes(quotes: Map<string, CryptoQuote>): Map<string, Quote[]> {
    const outputMap = new Map<string, Quote[]>();
    for (const [symbol, quote] of quotes.entries()) {
      outputMap.set(symbol, [this.fromAlpacaQuote(quote)]);
    }
    return outputMap;
  }

  fromAlpacaOrderBookUpdate(book: AlpacaCryptoOrderBook): OrderBookUpdate {
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
