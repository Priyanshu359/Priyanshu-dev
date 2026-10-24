package dev.priyanshu.api.analytics.domain;

import java.time.Instant;
import java.util.Map;

public record AnalyticsEvent(
    Long id,
    String sessionId,
    String eventType,
    String eventName,
    String path,
    String referrer,
    String device,
    String browser,
    String os,
    String ipHash,
    Map<String, Object> metadata,
    Instant createdAt
) {
    public static String computeIpHash(String ip) {
        if (ip == null || ip.isBlank()) return "unknown";
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(("salt:analytics:priyanshu:" + ip.trim()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash).substring(0, 16);
        } catch (Exception e) {
            return "unknown";
        }
    }
}
