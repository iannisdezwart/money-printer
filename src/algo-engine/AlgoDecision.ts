
export abstract class AlgoDecision {
  constructor(public readonly assetId: string) {}
}

export namespace AlgoDecision {
  export abstract class PlaceOrderDecision extends AlgoDecision {
    constructor(
      assetId: string,
      public readonly quantity: number,
      public readonly callback?: (clientOrderId: string) => void
    ) {
      super(assetId);
    }
  }

  export class LimitBuy extends PlaceOrderDecision {
    constructor(
      assetId: string,
      quantity: number,
      public readonly price: number,
      callback?: (clientOrderId: string) => void
    ) {
      super(assetId, quantity, callback);
    }
  }

  export class LimitSell extends PlaceOrderDecision {
    constructor(
      assetId: string,
      quantity: number,
      public readonly price: number,
      callback?: (clientOrderId: string) => void
    ) {
      super(assetId, quantity, callback);
    }
  }

  export class StopLimitBuy extends PlaceOrderDecision {
    constructor(
      assetId: string,
      quantity: number,
      public readonly stopPrice: number,
      public readonly limitPrice: number,
      callback?: (clientOrderId: string) => void
    ) {
      super(assetId, quantity, callback);
    }
  }

  export class StopLimitSell extends PlaceOrderDecision {
    constructor(
      assetId: string,
      quantity: number,
      public readonly stopPrice: number,
      public readonly limitPrice: number,
      callback?: (clientOrderId: string) => void
    ) {
      super(assetId, quantity, callback);
    }
  }

  export class TwoLeggedLimitBuy extends PlaceOrderDecision {
    constructor(
      assetId: string,
      quantity: number,
      public readonly limitPrice: number,
      public readonly takeProfitPrice: number,
      public readonly stopLossPrice: number,
      callback?: (clientOrderId: string) => void
    ) {
      super(assetId, quantity, callback);
    }
  }
  export class TwoLeggedLimitSell extends PlaceOrderDecision {
    constructor(
      assetId: string,
      quantity: number,
      public readonly limitPrice: number,
      public readonly takeProfitPrice: number,
      public readonly stopLossPrice: number,
      callback?: (clientOrderId: string) => void
    ) {
      super(assetId, quantity, callback);
    }
  }

  export class LimitStopLossBuy extends PlaceOrderDecision {
    constructor(
      assetId: string,
      quantity: number,
      public readonly limitPrice: number,
      public readonly stopLossPrice: number,
      callback?: (clientOrderId: string) => void
    ) {
      super(assetId, quantity, callback);
    }
  }

  export class LimitStopLossSell extends PlaceOrderDecision {
    constructor(
      assetId: string,
      quantity: number,
      public readonly limitPrice: number,
      public readonly stopLossPrice: number,
      callback?: (clientOrderId: string) => void
    ) {
      super(assetId, quantity, callback);
    }
  }

  export class UpdateLimitPrice extends AlgoDecision {
    constructor(
      assetId: string,
      public readonly clientOrderId: string,
      public readonly quantity: number,
      public readonly newLimitPrice: number
    ) {
      super(assetId);
    }
  }
}
