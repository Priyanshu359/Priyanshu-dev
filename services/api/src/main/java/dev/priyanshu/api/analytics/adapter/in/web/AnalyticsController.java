package dev.priyanshu.api.analytics.adapter.in.web;

import dev.priyanshu.api.analytics.application.AnalyticsService;
import dev.priyanshu.api.analytics.domain.AnalyticsOverview;
import dev.priyanshu.api.platform.adapter.in.web.RateLimitingFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    public record IngestEventRequest(
        String sessionId,
        String eventType,
        String eventName,
        String path,
        String referrer,
        Map<String, Object> metadata
    ) {}

    @PostMapping("/events")
    public ResponseEntity<Map<String, String>> ingestEvent(
        @RequestBody(required = false) IngestEventRequest body,
        HttpServletRequest request
    ) {
        if (body == null) {
            return ResponseEntity.accepted().body(Map.of("status", "ignored"));
        }

        String userAgent = request.getHeader("User-Agent");
        String clientIp = RateLimitingFilter.extractClientIp(request);

        analyticsService.recordEvent(
            body.sessionId(),
            body.eventType(),
            body.eventName(),
            body.path(),
            body.referrer(),
            userAgent,
            clientIp,
            body.metadata()
        );

        return ResponseEntity.accepted().body(Map.of("status", "queued"));
    }

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview(
        @RequestParam(name = "period", defaultValue = "7d") String period,
        @RequestHeader(name = "X-Admin-Key", required = false) String adminKeyHeader,
        @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String key = adminKeyHeader;
        if ((key == null || key.isBlank()) && authHeader != null && authHeader.startsWith("Bearer ")) {
            key = authHeader.substring(7).trim();
        }

        if (!analyticsService.isAuthorized(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Unauthorized access to telemetry dashboard",
                "status", 401
            ));
        }

        AnalyticsOverview overview = analyticsService.getOverview(period);
        return ResponseEntity.ok(overview);
    }
}
