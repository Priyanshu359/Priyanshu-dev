package dev.priyanshu.api.lab.adapter.in.web;

import dev.priyanshu.api.lab.application.CircuitBreakerLabService;
import dev.priyanshu.api.lab.domain.CircuitBreakerResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/lab/circuit-breaker")
public class CircuitBreakerLabController {

    private final CircuitBreakerLabService circuitBreakerLabService;

    public CircuitBreakerLabController(CircuitBreakerLabService circuitBreakerLabService) {
        this.circuitBreakerLabService = circuitBreakerLabService;
    }

    @GetMapping("/call")
    public ResponseEntity<CircuitBreakerResult> call() {
        CircuitBreakerResult result = circuitBreakerLabService.executeCall();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Circuit-State", result.state().name());
        headers.set("X-Fallback-Used", String.valueOf(result.fallbackUsed()));
        headers.set("X-Response-Time", result.latencyMs() + "ms");

        return ResponseEntity.ok()
            .headers(headers)
            .body(result);
    }

    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggle(
        @RequestParam boolean healthy
    ) {
        circuitBreakerLabService.setDownstreamHealthy(healthy);
        return ResponseEntity.ok(Map.of(
            "downstreamHealthy", healthy,
            "message", healthy ? "Downstream service marked HEALTHY." : "Downstream service marked BROKEN (503 / Timeout)."
        ));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        circuitBreakerLabService.reset();
        return ResponseEntity.ok(Map.of("message", "Circuit breaker reset to CLOSED and downstream healed."));
    }
}
