package dev.priyanshu.api.lab.adapter.in.web;

import dev.priyanshu.api.lab.application.CacheLabService;
import dev.priyanshu.api.lab.domain.CacheItemResult;
import dev.priyanshu.api.lab.domain.CacheStatsResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/lab/cache")
public class CacheLabController {

    private static final Logger log = LoggerFactory.getLogger(CacheLabController.class);

    private final CacheLabService cacheLabService;

    public CacheLabController(CacheLabService cacheLabService) {
        this.cacheLabService = cacheLabService;
    }

    @GetMapping("/item")
    public ResponseEntity<CacheItemResult> getItem(
        @RequestParam(value = "key", defaultValue = "user:42:profile") String key
    ) {
        CacheItemResult result = cacheLabService.getOrCompute(key);

        log.info("[LAB-CACHE] GET /item key='{}' -> {} (source='{}', latency={}ms, ttl={}s)",
            key, result.cacheHit() ? "HIT" : "MISS", result.source(), result.latencyMs(), result.ttlSeconds());

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Cache", result.cacheHit() ? "HIT" : "MISS");
        headers.set("X-Cache-TTL", String.valueOf(result.ttlSeconds()));
        headers.set("X-Response-Time", result.latencyMs() + "ms");
        headers.set("X-Cache-Source", result.source());

        return ResponseEntity.ok()
            .headers(headers)
            .body(result);
    }

    @PostMapping("/evict")
    public ResponseEntity<Map<String, Object>> evict(
        @RequestParam(value = "key", defaultValue = "user:42:profile") String key
    ) {
        boolean evicted = cacheLabService.evict(key);
        log.info("[LAB-CACHE] POST /evict key='{}' -> evicted={}", key, evicted);
        return ResponseEntity.ok(Map.of(
            "status", 200,
            "message", "Key purged from cache.",
            "key", key,
            "evicted", evicted
        ));
    }

    @PostMapping("/warm")
    public ResponseEntity<CacheItemResult> warm(
        @RequestParam(value = "key", defaultValue = "user:42:profile") String key
    ) {
        CacheItemResult result = cacheLabService.warm(key);
        log.info("[LAB-CACHE] POST /warm key='{}' -> pre-warmed in {}ms (ttl={}s)", key, result.latencyMs(), result.ttlSeconds());

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Cache", "WARM");
        headers.set("X-Cache-TTL", String.valueOf(result.ttlSeconds()));
        headers.set("X-Response-Time", result.latencyMs() + "ms");

        return ResponseEntity.ok()
            .headers(headers)
            .body(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<CacheStatsResult> getStats() {
        CacheStatsResult stats = cacheLabService.getStats();
        log.info("[LAB-CACHE] GET /stats -> hits={}, misses={}, totalReqs={}, hitRatio={}%",
            stats.hits(), stats.misses(), stats.totalRequests(), stats.hitRatio());
        return ResponseEntity.ok(stats);
    }
}
