package dev.priyanshu.api.ask;

import dev.priyanshu.api.ask.adapter.out.embedding.LocalMiniLmEmbeddingAdapter;
import dev.priyanshu.api.ask.adapter.out.model.NoModelAnswerProvider;
import dev.priyanshu.api.ask.adapter.out.model.PresetAnswerProvider;
import dev.priyanshu.api.ask.application.AskPipelineService;
import dev.priyanshu.api.ask.application.LlmGatewayService;
import dev.priyanshu.api.ask.application.port.AnswerProvider.AnswerResult;
import dev.priyanshu.api.ask.application.port.EmbeddingPort;
import dev.priyanshu.api.ask.application.port.RetrievalPort;
import dev.priyanshu.api.ask.application.port.SemanticCachePort;
import dev.priyanshu.api.ask.application.port.SemanticCachePort.CacheResult;
import dev.priyanshu.api.ask.application.port.SessionPort;
import dev.priyanshu.api.ask.application.port.UsageEventOutboxPort;
import dev.priyanshu.api.ask.domain.AskSession;
import dev.priyanshu.api.ask.domain.ScoredChunk;
import dev.priyanshu.api.ask.domain.StageEvent;
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

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "priyanshu.outbox.polling-interval-ms=600000"
})
class AskPipelineTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LocalMiniLmEmbeddingAdapter embeddingAdapter;

    @Autowired
    private PresetAnswerProvider presetAnswerProvider;

    @Autowired
    private NoModelAnswerProvider noModelAnswerProvider;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    @MockitoBean
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private JavaMailSender mailSender;

    @MockitoBean
    private SemanticCachePort semanticCachePort;

    @MockitoBean
    private RetrievalPort retrievalPort;

    @MockitoBean
    private SessionPort sessionPort;

    @MockitoBean
    private UsageEventOutboxPort usageEventOutboxPort;

    @Test
    void embeddingAdapterGenerates384DimensionalUnitVectors() {
        float[] vector = embeddingAdapter.embed("How does Priyanshu handle traffic spikes at StudyIQ?");
        assertEquals(384, vector.length);
        assertEquals(384, embeddingAdapter.getDimension());
        assertTrue(embeddingAdapter.getModelName().contains("384-dim"));

        // Verify L2 unit norm
        double sumSq = 0;
        for (float v : vector) {
            sumSq += v * v;
        }
        assertEquals(1.0, Math.sqrt(sumSq), 0.01);
    }

    @Test
    void presetAnswerProviderReturnsCuratedAnswerForPresetQuestion() {
        AnswerResult result = presetAnswerProvider.generateAnswer(
            "What does Priyanshu work on?",
            "",
            List.of(),
            true
        );

        assertTrue(result.isPreset());
        assertFalse(result.modelNotConnected());
        assertNotNull(result.answer());
        assertTrue(result.answer().contains("StudyIQ"));
    }

    @Test
    void noModelAnswerProviderEnforcesZeroAnswerTextForGeneralQuestions() {
        AnswerResult result = noModelAnswerProvider.generateAnswer(
            "Write a poem about backends",
            "",
            List.of(),
            false
        );

        assertTrue(result.modelNotConnected());
        assertNull(result.answer(), "AI page must never display generated answer text");
    }

    @Test
    void askPipelineServiceEmitsAllStagesInSequence() {
        when(semanticCachePort.checkCache(any(), anyString()))
            .thenReturn(new CacheResult(false, 0.45, "cached question", null));

        when(sessionPort.getAndIncrementSession(anyString()))
            .thenReturn(new AskSession("sess_test", 1, Instant.now(), Instant.now()));

        when(retrievalPort.retrieveTopK(any(), anyInt()))
            .thenReturn(List.of(
                new ScoredChunk(1L, "caching.md", "Caching", "Redis caching at StudyIQ", 0.92)
            ));

        AskPipelineService service = new AskPipelineService(
            embeddingAdapter,
            semanticCachePort,
            retrievalPort,
            sessionPort,
            new LlmGatewayService(noModelAnswerProvider),
            usageEventOutboxPort
        );

        List<StageEvent> emitted = new ArrayList<>();
        service.runPipeline(
            "How does he handle traffic spikes?",
            "127.0.0.1",
            "TestAgent/1.0",
            "sess_test",
            false,
            emitted::add
        );

        assertFalse(emitted.isEmpty());
        // Verify stage started and done events
        assertTrue(emitted.stream().anyMatch(e -> e.stageNumber() == 1 && "stage.done".equals(e.type())));
        assertTrue(emitted.stream().anyMatch(e -> e.stageNumber() == 2 && "stage.done".equals(e.type())));
        assertTrue(emitted.stream().anyMatch(e -> e.stageNumber() == 3 && "stage.done".equals(e.type())));
        assertTrue(emitted.stream().anyMatch(e -> e.stageNumber() == 4 && "stage.done".equals(e.type())));
        assertTrue(emitted.stream().anyMatch(e -> e.stageNumber() == 5 && "stage.done".equals(e.type())));
        assertTrue(emitted.stream().anyMatch(e -> e.stageNumber() == 6 && "stage.done".equals(e.type())));
        assertTrue(emitted.stream().anyMatch(e -> e.stageNumber() == 7 && "stage.done".equals(e.type())));
        assertTrue(emitted.stream().anyMatch(e -> e.stageNumber() == 8 && "stage.done".equals(e.type())));
        assertTrue(emitted.stream().anyMatch(e -> e.stageNumber() == 9 && "pipeline.done".equals(e.type())));
    }

    @Test
    void askPostEndpointReturnsEventStream() throws Exception {
        when(semanticCachePort.checkCache(any(), anyString()))
            .thenReturn(new CacheResult(false, 0.2, null, null));
        when(sessionPort.getAndIncrementSession(any()))
            .thenReturn(new AskSession("sess_abc", 1, Instant.now(), Instant.now()));
        when(retrievalPort.retrieveTopK(any(), anyInt()))
            .thenReturn(List.of());

        mockMvc.perform(post("/ask")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"q\":\"How does he use Redis?\",\"isHomePreset\":false}"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM));
    }
}
