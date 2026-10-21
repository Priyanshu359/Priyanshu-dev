package dev.priyanshu.api.lab.domain;

public record CircuitBreakerResult(
    CircuitBreakerState state,
    boolean downstreamHealthy,
    boolean fallbackUsed,
    long latencyMs,
    int failuresInWindow,
    double failureRatePercent,
    String message,
    long timestamp
) {}
