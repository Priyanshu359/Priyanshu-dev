package dev.priyanshu.api.ask.domain;

public record KnowledgeChunkEntity(
    Long id,
    String source,
    String title,
    String content,
    String contentHash,
    float[] embedding
) {}
