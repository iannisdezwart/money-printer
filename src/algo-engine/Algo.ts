import { MarketDataService } from "../market-data/MarketDataService.js";
import { OrderUpdateEvent } from "../orders/exchanges/models/OrderUpdateEvent.js";
import { PositionService } from "../positions/PositionService.js";
import { AlgoDecision } from "./AlgoDecision.js";

export abstract class Algo {
  abstract decide(
    orderUpdates: OrderUpdateEvent[],
    marketDataService: MarketDataService,
    positionService: PositionService
  ): AlgoDecision[];
}
