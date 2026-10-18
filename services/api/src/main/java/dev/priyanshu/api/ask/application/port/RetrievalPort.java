package dev.priyanshu.api.ask.application.port;

import dev.priyanshu.api.ask.domain.KnowledgeChunkEntity;
import dev.priyanshu.api.ask.domain.ScoredChunk;

import java.util.List;

public interface RetrievalPort {
    List<ScoredChunk> retrieveTopK(float[] queryEmbedding, int k);
    void saveOrUpdateChunk(KnowledgeChunkEntity chunk);
    long countChunks();
}
