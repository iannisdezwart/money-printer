import Alpaca from "@alpacahq/alpaca-trade-api";
import { IExchange } from "../IExchange";
import { AbortOrderRequest } from "../models/AbortOrderRequest";
import { PatchOrderRequest } from "../models/PatchOrderRequest";
import { PlaceOrderRequest } from "../models/PlaceOrderRequest";
import { AlpacaOrderUpdate } from "./entities/AlpacaOrderUpdate";
import { AlpacaOrderUpdateMapper } from "./mappers/AlpacaOrderUpdateMapper";
import { AlpacaPatchOrderMapper } from "./mappers/AlpacaPatchOrderMapper";
import { AlpacaPlaceOrderMapper } from "./mappers/AlpacaPlaceOrderMapper";

export class AlpacaCryptoExchange extends IExchange {
  private orderUpdateMapper = new AlpacaOrderUpdateMapper();
  private placeOrderMapper = new AlpacaPlaceOrderMapper();
  private patchOrderMapper = new AlpacaPatchOrderMapper();

  private constructor(private alpaca: Alpaca) {
    super();
  }

  private async init() {
    return new Promise<AlpacaCryptoExchange>((resolve, reject) => {
      this.alpaca.trade_ws.onConnect(() => {
        console.log("Connected to trade websocket");
        this.alpaca.trade_ws.subscribe(["trade_updates"]);
        resolve(this);
      });
      this.alpaca.trade_ws.onError((err: Error) => {
        console.log("Error from trade websocket", err);
        reject(err);
      });
      this.alpaca.trade_ws.onOrderUpdate((orderUpdate: AlpacaOrderUpdate) => {
        this.onOrderUpdate?.(
          this.orderUpdateMapper.fromAlpacaOrderUpdate(orderUpdate)
        );
      });
      this.alpaca.trade_ws.onStateChange((state: {}) => {
        console.log("State change received", state);
      });
      this.alpaca.trade_ws.onDisconnect(() => {
        console.log("Disconnected from trade websocket");
      });
      this.alpaca.trade_ws.connect();
    });
  }

  static async create(alpaca: Alpaca) {
    const inst = new AlpacaCryptoExchange(alpaca);
    return await inst.init();
  }

  override placeOrder(req: PlaceOrderRequest) {
    this.alpaca.createOrder(
      this.placeOrderMapper.toAlpacaPlaceOrderRequest(req)
    );
  }

  override patchOrder(req: PatchOrderRequest): void {
    this.alpaca.replaceOrder(
      req.clientOrderId,
      this.patchOrderMapper.toAlpacaPatchOrderRequest(req)
    );
  }

  override abortOrder(req: AbortOrderRequest): void {
    this.alpaca.cancelOrder(req.clientOrderId);
  }
}
