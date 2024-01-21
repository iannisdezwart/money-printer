export type AlpacaOrder = {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  cancel_requested_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: "crypto" | "us_equity";
  notional?: string;
  qty: string;
  filled_qty: string;
  filled_avg_price?: string;
  order_class: "" | "bracket" | "oco" | "oto";
  order_type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  side: "buy" | "sell";
  time_in_force: "day" | "gtc" | "opg" | "ioc";
  limit_price?: string;
  stop_price?: string;
  status: "new" | "filled" | "partially_filled" | "canceled" | "expired";
  extended_hours: boolean;
  legs: null; // TODO
  trail_percent?: string;
  trail_price?: string;
  hwm: null; // TODO
};

export type AlpacaOrderUpdate = {
  event:
    | "new"
    | "fill"
    | "partial_fill"
    | "canceled"
    | "expired"
    | "done_for_day"
    | "replaced"
    | "rejected"
    | "pending_new"
    | "stopped"
    | "pending_cancel"
    | "pending_replace"
    | "calculated"
    | "suspended"
    | "order_replace_rejected"
    | "order_cancel_rejected";
  timestamp: string;
  order: AlpacaOrder;
  execution_id: string;
};

export type AlpacaOrderUpdateNew = AlpacaOrderUpdate & {
  event: "new";
};

export type AlpacaOrderUpdateFill = AlpacaOrderUpdate & {
  event: "fill";
  price: string;
  qty: string;
  position_qty: string;
};
