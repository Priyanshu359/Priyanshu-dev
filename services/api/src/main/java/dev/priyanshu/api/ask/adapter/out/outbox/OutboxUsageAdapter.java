package dev.priyanshu.api.ask.adapter.out.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.ask.application.port.UsageEventOutboxPort;
import dev.priyanshu.api.ask.domain.UsageEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class OutboxUsageAdapter implements UsageEventOutboxPort {

    private static final Logger log = LoggerFactory.getLogger(OutboxUsageAdapter.class);
    private static final String STREAM_NAME = "app:events";

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public OutboxUsageAdapter(
            JdbcTemplate jdbcTemplate,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void publishUsage(UsageEvent event) {
        try {
            String payloadJson = objectMapper.writeValueAsString(event);

            // 1. Transactional outbox event table
            try {
                jdbcTemplate.update(
                    "INSERT INTO app.outbox_event (aggregate, event_type, payload, created_at) VALUES ('ask', 'USAGE_LOGGED', ?::jsonb, now())",
                    payloadJson
                );
            } catch (Exception e) {
                log.trace("Outbox event table insert fallback: {}", e.getMessage());
            }

            // 2. Direct write to app.usage_event (costs 0 Redis commands)
            try {
                String sql = """
                    INSERT INTO app.usage_event (request_id, session_id, prompt_tokens, cache_hit, context_chunks, blocked, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, now())
                    ON CONFLICT (request_id) DO NOTHING
                    """;
                jdbcTemplate.update(
                    sql,
                    event.requestId(),
                    event.sessionId(),
                    event.promptTokens(),
                    event.cacheHit(),
                    event.contextChunks(),
                    event.blocked()
                );
            } catch (Exception e) {
                log.trace("app.usage_event direct write fallback: {}", e.getMessage());
            }
        } catch (Exception ex) {
            log.error("Failed to serialize or publish usage event: {}", ex.getMessage());
        }
    }
}
