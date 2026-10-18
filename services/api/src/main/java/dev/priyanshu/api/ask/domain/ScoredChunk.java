package dev.priyanshu.api.ask.domain;

public record ScoredChunk(
    Long id,
    String source,
    String title,
    String content,
    double score
) {}
