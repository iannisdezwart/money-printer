export type Quote = {
  bidPrice: number; // TODO: 0 means no active bid.
  bidQty: number;
  askPrice: number; // TODO: 0 means no active ask.
  askQty: number;
  timestamp: Date;
};
