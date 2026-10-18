export interface RateLimitLogRow {
  id: number | string;
  status: string;
  color: string;
  remaining: number;
  isBlocked: boolean;
  retryAfter?: number;
  responseTime?: string;
  isReplay?: boolean;
}

export type RateLimiterRow = RateLimitLogRow;

export interface RateLimiterState {
  tokens: number;
  capacity: number;
  refillRateMs: number;
  refillTokens: number;
  seq: number;
  okCount: number;
  blockedCount: number;
  log: RateLimitLogRow[];
}

export type RateLimiterEvent =
  | { type: "SEND_REQUESTS"; count: number }
  | { type: "REFILL" }
  | { type: "RESET" }
  | { type: "SET_LIVE_RESULT"; row: RateLimitLogRow; tokens: number };

export const initialRateLimiterState: RateLimiterState = {
  tokens: 5,
  capacity: 5,
  refillRateMs: 2000,
  refillTokens: 1,
  seq: 0,
  okCount: 0,
  blockedCount: 0,
  log: [],
};

export function rateLimiterReducer(
  state: RateLimiterState,
  event: RateLimiterEvent
): RateLimiterState {
  switch (event.type) {
    case "REFILL":
      return {
        ...state,
        tokens: Math.min(state.capacity, state.tokens + state.refillTokens),
      };

    case "RESET":
      return {
        ...initialRateLimiterState,
        capacity: state.capacity,
        refillRateMs: state.refillRateMs,
        refillTokens: state.refillTokens,
      };

    case "SET_LIVE_RESULT": {
      const isOk = !event.row.isBlocked;
      return {
        ...state,
        tokens: event.tokens,
        okCount: isOk ? state.okCount + 1 : state.okCount,
        blockedCount: !isOk ? state.blockedCount + 1 : state.blockedCount,
        log: [event.row, ...state.log].slice(0, 10),
      };
    }

    case "SEND_REQUESTS": {
      let tokens = state.tokens;
      let seq = state.seq;
      let okCount = state.okCount;
      let blockedCount = state.blockedCount;
      const newRows: RateLimitLogRow[] = [];

      for (let i = 0; i < event.count; i++) {
        seq += 1;
        if (tokens > 0) {
          tokens -= 1;
          okCount += 1;
          newRows.unshift({
            id: seq,
            status: "200 OK",
            color: "#7FD1A5",
            remaining: tokens,
            isBlocked: false,
          });
        } else {
          blockedCount += 1;
          newRows.unshift({
            id: seq,
            status: "429 Too Many Requests",
            color: "#FF9A7A",
            remaining: 0,
            isBlocked: true,
            retryAfter: 2,
          });
        }
      }

      const combinedLog = [...newRows, ...state.log].slice(0, 10);

      return {
        ...state,
        tokens,
        seq,
        okCount,
        blockedCount,
        log: combinedLog,
      };
    }

    default:
      return state;
  }
}
