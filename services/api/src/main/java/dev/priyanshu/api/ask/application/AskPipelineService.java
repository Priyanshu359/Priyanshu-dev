package dev.priyanshu.api.ask.application;

import dev.priyanshu.api.ask.application.port.AnswerProvider.AnswerResult;
import dev.priyanshu.api.ask.application.port.EmbeddingPort;
import dev.priyanshu.api.ask.application.port.RetrievalPort;
import dev.priyanshu.api.ask.application.port.SemanticCachePort;
import dev.priyanshu.api.ask.application.port.SemanticCachePort.CacheResult;
import dev.priyanshu.api.ask.application.port.SessionPort;
import dev.priyanshu.api.ask.application.port.UsageEventOutboxPort;
import dev.priyanshu.api.ask.domain.AskSession;
import dev.priyanshu.api.ask.domain.ScoredChunk;
import dev.priyanshu.api.ask.domain.StageEvent;
import dev.priyanshu.api.ask.domain.UsageEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

@Service
public class AskPipelineService {

    private static final Logger log = LoggerFactory.getLogger(AskPipelineService.class);

    private final EmbeddingPort embeddingPort;
    private final SemanticCachePort semanticCachePort;
    private final RetrievalPort retrievalPort;
    private final SessionPort sessionPort;
    private final LlmGatewayService llmGatewayService;
    private final UsageEventOutboxPort usageEventOutboxPort;

    // Rate limiter for /ask (capacity 5 tokens per IP, 1 refill / 3s)
    private final ConcurrentHashMap<String, TokenBucket> ipBuckets = new ConcurrentHashMap<>();

    public static class TokenBucket {
        private final int capacity;
        private final double refillTokensPerSecond;
        private double tokens;
        private long lastRefillTimeMs;

        public TokenBucket(int capacity, double refillTokensPerSecond) {
            this.capacity = capacity;
            this.refillTokensPerSecond = refillTokensPerSecond;
            this.tokens = capacity;
            this.lastRefillTimeMs = System.currentTimeMillis();
        }

        public synchronized boolean tryAcquire() {
            refill();
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }

        public synchronized int getRemaining() {
            refill();
            return (int) Math.floor(tokens);
        }

        private void refill() {
            long now = System.currentTimeMillis();
            double elapsedSec = Math.max(0, (now - lastRefillTimeMs) / 1000.0);
            tokens = Math.min(capacity, tokens + elapsedSec * refillTokensPerSecond);
            lastRefillTimeMs = now;
        }
    }

    public AskPipelineService(
            EmbeddingPort embeddingPort,
            SemanticCachePort semanticCachePort,
            RetrievalPort retrievalPort,
            SessionPort sessionPort,
            LlmGatewayService llmGatewayService,
            UsageEventOutboxPort usageEventOutboxPort) {
        this.embeddingPort = embeddingPort;
        this.semanticCachePort = semanticCachePort;
        this.retrievalPort = retrievalPort;
        this.sessionPort = sessionPort;
        this.llmGatewayService = llmGatewayService;
        this.usageEventOutboxPort = usageEventOutboxPort;
    }

    public void runPipeline(
            String question,
            String clientIp,
            String userAgent,
            String sessionId,
            boolean isHomePreset,
            Consumer<StageEvent> emitter) {
        long pipelineStart = System.currentTimeMillis();
        String requestId = "req_" + UUID.randomUUID().toString().substring(0, 8);
        String q = (question != null && !question.isBlank()) ? question.trim() : "What does Priyanshu work on?";

        // --- STAGE 1: A question arrives (Gateway + Rate limiter) ---
        long s1Start = System.currentTimeMillis();
        emitter.accept(StageEvent.started(1, "gateway", List.of("client", "gateway", "limiter")));

        TokenBucket bucket = ipBuckets.computeIfAbsent(clientIp, k -> new TokenBucket(5, 1.0 / 3.0));
        boolean allowed = bucket.tryAcquire();
        int tokensLeft = bucket.getRemaining();

        long s1Duration = Math.max(1, System.currentTimeMillis() - s1Start);
        Map<String, Object> s1Data = Map.of(
            "requestId", requestId,
            "clientIp", clientIp,
            "userAgent", userAgent != null ? userAgent : "Mozilla/5.0",
            "authStatus", "Anonymous visitor (verified)",
            "rateLimitAllowed", allowed,
            "rateLimitRemaining", Math.max(0, tokensLeft),
            "rateLimitCapacity", 5,
            "blocked", !allowed
        );
        emitter.accept(StageEvent.done(1, "gateway", s1Duration, s1Data, List.of("client", "gateway", "limiter")));

        if (!allowed) {
            usageEventOutboxPort.publishUsage(new UsageEvent(requestId, sessionId, 0, false, 0, true, Instant.now()));
            emitter.accept(StageEvent.completed(System.currentTimeMillis() - pipelineStart, Map.of(
                "status", "BLOCKED_RATE_LIMIT",
                "message", "Rate limit exceeded. 429 Too Many Requests."
            )));
            return;
        }

        // --- STAGE 2: Check the semantic cache ---
        long s2Start = System.currentTimeMillis();
        emitter.accept(StageEvent.started(2, "cache", List.of("cache")));

        float[] queryEmbedding = embeddingPort.embed(q);
        CacheResult cacheResult = semanticCachePort.checkCache(queryEmbedding, q);

        List<String> words = Arrays.stream(q.toLowerCase().split("[^a-zA-Z0-9]+"))
            .filter(w -> !w.isBlank())
            .toList();

        long s2Duration = Math.max(1, System.currentTimeMillis() - s2Start);
        Map<String, Object> s2Data = Map.of(
            "tokens", words,
            "tokenCount", words.size(),
            "vectorDimensions", embeddingPort.getDimension(),
            "embeddingModel", embeddingPort.getModelName(),
            "cacheHit", cacheResult.hit(),
            "similarity", cacheResult.similarity(),
            "threshold", 0.90,
            "closestCachedQuestion", cacheResult.cachedQuestion() != null ? cacheResult.cachedQuestion() : "none"
        );
        emitter.accept(StageEvent.done(2, "cache", s2Duration, s2Data, List.of("cache")));

        // --- STAGE 3: Orchestrate the request ---
        long s3Start = System.currentTimeMillis();
        emitter.accept(StageEvent.started(3, "orchestration", List.of("orch", "pg")));

        AskSession session = sessionPort.getAndIncrementSession(sessionId);
        if (session == null) {
            session = new AskSession(
                sessionId != null && !sessionId.isBlank() ? sessionId : "sess_" + UUID.randomUUID().toString().substring(0, 8),
                1,
                Instant.now(),
                Instant.now()
            );
        }

        long s3Duration = Math.max(1, System.currentTimeMillis() - s3Start);
        Map<String, Object> s3Data = Map.of(
            "sessionId", session.id(),
            "sessionQuestionCount", session.questionCount(),
            "sessionCreatedAt", session.createdAt().toString(),
            "toolRegistryCount", 0,
            "orchestrationEngine", "Spring Boot 3.4 (Hexagonal Architecture)"
        );
        emitter.accept(StageEvent.done(3, "orchestration", s3Duration, s3Data, List.of("orch", "pg")));

        // --- STAGE 4: Retrieve only what matters ---
        long s4Start = System.currentTimeMillis();
        emitter.accept(StageEvent.started(4, "retrieval", List.of("vector")));

        List<ScoredChunk> retrievedChunks = retrievalPort.retrieveTopK(queryEmbedding, 3);

        long s4Duration = Math.max(1, System.currentTimeMillis() - s4Start);
        Map<String, Object> s4Data = Map.of(
            "strategy", "pgvector HNSW Cosine Distance (1 - <=>)",
            "topK", 3,
            "chunks", retrievedChunks.stream().map(c -> Map.of(
                "title", c.title(),
                "source", c.source(),
                "score", c.score()
            )).toList()
        );
        emitter.accept(StageEvent.done(4, "retrieval", s4Duration, s4Data, List.of("vector")));

        // --- STAGE 5: Call the model — safely ---
        long s5Start = System.currentTimeMillis();
        emitter.accept(StageEvent.started(5, "llmgw", List.of("llmgw", "model")));

        // Construct grounded prompt
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("System: You are Priyanshu Sinha's portfolio assistant.\n\nContext:\n");
        for (ScoredChunk chunk : retrievedChunks) {
            promptBuilder.append("- ").append(chunk.title()).append(": ").append(chunk.content()).append("\n");
        }
        promptBuilder.append("\nUser: ").append(q);
        String assembledPrompt = promptBuilder.toString();
        int promptTokens = Math.max(10, assembledPrompt.length() / 4);

        AnswerResult answerResult = llmGatewayService.executeWithGateway(q, assembledPrompt, retrievedChunks, isHomePreset);

        // Put in semantic cache if answer is present
        if (answerResult.answer() != null) {
            semanticCachePort.put(q, queryEmbedding, answerResult.answer());
        }

        long s5Duration = Math.max(1, System.currentTimeMillis() - s5Start);
        Map<String, Object> s5Data = Map.of(
            "assembledPromptLength", assembledPrompt.length(),
            "promptTokens", promptTokens,
            "gatewayMetadata", llmGatewayService.getGatewayMetadata(),
            "provider", answerResult.providerName(),
            "isPreset", answerResult.isPreset(),
            "modelNotConnected", answerResult.modelNotConnected(),
            "architectureNotice", "Model call intercepted safely — zero generative API cost"
        );
        emitter.accept(StageEvent.done(5, "llmgw", s5Duration, s5Data, List.of("llmgw", "model")));

        // --- STAGE 6: Stream it back ---
        long s6Start = System.currentTimeMillis();
        emitter.accept(StageEvent.started(6, "stream", List.of("sse", "client")));

        if (isHomePreset && answerResult.answer() != null) {
            // Stream real tokens for preset question on Home Hero
            String[] tokens = answerResult.answer().split(" ");
            for (String tok : tokens) {
                emitter.accept(StageEvent.streamToken(tok + " "));
            }
        }

        long s6Duration = Math.max(1, System.currentTimeMillis() - s6Start);
        Map<String, Object> s6Data = Map.of(
            "protocol", "Server-Sent Events (SSE)",
            "streamingMode", isHomePreset ? "Token-by-token text stream" : "Architecture telemetry stream (zero answer text)",
            "clientState", "Active HTTP connection"
        );
        emitter.accept(StageEvent.done(6, "stream", s6Duration, s6Data, List.of("sse", "client")));

        // --- STAGE 7: Do the bookkeeping later ---
        long s7Start = System.currentTimeMillis();
        emitter.accept(StageEvent.started(7, "bookkeeping", List.of("kafka", "usage", "evals")));

        UsageEvent usageEvent = new UsageEvent(
            requestId,
            session.id(),
            promptTokens,
            cacheResult.hit(),
            retrievedChunks.size(),
            false,
            Instant.now()
        );
        usageEventOutboxPort.publishUsage(usageEvent);

        long s7Duration = Math.max(1, System.currentTimeMillis() - s7Start);
        Map<String, Object> s7Data = Map.of(
            "stream", "app:events",
            "outboxTable", "app.outbox_event",
            "usageTable", "app.usage_event",
            "tokensRecorded", promptTokens,
            "costIncurred", "$0.0000"
        );
        emitter.accept(StageEvent.done(7, "bookkeeping", s7Duration, s7Data, List.of("kafka", "usage", "evals")));

        // --- STAGE 8: Keep knowledge fresh ---
        long s8Start = System.currentTimeMillis();
        emitter.accept(StageEvent.started(8, "ingestion", List.of("docs", "workers", "vector2", "vector")));

        long totalChunks = retrievalPort.countChunks();
        long s8Duration = Math.max(1, System.currentTimeMillis() - s8Start);
        Map<String, Object> s8Data = Map.of(
            "totalChunksIndexed", totalChunks,
            "deduplicationKey", "content_hash (SHA-256)",
            "embeddingModel", embeddingPort.getModelName(),
            "pipelineType", "Idempotent background ingestion"
        );
        emitter.accept(StageEvent.done(8, "ingestion", s8Duration, s8Data, List.of("docs", "workers", "vector2", "vector")));

        // --- STAGE 9: Box counts & summary ---
        long totalPipelineDuration = System.currentTimeMillis() - pipelineStart;
        Map<String, Object> summaryData = Map.of(
            "totalDurationMs", totalPipelineDuration,
            "totalArchitectureBoxes", 16,
            "modelBoxes", 1,
            "distributedBackendBoxes", 15,
            "summary", "16 boxes in the architecture. Only 1 is the LLM — the remaining 15 are distributed backend systems."
        );
        emitter.accept(StageEvent.completed(totalPipelineDuration, summaryData));
    }
}
