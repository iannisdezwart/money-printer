import Alpaca from "@alpacahq/alpaca-trade-api/dist/alpaca-trade-api.js";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { AlgoEngine } from "./algo-engine/AlgoEngine.js";
import { SimpleAlgo } from "./algo-engine/SimpleAlgo.js";
import { Asset } from "./algo-engine/models/Asset.js";
import { Exchange } from "./algo-engine/models/Exchange.js";
import { MarketDataService } from "./market-data/MarketDataService.js";
import { IMarketDataAdapter } from "./market-data/exchanges/IMarketDataAdapter.js";
import { AlpacaCryptoMarketDataAdapter } from "./market-data/exchanges/alpaca-crypto/AlpacaCryptoMarketDataAdapter.js";
import { AlpacaUsEquityMarketDataAdapter } from "./market-data/exchanges/alpaca-us-equity/AlpacaUsEquityMarketDataAdapter.js";
import { AlpacaUsEquityMarketDataRealtimeWebsocketStream } from "./market-data/exchanges/alpaca-us-equity/data-stream/AlpacaUsEquityMarketDataRealtimeWebsocketStream.js";
import { AlpacaUsEquityMarketDataReplayDataStream } from "./market-data/exchanges/alpaca-us-equity/data-stream/AlpacaUsEquityMarketDataReplayDataStream.js";
import { AssetConfiguration } from "./models/AssetConfiguration.js";
import { OrderService } from "./orders/OrderService.js";
import { ITradeAdapter } from "./orders/exchanges/ITradeAdapter.js";
import { AlpacaTradeAdapter } from "./orders/exchanges/alpaca/AlpacaTradeAdapter.js";
import { PositionService } from "./positions/PositionService.js";
import { UiServer } from "./ui/UiServer.js";

const mode = process.env["mode"] || "paper";
console.log(`Starting in ${mode} mode`);
dotenv.config({
  path: `env/${mode}.env`,
});

const main = async () => {
  const alpaca = new Alpaca({
    keyId: process.env.ALPACA_KEY_ID,
    secretKey: process.env.ALPACA_SECRET_KEY,
    paper: mode != "live",
  });

  const assetConfiguration = JSON.parse(
    readFileSync(`config/assets.${mode}.json`, "utf-8")
  ) as AssetConfiguration;

  const assets = assetConfiguration.assets.map<Asset>((asset) => {
    return {
      exchange: Exchange[asset.source as keyof typeof Exchange],
      symbol: asset.symbol,
      id: asset.id,
      qtyDecimals: asset.qtyDecimals,
      priceDecimals: asset.priceDecimals,
    };
  });
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  const tradeAdapters: ITradeAdapter[] = [];

  if (process.env.ALPACA_TRADE_ADAPTER_ENABLED) {
    tradeAdapters.push(await AlpacaTradeAdapter.create(alpaca, assetMap));
  }

  const orderService = await OrderService.create(tradeAdapters, assetMap);

  const marketDataAdapters: IMarketDataAdapter[] = [];

  if (process.env.ALPACA_CRYPTO_MARKET_DATA_ADAPTER_ENABLED) {
    marketDataAdapters.push(
      await AlpacaCryptoMarketDataAdapter.create(alpaca, assets)
    );
  }

  if (process.env.ALPACA_US_EQUITY_MARKET_DATA_APAPTER_ENABLED) {
    const source = process.env.ALPACA_US_EQUITY_MARKET_DATA_REPLAY_ENABLED
      ? await AlpacaUsEquityMarketDataReplayDataStream.create(
          alpaca,
          new Date("2024-01-23T14:30:00.000Z")
        )
      : await AlpacaUsEquityMarketDataRealtimeWebsocketStream.create(alpaca);

    marketDataAdapters.push(
      await AlpacaUsEquityMarketDataAdapter.create(source, assets)
    );
  }

  const marketDataService = await MarketDataService.create(
    marketDataAdapters,
    assets
  );

  const positionService = await PositionService.create(alpaca);
  const algoEngine = new AlgoEngine(
    marketDataService,
    orderService,
    positionService
  );

  algoEngine.addAlgo(
    await SimpleAlgo.create(
      "AAPL",
      {
        lookbackPeriodMs: 1000 * 10, // 10 seconds
        maxSpread: 0.05,
        enterParams: {
          tradeQty: 1,
          jumpSize: 0.08,
          jumpContUpOffs: 0.06,
          jumpContUpSize: 0.04,
          jumpContUpStop: 0.1,
          jumpContDnOffs: 0.06,
          jumpContDnSize: 0.04,
          jumpContDnStop: 0.1,
          fallSize: 0.08,
          fallContUpOffs: 0.06,
          fallContUpSize: 0.04,
          fallContUpStop: 0.1,
          fallContDnOffs: 0.06,
          fallContDnSize: 0.04,
          fallContDnStop: 0.1,
        },
      },
      marketDataService
    )
  );

  algoEngine.run();

  const uiServer = await UiServer.create(marketDataService);
  uiServer.start(3000);
};

main();
