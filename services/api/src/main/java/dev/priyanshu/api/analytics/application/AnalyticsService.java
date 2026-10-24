package dev.priyanshu.api.analytics.application;

import dev.priyanshu.api.analytics.adapter.out.persistence.AnalyticsPersistenceAdapter;
import dev.priyanshu.api.analytics.domain.AnalyticsEvent;
import dev.priyanshu.api.analytics.domain.AnalyticsOverview;
import dev.priyanshu.api.platform.PlatformProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    private final AnalyticsPersistenceAdapter persistenceAdapter;
    private final PlatformProperties properties;

    public AnalyticsService(AnalyticsPersistenceAdapter persistenceAdapter, PlatformProperties properties) {
        this.persistenceAdapter = persistenceAdapter;
        this.properties = properties;
    }

    public void recordEvent(
        String sessionId,
        String eventType,
        String eventName,
        String path,
        String referrer,
        String userAgent,
        String clientIp,
        Map<String, Object> metadata
    ) {
        String cleanSession = (sessionId != null && !sessionId.isBlank()) ? sessionId.trim() : UUID.randomUUID().toString();
        String cleanType = (eventType != null && !eventType.isBlank()) ? eventType.trim().toLowerCase() : "page_view";
        String cleanPath = (path != null && !path.isBlank()) ? path.trim() : "/";
        String cleanName = (eventName != null && !eventName.isBlank()) ? eventName.trim() : cleanType + "_" + cleanPath;
        String cleanReferrer = sanitizeReferrer(referrer);
        String ipHash = AnalyticsEvent.computeIpHash(clientIp);

        String device = detectDevice(userAgent);
        String browser = detectBrowser(userAgent);
        String os = detectOs(userAgent);

        AnalyticsEvent event = new AnalyticsEvent(
            null,
            cleanSession,
            cleanType,
            cleanName,
            cleanPath,
            cleanReferrer,
            device,
            browser,
            os,
            ipHash,
            metadata,
            Instant.now()
        );

        // Async non-blocking write to PostgreSQL
        CompletableFuture.runAsync(() -> {
            try {
                persistenceAdapter.saveEvent(event);
            } catch (Exception ex) {
                log.trace("Error recording analytics event: {}", ex.getMessage());
            }
        });
    }

    public boolean isAuthorized(String providedKey) {
        if (providedKey == null || providedKey.isBlank()) {
            return false;
        }
        String configuredKey = properties.getAnalytics().getAdminKey();
        return configuredKey != null && !configuredKey.isBlank() && configuredKey.trim().equals(providedKey.trim());
    }

    public AnalyticsOverview getOverview(String period) {
        return persistenceAdapter.getOverview(period);
    }

    private String sanitizeReferrer(String referrer) {
        if (referrer == null || referrer.isBlank()) return "Direct / Bookmark";
        try {
            java.net.URI uri = java.net.URI.create(referrer);
            String host = uri.getHost();
            if (host == null || host.isBlank()) return "Direct / Bookmark";
            if (host.contains("google.")) return "Google Search";
            if (host.contains("linkedin.")) return "LinkedIn";
            if (host.contains("github.")) return "GitHub";
            if (host.contains("twitter.") || host.contains("x.com")) return "X / Twitter";
            if (host.contains("reddit.")) return "Reddit";
            if (host.contains("priyanshusinha.dev") || host.contains("priyanshu.dev") || host.contains("localhost")) {
                return "Internal Navigation";
            }
            return host.replaceFirst("^www\\.", "");
        } catch (Exception e) {
            return "Other External";
        }
    }

    private String detectDevice(String ua) {
        if (ua == null) return "desktop";
        String lower = ua.toLowerCase();
        if (lower.contains("mobile") || lower.contains("android") || lower.contains("iphone")) return "mobile";
        if (lower.contains("ipad") || lower.contains("tablet")) return "tablet";
        return "desktop";
    }

    private String detectBrowser(String ua) {
        if (ua == null) return "Other";
        String lower = ua.toLowerCase();
        if (lower.contains("edg/")) return "Edge";
        if (lower.contains("chrome/") && !lower.contains("edg/")) return "Chrome";
        if (lower.contains("safari/") && !lower.contains("chrome/")) return "Safari";
        if (lower.contains("firefox/")) return "Firefox";
        if (lower.contains("brave")) return "Brave";
        return "Other";
    }

    private String detectOs(String ua) {
        if (ua == null) return "Other";
        String lower = ua.toLowerCase();
        if (lower.contains("mac os") || lower.contains("macintosh")) return "macOS";
        if (lower.contains("windows")) return "Windows";
        if (lower.contains("linux") && !lower.contains("android")) return "Linux";
        if (lower.contains("android")) return "Android";
        if (lower.contains("iphone") || lower.contains("ipad") || lower.contains("ios")) return "iOS";
        return "Other";
    }
}
