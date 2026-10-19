export type IndexStrategy = "none" | "single" | "composite";
export type N1Strategy = "naive" | "fetch";
export type TxStrategy = "naive" | "lock" | "optimistic";

export interface IndexExperimentData {
  label: string;
  ddl: string;
  rows: string;
  rowsNumber: number;
  time: string;
  timeMs: number;
  bar: string;
  speedup: string;
  badLevel: number;
  plan: string;
}

export const indexStrategyData: Record<IndexStrategy, IndexExperimentData> = {
  none: {
    label: "No index",
    ddl: "-- no index on orders(user_id, created_at)",
    rows: "1,000,000",
    rowsNumber: 1000000,
    time: "~418.2 ms",
    timeMs: 418.2,
    bar: "100%",
    speedup: "1x (Baseline)",
    badLevel: 2,
    plan: "Limit  (actual time=418.2..418.3 rows=20)\n  ->  Sort  (sort key: created_at DESC)\n        ->  Seq Scan on orders\n              Filter: user_id = 4821 AND created_at > ...\n              Rows Removed by Filter: 999,972",
  },
  single: {
    label: "Index on user_id",
    ddl: "CREATE INDEX idx_orders_user ON orders (user_id);",
    rows: "1,180",
    rowsNumber: 1180,
    time: "~5.8 ms",
    timeMs: 5.8,
    bar: "28%",
    speedup: "72x faster",
    badLevel: 1,
    plan: "Limit  (actual time=5.8..6.1 rows=20)\n  ->  Sort  (sort key: created_at DESC)\n        ->  Index Scan using idx_orders_user on orders\n              Index Cond: user_id = 4821\n              Filter: created_at > ...  (1,160 rows removed)",
  },
  composite: {
    label: "Composite (user_id, created_at)",
    ddl: "CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);",
    rows: "20",
    rowsNumber: 20,
    time: "~0.08 ms",
    timeMs: 0.08,
    bar: "6%",
    speedup: "5,225x faster",
    badLevel: 0,
    plan: "Limit  (actual time=0.04..0.08 rows=20)\n  ->  Index Scan using idx_orders_user_created on orders\n        Index Cond: user_id = 4821 AND created_at > ...\n        -- already in order: no sort, stops after 20 rows",
  },
};

export interface N1ExperimentData {
  label: string;
  queries: number;
  time: string;
  timeMs: number;
  speedup: string;
  sql: string;
  code: string;
  roundtrips: number;
  description: string;
}

export const n1StrategyData: Record<N1Strategy, N1ExperimentData> = {
  naive: {
    label: "Lazy loading (naive)",
    queries: 51,
    time: "~42.6 ms",
    timeMs: 42.6,
    speedup: "1x (Baseline)",
    sql: "SELECT * FROM courses LIMIT 50;\nSELECT * FROM instructors WHERE id = ?; -- x50 times",
    code: "courseRepo.findAll()\n  .forEach(c -> c.getInstructor()\n                 .getName());",
    roundtrips: 51,
    description: "1 query fetches courses + 50 serial queries fetch each instructor individually.",
  },
  fetch: {
    label: "JOIN FETCH (eager batch)",
    queries: 1,
    time: "~3.8 ms",
    timeMs: 3.8,
    speedup: "11.2x faster",
    sql: "SELECT c.*, i.* FROM courses c\n  JOIN instructors i ON i.id = c.instructor_id\n  LIMIT 50;",
    code: '@Query("select c from Course c\\n        join fetch c.instructor")\nList<Course> findAllWithInstructor();',
    roundtrips: 1,
    description: "Single query joins courses and instructors in one database round-trip.",
  },
};

export interface TxExperimentData {
  label: string;
  code: string;
  steps: Array<[string, string, string?]>;
  balance: string;
  ok: boolean;
  result: string;
  latency: string;
}

export const txStrategyData: Record<TxStrategy, TxExperimentData> = {
  naive: {
    label: "Read, then write (no lock)",
    code: "Wallet w = repo.findById(id);\nif (w.balance >= 700) {\n  w.balance -= 700;\n  repo.save(w);\n}",
    steps: [
      ["T1", "SELECT balance → ₹1,000", "+0.0 ms"],
      ["T2", "SELECT balance → ₹1,000", "+0.3 ms"],
      ["T1", "check ok · UPDATE balance = ₹300", "+0.9 ms"],
      ["T2", "check ok · UPDATE balance = ₹300", "+1.1 ms"],
      ["T1", "COMMIT · pays ₹700", "+1.8 ms"],
      ["T2", "COMMIT · pays ₹700", "+2.1 ms"],
    ],
    balance: "₹300",
    ok: false,
    result: "Lost update: ₹1,400 paid out of a ₹1,000 wallet.",
    latency: "~2.1 ms (unsynchronized race)",
  },
  lock: {
    label: "SELECT … FOR UPDATE",
    code: "@Transactional\n@Lock(PESSIMISTIC_WRITE)\nWallet w = repo.findByIdForUpdate(id);\n// T2 waits here until T1 commits",
    steps: [
      ["T1", "SELECT … FOR UPDATE → ₹1,000 (row locked)", "+0.0 ms"],
      ["T2", "SELECT … FOR UPDATE → waiting for row lock…", "+0.3 ms"],
      ["T1", "UPDATE balance = ₹300 · COMMIT · pays ₹700", "+1.2 ms"],
      ["T2", "lock acquired → reads updated balance ₹300", "+1.4 ms"],
      ["T2", "check fails (₹300 < ₹700) → ROLLBACK · 409", "+2.2 ms"],
    ],
    balance: "₹300",
    ok: true,
    result: "Correct: one succeeds, one is safely rejected.",
    latency: "~2.2 ms (safe serialized lock)",
  },
  optimistic: {
    label: "Optimistic (version column)",
    code: "@Version long version;\n\nUPDATE wallet SET balance = ?, version = 8\nWHERE id = ? AND version = 7;",
    steps: [
      ["T1", "SELECT → ₹1,000 · version 7", "+0.0 ms"],
      ["T2", "SELECT → ₹1,000 · version 7", "+0.3 ms"],
      ["T1", "UPDATE … WHERE version = 7 → 1 row · COMMIT", "+0.9 ms"],
      ["T2", "UPDATE … WHERE version = 7 → 0 rows (stale version)", "+1.1 ms"],
      ["T2", "retry → reads ₹300 · version 8", "+1.6 ms"],
      ["T2", "check fails (₹300 < ₹700) → 409 Insufficient funds", "+2.3 ms"],
    ],
    balance: "₹300",
    ok: true,
    result: "Correct, with no locks held — the conflict is detected and retried.",
    latency: "~2.3 ms (lockless conflict detection)",
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
