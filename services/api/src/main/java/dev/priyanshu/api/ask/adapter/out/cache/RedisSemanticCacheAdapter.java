package dev.priyanshu.api.ask.adapter.out.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.ask.application.port.SemanticCachePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RedisSemanticCacheAdapter implements SemanticCachePort {

    private static final Logger log = LoggerFactory.getLogger(RedisSemanticCacheAdapter.class);
    private static final String CACHE_LIST_KEY = "ask:cache:recent_queries";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final double similarityThreshold;

    // In-memory fallback
    private final List<CachedItem> localCache = Collections.synchronizedList(new ArrayList<>());

    public RedisSemanticCacheAdapter(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${priyanshu.ask.semantic-cache.threshold:0.90}") double similarityThreshold) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.similarityThreshold = similarityThreshold;
    }

    @Override
    public CacheResult checkCache(float[] queryEmbedding, String question) {
        List<CachedItem> items = loadCachedItems();
        if (items.isEmpty()) {
            return new CacheResult(false, 0.0, null, null);
        }

        CachedItem bestMatch = null;
        double bestSimilarity = -1.0;

        for (CachedItem item : items) {
            double sim = cosineSimilarity(queryEmbedding, item.vector());
            if (sim > bestSimilarity) {
                bestSimilarity = sim;
                bestMatch = item;
            }
        }

        boolean hit = bestSimilarity >= similarityThreshold && bestMatch != null;
        return new CacheResult(
            hit,
            bestSimilarity > 0 ? Math.round(bestSimilarity * 100.0) / 100.0 : 0.0,
            bestMatch != null ? bestMatch.question() : null,
            hit ? bestMatch.answer() : null
        );
    }

    @Override
    public void put(String question, float[] embedding, String answer) {
        CachedItem item = new CachedItem(question, embedding, answer);
        localCache.add(item);
        if (localCache.size() > 50) {
            localCache.remove(0);
        }

        try {
            String json = objectMapper.writeValueAsString(item);
            redisTemplate.opsForList().rightPush(CACHE_LIST_KEY, json);
            redisTemplate.opsForList().trim(CACHE_LIST_KEY, -50, -1);
            redisTemplate.expire(CACHE_LIST_KEY, Duration.ofHours(24));
        } catch (Exception e) {
            log.trace("Redis cache put fallback: {}", e.getMessage());
        }
    }

    private List<CachedItem> loadCachedItems() {
        try {
            List<String> raw = redisTemplate.opsForList().range(CACHE_LIST_KEY, 0, -1);
            if (raw != null && !raw.isEmpty()) {
                List<CachedItem> list = new ArrayList<>();
                for (String s : raw) {
                    list.add(objectMapper.readValue(s, CachedItem.class));
                }
                return list;
            }
        } catch (Exception e) {
            log.trace("Redis cache read fallback: {}", e.getMessage());
        }
        return new ArrayList<>(localCache);
    }

    private double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length) return 0.0;
        double dot = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
        }
        return dot;
    }

    public record CachedItem(String question, float[] vector, String answer) {}
}
