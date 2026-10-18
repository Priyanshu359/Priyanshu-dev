export type IndexStrategy = "none" | "single" | "composite";
export type N1Strategy = "naive" | "fetch";
export type TxStrategy = "naive" | "lock" | "optimistic";

export interface IndexExperimentData {
  label: string;
  ddl: string;
  rows: string;
  time: string;
  bar: string;
  badLevel: number;
  plan: string;
}

export const indexStrategyData: Record<IndexStrategy, IndexExperimentData> = {
  none: {
    label: "No index",
    ddl: "-- no index on orders(user_id, created_at)",
    rows: "1,000,000",
    time: "~418 ms",
    bar: "100%",
    badLevel: 2,
    plan: "Limit  (actual time=418.2..418.3 rows=20)\n  ->  Sort  (sort key: created_at DESC)\n        ->  Seq Scan on orders\n              Filter: user_id = 4821 AND created_at > ...\n              Rows Removed by Filter: 999,972",
  },
  single: {
    label: "Index on user_id",
    ddl: "CREATE INDEX idx_orders_user ON orders (user_id);",
    rows: "1,180",
    time: "~6 ms",
    bar: "42%",
    badLevel: 1,
    plan: "Limit  (actual time=5.9..6.1 rows=20)\n  ->  Sort  (sort key: created_at DESC)\n        ->  Index Scan using idx_orders_user on orders\n              Index Cond: user_id = 4821\n              Filter: created_at > ...  (1,160 rows removed)",
  },
  composite: {
    label: "Composite (user_id, created_at)",
    ddl: "CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);",
    rows: "20",
    time: "~0.1 ms",
    bar: "5%",
    badLevel: 0,
    plan: "Limit  (actual time=0.04..0.09 rows=20)\n  ->  Index Scan using idx_orders_user_created on orders\n        Index Cond: user_id = 4821 AND created_at > ...\n        -- already in order: no sort, stops after 20 rows",
  },
};

export interface TxExperimentData {
  label: string;
  code: string;
  steps: Array<[string, string]>;
  balance: string;
  ok: boolean;
  result: string;
}

export const txStrategyData: Record<TxStrategy, TxExperimentData> = {
  naive: {
    label: "Read, then write (no lock)",
    code: "Wallet w = repo.findById(id);\nif (w.balance >= 700) {\n  w.balance -= 700;\n  repo.save(w);\n}",
    steps: [
      ["T1", "SELECT balance → ₹1,000"],
      ["T2", "SELECT balance → ₹1,000"],
      ["T1", "check ok · UPDATE balance = ₹300"],
      ["T2", "check ok · UPDATE balance = ₹300"],
      ["T1", "COMMIT · pays ₹700"],
      ["T2", "COMMIT · pays ₹700"],
    ],
    balance: "₹300",
    ok: false,
    result: "Lost update: ₹1,400 paid out of a ₹1,000 wallet.",
  },
  lock: {
    label: "SELECT … FOR UPDATE",
    code: "@Transactional\n@Lock(PESSIMISTIC_WRITE)\nWallet w = repo.findByIdForUpdate(id);\n// T2 waits here until T1 commits",
    steps: [
      ["T1", "SELECT … FOR UPDATE → ₹1,000 (row locked)"],
      ["T2", "SELECT … FOR UPDATE → waiting for lock…"],
      ["T1", "UPDATE balance = ₹300 · COMMIT · pays ₹700"],
      ["T2", "lock acquired → reads ₹300"],
      ["T2", "check fails → ROLLBACK · 409 Insufficient funds"],
    ],
    balance: "₹300",
    ok: true,
    result: "Correct: one succeeds, one is safely rejected.",
  },
  optimistic: {
    label: "Optimistic (version column)",
    code: "@Version long version;\n\nUPDATE wallet SET balance = ?, version = 8\nWHERE id = ? AND version = 7;",
    steps: [
      ["T1", "SELECT → ₹1,000 · version 7"],
      ["T2", "SELECT → ₹1,000 · version 7"],
      ["T1", "UPDATE … WHERE version = 7 → 1 row · COMMIT"],
      ["T2", "UPDATE … WHERE version = 7 → 0 rows (stale)"],
      ["T2", "retry → reads ₹300 · version 8"],
      ["T2", "check fails → 409 Insufficient funds"],
    ],
    balance: "₹300",
    ok: true,
    result: "Correct, with no locks held — the conflict is detected and retried.",
  },
};

export interface DatabaseLabState {
  // Exp 1: Index
  indexStrategy: IndexStrategy;
  indexRunning: boolean;
  indexRan: boolean;

  // Exp 2: N+1
  n1Strategy: N1Strategy;
  n1Running: boolean;
  n1Ran: boolean;
  n1Count: number;
  n1Log: Array<{ text: string; color: string; isMain?: boolean }>;

  // Exp 3: Transactions
  txStrategy: TxStrategy;
  txRunning: boolean;
  txRan: boolean;
  txShownSteps: number;
}

export type DatabaseLabEvent =
  | { type: "SET_INDEX_STRATEGY"; strategy: IndexStrategy }
  | { type: "START_INDEX_RUN" }
  | { type: "FINISH_INDEX_RUN" }
  | { type: "SET_N1_STRATEGY"; strategy: N1Strategy }
  | { type: "START_N1_RUN" }
  | { type: "SET_N1_PROGRESS"; count: number; log: Array<{ text: string; color: string; isMain?: boolean }> }
  | { type: "SET_TX_STRATEGY"; strategy: TxStrategy }
  | { type: "START_TX_RUN" }
  | { type: "SET_TX_STEP"; step: number };

export const initialDatabaseLabState: DatabaseLabState = {
  indexStrategy: "none",
  indexRunning: false,
  indexRan: false,
  n1Strategy: "naive",
  n1Running: false,
  n1Ran: false,
  n1Count: 0,
  n1Log: [],
  txStrategy: "naive",
  txRunning: false,
  txRan: false,
  txShownSteps: 0,
};

export function databaseLabReducer(
  state: DatabaseLabState,
  event: DatabaseLabEvent
): DatabaseLabState {
  switch (event.type) {
    case "SET_INDEX_STRATEGY":
      return {
        ...state,
        indexStrategy: event.strategy,
        indexRan: false,
      };

    case "START_INDEX_RUN":
      return {
        ...state,
        indexRunning: true,
        indexRan: false,
      };

    case "FINISH_INDEX_RUN":
      return {
        ...state,
        indexRunning: false,
        indexRan: true,
      };

    case "SET_N1_STRATEGY":
      return {
        ...state,
        n1Strategy: event.strategy,
        n1Ran: false,
        n1Count: 0,
        n1Log: [],
      };

    case "START_N1_RUN":
      return {
        ...state,
        n1Running: true,
        n1Ran: true,
        n1Count: 0,
        n1Log: [],
      };

    case "SET_N1_PROGRESS":
      return {
        ...state,
        n1Running: false,
        n1Count: event.count,
        n1Log: event.log,
      };

    case "SET_TX_STRATEGY":
      return {
        ...state,
        txStrategy: event.strategy,
        txRan: false,
        txShownSteps: 0,
      };

    case "START_TX_RUN":
      return {
        ...state,
        txRunning: true,
        txRan: true,
        txShownSteps: 0,
      };

    case "SET_TX_STEP":
      return {
        ...state,
        txShownSteps: event.step,
        txRunning: event.step < txStrategyData[state.txStrategy].steps.length,
      };

    default:
      return state;
  }
}
