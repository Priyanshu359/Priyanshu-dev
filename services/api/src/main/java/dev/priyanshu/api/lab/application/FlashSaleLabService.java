package dev.priyanshu.api.lab.application;

import dev.priyanshu.api.lab.domain.FlashSaleOrderResult;
import dev.priyanshu.api.lab.domain.FlashSaleSimulationResult;
import dev.priyanshu.api.lab.domain.FlashSaleSimulationResult.FlashSaleEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class FlashSaleLabService {

    private static final Logger log = LoggerFactory.getLogger(FlashSaleLabService.class);
    private static final String STOCK_KEY = "lab:flashsale:stock";
    private static final int DEFAULT_STOCK = 10;

    private static final String ATOMIC_DECR_LUA = """
        local current = tonumber(redis.call('GET', KEYS[1]) or 0)
        local requested = tonumber(ARGV[1])
        if current >= requested then
            redis.call('DECRBY', KEYS[1], requested)
            return {1, current - requested}
        else
            return {0, current}
        end
        """;

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<List> atomicDecrScript;
    private final AtomicInteger localStock = new AtomicInteger(DEFAULT_STOCK);

    public FlashSaleLabService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.atomicDecrScript = new DefaultRedisScript<>();
        this.atomicDecrScript.setScriptText(ATOMIC_DECR_LUA);
        this.atomicDecrScript.setResultType(List.class);
    }

    public int getStock() {
        try {
            String val = redisTemplate.opsForValue().get(STOCK_KEY);
            if (val != null) return Integer.parseInt(val);
        } catch (Exception ignored) {}
        return localStock.get();
    }

    public void resetStock(int stock) {
        try {
            redisTemplate.opsForValue().set(STOCK_KEY, String.valueOf(stock));
        } catch (Exception ignored) {}
        localStock.set(stock);
    }

    public FlashSaleOrderResult buyItem(String userId, String strategy) {
        long start = System.currentTimeMillis();
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        if ("naive".equalsIgnoreCase(strategy)) {
            // Naive read-then-write (prone to lost updates)
            int current = localStock.get();
            if (current > 0) {
                try {
                    Thread.sleep(15); // simulate DB order creation delay
                } catch (InterruptedException ignored) {}
                int after = localStock.decrementAndGet();
                long latency = System.currentTimeMillis() - start;
                return new FlashSaleOrderResult(orderId, userId, true, after, "naive", latency, "Order confirmed (naive)");
            } else {
                long latency = System.currentTimeMillis() - start;
                return new FlashSaleOrderResult(orderId, userId, false, current, "naive", latency, "Sold out");
            }
        }

        // Atomic Redis Lua or in-memory AtomicInteger
        try {
            List<?> result = redisTemplate.execute(
                atomicDecrScript,
                List.of(STOCK_KEY),
                "1"
            );
            if (result != null && result.size() >= 2) {
                long allowed = ((Number) result.get(0)).longValue();
                int remaining = ((Number) result.get(1)).intValue();
                long latency = System.currentTimeMillis() - start;

                if (allowed == 1) {
                    return new FlashSaleOrderResult(orderId, userId, true, remaining, "atomic", latency, "Order locked & confirmed!");
                } else {
                    return new FlashSaleOrderResult(orderId, userId, false, remaining, "atomic", latency, "Sold out (Zero overselling)");
                }
            }
        } catch (Exception e) {
            log.trace("Redis flash sale fallback: {}", e.getMessage());
        }

        // Local atomic decrement fallback
        int prev = localStock.getAndUpdate(s -> Math.max(0, s - 1));
        long latency = System.currentTimeMillis() - start;
        if (prev > 0) {
            return new FlashSaleOrderResult(orderId, userId, true, prev - 1, "atomic", latency, "Order locked & confirmed (local atomic)");
        } else {
            return new FlashSaleOrderResult(orderId, userId, false, 0, "atomic", latency, "Sold out (Zero overselling)");
        }
    }

    public FlashSaleSimulationResult runSimulation(String strategy, int concurrentRequests, int initialStock) {
        resetStock(initialStock);
        boolean isNaive = "naive".equalsIgnoreCase(strategy);

        List<FlashSaleEvent> timeline = new CopyOnWriteArrayList<>();
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(30, concurrentRequests));
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(concurrentRequests);

        AtomicInteger successfulOrders = new AtomicInteger(0);
        AtomicInteger failedOrders = new AtomicInteger(0);
        long simStart = System.currentTimeMillis();

        // For naive simulation, use non-atomic primitive int to recreate real race condition
        final int[] naiveStock = new int[]{ initialStock };

        for (int i = 1; i <= concurrentRequests; i++) {
            final int buyerId = i;
            executor.submit(() -> {
                try {
                    startGate.await();
                    long offset = System.currentTimeMillis() - simStart;
                    String orderId = "ORD-" + String.format("%03d", buyerId);
                    String user = "buyer_" + buyerId;

                    if (isNaive) {
                        // Race condition: check without lock, artificial delay, decrement
                        int readVal = naiveStock[0];
                        if (readVal > 0) {
                            Thread.sleep(ThreadLocalRandom.current().nextInt(5, 20));
                            naiveStock[0]--;
                            successfulOrders.incrementAndGet();
                            timeline.add(new FlashSaleEvent(
                                orderId, user, true, naiveStock[0], offset,
                                naiveStock[0] < 0 ? "OVERSELLING! Read stock=" + readVal + " but decremented to negative" : "Checked stock > 0, confirmed"
                            ));
                        } else {
                            failedOrders.incrementAndGet();
                            timeline.add(new FlashSaleEvent(orderId, user, false, readVal, offset, "Stock 0 detected, rejected"));
                        }
                    } else {
                        // Atomic check & decrement
                        FlashSaleOrderResult res = buyItem(user, "atomic");
                        if (res.success()) {
                            successfulOrders.incrementAndGet();
                            timeline.add(new FlashSaleEvent(orderId, user, true, res.remainingStock(), offset, "Atomic lock acquired. Remaining: " + res.remainingStock()));
                        } else {
                            failedOrders.incrementAndGet();
                            timeline.add(new FlashSaleEvent(orderId, user, false, res.remainingStock(), offset, "Sold out. Atomic lock rejected request"));
                        }
                    }
                } catch (Exception ignored) {
                } finally {
                    endGate.countDown();
                }
            });
        }

        startGate.countDown();
        try {
            endGate.await(5, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {}
        executor.shutdown();

        int successes = successfulOrders.get();
        int fails = failedOrders.get();
        int finalStk = isNaive ? naiveStock[0] : Math.max(0, initialStock - successes);
        int oversold = Math.max(0, successes - initialStock);

        timeline.sort(Comparator.comparingLong(FlashSaleEvent::offsetMs));

        return new FlashSaleSimulationResult(
            strategy,
            initialStock,
            concurrentRequests,
            successes,
            fails,
            oversold,
            finalStk,
            oversold > 0,
            timeline
        );
    }
}
