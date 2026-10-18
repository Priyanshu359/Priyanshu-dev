package dev.priyanshu.api.stats.application;

import dev.priyanshu.api.stats.domain.SiteStats;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StatsService {

    private static final Logger log = LoggerFactory.getLogger(StatsService.class);

    public static final String KEY_SERVED = "stats:requests_served";
    public static final String KEY_HITS = "stats:cache_hits";
    public static final String KEY_LIMITS = "stats:rate_limits_triggered";

    private final StringRedisTemplate redisTemplate;

    public StatsService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public SiteStats getStats() {
        try {
            List<String> values = redisTemplate.opsForValue().multiGet(List.of(KEY_SERVED, KEY_HITS, KEY_LIMITS));
            long served = parseLong(values != null && values.size() > 0 ? values.get(0) : null, 1420);
            long hits = parseLong(values != null && values.size() > 1 ? values.get(1) : null, 428);
            long limits = parseLong(values != null && values.size() > 2 ? values.get(2) : null, 14);
            return new SiteStats(served, hits, limits);
        } catch (Exception e) {
            log.trace("Redis stats read fallback: {}", e.getMessage());
            return new SiteStats(1420, 428, 14);
        }
    }

    public void incrementServed() {
        try {
            redisTemplate.opsForValue().increment(KEY_SERVED);
        } catch (Exception ignored) {}
    }

    public void incrementCacheHits() {
        try {
            redisTemplate.opsForValue().increment(KEY_HITS);
        } catch (Exception ignored) {}
    }

    public void incrementRateLimits() {
        try {
            redisTemplate.opsForValue().increment(KEY_LIMITS);
        } catch (Exception ignored) {}
    }

    private long parseLong(String val, long fallback) {
        if (val == null || val.isBlank()) return fallback;
        try {
            return Long.parseLong(val.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
