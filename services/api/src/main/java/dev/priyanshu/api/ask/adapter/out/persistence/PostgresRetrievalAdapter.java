package dev.priyanshu.api.ask.adapter.out.persistence;

import dev.priyanshu.api.ask.application.port.RetrievalPort;
import dev.priyanshu.api.ask.domain.KnowledgeChunkEntity;
import dev.priyanshu.api.ask.domain.ScoredChunk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PostgresRetrievalAdapter implements RetrievalPort {

    private static final Logger log = LoggerFactory.getLogger(PostgresRetrievalAdapter.class);

    private final JdbcTemplate jdbcTemplate;
    private final Map<String, KnowledgeChunkEntity> inMemoryStore = new ConcurrentHashMap<>();

    public PostgresRetrievalAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<ScoredChunk> retrieveTopK(float[] queryEmbedding, int k) {
        String vectorString = formatVector(queryEmbedding);

        try {
            // Try pgvector cosine distance query
            String sql = """
                SELECT id, source, title, content, (1 - (embedding <=> ?::vector)) AS score
                FROM app.knowledge_chunk
                ORDER BY embedding <=> ?::vector ASC
                LIMIT ?
                """;

            List<ScoredChunk> results = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new ScoredChunk(
                    rs.getLong("id"),
                    rs.getString("source"),
                    rs.getString("title"),
                    rs.getString("content"),
                    Math.round(rs.getDouble("score") * 100.0) / 100.0
                ),
                vectorString,
                vectorString,
                k
            );

            if (!results.isEmpty()) {
                return results;
            }
        } catch (Exception e) {
            log.trace("pgvector retrieval fallback: {}", e.getMessage());
        }

        // In-memory fallback
        return retrieveTopKInMemory(queryEmbedding, k);
    }

    @Override
    public void saveOrUpdateChunk(KnowledgeChunkEntity chunk) {
        inMemoryStore.put(chunk.contentHash(), chunk);

        try {
            String vectorString = formatVector(chunk.embedding());
            String sql = """
                INSERT INTO app.knowledge_chunk (source, title, content, content_hash, embedding, updated_at)
                VALUES (?, ?, ?, ?, ?::vector, now())
                ON CONFLICT (content_hash) DO UPDATE
                SET source = EXCLUDED.source,
                    title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    embedding = EXCLUDED.embedding,
                    updated_at = now()
                """;
            jdbcTemplate.update(sql, chunk.source(), chunk.title(), chunk.content(), chunk.contentHash(), vectorString);
        } catch (Exception e) {
            log.trace("Postgres knowledge chunk upsert fallback: {}", e.getMessage());
        }
    }

    @Override
    public long countChunks() {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM app.knowledge_chunk", Long.class);
            if (count != null && count > 0) return count;
        } catch (Exception ignored) {}
        return inMemoryStore.size();
    }

    private List<ScoredChunk> retrieveTopKInMemory(float[] queryEmbedding, int k) {
        List<ScoredChunk> scored = new ArrayList<>();
        long id = 1;
        for (KnowledgeChunkEntity entity : inMemoryStore.values()) {
            double sim = cosineSimilarity(queryEmbedding, entity.embedding());
            scored.add(new ScoredChunk(
                id++,
                entity.source(),
                entity.title(),
                entity.content(),
                Math.round(sim * 100.0) / 100.0
            ));
        }

        scored.sort(Comparator.comparingDouble(ScoredChunk::score).reversed());
        return scored.stream().limit(k).toList();
    }

    private String formatVector(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length) return 0.0;
        double dot = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
        }
        return dot;
    }
}
