import { MarketDataService } from "../market-data/MarketDataService";
import { OrderService } from "../orders/OrderService";
import { PositionService } from "../positions/PositionService";
import { Algo } from "./Algo";

export class AlgoEngine {
  private algos: Algo[] = [];

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
          .decide(orderUpdates, this.marketDataService, this.positionService)
          .forEach((decision) => {
            this.orderService.perform(decision);
          });
      });
    }, 1000);
  }

  addAlgo(algo: Algo) {
    this.algos.push(algo);
  }
}
