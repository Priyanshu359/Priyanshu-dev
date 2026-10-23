package dev.priyanshu.api.platform.adapter.out.outbox;

import dev.priyanshu.api.platform.PlatformProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
@EnableScheduling
public class OutboxRelayScheduler {

    private static final Logger log = LoggerFactory.getLogger(OutboxRelayScheduler.class);

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;
    private final PlatformProperties properties;

    public OutboxRelayScheduler(JdbcTemplate jdbcTemplate,
                                StringRedisTemplate redisTemplate,
                                PlatformProperties properties) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisTemplate = redisTemplate;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${priyanshu.outbox.polling-interval-ms:1000}")
    public void relayUnpublishedEvents() {
        int batchSize = properties.getOutbox().getBatchSize();
        String streamName = properties.getOutbox().getStreamName();

        try {
            String sql = """
                SELECT id, aggregate, event_type, payload
                FROM app.outbox_event
                WHERE published_at IS NULL
                ORDER BY id ASC
                LIMIT ?
                """;

            List<OutboxRow> unpublished = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new OutboxRow(
                    rs.getLong("id"),
                    rs.getString("aggregate"),
                    rs.getString("event_type"),
                    rs.getString("payload")
                ),
                batchSize
            );

            if (unpublished.isEmpty()) {
                return;
            }

            for (OutboxRow row : unpublished) {
                try {
                    Map<String, String> fields = Map.of(
                        "id", String.valueOf(row.id()),
                        "aggregate", row.aggregate(),
                        "eventType", row.eventType(),
                        "payload", row.payload()
                    );

                    MapRecord<String, String, String> record = StreamRecords.string(fields).withStreamKey(streamName);
                    redisTemplate.opsForStream().add(record);

                    jdbcTemplate.update(
                        "UPDATE app.outbox_event SET published_at = ? WHERE id = ?",
                        Timestamp.from(Instant.now()),
                        row.id()
                    );
                    log.debug("Relayed outbox event id: {} to stream: {}", row.id(), streamName);
                } catch (Exception ex) {
                    log.error("Failed to relay outbox event id: {}", row.id(), ex);
                    break; // Stop batch on failure so order is preserved
                }
            }
        } catch (Exception ex) {
            // DB might be temporarily unavailable or not initialized yet
            log.trace("Outbox polling skipped: {}", ex.getMessage());
        }
    }

    private record OutboxRow(long id, String aggregate, String eventType, String payload) {}
}
