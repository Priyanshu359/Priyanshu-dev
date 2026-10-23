package dev.priyanshu.api.ask.adapter.out.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import dev.priyanshu.api.ask.application.port.AnswerProvider;
import dev.priyanshu.api.ask.domain.ScoredChunk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class PresetAnswerProvider implements AnswerProvider {

    private static final Logger log = LoggerFactory.getLogger(PresetAnswerProvider.class);

    private final List<PresetEntry> presets = new ArrayList<>();

    public PresetAnswerProvider(@Value("${priyanshu.content.dir:../../content}") String contentDir) {
        loadPresets(contentDir);
    }

    @Override
    public AnswerResult generateAnswer(String question, String prompt, List<ScoredChunk> context, boolean isHomePreset) {
        if (!isHomePreset || question == null || question.isBlank()) {
            return new AnswerResult(null, "PresetAnswerProvider", false, true);
        }

        String normalized = question.trim().toLowerCase(Locale.ROOT);
        for (PresetEntry preset : presets) {
            String pQ = preset.question().trim().toLowerCase(Locale.ROOT);
            if (pQ.equals(normalized) || normalized.contains(pQ) || pQ.contains(normalized)) {
                return new AnswerResult(preset.answer(), "PresetAnswerProvider (presets.yaml)", true, false);
            }
        }

        return new AnswerResult(null, "PresetAnswerProvider", false, true);
    }

    private void loadPresets(String contentDir) {
        List<Path> candidates = List.of(
            Path.of(contentDir, "ask/presets.yaml"),
            Path.of("content/ask/presets.yaml"),
            Path.of("../../content/ask/presets.yaml"),
            Path.of("../../../content/ask/presets.yaml")
        );

        for (Path p : candidates) {
            if (Files.exists(p)) {
                try {
                    ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
                    JsonNode root = mapper.readTree(p.toFile());
                    JsonNode presetsNode = root.get("presets");
                    if (presetsNode != null && presetsNode.isArray()) {
                        for (JsonNode item : presetsNode) {
                            String q = item.path("question").asText();
                            String a = item.path("answer").asText();
                            presets.add(new PresetEntry(q, a));
                        }
                    }
                    log.info("Loaded {} preset Q&As from {}", presets.size(), p);
                    return;
                } catch (Exception e) {
                    log.warn("Failed reading presets from {}: {}", p, e.getMessage());
                }
            }
        }

        // Hardcoded built-in fallback matching presets.yaml
        presets.add(new PresetEntry(
            "What does Priyanshu work on?",
            "Priyanshu is a backend engineer at StudyIQ. He owns 20+ Java/Spring Boot microservices and works on caching, Kafka pipelines and production reliability for high-traffic exam platforms."
        ));
        presets.add(new PresetEntry(
            "How does he handle traffic spikes?",
            "Redis caching on read-heavy paths, Kafka for async work, connection-pool tuning and Kubernetes autoscaling. You can try the same patterns live in the Lab."
        ));
        presets.add(new PresetEntry(
            "Has he built AI systems?",
            "Yes: a speech-to-text, LLM and text-to-speech pipeline for automating support calls, plus AI meeting insights. He designs them backend-first, with gateways, streaming, caching and fallbacks."
        ));
    }

    public record PresetEntry(String question, String answer) {}
}
