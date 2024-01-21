import { OrderUpdate } from "../entities/OrderUpdate";
import { MarketData } from "../market-data/MarketData";
import { PositionService } from "../positions/PositionService";
import { AlgoDecision } from "./AlgoDecision";

export abstract class Algo {
  abstract decide(
    orderUpdates: OrderUpdate[],
    marketData: MarketData,
    positionService: PositionService
  ): AlgoDecision[];
}
