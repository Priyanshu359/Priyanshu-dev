package dev.priyanshu.api.lab.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitLabService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitLabService.class);

    private static final long LAB_CAPACITY = 5;
    private static final double LAB_REFILL_RATE = 1.0 / 2.0; // 1 token every 2 seconds

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
    private final ConcurrentHashMap<String, InMemoryBucket> localBuckets = new ConcurrentHashMap<>();

    public RateLimitLabService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.script = new DefaultRedisScript<>();
        this.script.setScriptText(LUA_SCRIPT);
        this.script.setResultType(List.class);
    }

    public LabRateLimitResult tryConsume(String clientIp) {
        String key = "ratelimit:lab:limited:" + clientIp;
        long now = Instant.now().getEpochSecond();

        try {
            List<?> result = redisTemplate.execute(
                script,
                List.of(key),
                String.valueOf(LAB_CAPACITY),
                String.valueOf(LAB_REFILL_RATE),
                String.valueOf(now),
                "1"
            );

            if (result != null && result.size() >= 3) {
                long allowed = ((Number) result.get(0)).longValue();
                long remaining = ((Number) result.get(1)).longValue();
                long retryAfter = ((Number) result.get(2)).longValue();
                return new LabRateLimitResult(allowed == 1, remaining, LAB_CAPACITY, retryAfter, false);
            }
        } catch (Exception e) {
            log.trace("Redis lab rate limiter fallback: {}", e.getMessage());
            return consumeLocal(clientIp, now);
        }

        return new LabRateLimitResult(true, LAB_CAPACITY - 1, LAB_CAPACITY, 0, false);
    }

    public void resetBucket(String clientIp) {
        String key = "ratelimit:lab:limited:" + clientIp;
        try {
            redisTemplate.delete(key);
        } catch (Exception ignored) {}
        localBuckets.remove(clientIp);
    }

    private LabRateLimitResult consumeLocal(String clientIp, long now) {
        InMemoryBucket bucket = localBuckets.computeIfAbsent(clientIp, k -> new InMemoryBucket(LAB_CAPACITY, now));
        synchronized (bucket) {
            long delta = Math.max(0, now - bucket.lastUpdated);
            bucket.tokens = Math.min(LAB_CAPACITY, bucket.tokens + (long) (delta * LAB_REFILL_RATE));
            bucket.lastUpdated = now;

            if (bucket.tokens >= 1) {
                bucket.tokens -= 1;
                return new LabRateLimitResult(true, bucket.tokens, LAB_CAPACITY, 0, true);
            } else {
                long retryAfter = Math.max(1, (long) Math.ceil(1.0 / LAB_REFILL_RATE));
                return new LabRateLimitResult(false, 0, LAB_CAPACITY, retryAfter, true);
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

    public record LabRateLimitResult(
        boolean allowed,
        long remaining,
        long limit,
        long retryAfterSeconds,
        boolean localReplay
    ) {}
}
