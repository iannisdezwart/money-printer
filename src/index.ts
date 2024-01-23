import Alpaca from "@alpacahq/alpaca-trade-api/dist/alpaca-trade-api.js";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { AlgoEngine } from "./algo-engine/AlgoEngine.js";
import { SimpleAlgo } from "./algo-engine/SimpleAlgo.js";
import { Asset } from "./algo-engine/models/Asset.js";
import { Exchange } from "./algo-engine/models/Exchange.js";
import { MarketDataService } from "./market-data/MarketDataService.js";
import { AlpacaCryptoMarketDataAdapter } from "./market-data/exchanges/alpaca-crypto/AlpacaCryptoMarketDataAdapter.js";
import { AlpacaUsEquityMarketDataAdapter } from "./market-data/exchanges/alpaca-us-equity/AlpacaUsEquityMarketDataAdapter.js";
import { AssetConfiguration } from "./models/AssetConfiguration.js";
import { OrderService } from "./orders/OrderService.js";
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

  const alpacaTradeAdapter = await AlpacaTradeAdapter.create(alpaca, assetMap);
  const orderService = await OrderService.create(
    [alpacaTradeAdapter],
    assetMap
  );

  const alpacaCryptoMarketDataAdapter =
    await AlpacaCryptoMarketDataAdapter.create(alpaca, assets);
  const alpacaUsEquityMarketDataAdapter =
    await AlpacaUsEquityMarketDataAdapter.create(alpaca, assets);
  const marketDataService = await MarketDataService.create(
    [alpacaCryptoMarketDataAdapter, alpacaUsEquityMarketDataAdapter],
    assets
  );

  const positionService = await PositionService.create(alpaca);
  const algoEngine = new AlgoEngine(
    marketDataService,
    orderService,
    positionService
  );

  // orderService.placeOrder({
  //   symbol: symbolBtcUsd,
  //   qty: 0.1,
  //   side: OrderSide.Buy,
  //   clientOrderId: `init-${crypto.randomUUID()}`,
  //   timeInForce: OrderTimeInForce.GoodTillCancel,
  //   type: OrderType.Market,
  // });

  // algoEngine.addAlgo(
  //   new SimpleAlgo(symbolBtcUsd, {
  //     lookbackPeriodMs: 1000 * 60, // 1 minute
  //     enterParams: {
  //       tradeQty: 0.01,
  //       jumpSize: 30,
  //       jumpContUpOffs: 15,
  //       jumpContUpSize: 15,
  //       jumpContUpStop: 15,
  //       jumpContDnOffs: 15,
  //       jumpContDnSize: 15,
  //       jumpContDnStop: 15,
  //       fallSize: 30,
  //       fallContUpOffs: 15,
  //       fallContUpSize: 15,
  //       fallContUpStop: 15,
  //       fallContDnOffs: 15,
  //       fallContDnSize: 15,
  //       fallContDnStop: 15,
  //     },
  //   })
  // );

  algoEngine.addAlgo(
    new SimpleAlgo("AAPL", {
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
    })
  );

  algoEngine.run();

  const uiServer = await UiServer.create(marketDataService);
  uiServer.start(3000);
};

main();
