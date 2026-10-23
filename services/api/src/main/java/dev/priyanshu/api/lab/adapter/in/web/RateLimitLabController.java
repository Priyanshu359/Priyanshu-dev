package dev.priyanshu.api.lab.adapter.in.web;

import dev.priyanshu.api.lab.application.RateLimitLabService;
import dev.priyanshu.api.lab.application.RateLimitLabService.LabRateLimitResult;
import dev.priyanshu.api.platform.adapter.in.web.RateLimitingFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/lab")
public class RateLimitLabController {

    private static final Logger log = LoggerFactory.getLogger(RateLimitLabController.class);

    private final RateLimitLabService rateLimitLabService;

    public RateLimitLabController(RateLimitLabService rateLimitLabService) {
        this.rateLimitLabService = rateLimitLabService;
    }

    @GetMapping("/limited")
    public ResponseEntity<Map<String, Object>> getLimited(HttpServletRequest request) {
        String clientIp = RateLimitingFilter.extractClientIp(request);
        LabRateLimitResult result = rateLimitLabService.tryConsume(clientIp);

        log.info("[LAB-RATE-LIMIT] Consume token for IP={} -> allowed={}, remaining={}/{}, retryAfter={}s",
            clientIp, result.allowed(), result.remaining(), result.limit(), result.retryAfterSeconds());

        HttpHeaders headers = new HttpHeaders();
        headers.set(RateLimitingFilter.RATELIMIT_LIMIT_HEADER, String.valueOf(result.limit()));
        headers.set(RateLimitingFilter.RATELIMIT_REMAINING_HEADER, String.valueOf(result.remaining()));
        if (result.localReplay()) {
            headers.set("X-Lab-Replay", "true");
        }

        if (!result.allowed()) {
            headers.set(RateLimitingFilter.RETRY_AFTER_HEADER, String.valueOf(result.retryAfterSeconds()));
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .headers(headers)
                .body(Map.of(
                    "status", 429,
                    "error", "Too Many Requests",
                    "message", "Rate limit exceeded. Bucket empty. Try again in " + result.retryAfterSeconds() + "s.",
                    "remaining", result.remaining(),
                    "limit", result.limit(),
                    "retryAfter", result.retryAfterSeconds(),
                    "replay", result.localReplay()
                ));
        }

        return ResponseEntity.ok()
            .headers(headers)
            .body(Map.of(
                "status", 200,
                "message", "Token granted. Request allowed.",
                "remaining", result.remaining(),
                "limit", result.limit(),
                "retryAfter", 0,
                "replay", result.localReplay()
            ));
    }

    @PostMapping("/limited/reset")
    public ResponseEntity<Map<String, Object>> resetBucket(HttpServletRequest request) {
        String clientIp = RateLimitingFilter.extractClientIp(request);
        rateLimitLabService.resetBucket(clientIp);

        HttpHeaders headers = new HttpHeaders();
        headers.set(RateLimitingFilter.RATELIMIT_LIMIT_HEADER, "5");
        headers.set(RateLimitingFilter.RATELIMIT_REMAINING_HEADER, "5");

        return ResponseEntity.ok()
            .headers(headers)
            .body(Map.of(
                "status", 200,
                "message", "Bucket reset to capacity 5",
                "remaining", 5,
                "limit", 5
            ));
    }
}
