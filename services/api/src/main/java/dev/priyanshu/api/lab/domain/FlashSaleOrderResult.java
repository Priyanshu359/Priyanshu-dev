package dev.priyanshu.api.lab.domain;

public record FlashSaleOrderResult(
    String orderId,
    String userId,
    boolean success,
    int remainingStock,
    String strategy,
    long latencyMs,
    String message
) {}
