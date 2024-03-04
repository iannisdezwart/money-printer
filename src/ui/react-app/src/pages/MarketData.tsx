import BasicPlotly from "plotly.js-basic-dist";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Analysis } from "../../../../analysis/analyses/Analyis.js";
import {
  QuoteEvent,
  TradeEvent,
} from "../../../../market-data/MarketDataService.js";

export const MarketData = () => {
  const [searchParams] = useSearchParams();
  const [quotes, setQuotes] = useState<QuoteEvent[]>([]);
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [analysis10s, setAnalysis10s] = useState<Analysis[]>([]);
  const [analysis1m, setAnalysis1m] = useState<Analysis[]>([]);

  const assetId = searchParams.get("assetId");
  const maxSpread = searchParams.get("maxSpread");

  const marketPlotLayout = {
    yaxis: {
      tickformat: ".2f",
      tickprefix: "US$ ",
    },
    margin: {
      l: 100,
    },
    title: `${assetId} Market Data`,
  };

  const analysisPlotLayout: Partial<BasicPlotly.Layout> = {
    yaxis: {
      ticksuffix: " US$/s",
    },
    margin: {
      l: 100,
    },
    title: `${assetId} Analysis`,
  };

  useEffect(() => {
    BasicPlotly.react(
      "market",
      [
        {
          y: quotes.map((quote) => quote.quote.askPrice),
          x: quotes.map((quote) => new Date(quote.quote.timestamp)),
          mode: "lines+markers",
          line: { color: "#ff0000" },
          name: "ask",
        },
        {
          y: quotes.map((quote) => quote.quote.bidPrice),
          x: quotes.map((quote) => new Date(quote.quote.timestamp)),
          mode: "lines+markers",
          line: { color: "#00ff00" },
          name: "bid",
        },
        {
          y: quotes.map(
            (quote) => (quote.quote.askPrice + quote.quote.bidPrice) / 2
          ),
          x: quotes.map((quote) => new Date(quote.quote.timestamp)),
          mode: "lines+markers",
          line: { color: "#0000ff" },
          name: "mid",
        },
        {
          y: trades.map((trade) => trade.trade.price),
          x: trades.map((trade) => new Date(trade.trade.timestamp)),
          mode: "markers",
          marker: { color: "#000000" },
          name: "trade",
        },
        {
          y: analysis10s.slice(-1)[0]?.bidTrend.map((t) => t[0]),
          x: analysis10s.slice(-1)[0]?.bidTrend.map((t) => new Date(t[1])),
          mode: "lines",
          line: { color: "#ffff00" },
          name: "bid trend 10s",
        },
        {
          y: analysis10s.slice(-1)[0]?.askTrend.map((t) => t[0]),
          x: analysis10s.slice(-1)[0]?.askTrend.map((t) => new Date(t[1])),
          mode: "lines",
          line: { color: "#00ffff" },
          name: "ask trend 10s",
        },
        {
          y: analysis1m.slice(-1)[0]?.bidTrend.map((t) => t[0]),
          x: analysis1m.slice(-1)[0]?.bidTrend.map((t) => new Date(t[1])),
          mode: "lines",
          line: { color: "#ff7700" },
          name: "bid trend 1m",
        },
        {
          y: analysis1m.slice(-1)[0]?.askTrend.map((t) => t[0]),
          x: analysis1m.slice(-1)[0]?.askTrend.map((t) => new Date(t[1])),
          mode: "lines",
          line: { color: "#0077ff" },
          name: "ask trend 1m",
        },
      ],
      marketPlotLayout
    );
  }, [quotes, trades]);

  useEffect(() => {
    BasicPlotly.react(
      "analysis",
      [
        {
          y: analysis10s.map((a) => a.bidMomentum),
          x: analysis10s.map((a) => new Date(a.timestamp)),
          mode: "lines",
          line: { color: "#ff0000" },
          name: "bid momentum 10s",
        },
        {
          y: analysis10s.map((a) => a.askMomentum),
          x: analysis10s.map((a) => new Date(a.timestamp)),
          mode: "lines",
          line: { color: "#00ff00" },
          name: "ask momentum 10s",
        },
        {
          y: analysis1m.map((a) => a.bidMomentum),
          x: analysis1m.map((a) => new Date(a.timestamp)),
          mode: "lines",
          line: { color: "#0000ff" },
          name: "bid momentum 1m",
        },
        {
          y: analysis1m.map((a) => a.askMomentum),
          x: analysis1m.map((a) => new Date(a.timestamp)),
          mode: "lines",
          line: { color: "#00ffff" },
          name: "ask momentum 1m",
        },
      ],
      analysisPlotLayout
    );
  }, [analysis10s, analysis1m]);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.emit("market-data/subscribe", { assetId: assetId });

    socket.on("quote", (data: QuoteEvent) => {
      if (
        maxSpread != null &&
        data.quote.askPrice - data.quote.bidPrice >= parseFloat(maxSpread)
      ) {
        return;
      }

      setQuotes((quotes) => [
        ...quotes.filter(
          (q) =>
            new Date(q.quote.timestamp) >=
            new Date(new Date(data.quote.timestamp).getTime() - 1000 * 60)
        ),
        data,
      ]);
    });

    socket.on("trade", (data: TradeEvent) => {
      setTrades((trades) => [
        ...trades.filter(
          (t) =>
            new Date(t.trade.timestamp) >=
            new Date(new Date(data.trade.timestamp).getTime() - 1000 * 60)
        ),
        data,
      ]);
    });

    socket.on("analysis", (data: Analysis) => {
      if (data.resolution == 10 * 1000) {
        setAnalysis10s((analysis) => [
          ...analysis.filter(
            (a) =>
              new Date(a.timestamp) >=
              new Date(new Date(data.timestamp).getTime() - 1000 * 60)
          ),
          data,
        ]);
      }

      if (data.resolution == 60 * 1000) {
        setAnalysis1m((analysis) => [
          ...analysis.filter(
            (a) =>
              new Date(a.timestamp) >=
              new Date(new Date(data.timestamp).getTime() - 1000 * 60)
          ),
          data,
        ]);
      }
    });

    BasicPlotly.newPlot("market", [], marketPlotLayout);

    BasicPlotly.newPlot("analysis", [], analysisPlotLayout);
  }, []);

  return (
    <>
      <div id="market"></div>
      <div id="analysis"></div>
    </>
  );
};
