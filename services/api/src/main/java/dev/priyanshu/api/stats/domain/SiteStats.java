package dev.priyanshu.api.stats.domain;

public record SiteStats(
    long served,
    long hits,
    long limits
) {}
