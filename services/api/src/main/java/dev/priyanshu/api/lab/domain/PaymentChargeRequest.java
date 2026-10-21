package dev.priyanshu.api.lab.domain;

public record PaymentChargeRequest(
    String idempotencyKey,
    String customerId,
    long amountCents,
    String currency
) {}
