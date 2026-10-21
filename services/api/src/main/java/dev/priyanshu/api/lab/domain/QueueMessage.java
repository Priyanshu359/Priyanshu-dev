package dev.priyanshu.api.lab.domain;

public record QueueMessage(
    String id,
    String payload,
    int attempts,
    int maxAttempts,
    String status, // PENDING, PROCESSING, RETRYING, SUCCESS, DLQ
    String queue,  // main, retry, dlq, completed
    String lastError,
    long timestamp
) {}
