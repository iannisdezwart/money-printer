export class Bar {
  constructor(
    public readonly open: number,
    public readonly close: number,
    public readonly high: number,
    public readonly low: number,
    public readonly volume: number,
    public readonly timestamp: Date,
    public readonly vwap: number
  ) {}

  get isGreen(): boolean {
    return this.close > this.open;
  }

  get isRed(): boolean {
    return this.close < this.open;
  }
}
