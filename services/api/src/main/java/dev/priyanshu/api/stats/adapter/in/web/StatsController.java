package dev.priyanshu.api.stats.adapter.in.web;

import dev.priyanshu.api.stats.application.StatsService;
import dev.priyanshu.api.stats.domain.SiteStats;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping(value = "/stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SiteStats> getStats() {
        return ResponseEntity.ok(statsService.getStats());
    }
}
