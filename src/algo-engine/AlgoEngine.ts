import { MarketDataService } from "../market-data/MarketDataService.js";
import { OrderService } from "../orders/OrderService.js";
import { PositionService } from "../positions/PositionService.js";
import { IAlgo } from "./Algo.js";

export class AlgoEngine {
  private algos: IAlgo[] = [];

  constructor(
    private marketDataService: MarketDataService,
    private orderService: OrderService,
    private positionService: PositionService
  ) {}

  run() {
    setInterval(() => {
      const orderUpdates = this.orderService.dequeueOrderUpdates();

      this.algos.forEach((algo) => {
        algo
          .decide(orderUpdates, this.positionService)
          .forEach((decision) => {
            this.orderService.perform(decision);
          });
      });
    }, 250);
  }

  addAlgo(algo: IAlgo) {
    this.algos.push(algo);
  }
}
