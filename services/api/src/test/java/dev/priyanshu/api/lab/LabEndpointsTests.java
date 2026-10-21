package dev.priyanshu.api.lab;

import dev.priyanshu.api.lab.application.CacheLabService;
import dev.priyanshu.api.lab.application.CircuitBreakerLabService;
import dev.priyanshu.api.lab.application.CoursesLabService;
import dev.priyanshu.api.lab.application.DatabaseExplainService;
import dev.priyanshu.api.lab.application.FlashSaleLabService;
import dev.priyanshu.api.lab.application.PaymentLabService;
import dev.priyanshu.api.lab.application.QueueLabService;
import dev.priyanshu.api.lab.application.RateLimitLabService;
import dev.priyanshu.api.lab.application.RateLimitLabService.LabRateLimitResult;
import dev.priyanshu.api.lab.application.WithdrawRaceService;
import dev.priyanshu.api.lab.domain.CacheItemResult;
import dev.priyanshu.api.lab.domain.CircuitBreakerResult;
import dev.priyanshu.api.lab.domain.CircuitBreakerState;
import dev.priyanshu.api.lab.domain.CourseMode;
import dev.priyanshu.api.lab.domain.CourseQueryResult;
import dev.priyanshu.api.lab.domain.CourseQueryResult.CourseDto;
import dev.priyanshu.api.lab.domain.ExplainResult;
import dev.priyanshu.api.lab.domain.FlashSaleOrderResult;
import dev.priyanshu.api.lab.domain.FlashSaleSimulationResult;
import dev.priyanshu.api.lab.domain.OrderStrategy;
import dev.priyanshu.api.lab.domain.PaymentChargeResult;
import dev.priyanshu.api.lab.domain.QueueMessage;
import dev.priyanshu.api.lab.domain.QueuePipelineResult;
import dev.priyanshu.api.lab.domain.RaceStrategy;
import dev.priyanshu.api.lab.domain.WithdrawRaceResult;
import dev.priyanshu.api.lab.domain.WithdrawRaceResult.TimelineStep;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "priyanshu.outbox.polling-interval-ms=600000"
})
class LabEndpointsTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RateLimitLabService rateLimitLabService;

    @MockitoBean
    private DatabaseExplainService databaseExplainService;

    @MockitoBean
    private CoursesLabService coursesLabService;

    @MockitoBean
    private WithdrawRaceService withdrawRaceService;

    @MockitoBean
    private CacheLabService cacheLabService;

    @MockitoBean
    private FlashSaleLabService flashSaleLabService;

    @MockitoBean
    private PaymentLabService paymentLabService;

    @MockitoBean
    private CircuitBreakerLabService circuitBreakerLabService;

    @MockitoBean
    private QueueLabService queueLabService;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    @MockitoBean
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private JavaMailSender mailSender;

    @Test
    void rateLimitAllowedReturns200AndHeaders() throws Exception {
        when(rateLimitLabService.tryConsume(anyString()))
            .thenReturn(new LabRateLimitResult(true, 4, 5, 0, false));

        mockMvc.perform(get("/lab/limited"))
            .andExpect(status().isOk())
            .andExpect(header().string("X-RateLimit-Limit", "5"))
            .andExpect(header().string("X-RateLimit-Remaining", "4"))
            .andExpect(jsonPath("$.status").value(200))
            .andExpect(jsonPath("$.remaining").value(4));
    }

    @Test
    void rateLimitExceededReturns429AndRetryAfter() throws Exception {
        when(rateLimitLabService.tryConsume(anyString()))
            .thenReturn(new LabRateLimitResult(false, 0, 5, 2, false));

        mockMvc.perform(get("/lab/limited"))
            .andExpect(status().isTooManyRequests())
            .andExpect(header().string("X-RateLimit-Limit", "5"))
            .andExpect(header().string("X-RateLimit-Remaining", "0"))
            .andExpect(header().string("Retry-After", "2"))
            .andExpect(jsonPath("$.status").value(429))
            .andExpect(jsonPath("$.retryAfter").value(2));
    }

    @Test
    void databaseExplainEndpointReturnsPlan() throws Exception {
        when(databaseExplainService.explainQuery(OrderStrategy.COMPOSITE))
            .thenReturn(new ExplainResult(
                "composite",
                "lab.orders_composite_idx",
                0.08,
                0.04,
                20L,
                20L,
                "Index Scan",
                "[]",
                List.of()
            ));

        mockMvc.perform(post("/lab/db/explain")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"strategy\":\"composite\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.strategy").value("composite"))
            .andExpect(jsonPath("$.rowsScanned").value(20));
    }

    @Test
    void databaseCoursesEndpointReturnsXQueryCountHeader() throws Exception {
        when(coursesLabService.getCourses(CourseMode.FETCH))
            .thenReturn(new CourseQueryResult(
                "fetch",
                1,
                12L,
                List.of("SELECT ..."),
                50,
                List.of(new CourseDto(1L, "Distributed Systems", "Priyanshu Sinha"))
            ));

        mockMvc.perform(get("/lab/db/courses").param("mode", "fetch"))
            .andExpect(status().isOk())
            .andExpect(header().string("X-Query-Count", "1"))
            .andExpect(jsonPath("$.queryCount").value(1));
    }

    @Test
    void databaseWithdrawRaceEndpointReturnsTimeline() throws Exception {
        when(withdrawRaceService.executeRace(RaceStrategy.LOCK))
            .thenReturn(new WithdrawRaceResult(
                "lock",
                100_000L,
                30_000L,
                false,
                true,
                "Correct: one succeeds, one safely rejected.",
                List.of(
                    new TimelineStep("T1", "SELECT ... FOR UPDATE (row locked)", 100_000L, 0L),
                    new TimelineStep("T2", "Waiting for lock...", 100_000L, 10L)
                )
            ));

        mockMvc.perform(post("/lab/db/withdraw-race")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"strategy\":\"lock\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.strategy").value("lock"))
            .andExpect(jsonPath("$.ok").value(true));
    }

    @Test
    void cacheItemEndpointReturnsHeadersAndCacheStatus() throws Exception {
        when(cacheLabService.getOrCompute("user:42:profile"))
            .thenReturn(new CacheItemResult(
                "user:42:profile",
                java.util.Map.of("id", "user:42:profile", "title", "Test"),
                true,
                1L,
                30L,
                "Redis (Memory)",
                System.currentTimeMillis()
            ));

        mockMvc.perform(get("/lab/cache/item").param("key", "user:42:profile"))
            .andExpect(status().isOk())
            .andExpect(header().string("X-Cache", "HIT"))
            .andExpect(header().string("X-Cache-TTL", "30"))
            .andExpect(jsonPath("$.cacheHit").value(true));
    }

    @Test
    void cacheEvictEndpointPurgesKey() throws Exception {
        when(cacheLabService.evict("user:42:profile")).thenReturn(true);

        mockMvc.perform(post("/lab/cache/evict").param("key", "user:42:profile"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.evicted").value(true));
    }

    @Test
    void flashSaleSimulateEndpointReturnsAccurateSummary() throws Exception {
        when(flashSaleLabService.runSimulation("atomic", 50, 10))
            .thenReturn(new FlashSaleSimulationResult(
                "atomic", 10, 50, 10, 40, 0, 0, false, List.of()
            ));

        mockMvc.perform(post("/lab/flash-sale/simulate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"strategy\":\"atomic\",\"concurrency\":50,\"stock\":10}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.successfulOrders").value(10))
            .andExpect(jsonPath("$.oversoldAmount").value(0))
            .andExpect(jsonPath("$.oversold").value(false));
    }

    @Test
    void flashSaleBuyEndpointReturnsOrderResult() throws Exception {
        when(flashSaleLabService.buyItem("buyer_1", "atomic"))
            .thenReturn(new FlashSaleOrderResult(
                "ORD-1234", "buyer_1", true, 9, "atomic", 2L, "Order locked & confirmed!"
            ));

        mockMvc.perform(post("/lab/flash-sale/buy")
                .param("userId", "buyer_1")
                .param("strategy", "atomic"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.remainingStock").value(9));
    }

    @Test
    void paymentChargeEndpointReturnsIdempotentReplayHeader() throws Exception {
        when(paymentLabService.processPayment(any(), any(Boolean.class)))
            .thenReturn(new PaymentChargeResult(
                "TXN_9999", "idem-uuid-1", 25_000L, "REPLAYED_SUCCESS", true, 1L, "Replayed", System.currentTimeMillis()
            ));

        mockMvc.perform(post("/lab/payments/charge")
                .header("Idempotency-Key", "idem-uuid-1")
                .param("enableIdempotency", "true"))
            .andExpect(status().isOk())
            .andExpect(header().string("X-Idempotent-Replay", "true"))
            .andExpect(jsonPath("$.replayed").value(true))
            .andExpect(jsonPath("$.transactionId").value("TXN_9999"));
    }

    @Test
    void circuitBreakerCallEndpointReturnsStateHeader() throws Exception {
        when(circuitBreakerLabService.executeCall())
            .thenReturn(new CircuitBreakerResult(
                CircuitBreakerState.CLOSED, true, false, 12L, 0, 0.0, "OK", System.currentTimeMillis()
            ));

        mockMvc.perform(get("/lab/circuit-breaker/call"))
            .andExpect(status().isOk())
            .andExpect(header().string("X-Circuit-State", "CLOSED"))
            .andExpect(jsonPath("$.state").value("CLOSED"));
    }

    @Test
    void queuePublishEndpointReturnsMessage() throws Exception {
        when(queueLabService.publish("Test payload", false))
            .thenReturn(new QueueMessage(
                "MSG-101", "Test payload", 0, 3, "PENDING", "main", null, System.currentTimeMillis()
            ));

        mockMvc.perform(post("/lab/queues/publish")
                .param("payload", "Test payload")
                .param("isPoisonPill", "false"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("MSG-101"))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }
}
