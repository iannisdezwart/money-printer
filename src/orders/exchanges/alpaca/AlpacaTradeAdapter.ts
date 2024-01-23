import Alpaca from "@alpacahq/alpaca-trade-api/dist/alpaca-trade-api.js";
import { Asset } from "../../../algo-engine/models/Asset.js";
import { Exchange } from "../../../algo-engine/models/Exchange.js";
import { ITradeAdapter } from "../ITradeAdapter.js";
import { AbortOrderRequest } from "../models/AbortOrderRequest.js";
import { PatchOrderRequest } from "../models/PatchOrderRequest.js";
import { PlaceOrderRequest } from "../models/PlaceOrderRequest.js";
import { AlpacaOrderUpdate } from "./entities/AlpacaOrderUpdate.js";
import { AlpacaOrderUpdateMapper } from "./mappers/AlpacaOrderUpdateMapper.js";
import { AlpacaPatchOrderMapper } from "./mappers/AlpacaPatchOrderMapper.js";
import { AlpacaPlaceOrderMapper } from "./mappers/AlpacaPlaceOrderMapper.js";

export class AlpacaTradeAdapter extends ITradeAdapter {
  override get exchanges() {
    return [Exchange.AlpacaCrypto, Exchange.AlpacaUsEquity];
  }

  private orderUpdateMapper = new AlpacaOrderUpdateMapper();
  private placeOrderMapper: AlpacaPlaceOrderMapper;
  private patchOrderMapper = new AlpacaPatchOrderMapper();

  private constructor(
    private alpaca: Alpaca,
    private assets: Map<string, Asset>
  ) {
    super();

    this.placeOrderMapper = AlpacaPlaceOrderMapper.create(assets);
  }

  private async init() {
    return new Promise<AlpacaTradeAdapter>((resolve, reject) => {
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
        console.log("Order update received", orderUpdate);
        const mapped =
          this.orderUpdateMapper.fromAlpacaOrderUpdate(orderUpdate);
        if (mapped != null) {
          this.onOrderUpdate?.(mapped);
        }
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

  static async create(alpaca: Alpaca, assets: Map<string, Asset>) {
    const inst = new AlpacaTradeAdapter(alpaca, assets);
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
