package dev.priyanshu.api.lab.adapter.in.web;

import dev.priyanshu.api.lab.application.QueueLabService;
import dev.priyanshu.api.lab.domain.QueueMessage;
import dev.priyanshu.api.lab.domain.QueuePipelineResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/lab/queues")
public class QueueLabController {

    private static final Logger log = LoggerFactory.getLogger(QueueLabController.class);

    private final QueueLabService queueLabService;

    public QueueLabController(QueueLabService queueLabService) {
        this.queueLabService = queueLabService;
    }

    @PostMapping("/publish")
    public ResponseEntity<QueueMessage> publish(
        @RequestParam(defaultValue = "Send order confirmation invoice") String payload,
        @RequestParam(defaultValue = "false") boolean isPoisonPill
    ) {
        QueueMessage msg = queueLabService.publish(payload, isPoisonPill);
        log.info("[LAB-QUEUES] POST /publish -> id='{}', poisonPill={}, payload='{}'", msg.id(), isPoisonPill, payload);
        return ResponseEntity.ok(msg);
    }

    @PostMapping("/process-step")
    public ResponseEntity<QueuePipelineResult> processStep() {
        QueuePipelineResult result = queueLabService.processNextStep();
        log.info("[LAB-QUEUES] POST /process-step -> mainQueue={}, retryQueue={}, dlq={}, totalProcessed={}",
            result.mainQueue().size(), result.retryQueue().size(), result.dlq().size(), result.totalProcessed());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/replay-dlq")
    public ResponseEntity<QueuePipelineResult> replayDlq() {
        queueLabService.replayDlq();
        QueuePipelineResult result = queueLabService.getState();
        log.info("[LAB-QUEUES] POST /replay-dlq -> replayed to main (mainQueue={}, dlq={})", result.mainQueue().size(), result.dlq().size());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        queueLabService.reset();
        log.info("[LAB-QUEUES] POST /reset -> all queues flushed");
        return ResponseEntity.ok(Map.of("message", "All queues flushed and reset to empty."));
    }

    @GetMapping("/state")
    public ResponseEntity<QueuePipelineResult> getState() {
        return ResponseEntity.ok(queueLabService.getState());
    }
}
