import Alpaca from "@alpacahq/alpaca-trade-api";
import dotenv from "dotenv";
import { AlgoEngine } from "./algo-engine/AlgoEngine";
import { SimpleAlgo } from "./algo-engine/SimpleAlgo";
import { MarketDataService } from "./market-data/MarketDataService";
import { OrderService } from "./orders/OrderService";
import { AlpacaCryptoExchange } from "./orders/exchanges/alpaca-crypto/AlpacaCryptoExchange";
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

  const alpacaCryptoExchange = await AlpacaCryptoExchange.create(alpaca);
  const orderService = await OrderService.create([alpacaCryptoExchange]);
  const marketDataService = await MarketDataService.create(alpaca, ["BTC/USD"]);
  const positionService = await PositionService.create(alpaca);
  const algoEngine = new AlgoEngine(marketDataService, orderService, positionService);
  const simpleAlgo = new SimpleAlgo();

  algoEngine.addAlgo(simpleAlgo);
  algoEngine.run();
};

main();
