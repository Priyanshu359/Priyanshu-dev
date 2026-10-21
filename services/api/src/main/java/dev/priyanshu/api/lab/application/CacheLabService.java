package dev.priyanshu.api.lab.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.lab.domain.CacheItemResult;
import dev.priyanshu.api.lab.domain.CacheStatsResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class CacheLabService {

    private static final Logger log = LoggerFactory.getLogger(CacheLabService.class);
    private static final String REDIS_PREFIX = "lab:cache:";
    private static final long DEFAULT_TTL_SECONDS = 30;

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong hits = new AtomicLong(0);
    private final AtomicLong misses = new AtomicLong(0);

    // Resilient in-memory fallback for environments where Redis is unavailable
    private final ConcurrentHashMap<String, InMemoryCacheEntry> localCache = new ConcurrentHashMap<>();

    public CacheLabService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public CacheItemResult getOrCompute(String key) {
        long startTime = System.currentTimeMillis();
        totalRequests.incrementAndGet();

        String redisKey = REDIS_PREFIX + key;

        // Try Redis first
        try {
            String cachedJson = redisTemplate.opsForValue().get(redisKey);
            if (cachedJson != null) {
                Long expire = redisTemplate.getExpire(redisKey);
                long ttl = (expire != null && expire > 0) ? expire : DEFAULT_TTL_SECONDS;
                hits.incrementAndGet();
                long latency = Math.max(1, System.currentTimeMillis() - startTime);

                Map<String, Object> data = objectMapper.readValue(cachedJson, new TypeReference<>() {});
                return new CacheItemResult(key, data, true, latency, ttl, "Redis (Memory)", Instant.now().toEpochMilli());
            }
        } catch (Exception e) {
            log.trace("Redis cache lookup error, using local fallback: {}", e.getMessage());
            InMemoryCacheEntry localEntry = localCache.get(key);
            long now = Instant.now().getEpochSecond();
            if (localEntry != null && localEntry.expiresAt > now) {
                hits.incrementAndGet();
                long latency = Math.max(1, System.currentTimeMillis() - startTime);
                return new CacheItemResult(key, localEntry.data, true, latency, localEntry.expiresAt - now, "Local In-Memory Cache", Instant.now().toEpochMilli());
            }
        }

        // Cache Miss: Simulate PostgreSQL index / query latency
        misses.incrementAndGet();
        long simulatedDbLatency = ThreadLocalRandom.current().nextLong(65, 95);
        try {
            Thread.sleep(simulatedDbLatency);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        Map<String, Object> freshData = generateEntityData(key);
        long now = Instant.now().getEpochSecond();

        // Write-through to Redis
        try {
            String json = objectMapper.writeValueAsString(freshData);
            redisTemplate.opsForValue().set(redisKey, json, Duration.ofSeconds(DEFAULT_TTL_SECONDS));
        } catch (Exception e) {
            log.trace("Redis cache write failed: {}", e.getMessage());
            localCache.put(key, new InMemoryCacheEntry(freshData, now + DEFAULT_TTL_SECONDS));
        }

        long totalLatency = System.currentTimeMillis() - startTime;
        return new CacheItemResult(key, freshData, false, totalLatency, DEFAULT_TTL_SECONDS, "PostgreSQL (Database)", Instant.now().toEpochMilli());
    }

    public boolean evict(String key) {
        String redisKey = REDIS_PREFIX + key;
        boolean evicted = false;
        try {
            Boolean res = redisTemplate.delete(redisKey);
            evicted = Boolean.TRUE.equals(res);
        } catch (Exception ignored) {}
        localCache.remove(key);
        return evicted;
    }

    public CacheItemResult warm(String key) {
        evict(key);
        return getOrCompute(key);
    }

    public CacheStatsResult getStats() {
        long reqs = totalRequests.get();
        long h = hits.get();
        long m = misses.get();
        double ratio = (reqs > 0) ? ((double) h / reqs) * 100.0 : 0.0;

        int cachedKeys = localCache.size();
        try {
            var keys = redisTemplate.keys(REDIS_PREFIX + "*");
            if (keys != null) {
                cachedKeys = Math.max(cachedKeys, keys.size());
            }
        } catch (Exception ignored) {}

        return new CacheStatsResult(reqs, h, m, Math.round(ratio * 10.0) / 10.0, cachedKeys);
    }

    private Map<String, Object> generateEntityData(String key) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", key);
        data.put("title", "Distributed Systems Architecture Blueprint");
        data.put("sku", "SKU-" + Math.abs(key.hashCode() % 10000));
        data.put("author", "Priyanshu Sinha");
        data.put("activeSubscribers", 1420);
        data.put("p99SlaMs", 4.5);
        data.put("version", "2.4.0");
        data.put("generatedAt", Instant.now().toString());
        data.put("status", "AVAILABLE");
        return data;
    }

    private static class InMemoryCacheEntry {
        final Map<String, Object> data;
        final long expiresAt;

        InMemoryCacheEntry(Map<String, Object> data, long expiresAt) {
            this.data = data;
            this.expiresAt = expiresAt;
        }
    }
}
