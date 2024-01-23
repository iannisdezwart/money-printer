import Alpaca from "@alpacahq/alpaca-trade-api/dist/alpaca-trade-api.js";

type Position = {
  qty: number; // long is positive, short is negative
  avgEntryPrice: number;
  currentPrice: number;
};

type AlpacaPosition = {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: "crypto" | "us_equity";
  asset_marginable: boolean;
  qty: string;
  avg_entry_price: string;
  side: "long" | "short";
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
  qty_available: string;
};

export class PositionService {
  constructor(
    private alpaca: Alpaca,
    private positions: Map<string, Position>
  ) {}
  static async createPositions(alpaca: Alpaca) {
    const externalPositions = (await alpaca.getPositions()) as AlpacaPosition[];
    const positions = new Map<string, Position>();

    for (const position of externalPositions) {
      positions.set(position.symbol, {
        qty: parseFloat(position.qty) * (position.side === "long" ? 1 : -1),
        avgEntryPrice: parseFloat(position.avg_entry_price),
        currentPrice: parseFloat(position.current_price),
      });
    }

    return positions;
  }

  static async create(alpaca: Alpaca): Promise<PositionService> {
    const inst = new PositionService(
      alpaca,
      await PositionService.createPositions(alpaca)
    );

    // TODO: Implement client-side instead of querying Alpaca.
    setInterval(async () => {
      inst.updatePosition();
    }, 1000 * 5); // Every 5 seconds

    return inst;
  }

  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  private updatePositionTicket = 0;
  async updatePosition() {
    // TODO: Implement client-side instead of querying Alpaca.

    const ticket = ++this.updatePositionTicket;
    const positions = await PositionService.createPositions(this.alpaca);

    if (ticket !== this.updatePositionTicket) {
      return;
    }

    this.positions = positions;
  }
}
