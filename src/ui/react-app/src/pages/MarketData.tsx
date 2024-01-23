import BasicPlotly from "plotly.js-basic-dist";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
    QuoteEvent,
    TradeEvent,
} from "../../../../market-data/MarketDataService.js";

export const MarketData = () => {
  const [searchParams] = useSearchParams();

  const assetId = searchParams.get("assetId");
  const maxSpread = searchParams.get("maxSpread");

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

      BasicPlotly.extendTraces(
        "plot",
        {
          y: [
            [data.quote.askPrice],
            [data.quote.bidPrice],
            [(data.quote.askPrice + data.quote.bidPrice) / 2],
          ],
          x: [
            [new Date(data.quote.timestamp)],
            [new Date(data.quote.timestamp)],
            [new Date(data.quote.timestamp)],
          ],
        },
        [0, 1, 2]
      );
    });

    socket.on("trade", (data: TradeEvent) => {
      BasicPlotly.extendTraces(
        "plot",
        {
          y: [[data.trade.price]],
          x: [[new Date(data.trade.timestamp)]],
        },
        [3]
      );
    });

    BasicPlotly.newPlot(
      "plot",
      [
        {
          y: [],
          x: [],
          mode: "lines",
          line: { color: "#ff0000" },
          name: "ask",
        },
        {
          y: [],
          x: [],
          mode: "lines",
          line: { color: "#00ff00" },
          name: "bid",
        },
        {
          y: [],
          x: [],
          mode: "lines",
          line: { color: "#0000ff" },
          name: "mid",
        },
        {
          y: [],
          x: [],
          mode: "markers",
          marker: { color: "#000000" },
          name: "trade",
        },
      ],
      {
        yaxis: {
          tickformat: ".2f",
          tickprefix: "US$ ",
        },
        margin: {
          l: 100,
        },
        title: `${assetId} Market Data`,
      }
    );
  }, []);

  return (
    <>
      <div id="plot"></div>
    </>
  );
};
