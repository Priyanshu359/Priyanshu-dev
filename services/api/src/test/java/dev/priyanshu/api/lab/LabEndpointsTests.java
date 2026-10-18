package dev.priyanshu.api.lab;

import dev.priyanshu.api.lab.application.CoursesLabService;
import dev.priyanshu.api.lab.application.DatabaseExplainService;
import dev.priyanshu.api.lab.application.RateLimitLabService;
import dev.priyanshu.api.lab.application.RateLimitLabService.LabRateLimitResult;
import dev.priyanshu.api.lab.application.WithdrawRaceService;
import dev.priyanshu.api.lab.domain.CourseMode;
import dev.priyanshu.api.lab.domain.CourseQueryResult;
import dev.priyanshu.api.lab.domain.CourseQueryResult.CourseDto;
import dev.priyanshu.api.lab.domain.ExplainResult;
import dev.priyanshu.api.lab.domain.OrderStrategy;
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
}
