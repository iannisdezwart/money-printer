import { Server as HttpServer } from "http";
import { Socket, Server as SocketIoServer } from "socket.io";
import { MarketDataService } from "../../market-data/MarketDataService.js";
import { WsMarketDataService } from "./services/WsMarketDataService.js";

export class WebSocketServer {
  listenerMap: Record<string, (socket: Socket, data: any) => void> = {
    "market-data/subscribe": (s, d) => this.wsMarketDataService.subscribe(s, d),
  };

  constructor(
    private socketIoServer: SocketIoServer,
    private wsMarketDataService: WsMarketDataService
  ) {}

  private async init() {
    this.socketIoServer.on("connection", (socket) => {
      console.log("[UiServer]: New socket:", socket.id);

      socket.on("disconnect", () => {
        console.log("[UiServer]: Socket disconnected:", socket.id);
      });

      for (const [event, listener] of Object.entries(this.listenerMap)) {
        socket.on(event, (data) => listener(socket, data));
      }
    });

    return this;
  }

  static async create(
    httpServer: HttpServer,
    marketDataService: MarketDataService
  ) {
    const socketIoServer = new SocketIoServer(httpServer);

    return await new WebSocketServer(
      socketIoServer,
      await WsMarketDataService.create(socketIoServer, marketDataService)
    ).init();
  }
}
