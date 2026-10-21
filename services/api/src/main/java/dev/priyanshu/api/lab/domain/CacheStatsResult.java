package dev.priyanshu.api.lab.domain;

public record CacheStatsResult(
    long totalRequests,
    long hits,
    long misses,
    double hitRatio,
    int cachedKeysCount
) {}
