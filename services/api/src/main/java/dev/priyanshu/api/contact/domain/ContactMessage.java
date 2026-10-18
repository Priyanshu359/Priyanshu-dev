package dev.priyanshu.api.contact.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

public record ContactMessage(
    UUID id,
    ContactType type,
    String name,
    String email,
    String message,
    Map<String, Object> details,
    String contentHash,
    String ipHash,
    String status,
    Instant createdAt
) {
    public static String computeContentHash(ContactType type, String email, String message) {
        String raw = type.getValue() + ":" + email.trim().toLowerCase() + ":" + message.trim();
        return sha256(raw);
    }

    public static String computeIpHash(String ip) {
        if (ip == null || ip.isBlank()) return "unknown";
        return sha256("salt:priyanshu:" + ip.trim());
    }

    private static String sha256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
