import { MarketDataService } from "../market-data/MarketDataService";
import { OrderUpdateEvent } from "../orders/exchanges/models/OrderUpdateEvent";
import { PositionService } from "../positions/PositionService";
import { AlgoDecision } from "./AlgoDecision";

export abstract class Algo {
  abstract decide(
    orderUpdates: OrderUpdateEvent[],
    marketDataService: MarketDataService,
    positionService: PositionService
  ): AlgoDecision[];
}
