package dev.priyanshu.api.ask.application.port;

public interface SemanticCachePort {
    record CacheResult(boolean hit, double similarity, String cachedQuestion, String cachedAnswer) {}

    CacheResult checkCache(float[] embedding, String question);
    void put(String question, float[] embedding, String answer);
}
