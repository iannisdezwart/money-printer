import {
  AlpacaBar,
  AlpacaQuote,
  AlpacaTrade,
} from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2.js";
import { Bar } from "../../../models/Bar.js";
import { Quote } from "../../../models/Quote.js";
import { Trade } from "../../../models/Trade.js";

export class AlpacaUsEquityMarketDataMapper {
  fromAlpacaBar(bar: AlpacaBar): Bar {
    return new Bar(
      bar.OpenPrice,
      bar.ClosePrice,
      bar.HighPrice,
      bar.LowPrice,
      bar.Volume,
      new Date(bar.Timestamp),
      bar.VWAP
    );
  }

  fromAlpacaBars(barsMap: Map<string, AlpacaBar[]>) {
    const outputMap = new Map<string, Bar[]>();
    for (const [symbol, bars] of barsMap.entries()) {
      outputMap.set(symbol, bars.map(this.fromAlpacaBar));
    }
    return outputMap;
  }

  fromAlpacaTrade(trade: AlpacaTrade): Trade {
    return {
      externalTradeId: trade.ID.toString(),
      price: trade.Price,
      qty: trade.Size,
      timestamp: new Date(trade.Timestamp),
    };
  }

  fromAlpacaQuote(quote: AlpacaQuote): Quote {
    return {
      bidPrice: quote.BidPrice,
      bidQty: quote.BidSize,
      askPrice: quote.AskPrice,
      askQty: quote.AskSize,
      timestamp: new Date(quote.Timestamp),
    };
  }

  fromAlpacaQuotes(quotes: Map<string, AlpacaQuote>): Map<string, Quote[]> {
    const outputMap = new Map<string, Quote[]>();
    for (const [symbol, quote] of quotes.entries()) {
      outputMap.set(symbol, [this.fromAlpacaQuote(quote)]);
    }
    return outputMap;
  }

  // fromAlpacaOrderBookUpdate(
  //   book:
  // ): OrderBookUpdate {
  //   return {
  //     bids: book.Bids.map((bid) => ({
  //       price: bid.Price,
  //       qty: bid.Size,
  //     })),
  //     asks: book.Asks.map((ask) => ({
  //       price: ask.Price,
  //       qty: ask.Size,
  //     })),
  //     timestamp: new Date(book.Timestamp),
  //     type: book.r ? OrderBookUpdateType.Replace : OrderBookUpdateType.Update,
  //   };
  // }
}
