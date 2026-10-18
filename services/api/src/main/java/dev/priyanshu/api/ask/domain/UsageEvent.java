package dev.priyanshu.api.ask.domain;

import java.time.Instant;

public record UsageEvent(
    String requestId,
    String sessionId,
    int promptTokens,
    boolean cacheHit,
    int contextChunks,
    boolean blocked,
    Instant createdAt
) {}
