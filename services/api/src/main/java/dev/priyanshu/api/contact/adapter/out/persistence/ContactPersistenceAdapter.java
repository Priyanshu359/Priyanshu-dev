package dev.priyanshu.api.contact.adapter.out.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.contact.application.ContactPersistencePort;
import dev.priyanshu.api.contact.domain.ContactMessage;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.Optional;
import java.util.UUID;

@Component
public class ContactPersistenceAdapter implements ContactPersistencePort {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public ContactPersistenceAdapter(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<UUID> findIdByContentHash(String contentHash) {
        String sql = "SELECT id FROM app.contact_message WHERE content_hash = ? LIMIT 1";
        try {
            UUID id = jdbcTemplate.queryForObject(sql, UUID.class, contentHash);
            return Optional.ofNullable(id);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public void saveMessageAndOutboxEvent(ContactMessage message, String eventPayload) {
        String detailsJson = "{}";
        try {
            if (message.details() != null) {
                detailsJson = objectMapper.writeValueAsString(message.details());
            }
        } catch (Exception ignored) {}

        String insertMessageSql = """
            INSERT INTO app.contact_message (
                id, type, name, email, message, details, content_hash, ip_hash, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(
            insertMessageSql,
            message.id(),
            message.type().getValue(),
            message.name(),
            message.email(),
            message.message(),
            detailsJson,
            message.contentHash(),
            message.ipHash(),
            message.status(),
            Timestamp.from(message.createdAt())
        );

        String insertOutboxSql = """
            INSERT INTO app.outbox_event (
                aggregate, event_type, payload, created_at
            ) VALUES (?, ?, ?::jsonb, ?)
            """;

        jdbcTemplate.update(
            insertOutboxSql,
            "contact",
            "CONTACT_RECEIVED",
            eventPayload,
            Timestamp.from(message.createdAt())
        );
    }

    @Override
    @Transactional
    public boolean markDeliveredIfQueued(UUID messageId) {
        String sql = "UPDATE app.contact_message SET status = 'delivered' WHERE id = ? AND status = 'queued'";
        int updated = jdbcTemplate.update(sql, messageId);
        return updated > 0;
    }

    @Override
    public java.util.List<ContactMessage> findQueuedMessagesOlderThan(int seconds) {
        String sql = """
            SELECT id, type, name, email, message, details, content_hash, ip_hash, status, created_at
            FROM app.contact_message
            WHERE status = 'queued' AND created_at < NOW() - (? * INTERVAL '1 second')
            ORDER BY created_at ASC
            LIMIT 10
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            java.util.Map<String, Object> details = java.util.Map.of();
            try {
                String dJson = rs.getString("details");
                if (dJson != null && !dJson.isBlank()) {
                    details = objectMapper.readValue(dJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                }
            } catch (Exception ignored) {}
            return new ContactMessage(
                rs.getObject("id", UUID.class),
                dev.priyanshu.api.contact.domain.ContactType.fromString(rs.getString("type")),
                rs.getString("name"),
                rs.getString("email"),
                rs.getString("message"),
                details,
                rs.getString("content_hash"),
                rs.getString("ip_hash"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant()
            );
        }, seconds);
    }
}
