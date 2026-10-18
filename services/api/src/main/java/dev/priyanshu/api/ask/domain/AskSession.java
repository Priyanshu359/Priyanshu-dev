package dev.priyanshu.api.ask.domain;

import java.time.Instant;

public record AskSession(
    String id,
    int questionCount,
    Instant createdAt,
    Instant lastSeenAt
) {}
