import { CryptoBar } from "@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2";

export const barIsGreen = (bar: CryptoBar) => bar.Close >= bar.Open;
export const barIsRed = (bar: CryptoBar) => bar.Close <= bar.Open;