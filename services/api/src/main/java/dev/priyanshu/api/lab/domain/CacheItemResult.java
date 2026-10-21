package dev.priyanshu.api.lab.domain;

import java.util.Map;

public record CacheItemResult(
    String key,
    Map<String, Object> data,
    boolean cacheHit,
    long latencyMs,
    long ttlSeconds,
    String source,
    long timestamp
) {}
