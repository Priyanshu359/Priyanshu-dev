package dev.priyanshu.api.lab.domain;

public record PaymentChargeResult(
    String transactionId,
    String idempotencyKey,
    long amountCents,
    String status,
    boolean replayed,
    long latencyMs,
    String message,
    long timestamp
) {}
