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

            // 2. Publish to Redis Stream
            try {
                redisTemplate.opsForStream().add(StreamRecords.newRecord()
                    .in(STREAM_NAME)
                    .ofMap(Map.of(
                        "eventType", "USAGE_LOGGED",
                        "requestId", event.requestId(),
                        "payload", payloadJson
                    )));
            } catch (Exception e) {
                log.trace("Redis stream add fallback: {}", e.getMessage());
            }
        } catch (Exception ex) {
            log.error("Failed to serialize or publish usage event: {}", ex.getMessage());
        }
    }
}
