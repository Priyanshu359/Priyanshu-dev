package dev.priyanshu.api.lab.application;

import dev.priyanshu.api.lab.domain.QueueMessage;
import dev.priyanshu.api.lab.domain.QueuePipelineResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class QueueLabService {

    private static final int MAX_ATTEMPTS = 3;

    private final List<QueueMessage> mainQueue = new CopyOnWriteArrayList<>();
    private final List<QueueMessage> retryQueue = new CopyOnWriteArrayList<>();
    private final List<QueueMessage> dlq = new CopyOnWriteArrayList<>();
    private final List<QueueMessage> processed = new CopyOnWriteArrayList<>();

    public synchronized QueueMessage publish(String payload, boolean isPoisonPill) {
        String id = "MSG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String content = isPoisonPill ? "[POISON_PILL] " + payload : payload;

        QueueMessage msg = new QueueMessage(
            id,
            content,
            0,
            MAX_ATTEMPTS,
            "PENDING",
            "main",
            null,
            Instant.now().toEpochMilli()
        );
        mainQueue.add(msg);
        return msg;
    }

    public synchronized QueuePipelineResult processNextStep() {
        // Priority 1: Process items waiting in retry queue
        if (!retryQueue.isEmpty()) {
            QueueMessage msg = retryQueue.remove(0);
            processMessage(msg);
            return getState();
        }

        // Priority 2: Process items in main queue
        if (!mainQueue.isEmpty()) {
            QueueMessage msg = mainQueue.remove(0);
            processMessage(msg);
            return getState();
        }

        return getState();
    }

    private void processMessage(QueueMessage msg) {
        int nextAttempts = msg.attempts() + 1;
        boolean isPoison = msg.payload().contains("[POISON_PILL]");

        if (isPoison) {
            // Fails on purpose to demonstrate DLQ routing
            if (nextAttempts >= MAX_ATTEMPTS) {
                // Max retries reached: route to DLQ
                QueueMessage deadLetter = new QueueMessage(
                    msg.id(),
                    msg.payload(),
                    nextAttempts,
                    MAX_ATTEMPTS,
                    "DLQ",
                    "dlq",
                    "Max retries (" + MAX_ATTEMPTS + ") exhausted: UnhandledJsonDeserializationException",
                    Instant.now().toEpochMilli()
                );
                dlq.add(deadLetter);
            } else {
                // Route to retry queue with exponential backoff annotation
                long backoffSeconds = (long) Math.pow(2, nextAttempts);
                QueueMessage retrying = new QueueMessage(
                    msg.id(),
                    msg.payload(),
                    nextAttempts,
                    MAX_ATTEMPTS,
                    "RETRYING",
                    "retry",
                    "Transient error. Scheduled retry #" + (nextAttempts + 1) + " (backoff: " + backoffSeconds + "s)",
                    Instant.now().toEpochMilli()
                );
                retryQueue.add(retrying);
            }
        } else {
            // Healthy message succeeds
            QueueMessage success = new QueueMessage(
                msg.id(),
                msg.payload(),
                nextAttempts,
                MAX_ATTEMPTS,
                "SUCCESS",
                "completed",
                null,
                Instant.now().toEpochMilli()
            );
            processed.add(0, success);
        }
    }

    public synchronized void replayDlq() {
        List<QueueMessage> toReplay = new ArrayList<>(dlq);
        dlq.clear();
        for (QueueMessage m : toReplay) {
            // Sanitize poison tag during replay
            String cleanPayload = m.payload().replace("[POISON_PILL] ", "[HEALED] ");
            mainQueue.add(new QueueMessage(
                m.id(),
                cleanPayload,
                0,
                MAX_ATTEMPTS,
                "PENDING",
                "main",
                null,
                Instant.now().toEpochMilli()
            ));
        }
    }

    public synchronized void reset() {
        mainQueue.clear();
        retryQueue.clear();
        dlq.clear();
        processed.clear();
    }

    public synchronized QueuePipelineResult getState() {
        return new QueuePipelineResult(
            new ArrayList<>(mainQueue),
            new ArrayList<>(retryQueue),
            new ArrayList<>(dlq),
            new ArrayList<>(processed),
            processed.size(),
            dlq.size()
        );
    }
}
