import type { KnowledgeChunk } from "@/content/schema";

export interface AISimBar {
  title: string;
  score: string;
  width: string;
}

export interface AISimStepTelemetry {
  stepIndex: number;
  label: string;
  data: string;
  ms: string;
  bars?: AISimBar[];
}

export interface AISimState {
  activeStep: number;
  question: string;
  bucket: number;
  hasRun: boolean;
  blocked: boolean;
  hit: boolean;
  telemetry: Record<number, AISimStepTelemetry>;
  isReplay?: boolean;
}

export type AISimEvent =
  | { type: "SET_ACTIVE_STEP"; step: number }
  | { type: "SET_QUESTION"; question: string }
  | { type: "REFILL_BUCKET" }
  | { type: "EXECUTE_QUESTION"; question: string; knowledgeChunks: KnowledgeChunk[] }
  | {
      type: "SET_LIVE_RESULT";
      question: string;
      telemetry: Record<number, AISimStepTelemetry>;
      blocked: boolean;
      hit: boolean;
      remaining: number;
      isReplay: boolean;
    };

export const initialAISimState: AISimState = {
  activeStep: 0,
  question: "",
  bucket: 5,
  hasRun: false,
  blocked: false,
  hit: false,
  telemetry: {},
  isReplay: false,
};

// Bag-of-words 256-dim vectorizer & cosine similarity for local retriever simulation
function hashDim(word: string): number {
  let h = 5381;
  for (let i = 0; i < word.length; i++) {
    h = ((h * 33) ^ word.charCodeAt(i)) >>> 0;
  }
  return h % 256;
}

const STOP_WORDS = new Set(
  "a an the is are was were be been being of to in on for and or with what who whom how does do did has have had he his him i you your me my can could would will should about at by from it its this that these those tell much many any which when where why there their them as into than then so if not use used using some get got also just very more most way ever".split(" ")
);

const SYNONYMS: Record<string, string> = {
  work: "job", works: "job", role: "job", job: "job", company: "job", employer: "job", currently: "job",
  redis: "cache", caching: "cache", cache: "cache", cached: "cache",
  llm: "ai", ml: "ai", gpt: "ai", model: "ai", ai: "ai", artificial: "ai", genai: "ai",
  database: "db", databases: "db", db: "db", sql: "db", mysql: "db", postgres: "db", postgresql: "db", query: "db",
  kafka: "kafka", queue: "kafka", queues: "kafka", messaging: "kafka", consumer: "kafka",
  scale: "scale", traffic: "scale", users: "scale", spikes: "scale", peak: "scale",
  voice: "voice", call: "voice", speech: "voice",
  college: "education", university: "education", degree: "education",
  hire: "freelance", freelance: "freelance",
};

function tokenize(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const out: string[] = [];
  words.forEach((w) => {
    if (w.length < 2 || STOP_WORDS.has(w)) return;
    if (SYNONYMS[w]) {
      out.push(SYNONYMS[w]);
      return;
    }
    let stem = w;
    if (stem.length > 5 && stem.endsWith("ing")) stem = stem.slice(0, -3);
    else if (stem.length > 4 && stem.endsWith("ed")) stem = stem.slice(0, -2);
    else if (stem.length > 3 && stem.endsWith("s") && !stem.endsWith("ss")) stem = stem.slice(0, -1);
    out.push(SYNONYMS[stem] || stem);
  });
  return out;
}

function embed(tokens: string[]): number[] {
  const vec = new Array(256).fill(0);
  tokens.forEach((t) => {
    vec[hashDim(t)] += 2.5;
  });
  const norm = Math.sqrt(vec.reduce((acc, val) => acc + val * val, 0)) || 1;
  return vec.map((v) => v / norm);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

let askCounter = 0;
let semanticCache: Array<{ q: string; vec: number[] }> = [];

export function aiSimReducer(state: AISimState, event: AISimEvent): AISimState {
  switch (event.type) {
    case "SET_ACTIVE_STEP":
      return {
        ...state,
        activeStep: event.step,
      };

    case "SET_QUESTION":
      return {
        ...state,
        question: event.question,
      };

    case "REFILL_BUCKET":
      return {
        ...state,
        bucket: Math.min(5, state.bucket + 1),
      };

    case "EXECUTE_QUESTION": {
      const q = event.question.trim().slice(0, 200);
      if (!q) return state;

      askCounter += 1;
      const isBlocked = state.bucket <= 0;
      const reqId = "req_" + Math.random().toString(36).slice(2, 8);
      const remaining = isBlocked ? 0 : state.bucket - 1;

      const qTokens = tokenize(q);
      const qVec = embed(qTokens);

      let bestCache: { q: string; vec: number[] } | null = null;
      let bestSim = 0;
      for (const entry of semanticCache) {
        const sim = cosineSimilarity(qVec, entry.vec);
        if (sim > bestSim) {
          bestSim = sim;
          bestCache = entry;
        }
      }

      const isHit = !isBlocked && !!bestCache && bestSim >= 0.9;
      const telemetry: Record<number, AISimStepTelemetry> = {};

      // Step 0: Request arrival & Rate limit
      telemetry[0] = {
        stepIndex: 0,
        label: isBlocked ? "429 BLOCKED" : "ALLOWED · 1 ms",
        data: `POST /api/ask\n{ "q": "${q}" }\nrequest-id: ${reqId}\nauth: anonymous visitor ✓\n${
          isBlocked
            ? "rate limit: bucket empty → 429 Too Many Requests\nRetry-After: 4s\nthe request stops here — nothing else runs"
            : `rate limit: allowed · ${remaining}/5 requests left`
        }`,
        ms: "1.1 ms",
      };

      if (isBlocked) {
        return {
          ...state,
          hasRun: true,
          blocked: true,
          hit: false,
          telemetry,
        };
      }

      // Step 1: Semantic Cache
      const topDims = qVec
        .map((v, i) => ({ dim: i, val: v }))
        .filter((p) => p.val > 0)
        .sort((a, b) => b.val - a.val)
        .slice(0, 3)
        .map((p) => `d${p.dim}=${p.val.toFixed(2)}`)
        .join(" ");

      telemetry[1] = {
        stepIndex: 1,
        label: isHit ? "CACHE HIT · 0.8 ms" : "CACHE MISS · 1.4 ms",
        data: `tokens: [${qTokens.map((w) => `"${w}"`).join(", ")}]\nvector: 256 dims · ${topDims || "empty"}\n${
          bestCache
            ? `closest earlier question: "${bestCache.q}"\nsimilarity ${bestSim.toFixed(2)} → ${isHit ? "HIT" : "MISS"} (threshold 0.90)`
            : "cache is empty → MISS"
        }${isHit ? "\nthe stored answer would be returned in ~1 ms" : ""}`,
        ms: "1.4 ms",
      };

      // Vector similarities for knowledge chunks
      const chunkScores = event.knowledgeChunks.map((chunk) => {
        const cTokens = tokenize(`${chunk.title} ${chunk.keywords} ${chunk.content}`);
        const cVec = embed(cTokens);
        const sim = cosineSimilarity(qVec, cVec);
        return {
          title: chunk.title,
          score: sim,
          chunk,
        };
      });

      chunkScores.sort((a, b) => b.score - a.score);
      const top3 = chunkScores.slice(0, 3);
      const bars: AISimBar[] = top3.map((x) => ({
        title: x.title,
        score: x.score.toFixed(2),
        width: `${Math.max(4, Math.round(x.score * 100))}%`,
      }));

      const contextChunks = top3.filter((x, i) => x.score >= 0.15 && (i === 0 || x.score >= top3[0].score * 0.8));

      // Step 2: Orchestration
      telemetry[2] = {
        stepIndex: 2,
        label: isHit ? "SKIPPED" : "CONTEXT LOADED · 4.2 ms",
        data: isHit
          ? "Skipped — the semantic cache already covers this question, so no retrieval and no model call."
          : `session sess_${reqId.slice(4)} · ${askCounter - 1} earlier questions loaded from Postgres\nplan: search knowledge base → call model with context\ntools allowed: knowledge_search`,
        ms: "4.2 ms",
      };

      // Step 3: Retrieval
      telemetry[3] = {
        stepIndex: 3,
        label: isHit ? "SKIPPED" : `TOP ${contextChunks.length} CHUNKS · 38 ms`,
        data: isHit
          ? "Skipped — cached query bypasses vector retrieval."
          : `cosine similarity against ${event.knowledgeChunks.length} knowledge chunks · top 3:${
              contextChunks.length ? "" : "\nnothing above 0.15 threshold"
            }`,
        ms: "38 ms",
        bars: isHit ? undefined : bars,
      };

      // Step 4: Model Call Assembly (Never show answer text!)
      const promptPreview = `SYSTEM: Answer only from CONTEXT. If it is not there, say so.\nCONTEXT: ${
        contextChunks.length ? contextChunks.map((c) => `[${c.title}]`).join(" ") : "(none)"
      }\nQUESTION: ${q}`;
      const approxTokens = Math.ceil(promptPreview.length / 4);

      telemetry[4] = {
        stepIndex: 4,
        label: isHit ? "SKIPPED" : `PROMPT ${approxTokens} TOKENS · 12 ms`,
        data: isHit
          ? "Skipped — no LLM gateway call required."
          : `prompt assembled:\nSYSTEM: Answer only from CONTEXT. If it is not there, say so.\nCONTEXT: ${
              contextChunks.length ? contextChunks.map((c) => `[${c.title}]`).join(" ") : "(none)"
            }\nQUESTION: ${q}\n≈ ${approxTokens} tokens · budget 2,000 ✓\n\n→ LLM gateway: timeout 10s · 2 retries · fallback model\n→ model call: executed via resilience wrapper`,
        ms: "12 ms",
      };

      // Step 5: Streaming (SSE)
      telemetry[5] = {
        stepIndex: 5,
        label: isHit ? "CACHED STREAM" : "SSE READY · 18 ms",
        data: `Content-Type: text/event-stream\nX-Cache: ${isHit ? "HIT" : "MISS"}\n${
          isHit
            ? "the cached answer is returned in one instantaneous SSE event"
            : "tokens stream back over SSE chunk by chunk as generated by model"
        }`,
        ms: "ready",
      };

      // Step 6: Async Bookkeeping
      telemetry[6] = {
        stepIndex: 6,
        label: "QUEUED · KAFKA",
        data: `→ topic usage.recorded\n{ id: "${reqId}", prompt_tokens: ${isHit ? 0 : approxTokens}, cache: "${
          isHit ? "HIT" : "MISS"
        }", context_chunks: ${contextChunks.length} }\nconsumer: usage-logger · processed asynchronously in background`,
        ms: "queued",
      };

      // Step 7: Ingestion
      telemetry[7] = {
        stepIndex: 7,
        label: "READ-ONLY",
        data: `index: ${event.knowledgeChunks.length} chunks · 256-dim vectors\nupserts keyed by content hash → re-runs never duplicate\nyour question read the index; it didn't change it`,
        ms: "read-only",
      };

      // Step 8: Box Count
      const touched = isHit ? 8 : 13;
      telemetry[8] = {
        stepIndex: 8,
        label: `${touched} / 16 BOXES`,
        data: `your request touched ${touched} of 16 boxes\n${
          isHit ? "model calls: 0 — the cache handled it" : "model calls: 1"
        }\neverything else: backend`,
        ms: `${touched}/16`,
      };

      if (!isHit) {
        semanticCache = [{ q, vec: qVec }, ...semanticCache].slice(0, 20);
      }

      return {
        ...state,
        bucket: remaining,
        hasRun: true,
        blocked: false,
        hit: isHit,
        telemetry,
        isReplay: true,
      };
    }

    case "SET_LIVE_RESULT": {
      return {
        ...state,
        question: event.question,
        bucket: event.remaining,
        hasRun: true,
        blocked: event.blocked,
        hit: event.hit,
        telemetry: event.telemetry,
        isReplay: event.isReplay,
      };
    }

    default:
      return state;
  }
}
