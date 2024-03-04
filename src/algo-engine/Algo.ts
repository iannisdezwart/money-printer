import { OrderUpdateEvent } from "../orders/exchanges/models/OrderUpdateEvent.js";
import { PositionService } from "../positions/PositionService.js";
import { AlgoDecision } from "./AlgoDecision.js";

export abstract class IAlgo {
  abstract decide(
    orderUpdates: OrderUpdateEvent[],
    positionService: PositionService
  ): AlgoDecision[];
}
