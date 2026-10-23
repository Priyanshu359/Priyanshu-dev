package dev.priyanshu.api.ask.adapter.out.persistence;

import dev.priyanshu.api.ask.application.port.SessionPort;
import dev.priyanshu.api.ask.domain.AskSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PostgresSessionAdapter implements SessionPort {

    private static final Logger log = LoggerFactory.getLogger(PostgresSessionAdapter.class);

    private final JdbcTemplate jdbcTemplate;
    private final Map<String, AskSession> localSessions = new ConcurrentHashMap<>();

    public PostgresSessionAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public AskSession getAndIncrementSession(String sessionId) {
        String sid = (sessionId != null && !sessionId.isBlank()) ? sessionId : "sess_" + System.currentTimeMillis();

        try {
            String sql = """
                INSERT INTO app.ask_session (id, question_count, created_at, last_seen_at)
                VALUES (?, 1, now(), now())
                ON CONFLICT (id) DO UPDATE
                SET question_count = app.ask_session.question_count + 1,
                    last_seen_at = now()
                RETURNING id, question_count, created_at, last_seen_at
                """;

            AskSession session = jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> new AskSession(
                    rs.getString("id"),
                    rs.getInt("question_count"),
                    rs.getTimestamp("created_at").toInstant(),
                    rs.getTimestamp("last_seen_at").toInstant()
                ),
                sid
            );

            if (session != null) return session;
        } catch (Exception e) {
            log.trace("AskSession db query fallback: {}", e.getMessage());
        }

        // In-memory fallback
        return localSessions.compute(sid, (k, existing) -> {
            Instant now = Instant.now();
            if (existing == null) {
                return new AskSession(k, 1, now, now);
            } else {
                return new AskSession(k, existing.questionCount() + 1, existing.createdAt(), now);
            }
        });
    }
}
