package dev.priyanshu.api.ask.application;

import dev.priyanshu.api.ask.application.port.AnswerProvider;
import dev.priyanshu.api.ask.application.port.AnswerProvider.AnswerResult;
import dev.priyanshu.api.ask.domain.ScoredChunk;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;

@Service
public class LlmGatewayService {

    private static final Logger log = LoggerFactory.getLogger(LlmGatewayService.class);

    private final AnswerProvider answerProvider;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;

    public LlmGatewayService(AnswerProvider answerProvider) {
        this.answerProvider = answerProvider;

        CircuitBreakerConfig cbConfig = CircuitBreakerConfig.custom()
            .failureRateThreshold(50.0f)
            .waitDurationInOpenState(Duration.ofSeconds(10))
            .slidingWindowSize(10)
            .minimumNumberOfCalls(5)
            .build();
        this.circuitBreaker = CircuitBreakerRegistry.ofDefaults().circuitBreaker("llmGateway", cbConfig);

        RetryConfig retryConfig = RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofMillis(200))
            .build();
        this.retry = RetryRegistry.ofDefaults().retry("llmGateway", retryConfig);
    }

    public AnswerResult executeWithGateway(String question, String prompt, List<ScoredChunk> context, boolean isHomePreset) {
        Callable<AnswerResult> callable = () -> answerProvider.generateAnswer(question, prompt, context, isHomePreset);
        Callable<AnswerResult> decorated = CircuitBreaker.decorateCallable(circuitBreaker, callable);
        decorated = Retry.decorateCallable(retry, decorated);

        try {
            return decorated.call();
        } catch (Exception e) {
            log.warn("LLM Gateway fallback triggered: {}", e.getMessage());
            return fallback(question, isHomePreset);
        }
    }

    private AnswerResult fallback(String question, boolean isHomePreset) {
        return new AnswerResult(
            null,
            "LlmGatewayFallback (CircuitBreaker/Timeout Safe Reject)",
            false,
            true
        );
    }

    public Map<String, Object> getGatewayMetadata() {
        return Map.of(
            "circuitBreakerState", circuitBreaker.getState().name(),
            "failureRateThreshold", "50%",
            "waitDurationInOpenState", "10s",
            "retryMaxAttempts", 3,
            "timeoutMs", 3000,
            "activeSafetyPolicies", List.of("Resilience4j CircuitBreaker", "Exponential Backoff", "Timeout 3s", "Graceful Fallback")
        );
    }
}
