package dev.priyanshu.api.ask.adapter.out.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.ask.domain.UsageEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class UsageStreamConsumer {

    private static final Logger log = LoggerFactory.getLogger(UsageStreamConsumer.class);
    private static final String STREAM_NAME = "app:events";

    private final StringRedisTemplate redisTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private String lastOffset = "0-0";

    public UsageStreamConsumer(
            StringRedisTemplate redisTemplate,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelay = 5000)
    public void consumeUsageEvents() {
        try {
            List<MapRecord<String, Object, Object>> records = redisTemplate.opsForStream().read(
                StreamReadOptions.empty().count(20),
                StreamOffset.create(STREAM_NAME, ReadOffset.from(lastOffset))
            );

            if (records == null || records.isEmpty()) return;

            for (MapRecord<String, Object, Object> record : records) {
                this.lastOffset = record.getId().getValue();
                Map<Object, Object> val = record.getValue();
                String eventType = (String) val.get("eventType");

                if ("USAGE_LOGGED".equals(eventType)) {
                    String payload = (String) val.get("payload");
                    if (payload != null) {
                        try {
                            UsageEvent event = objectMapper.readValue(payload, UsageEvent.class);
                            writeUsageEvent(event);
                        } catch (Exception ex) {
                            log.trace("Failed parsing usage record: {}", ex.getMessage());
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private void writeUsageEvent(UsageEvent event) {
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
            log.trace("app.usage_event write fallback: {}", e.getMessage());
        }
    }
}
