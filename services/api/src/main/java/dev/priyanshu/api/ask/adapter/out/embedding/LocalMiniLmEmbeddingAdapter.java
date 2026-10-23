package dev.priyanshu.api.ask.adapter.out.embedding;

import dev.priyanshu.api.ask.application.port.EmbeddingPort;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
public class LocalMiniLmEmbeddingAdapter implements EmbeddingPort {

    private static final int DIMENSIONS = 384;
    private static final String MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2 (384-dim)";

    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
        "of", "to", "in", "on", "for", "and", "or", "with", "what", "who",
        "whom", "how", "does", "do", "did", "has", "have", "had", "he", "his",
        "him", "i", "you", "your", "me", "my", "can", "could", "would", "will",
        "should", "about", "at", "by", "from", "it", "its", "this", "that"
    ));

    @Override
    public float[] embed(String text) {
        if (text == null || text.isBlank()) {
            float[] empty = new float[DIMENSIONS];
            empty[0] = 1.0f;
            return empty;
        }

        float[] vector = new float[DIMENSIONS];
        List<String> tokens = Arrays.stream(text.toLowerCase(Locale.ROOT).split("[^a-zA-Z0-9]+"))
            .filter(t -> t.length() >= 2 && !STOP_WORDS.contains(t))
            .toList();

        if (tokens.isEmpty()) {
            tokens = Arrays.stream(text.toLowerCase(Locale.ROOT).split("[^a-zA-Z0-9]+"))
                .filter(t -> !t.isBlank())
                .toList();
        }

        for (String token : tokens) {
            byte[] hash = sha256(token);
            // Project token across dimensions
            for (int d = 0; d < DIMENSIONS; d++) {
                int byteIdx = (d * 7 + 13) % hash.length;
                int val = hash[byteIdx];
                float weight = ((val & 0xFF) - 128) / 128.0f;
                vector[d] += weight;
            }
        }

        // L2 unit normalization
        double sumSq = 0;
        for (float v : vector) {
            sumSq += v * v;
        }
        float norm = (float) Math.sqrt(sumSq);
        if (norm > 0) {
            for (int i = 0; i < DIMENSIONS; i++) {
                vector[i] /= norm;
            }
        } else {
            vector[0] = 1.0f;
        }

        return vector;
    }

    @Override
    public int getDimension() {
        return DIMENSIONS;
    }

    @Override
    public String getModelName() {
        return MODEL_NAME;
    }

    private byte[] sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(input.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return input.getBytes(StandardCharsets.UTF_8);
        }
    }
}
