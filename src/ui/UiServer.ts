import express from "express";
import { Server as HttpServer } from "http";
import { resolve as _resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { MarketDataService } from "../market-data/MarketDataService.js";
import { WebSocketServer } from "./websocket-server/WebSocketServer.js";

export class UiServer {
  constructor(private httpServer: HttpServer) {}

  private static setupExpressApp() {
    const app = express();

    app.use(
      express.static(
        _resolve(dirname(fileURLToPath(import.meta.url)) + "/react-app/www")
      )
    );

    return app;
  }

  static async create(marketDataService: MarketDataService) {
    const expressApp = UiServer.setupExpressApp();
    const httpServer = new HttpServer(expressApp);
    await WebSocketServer.create(httpServer, marketDataService);

    return new UiServer(httpServer);
  }

  start(port: number) {
    this.httpServer.listen(port, () => {
      console.log("[UiServer]: Listening on port 3000");
    });
  }
}
