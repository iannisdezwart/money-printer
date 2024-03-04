import Alpaca from "@alpacahq/alpaca-trade-api/dist/alpaca-trade-api.js";
import {
    AlpacaBar,
    AlpacaQuote,
    AlpacaTrade,
} from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2.js";
import { IAlpacaUsEquityMarketDataStreamSource } from "./IAlpacaUsEquityMarketDataStreamSource.js";

class ReplayDataFetcher<T> {
  private buffer: T[] = [];
  static LOW_SIZE = 1000;
  static FETCH_SIZE = 2000;
  private isFetching = false;
  private dataEnd = false;

  size() {
    return this.buffer.length;
  }

  private constructor(
    private startTime: Date,
    private fetchCallback: (startTime: Date, size: number) => Promise<T[]>,
    private getTimestamp: (data: T) => Date
  ) {}

  static async create<T>(
    startTime: Date,
    fetchCallback: (startTime: Date, size: number) => Promise<T[]>,
    getTimestamp: (data: T) => Date
  ) {
    return new ReplayDataFetcher<T>(
      startTime,
      fetchCallback,
      getTimestamp
    ).init();
  }

  private async init() {
    await this.fetch();
    return this;
  }

  private async fetch() {
    if (this.isFetching || this.dataEnd) {
      return;
    }

    this.isFetching = true;

    const bars = await this.fetchCallback(
      this.buffer.length == 0
        ? this.startTime
        : new Date(this.getTimestamp(this.buffer.slice(-1)[0]).getTime() + 1),
      ReplayDataFetcher.FETCH_SIZE
    );
    this.buffer.push(...bars);

    this.isFetching = false;
    if (bars.length == 0) {
      this.dataEnd = true;
    }
  }

  read(curTime: Date): T[] {
    let out: T[] = [];

    while (true) {
      if (this.buffer.length == 0) {
        break;
      }

      const data = this.buffer[0];

      if (this.getTimestamp(data) > curTime) {
        break;
      }

      this.buffer.shift();
      out.push(data);
    }

    if (this.buffer.length < ReplayDataFetcher.LOW_SIZE) {
      this.fetch();
    }

    return out;
  }
}

export class AlpacaUsEquityMarketDataReplayDataStream extends IAlpacaUsEquityMarketDataStreamSource {
  private barsFetcher?: ReplayDataFetcher<AlpacaBar>;
  private quotesFetcher?: ReplayDataFetcher<AlpacaQuote>;
  private tradesFetcher?: ReplayDataFetcher<AlpacaTrade>;

  private constructor(private alpaca: Alpaca, private curTime: Date) {
    super();
  }

  static async create(alpaca: Alpaca, replayDate: Date) {
    return new AlpacaUsEquityMarketDataReplayDataStream(alpaca, replayDate);
  }

  async subscribe(symbols: string[]): Promise<void> {
    this.barsFetcher = await ReplayDataFetcher.create(
      this.curTime,
      async (startTime, size) => {
        console.log(
          "[AlpacaUsEquityMarketDataReplayDataStream]: Fetching %d bars @",
          size,
          startTime
        );
        const barsMap = await this.alpaca.getMultiBarsV2(symbols, {
          timeframe: "1Min",
          start: startTime.toISOString(),
          feed: "iex",
          limit: size,
        });

        const bars: AlpacaBar[] = [];

        barsMap.forEach((barsForSymbol) =>
          barsForSymbol.forEach((bar) => bars.push(bar))
        );
        bars.sort((a, b) => (a.Timestamp < b.Timestamp ? -1 : 1));

        return bars;
      },
      (bar: AlpacaBar) => new Date(bar.Timestamp)
    );

    this.quotesFetcher = await ReplayDataFetcher.create(
      this.curTime,
      async (startTime, size) => {
        console.log(
          "[AlpacaUsEquityMarketDataReplayDataStream]: Fetching %d quotes @",
          size,
          startTime
        );
        const quotesMap = await this.alpaca.getMultiQuotesV2(symbols, {
          start: startTime.toISOString(),
          feed: "iex",
          limit: size,
        });

        const quotes: AlpacaQuote[] = [];

        quotesMap.forEach((quotesForSymbol) =>
          quotesForSymbol.forEach((quote) => quotes.push(quote))
        );
        quotes.sort((a, b) => (a.Timestamp < b.Timestamp ? -1 : 1));

        return quotes;
      },
      (quote: AlpacaQuote) => new Date(quote.Timestamp)
    );

    this.tradesFetcher = await ReplayDataFetcher.create(
      this.curTime,
      async (startTime, size) => {
        console.log(
          "[AlpacaUsEquityMarketDataReplayDataStream]: Fetching %d trades @",
          size,
          startTime
        );
        const tradesMap = await this.alpaca.getMultiTradesV2(symbols, {
          start: startTime.toISOString(),
          feed: "iex",
          limit: size,
        });

        const trades: AlpacaTrade[] = [];

        tradesMap.forEach((tradesForSymbol) =>
          tradesForSymbol.forEach((trade) => trades.push(trade))
        );
        trades.sort((a, b) => (a.Timestamp < b.Timestamp ? -1 : 1));

        return trades;
      },
      (trade: AlpacaTrade) => new Date(trade.Timestamp)
    );

    const interval = 50;
    setInterval(async () => {
      const bars = this.barsFetcher!.read(this.curTime);
      const quotes = this.quotesFetcher!.read(this.curTime);
      const trades = this.tradesFetcher!.read(this.curTime);

      if (false) {
        console.log(
          "[AlpacaUsEquityMarketDataReplayDataStream]: Bars (%d, %d), Quotes (%d, %d), Trades (%d, %d) @ %s",
          bars.length,
          this.barsFetcher?.size(),
          quotes.length,
          this.quotesFetcher?.size(),
          trades.length,
          this.tradesFetcher?.size(),
          this.curTime
        );
      }

      bars.forEach((bar) => this.emitStockBar(bar));
      quotes.forEach((quote) => this.emitQuote(quote));
      trades.forEach((trade) => this.emitTrade(trade));

      this.curTime = new Date(this.curTime.getTime() + interval);
    }, interval);
  }
}
