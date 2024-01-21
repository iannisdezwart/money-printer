import { MarketData } from "../market-data/MarketData";
import { OrderManager } from "../order-manager/OrderManager";
import { PositionService } from "../positions/PositionService";
import { Algo } from "./Algo";

export class AlgoEngine {
  private algos: Algo[] = [];

  constructor(
    private marketData: MarketData,
    private orderManager: OrderManager,
    private positionService: PositionService
  ) {}

  run() {
    setInterval(() => {
      const orderUpdates = this.orderManager.dequeueOrderUpdates();

      this.algos.forEach((algo) => {
        algo
          .decide(orderUpdates, this.marketData, this.positionService)
          .forEach((decision) => {
            this.orderManager.perform(decision);
          });
      });
    }, 1000);
  }

  addAlgo(algo: Algo) {
    this.algos.push(algo);
  }
}
