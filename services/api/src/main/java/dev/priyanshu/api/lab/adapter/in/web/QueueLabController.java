package dev.priyanshu.api.lab.adapter.in.web;

import dev.priyanshu.api.lab.application.QueueLabService;
import dev.priyanshu.api.lab.domain.QueueMessage;
import dev.priyanshu.api.lab.domain.QueuePipelineResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/lab/queues")
public class QueueLabController {

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
        return ResponseEntity.ok(msg);
    }

    @PostMapping("/process-step")
    public ResponseEntity<QueuePipelineResult> processStep() {
        QueuePipelineResult result = queueLabService.processNextStep();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/replay-dlq")
    public ResponseEntity<QueuePipelineResult> replayDlq() {
        queueLabService.replayDlq();
        return ResponseEntity.ok(queueLabService.getState());
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        queueLabService.reset();
        return ResponseEntity.ok(Map.of("message", "All queues flushed and reset to empty."));
    }

    @GetMapping("/state")
    public ResponseEntity<QueuePipelineResult> getState() {
        return ResponseEntity.ok(queueLabService.getState());
    }
}
