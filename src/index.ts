import Alpaca from "@alpacahq/alpaca-trade-api";
import dotenv from "dotenv";
import { AlgoEngine } from "./algo-engine/AlgoEngine";
import { SimpleAlgo } from "./algo-engine/SimpleAlgo";
import { AssetSymbol } from "./algo-engine/models/AssetSymbol";
import { Exchange } from "./algo-engine/models/Exchange";
import { MarketDataService } from "./market-data/MarketDataService";
import { AlpacaCryptoMarketDataAdapter } from "./market-data/exchanges/alpaca-crypto/AlpacaCryptoMarketDataAdapter";
import { OrderService } from "./orders/OrderService";
import { AlpacaTradeAdapter } from "./orders/exchanges/alpaca/AlpacaTradeAdapter";
import { PositionService } from "./positions/PositionService";

dotenv.config();

const main = async () => {
  const alpaca = new Alpaca({
    keyId: process.env.ALPACA_KEY_ID,
    secretKey: process.env.ALPACA_SECRET_KEY,
    paper: true,
  });

  //   const assets = await alpaca.getAssets({
  //     status: "active",
  //     asset_class: "crypto",
  //   });
  //   console.log(assets);

  const symbolBtcUsd: AssetSymbol = {
    exchange: Exchange.AlpacaCrypto,
    symbol: "BTC/USD",
  };

  const alpacaCryptoExchange = await AlpacaTradeAdapter.create(alpaca);
  const orderService = await OrderService.create([alpacaCryptoExchange]);

  const alpacaCryptoMarketDataAdapter =
    await AlpacaCryptoMarketDataAdapter.create(alpaca, [symbolBtcUsd.symbol]);
  const marketDataService = await MarketDataService.create([
    alpacaCryptoMarketDataAdapter,
  ]);

  const positionService = await PositionService.create(alpaca);
  const algoEngine = new AlgoEngine(
    marketDataService,
    orderService,
    positionService
  );
  const simpleAlgo = new SimpleAlgo(symbolBtcUsd);

  algoEngine.addAlgo(simpleAlgo);
  algoEngine.run();
};

main();
