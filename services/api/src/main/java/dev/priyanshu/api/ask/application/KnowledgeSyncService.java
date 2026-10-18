package dev.priyanshu.api.ask.application;

import dev.priyanshu.api.ask.application.port.EmbeddingPort;
import dev.priyanshu.api.ask.application.port.RetrievalPort;
import dev.priyanshu.api.ask.domain.KnowledgeChunkEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service
public class KnowledgeSyncService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeSyncService.class);
    private static final Pattern FRONTMATTER_PATTERN = Pattern.compile("^---\\s*\\n(.*?)\\n---\\s*\\n(.*)$", Pattern.DOTALL);
    private static final Pattern TITLE_PATTERN = Pattern.compile("title:\\s*\"?([^\"]+)\"?");

    private final EmbeddingPort embeddingPort;
    private final RetrievalPort retrievalPort;
    private final String contentDir;

    public KnowledgeSyncService(
            EmbeddingPort embeddingPort,
            RetrievalPort retrievalPort,
            @Value("${priyanshu.content.dir:../../content}") String contentDir) {
        this.embeddingPort = embeddingPort;
        this.retrievalPort = retrievalPort;
        this.contentDir = contentDir;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncKnowledgeOnStartup() {
        Path knowledgePath = resolveKnowledgeDirectory();
        if (knowledgePath == null || !Files.exists(knowledgePath)) {
            log.warn("Knowledge directory not found. Skipping embedding indexing.");
            return;
        }

        try (Stream<Path> files = Files.list(knowledgePath)) {
            List<Path> markdownFiles = files
                .filter(p -> p.toString().endsWith(".md"))
                .toList();

            int indexed = 0;
            for (Path file : markdownFiles) {
                if (indexFile(file)) {
                    indexed++;
                }
            }
            log.info("Knowledge sync complete: {} chunks embedded and upserted (dimension: {})",
                indexed, embeddingPort.getDimension());
        } catch (IOException e) {
            log.error("Failed to read knowledge directory: {}", e.getMessage());
        }
    }

    private boolean indexFile(Path file) {
        try {
            String raw = Files.readString(file, StandardCharsets.UTF_8);
            String title = file.getFileName().toString().replace(".md", "");
            String content = raw;

            Matcher m = FRONTMATTER_PATTERN.matcher(raw);
            if (m.find()) {
                String frontmatter = m.group(1);
                content = m.group(2).trim();
                Matcher titleMatcher = TITLE_PATTERN.matcher(frontmatter);
                if (titleMatcher.find()) {
                    title = titleMatcher.group(1).trim();
                }
            }

            String contentHash = sha256(raw);
            float[] vector = embeddingPort.embed(title + " " + content);

            KnowledgeChunkEntity chunk = new KnowledgeChunkEntity(
                null,
                file.getFileName().toString(),
                title,
                content,
                contentHash,
                vector
            );

            retrievalPort.saveOrUpdateChunk(chunk);
            return true;
        } catch (Exception e) {
            log.error("Failed indexing file {}: {}", file, e.getMessage());
            return false;
        }
    }

    private Path resolveKnowledgeDirectory() {
        List<Path> candidates = List.of(
            Path.of(contentDir, "ask/knowledge"),
            Path.of("content/ask/knowledge"),
            Path.of("../../content/ask/knowledge"),
            Path.of("../../../content/ask/knowledge")
        );

        for (Path p : candidates) {
            if (Files.exists(p)) return p;
        }
        return null;
    }

    private String sha256(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return Integer.toHexString(text.hashCode());
        }
    }
}
