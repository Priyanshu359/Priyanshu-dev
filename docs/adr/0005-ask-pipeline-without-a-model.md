# ADR 0005: Ask Pipeline Without a Model

* **Status**: Accepted
* **Date**: 2026-10-18
* **Deciders**: Priyanshu Sinha

## Context & Problem Statement

A central thesis of this portfolio is: **"In every AI product, the backend is the real hero."**
Modern AI applications rely heavily on a robust distributed backend to make features fast, affordable, reliable, and secure. Of the 16 architectural boxes required to serve a production AI query, only 1 is the LLM itself; the remaining 15 are distributed systems (rate limiters, semantic caches, vector databases, session managers, gateways, streaming servers, and async message queues).

Exposing an open public endpoint that calls commercial paid generative LLM APIs (e.g., OpenAI GPT-4, Anthropic Claude) presents several operational risks:
1. **Unbounded Cost & Abuse**: Public internet bots and scrapers can quickly exhaust API credit balances or run up hundreds of dollars in automated queries.
2. **Prompt Injection & Brand Risk**: Public LLMs can hallucinate, be jailbroken, or answer off-topic questions in undesirable ways.
3. **Misdirected Focus**: Showing generated conversational text distracts from the core engineering message: demonstrating distributed systems, low-latency caching, vector math, and resilient system design.

We need a solution that proves real backend engineering capabilities in production without incurring generative API costs or operational vulnerabilities.

## Decision Drivers

* **Real Distributed Backend**: Every stage of the pipeline must execute real code with real timings and real telemetry: token-bucket rate limiting, vector embedding generation, Redis semantic cache lookups, Postgres session updates, pgvector cosine search, Resilience4j circuit breakers, SSE streaming, and transactional outbox event publishing.
* **Zero Model Generation Cost**: Non-preset queries must never incur commercial LLM API costs.
* **Strict Architecture Demystification**: On `/ai`, no answer text is ever shown; instead, every step card renders real stage telemetry so visitors see the end-to-end data flow.
* **Grounded Preset Answers**: On `/`, the Home Hero only streams the curated preset answers defined in `presets.yaml` for its predefined questions.
* **Clean Extensibility**: The architecture must use Ports & Adapters (Hexagonal Architecture) so that a real model provider (`LlmAnswerProvider`) can be plugged in later via configuration without modifying pipeline logic.

## Decision Outcome

We decided on **a fully authentic distributed Ask pipeline with a decoupled `AnswerProvider` port, running local open-source sentence embeddings and zero generative model cost**:

### 1. Hexagonal AnswerProvider Architecture
The model invocation is isolated behind an `AnswerProvider` port:
```java
public interface AnswerProvider {
    AnswerResult generateAnswer(
        String question,
        String assembledPrompt,
        List<ScoredChunk> retrievedChunks,
        boolean isHomePreset
    );
}
```
Two adapters implement this port:
- `PresetAnswerProvider`: Returns the curated answers from `content/ask/presets.yaml` exclusively when `isHomePreset == true`.
- `NoModelAnswerProvider`: Intercepts general model calls, returning `modelNotConnected = true` and `answer = null`.

A future `LlmAnswerProvider` (e.g., calling OpenAI, Anthropic, or an on-prem vLLM instance) can be activated via configuration (`priyanshu.ask.provider=openai`) with no modifications to the surrounding architecture.

### 2. Resilience4j LLM Gateway Wrapper
Even without a live LLM, the model call is wrapped inside `LlmGatewayService` with real resilience primitives:
- **Timeout**: 10-second timeout guard.
- **Circuit Breaker**: Monitored sliding window tracking failure rates.
- **Retry**: Exponential backoff with jitter.
- **Fallback**: Graceful fallback routing.

### 3. Local Sentence Embeddings (all-MiniLM-L6-v2)
- Vectorization runs locally with zero external network dependencies, generating 384-dimensional unit-normalized embeddings (`LocalMiniLmEmbeddingAdapter`).
- At application startup, `KnowledgeSyncService` parses `content/ask/knowledge/*.md` into chunks and computes SHA-256 `content_hash` keys, performing idempotent upserts into `app.knowledge_chunk`.

### 4. Redis Semantic Cache
- Every question embedding is checked against Redis (`RedisSemanticCacheAdapter`).
- Cosine similarity threshold is set to `0.90`.
- Cache hits return in ~1 ms and bypass vector retrieval and model invocation entirely.

### 5. Postgres & pgvector HNSW Retrieval
- Context is loaded from `app.ask_session`, incrementing session counters.
- Vector retrieval searches `app.knowledge_chunk` using pgvector's cosine distance operator (`1 - (embedding <=> ?::vector)`), retrieving top-k chunks with real similarity scores.

### 6. Server-Sent Events (SSE) Streaming
- `POST /ask { q, isHomePreset, sessionId }` responds with `Content-Type: text/event-stream`.
- Emits real-time `stage.started` and `stage.done` events containing stage duration, telemetry, and touched boxes for all 9 architectural stages.
- When `isHomePreset == true`, emits `stream.token` events to stream the preset answer word-by-word into the Home terminal.
- On the `/ai` page, answer text is omitted, populating all 9 step cards with real telemetry.

### 7. Transactional Outbox & Redis Stream Usage Ingestion
- Usage events (`UsageEvent`) containing token counts and cache status are written to `app.outbox_event` and published to Redis Stream `app:events` (`OutboxUsageAdapter`).
- An idempotent consumer (`UsageStreamConsumer`) reads from the stream and records audit records into `app.usage_event`.

### 8. Frontend Event Stream Hook with Offline Replay Fallback
- `useEventStream` consumes `POST /ask` SSE streams in React.
- If the backend is unreachable (offline environment), both Home and AI widgets seamlessly fall back to client-side simulators labelled **"replay of a real request"**.

## Consequences

* **Positive**:
  - Zero API bills and immunity to LLM denial-of-wallet attacks.
  - Complete architectural authenticity: visitors and recruiters inspect real telemetry, real HTTP status, and real Redis/Postgres timings in their browser Network tab.
  - Plug-and-play readiness: connecting a real LLM requires only writing an `AnswerProvider` adapter and setting a configuration property.
  - Safe, predictable public operation on free-tier infrastructure.
