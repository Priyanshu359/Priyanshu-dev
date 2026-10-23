package dev.priyanshu.api.lab.adapter.in.web;

import dev.priyanshu.api.lab.application.CoursesLabService;
import dev.priyanshu.api.lab.application.DatabaseExplainService;
import dev.priyanshu.api.lab.application.WithdrawRaceService;
import dev.priyanshu.api.lab.domain.CourseMode;
import dev.priyanshu.api.lab.domain.CourseQueryResult;
import dev.priyanshu.api.lab.domain.ExplainResult;
import dev.priyanshu.api.lab.domain.OrderStrategy;
import dev.priyanshu.api.lab.domain.RaceStrategy;
import dev.priyanshu.api.lab.domain.WithdrawRaceResult;
import dev.priyanshu.api.platform.adapter.in.web.RateLimitingFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/lab/db")
public class DatabaseLabController {

    private static final Logger log = LoggerFactory.getLogger(DatabaseLabController.class);
    private static final int DB_LAB_RATE_LIMIT_PER_MINUTE = 30;

    private final DatabaseExplainService databaseExplainService;
    private final CoursesLabService coursesLabService;
    private final WithdrawRaceService withdrawRaceService;
    private final StringRedisTemplate redisTemplate;

    public DatabaseLabController(
            DatabaseExplainService databaseExplainService,
            CoursesLabService coursesLabService,
            WithdrawRaceService withdrawRaceService,
            StringRedisTemplate redisTemplate) {
        this.databaseExplainService = databaseExplainService;
        this.coursesLabService = coursesLabService;
        this.withdrawRaceService = withdrawRaceService;
        this.redisTemplate = redisTemplate;
    }

    private boolean checkDbLabRateLimit(HttpServletRequest request) {
        String clientIp = RateLimitingFilter.extractClientIp(request);
        String key = "ratelimit:lab:db:" + clientIp;
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, Duration.ofMinutes(1));
            }
            return count != null && count <= DB_LAB_RATE_LIMIT_PER_MINUTE;
        } catch (Exception ignored) {
            return true;
        }
    }

    @PostMapping("/explain")
    public ResponseEntity<?> explainQuery(
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {
        if (!checkDbLabRateLimit(request)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("error", "Lab database rate limit exceeded (30 req/min). Try again shortly."));
        }

        String strategyParam = body != null ? body.get("strategy") : null;
        OrderStrategy strategy = OrderStrategy.fromString(strategyParam);
        ExplainResult result = databaseExplainService.explainQuery(strategy);

        log.info("[LAB-DB] EXPLAIN strategy='{}' -> node='{}', rowsScanned={}, execTime={}ms",
            strategy.getId(), result.nodeType(), result.rowsScanned(), result.executionTimeMs());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getCourses(
            @RequestParam(name = "mode", defaultValue = "naive") String modeParam,
            HttpServletRequest request) {
        if (!checkDbLabRateLimit(request)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("error", "Lab database rate limit exceeded (30 req/min). Try again shortly."));
        }

        CourseMode mode = CourseMode.fromString(modeParam);
        CourseQueryResult result = coursesLabService.getCourses(mode);

        log.info("[LAB-DB] Courses mode='{}' -> queryCount={}, duration={}ms, coursesReturned={}",
            mode.name().toLowerCase(), result.queryCount(), result.durationMs(), result.coursesCount());

        return ResponseEntity.ok()
            .header("X-Query-Count", String.valueOf(result.queryCount()))
            .body(result);
    }

    @PostMapping("/withdraw-race")
    public ResponseEntity<?> withdrawRace(
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {
        if (!checkDbLabRateLimit(request)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("error", "Lab database rate limit exceeded (30 req/min). Try again shortly."));
        }

        String strategyParam = body != null ? body.get("strategy") : null;
        RaceStrategy strategy = RaceStrategy.fromString(strategyParam);
        WithdrawRaceResult result = withdrawRaceService.executeRace(strategy);

        log.info("[LAB-DB] Withdraw race strategy='{}' -> finalBalancePaise={}, lostUpdate={}, ok={}, summary='{}'",
            strategy.name().toLowerCase(), result.finalBalancePaise(), result.lostUpdate(), result.ok(), result.summary());

        return ResponseEntity.ok(result);
    }
}
