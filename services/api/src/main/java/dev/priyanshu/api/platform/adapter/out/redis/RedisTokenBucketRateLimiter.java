package dev.priyanshu.api.platform.adapter.out.redis;

import dev.priyanshu.api.platform.PlatformProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RedisTokenBucketRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(RedisTokenBucketRateLimiter.class);

    private static final String LUA_SCRIPT = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local requested = tonumber(ARGV[4])

        local data = redis.call('HMGET', key, 'tokens', 'last_updated')
        local tokens = tonumber(data[1])
        local last_updated = tonumber(data[2])

        if tokens == nil then
          tokens = capacity
          last_updated = now
        else
          local delta = math.max(0, now - last_updated)
          tokens = math.min(capacity, tokens + delta * refill_rate)
          last_updated = now
        end

        if tokens >= requested then
          tokens = tokens - requested
          redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
          redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) * 2)
          return {1, math.floor(tokens), 0}
        else
          redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
          local missing = requested - tokens
          local retry_after = math.ceil(missing / refill_rate)
          if retry_after <= 0 then retry_after = 1 end
          return {0, math.floor(tokens), retry_after}
        end
        """;

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<List> script;
    private final PlatformProperties properties;
    private final ConcurrentHashMap<String, InMemoryBucket> localFallback = new ConcurrentHashMap<>();

    public RedisTokenBucketRateLimiter(StringRedisTemplate redisTemplate, PlatformProperties properties) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;
        this.script = new DefaultRedisScript<>();
        this.script.setScriptText(LUA_SCRIPT);
        this.script.setResultType(List.class);
    }

    public RateLimitResult tryAcquire(String clientIp) {
        var globalConfig = properties.getRateLimit().getGlobal();
        long capacity = globalConfig.getCapacity();
        double refillRate = (double) globalConfig.getRefillTokens() / (double) globalConfig.getRefillPeriodSeconds();
        long now = Instant.now().getEpochSecond();
        String redisKey = "ratelimit:global:" + clientIp;

        try {
            List<?> result = redisTemplate.execute(
                script,
                List.of(redisKey),
                String.valueOf(capacity),
                String.valueOf(refillRate),
                String.valueOf(now),
                "1"
            );

            if (result != null && result.size() >= 3) {
                long allowed = ((Number) result.get(0)).longValue();
                long remaining = ((Number) result.get(1)).longValue();
                long retryAfter = ((Number) result.get(2)).longValue();
                return new RateLimitResult(allowed == 1, remaining, capacity, retryAfter);
            }
        } catch (Exception e) {
            log.warn("Redis rate limiter unavailable, failing open with in-memory token bucket: {}", e.getMessage());
            return acquireLocal(clientIp, capacity, refillRate, now);
        }

        return new RateLimitResult(true, capacity - 1, capacity, 0);
    }

    private RateLimitResult acquireLocal(String clientIp, long capacity, double refillRate, long now) {
        InMemoryBucket bucket = localFallback.computeIfAbsent(clientIp, k -> new InMemoryBucket(capacity, now));
        synchronized (bucket) {
            long delta = Math.max(0, now - bucket.lastUpdated);
            bucket.tokens = Math.min(capacity, bucket.tokens + (long) (delta * refillRate));
            bucket.lastUpdated = now;

            if (bucket.tokens >= 1) {
                bucket.tokens -= 1;
                return new RateLimitResult(true, bucket.tokens, capacity, 0);
            } else {
                long retryAfter = Math.max(1, (long) Math.ceil(1.0 / refillRate));
                return new RateLimitResult(false, 0, capacity, retryAfter);
            }
        }
    }

    private static class InMemoryBucket {
        long tokens;
        long lastUpdated;

        InMemoryBucket(long tokens, long lastUpdated) {
            this.tokens = tokens;
            this.lastUpdated = lastUpdated;
        }
    }

    public record RateLimitResult(boolean allowed, long remaining, long limit, long retryAfterSeconds) {}
}
