package dev.priyanshu.api.lab.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.lab.domain.PaymentChargeRequest;
import dev.priyanshu.api.lab.domain.PaymentChargeResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PaymentLabService {

    private static final Logger log = LoggerFactory.getLogger(PaymentLabService.class);
    private static final String IDEMPOTENCY_PREFIX = "lab:payment:idempotency:";
    private static final Duration TTL = Duration.ofMinutes(5);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // Resilient fallback storage
    private final ConcurrentHashMap<String, PaymentChargeResult> localStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Object> inFlightLocks = new ConcurrentHashMap<>();
    private final List<PaymentChargeResult> auditLog = Collections.synchronizedList(new ArrayList<>());
    private final AtomicLong customerBalanceCents = new AtomicLong(100_000); // $1000.00 initial balance

    public PaymentLabService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public PaymentChargeResult processPayment(PaymentChargeRequest request, boolean enableIdempotency) {
        long start = System.currentTimeMillis();
        String key = (request.idempotencyKey() != null && !request.idempotencyKey().isBlank())
            ? request.idempotencyKey()
            : UUID.randomUUID().toString();

        String redisKey = IDEMPOTENCY_PREFIX + key;

        if (enableIdempotency) {
            // Concurrent in-flight mutex: ensure rapid double-clicks on the same key
            // execute strictly once and subsequent concurrent requests await and replay the result.
            Object lock = inFlightLocks.computeIfAbsent(key, k -> new Object());
            synchronized (lock) {
                try {
                    // Check if already processed while waiting for lock
                    PaymentChargeResult cached = getCachedResult(key, redisKey, start);
                    if (cached != null) {
                        return cached;
                    }

                    return executeFreshPayment(request, key, redisKey, start, true);
                } finally {
                    inFlightLocks.remove(key);
                }
            }
        }

        // Fresh Payment without idempotency protection: double clicks will charge twice
        return executeFreshPayment(request, key, redisKey, start, false);
    }

    private PaymentChargeResult getCachedResult(String key, String redisKey, long start) {
        // 1. Check Redis
        try {
            String existingJson = redisTemplate.opsForValue().get(redisKey);
            if (existingJson != null) {
                PaymentChargeResult cached = objectMapper.readValue(existingJson, PaymentChargeResult.class);
                long latency = System.currentTimeMillis() - start;
                PaymentChargeResult replayedResult = new PaymentChargeResult(
                    cached.transactionId(),
                    cached.idempotencyKey(),
                    cached.amountCents(),
                    "REPLAYED_SUCCESS",
                    true,
                    latency,
                    "Idempotent replay: previous transaction returned. No duplicate charge incurred.",
                    cached.timestamp()
                );
                auditLog.add(replayedResult);
                return replayedResult;
            }
        } catch (Exception e) {
            log.trace("Redis idempotency lookup fallback: {}", e.getMessage());
        }

        // 2. Check local in-memory fallback
        PaymentChargeResult localCached = localStore.get(key);
        if (localCached != null) {
            long latency = System.currentTimeMillis() - start;
            PaymentChargeResult replayedResult = new PaymentChargeResult(
                localCached.transactionId(),
                localCached.idempotencyKey(),
                localCached.amountCents(),
                "REPLAYED_SUCCESS",
                true,
                latency,
                "Idempotent replay: previous transaction returned. No duplicate charge incurred.",
                localCached.timestamp()
            );
            auditLog.add(replayedResult);
            return replayedResult;
        }

        return null;
    }

    private PaymentChargeResult executeFreshPayment(
            PaymentChargeRequest request,
            String key,
            String redisKey,
            long start,
            boolean saveToIdempotencyStore) {
        // Fresh Payment Processing: Simulate 80–120ms banking gateway latency
        try {
            Thread.sleep(85);
        } catch (InterruptedException ignored) {}

        customerBalanceCents.addAndGet(-request.amountCents());
        String txId = "TXN_" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        long latency = System.currentTimeMillis() - start;

        PaymentChargeResult newCharge = new PaymentChargeResult(
            txId,
            key,
            request.amountCents(),
            "SUCCESS",
            false,
            latency,
            "Card charged successfully: $" + (request.amountCents() / 100.0),
            Instant.now().toEpochMilli()
        );

        if (saveToIdempotencyStore) {
            try {
                String json = objectMapper.writeValueAsString(newCharge);
                redisTemplate.opsForValue().set(redisKey, json, TTL);
            } catch (Exception e) {
                log.trace("Redis store fallback: {}", e.getMessage());
            }
            localStore.put(key, newCharge);
        }

        auditLog.add(newCharge);
        return newCharge;
    }

    public void reset() {
        try {
            var keys = redisTemplate.keys(IDEMPOTENCY_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception ignored) {}
        localStore.clear();
        inFlightLocks.clear();
        auditLog.clear();
        customerBalanceCents.set(100_000);
    }

    public List<PaymentChargeResult> getAuditLog() {
        return new ArrayList<>(auditLog);
    }

    public long getBalanceCents() {
        return customerBalanceCents.get();
    }
}
