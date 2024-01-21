import Alpaca from "@alpacahq/alpaca-trade-api";
import dotenv from "dotenv";
import { AlgoEngine } from "./algo-engine/AlgoEngine";
import { SimpleAlgo } from "./algo-engine/SimpleAlgo";
import { MarketData } from "./market-data/MarketData";
import { OrderManager } from "./order-manager/OrderManager";
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

  const orderManager = await OrderManager.create(alpaca);
  const marketData = await MarketData.create(alpaca, ["BTC/USD"]);
  const positionService = await PositionService.create(alpaca);
  const algoEngine = new AlgoEngine(marketData, orderManager, positionService);
  const algo = new SimpleAlgo();

  algoEngine.addAlgo(algo);
  algoEngine.run();
};

main();
