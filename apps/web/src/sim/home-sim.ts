import type { AskPresets } from "@/content/schema";
import type { StageStatus } from "@/components/StageCard";

export interface HomeSimState {
  selectedQuestionIndex: number;
  stageStatuses: StageStatus[];
  statusText: string;
  cacheHeader: string;
  responseTime: string;
  answerText: string;
  running: boolean;
  realSpeed: boolean;
  tokensRemaining: number;
  totalRequests: number;
  cacheHits: number;
  cachedQueries: Record<number, boolean>;
  lastHit: boolean;
  dotIndex: number;
  dotBlocked: boolean;
  isReplay?: boolean;
}

export type HomeSimEvent =
  | { type: "SELECT_QUESTION"; index: number }
  | { type: "TOGGLE_SPEED" }
  | { type: "REFILL_TOKEN" }
  | { type: "START_REQUEST" }
  | { type: "SET_STAGE"; index: number; status: StageStatus }
  | { type: "DECREMENT_TOKEN" }
  | { type: "SET_STREAM_TEXT"; text: string }
  | { type: "COMPLETE_HIT"; answer: string }
  | { type: "COMPLETE_MISS"; questionIndex: number }
  | { type: "BLOCKED"; message: string }
  | { type: "SET_REPLAY"; isReplay: boolean };

export const initialHomeSimState: HomeSimState = {
  selectedQuestionIndex: 0,
  stageStatuses: ["idle", "idle", "idle", "idle", "idle", "idle"],
  statusText: "—",
  cacheHeader: "—",
  responseTime: "—",
  answerText: "Pick a question and send it.",
  running: false,
  realSpeed: false,
  tokensRemaining: 5,
  totalRequests: 0,
  cacheHits: 0,
  cachedQueries: {},
  lastHit: false,
  dotIndex: 0,
  dotBlocked: false,
  isReplay: false,
};

export function homeSimReducer(state: HomeSimState, event: HomeSimEvent): HomeSimState {
  switch (event.type) {
    case "SELECT_QUESTION":
      if (state.running) return state;
      return {
        ...state,
        selectedQuestionIndex: event.index,
      };

    case "TOGGLE_SPEED":
      return {
        ...state,
        realSpeed: !state.realSpeed,
      };

    case "REFILL_TOKEN":
      return {
        ...state,
        tokensRemaining: Math.min(5, state.tokensRemaining + 1),
      };

    case "DECREMENT_TOKEN":
      return {
        ...state,
        tokensRemaining: Math.max(0, state.tokensRemaining - 1),
      };

    case "START_REQUEST": {
      const qIndex = state.selectedQuestionIndex;
      const isHit = !!state.cachedQueries[qIndex];
      return {
        ...state,
        running: true,
        stageStatuses: ["active", "idle", "idle", "idle", "idle", "idle"],
        statusText: "…",
        cacheHeader: "…",
        responseTime: "…",
        answerText: "",
        totalRequests: state.totalRequests + 1,
        lastHit: isHit,
        dotIndex: 0,
        dotBlocked: false,
      };
    }

    case "SET_STAGE": {
      const nextStatuses = [...state.stageStatuses];
      nextStatuses[event.index] = event.status;
      let nextDot = state.dotIndex;
      if (event.status !== "idle" && event.status !== "skipped") {
        nextDot = event.index;
      }
      return {
        ...state,
        stageStatuses: nextStatuses,
        dotIndex: nextDot,
      };
    }

    case "SET_STREAM_TEXT":
      return {
        ...state,
        answerText: event.text,
      };

    case "COMPLETE_HIT": {
      const nextStatuses: StageStatus[] = ["done", "done", "done", "skipped", "skipped", "done"];
      return {
        ...state,
        running: false,
        stageStatuses: nextStatuses,
        statusText: "200 OK",
        cacheHeader: "HIT",
        responseTime: "6 ms",
        answerText: event.answer,
        cacheHits: state.cacheHits + 1,
        dotIndex: 5,
        dotBlocked: false,
      };
    }

    case "COMPLETE_MISS": {
      const nextStatuses: StageStatus[] = ["done", "done", "done", "done", "done", "done"];
      return {
        ...state,
        running: false,
        stageStatuses: nextStatuses,
        statusText: "200 OK",
        cacheHeader: "MISS",
        responseTime: "884 ms",
        cachedQueries: {
          ...state.cachedQueries,
          [event.questionIndex]: true,
        },
        dotIndex: 5,
        dotBlocked: false,
      };
    }

    case "BLOCKED": {
      const nextStatuses: StageStatus[] = ["done", "blocked", "idle", "idle", "idle", "idle"];
      return {
        ...state,
        running: false,
        stageStatuses: nextStatuses,
        statusText: "429 Too Many Requests",
        cacheHeader: "—",
        responseTime: "3 ms",
        answerText: event.message,
        dotIndex: 1,
        dotBlocked: true,
      };
    }

    case "SET_REPLAY": {
      return {
        ...state,
        isReplay: event.isReplay,
      };
    }

    default:
      return state;
  }
}

/**
 * Runner function that schedules timed events based on simulation logic
 */
export function runHomeSimulation(
  state: HomeSimState,
  dispatch: React.Dispatch<HomeSimEvent>,
  presets: AskPresets["presets"],
  rateLimitBlockedText = "Whoa, slow down. Retry-After: 3s. (That was the rate limiter protecting the model from you.)"
): () => void {
  const timers: NodeJS.Timeout[] = [];
  const speed = state.realSpeed ? 0.04 : 1;
  const later = (fn: () => void, ms: number) => {
    timers.push(setTimeout(fn, ms * speed));
  };

  const qIndex = state.selectedQuestionIndex;
  const hit = !!state.cachedQueries[qIndex];
  const blocked = state.tokensRemaining <= 0;
  const currentAnswer = presets[qIndex]?.answer || "";

  dispatch({ type: "SET_REPLAY", isReplay: true });
  dispatch({ type: "START_REQUEST" });

  // Stage 0 -> 1
  later(() => {
    dispatch({ type: "SET_STAGE", index: 0, status: "done" });
    dispatch({ type: "SET_STAGE", index: 1, status: "active" });
  }, 300);

  // If rate limit blocked
  if (blocked) {
    later(() => {
      dispatch({ type: "BLOCKED", message: rateLimitBlockedText });
    }, 650);
    return () => timers.forEach(clearTimeout);
  }

  // Token spend
  later(() => {
    dispatch({ type: "DECREMENT_TOKEN" });
    dispatch({ type: "SET_STAGE", index: 1, status: "done" });
    dispatch({ type: "SET_STAGE", index: 2, status: "active" });
  }, 650);

  // Cache Hit Path
  if (hit) {
    later(() => {
      dispatch({ type: "SET_STAGE", index: 2, status: "done" });
      dispatch({ type: "SET_STAGE", index: 3, status: "skipped" });
      dispatch({ type: "SET_STAGE", index: 4, status: "skipped" });
      dispatch({ type: "SET_STAGE", index: 5, status: "active" });
      dispatch({ type: "SET_STREAM_TEXT", text: currentAnswer });
    }, 1000);

    later(() => {
      dispatch({ type: "COMPLETE_HIT", answer: currentAnswer });
    }, 1250);

    return () => timers.forEach(clearTimeout);
  }

  // Cache Miss Path
  later(() => {
    dispatch({ type: "SET_STAGE", index: 2, status: "done" });
    dispatch({ type: "SET_STAGE", index: 3, status: "active" });
  }, 1000);

  later(() => {
    dispatch({ type: "SET_STAGE", index: 3, status: "done" });
    dispatch({ type: "SET_STAGE", index: 4, status: "active" });
  }, 1600);

  later(() => {
    dispatch({ type: "SET_STAGE", index: 4, status: "done" });
    dispatch({ type: "SET_STAGE", index: 5, status: "active" });
  }, 2700);

  // Stream words
  const words = currentAnswer.split(" ");
  words.forEach((_, k) => {
    later(() => {
      dispatch({ type: "SET_STREAM_TEXT", text: words.slice(0, k + 1).join(" ") });
    }, 2750 + k * 45);
  });

  later(() => {
    dispatch({ type: "COMPLETE_MISS", questionIndex: qIndex });
  }, 2850 + words.length * 45);

  return () => timers.forEach(clearTimeout);
}
