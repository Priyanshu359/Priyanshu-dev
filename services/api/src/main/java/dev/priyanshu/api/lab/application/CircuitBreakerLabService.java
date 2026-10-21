package dev.priyanshu.api.lab.application;

import dev.priyanshu.api.lab.domain.CircuitBreakerResult;
import dev.priyanshu.api.lab.domain.CircuitBreakerState;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;

@Service
public class CircuitBreakerLabService {

    private static final int WINDOW_SIZE = 5;
    private static final double FAILURE_THRESHOLD_RATIO = 0.60; // 60%
    private static final long OPEN_DURATION_MS = 5000; // 5 seconds wait before HALF_OPEN probe

    private CircuitBreakerState state = CircuitBreakerState.CLOSED;
    private boolean downstreamHealthy = true;
    private long openedAtTimestamp = 0;

    // Sliding window of recent results (true = success, false = failure)
    private final Deque<Boolean> callWindow = new ArrayDeque<>();

    public synchronized CircuitBreakerResult executeCall() {
        long start = System.currentTimeMillis();
        long now = System.currentTimeMillis();

        // 1. Check if OPEN has elapsed and should transition to HALF_OPEN probe
        if (state == CircuitBreakerState.OPEN) {
            if (now - openedAtTimestamp >= OPEN_DURATION_MS) {
                state = CircuitBreakerState.HALF_OPEN;
            } else {
                // Fail Fast instantly (<1ms)
                long latency = System.currentTimeMillis() - start;
                int failures = countFailures();
                return new CircuitBreakerResult(
                    CircuitBreakerState.OPEN,
                    downstreamHealthy,
                    true,
                    latency,
                    failures,
                    calculateFailureRate(),
                    "Circuit is OPEN: Request blocked immediately to protect system threads. Graceful cached fallback returned.",
                    Instant.now().toEpochMilli()
                );
            }
        }

        // 2. Execute downstream call
        if (state == CircuitBreakerState.HALF_OPEN) {
            if (downstreamHealthy) {
                // Probe succeeded: recover to CLOSED!
                callWindow.clear();
                recordCall(true);
                state = CircuitBreakerState.CLOSED;
                long latency = System.currentTimeMillis() - start + 15;
                return new CircuitBreakerResult(
                    CircuitBreakerState.CLOSED,
                    true,
                    false,
                    latency,
                    0,
                    0.0,
                    "HALF-OPEN trial probe succeeded! Downstream recovered. Circuit reset to CLOSED.",
                    Instant.now().toEpochMilli()
                );
            } else {
                // Probe failed: trip back to OPEN
                state = CircuitBreakerState.OPEN;
                openedAtTimestamp = System.currentTimeMillis();
                recordCall(false);
                long latency = System.currentTimeMillis() - start + 45;
                return new CircuitBreakerResult(
                    CircuitBreakerState.OPEN,
                    false,
                    true,
                    latency,
                    countFailures(),
                    100.0,
                    "HALF-OPEN trial probe failed! Downstream still broken. Circuit tripped back to OPEN.",
                    Instant.now().toEpochMilli()
                );
            }
        }

        // 3. CLOSED State normal execution
        if (downstreamHealthy) {
            recordCall(true);
            long latency = Math.max(1, System.currentTimeMillis() - start + 12);
            return new CircuitBreakerResult(
                CircuitBreakerState.CLOSED,
                true,
                false,
                latency,
                countFailures(),
                calculateFailureRate(),
                "Downstream responded normally: HTTP 200 OK",
                Instant.now().toEpochMilli()
            );
        } else {
            // Downstream simulated timeout / 503 error
            recordCall(false);
            int failures = countFailures();
            double rate = calculateFailureRate();

            // Check if threshold exceeded
            if (callWindow.size() >= 3 && rate >= (FAILURE_THRESHOLD_RATIO * 100)) {
                state = CircuitBreakerState.OPEN;
                openedAtTimestamp = System.currentTimeMillis();
                long latency = System.currentTimeMillis() - start + 75;
                return new CircuitBreakerResult(
                    CircuitBreakerState.OPEN,
                    false,
                    true,
                    latency,
                    failures,
                    rate,
                    "Failure threshold reached (" + rate + "% >= 60%). Breaker TRIPPED to OPEN! Fast-fail active.",
                    Instant.now().toEpochMilli()
                );
            }

            long latency = System.currentTimeMillis() - start + 75;
            return new CircuitBreakerResult(
                CircuitBreakerState.CLOSED,
                false,
                true,
                latency,
                failures,
                rate,
                "Downstream call failed (timeout / 503). Failure recorded in sliding window.",
                Instant.now().toEpochMilli()
            );
        }
    }

    public synchronized void setDownstreamHealthy(boolean healthy) {
        this.downstreamHealthy = healthy;
    }

    public synchronized boolean isDownstreamHealthy() {
        return downstreamHealthy;
    }

    public synchronized void reset() {
        this.state = CircuitBreakerState.CLOSED;
        this.downstreamHealthy = true;
        this.callWindow.clear();
        this.openedAtTimestamp = 0;
    }

    private void recordCall(boolean success) {
        if (callWindow.size() >= WINDOW_SIZE) {
            callWindow.pollFirst();
        }
        callWindow.addLast(success);
    }

    private int countFailures() {
        int count = 0;
        for (Boolean s : callWindow) {
            if (!s) count++;
        }
        return count;
    }

    private double calculateFailureRate() {
        if (callWindow.isEmpty()) return 0.0;
        int fails = countFailures();
        double rate = ((double) fails / callWindow.size()) * 100.0;
        return Math.round(rate * 10.0) / 10.0;
    }
}
