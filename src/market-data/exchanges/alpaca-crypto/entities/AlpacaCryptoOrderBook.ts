import { CryptoOrderbook } from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2.js";

export type AlpacaCryptoOrderBook = CryptoOrderbook & { S: string; r: boolean };