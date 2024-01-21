export abstract class AlgoDecision {
  constructor(public readonly symbol: string) {}
}

export namespace AlgoDecision {
  export class LimitBuy extends AlgoDecision {
    constructor(
      symbol: string,
      public readonly quantity: number,
      public readonly price: number
    ) {
      super(symbol);
    }
  }

  export class LimitSell extends AlgoDecision {
    constructor(
      symbol: string,
      public readonly quantity: number,
      public readonly price: number
    ) {
      super(symbol);
    }
  }

  export class StopLimitBuy extends AlgoDecision {
    constructor(
      symbol: string,
      public readonly quantity: number,
      public readonly stopPrice: number,
      public readonly limitPrice: number
    ) {
      super(symbol);
    }
  }

  export class StopLimitSell extends AlgoDecision {
    constructor(
      symbol: string,
      public readonly quantity: number,
      public readonly stopPrice: number,
      public readonly limitPrice: number
    ) {
      super(symbol);
    }
  }

  export class UpdateLimitPrice extends AlgoDecision {
    constructor(
      symbol: string,
      public readonly orderId: string,
      public readonly quantity: number,
      public readonly newLimitPrice: number
    ) {
      super(symbol);
    }
  }
}
