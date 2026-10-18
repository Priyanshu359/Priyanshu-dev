package dev.priyanshu.api.contact.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.contact.domain.ContactMessage;
import dev.priyanshu.api.contact.domain.ContactType;
import dev.priyanshu.api.platform.PlatformProperties;
import dev.priyanshu.api.platform.domain.RateLimitExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class ContactUseCase {

    private static final Logger log = LoggerFactory.getLogger(ContactUseCase.class);

    private final ContactPersistencePort persistencePort;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final PlatformProperties properties;

    @org.springframework.beans.factory.annotation.Value("${priyanshu.turnstile.secret-key:}")
    private String turnstileSecretKey;

    public ContactUseCase(ContactPersistencePort persistencePort,
                          StringRedisTemplate redisTemplate,
                          ObjectMapper objectMapper,
                          PlatformProperties properties) {
        this.persistencePort = persistencePort;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    public ContactResponse submitContact(ContactRequest request, String clientIp) {
        // 0. Verify Turnstile token if provided (web form path)
        if (turnstileSecretKey != null && !turnstileSecretKey.isBlank()
                && request.turnstileToken() != null && !request.turnstileToken().isBlank()) {
            verifyTurnstile(request.turnstileToken(), clientIp);
        }

        ContactType type = ContactType.fromString(request.type());
        String ipHash = ContactMessage.computeIpHash(clientIp);

        // 1. Strict per-IP rate limit: 3 submissions per hour
        enforceContactRateLimit(ipHash);

        // 2. Compute deterministic content hash for deduplication
        String contentHash = ContactMessage.computeContentHash(type, request.email(), request.message());
        Optional<UUID> existingId = persistencePort.findIdByContentHash(contentHash);
        if (existingId.isPresent()) {
            log.info("Duplicate contact message received (hash: {}). Returning existing ID.", contentHash);
            return new ContactResponse(existingId.get(), "accepted", "Message already received and queued.");
        }

        // 3. Construct new ContactMessage and Outbox Event
        UUID messageId = UUID.randomUUID();
        Instant now = Instant.now();
        ContactMessage message = new ContactMessage(
            messageId,
            type,
            request.name().trim(),
            request.email().trim().toLowerCase(),
            request.message().trim(),
            request.details(),
            contentHash,
            ipHash,
            "queued",
            now
        );

        String eventPayload;
        try {
            eventPayload = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize contact message event", e);
        }

        // 4. Save message and outbox event in one transaction
        persistencePort.saveMessageAndOutboxEvent(message, eventPayload);

        log.info("Saved contact message {} [{}] from {}", messageId, type.getValue(), request.email());
        return new ContactResponse(messageId, "queued", "Thanks — your message is in.");
    }

    private void enforceContactRateLimit(String ipHash) {
        long limit = properties.getRateLimit().getContact().getHourlyIpLimit();
        String redisKey = "ratelimit:contact:" + ipHash;

        try {
            Long count = redisTemplate.opsForValue().increment(redisKey);
            if (count != null && count == 1) {
                redisTemplate.expire(redisKey, Duration.ofHours(1));
            }

            if (count != null && count > limit) {
                Long ttlSeconds = redisTemplate.getExpire(redisKey);
                long retryAfter = (ttlSeconds != null && ttlSeconds > 0) ? ttlSeconds : 3600;
                throw new RateLimitExceededException(
                    "Contact form rate limit exceeded (maximum " + limit + " messages per hour).",
                    retryAfter
                );
            }
        } catch (RateLimitExceededException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis unavailable for contact rate limit, allowing request: {}", e.getMessage());
        }
    }

    private void verifyTurnstile(String token, String clientIp) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String formData = "secret=" + java.net.URLEncoder.encode(turnstileSecretKey, java.nio.charset.StandardCharsets.UTF_8)
                    + "&response=" + java.net.URLEncoder.encode(token, java.nio.charset.StandardCharsets.UTF_8)
                    + "&remoteip=" + java.net.URLEncoder.encode(clientIp, java.nio.charset.StandardCharsets.UTF_8);

            java.net.http.HttpRequest httpRequest = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://challenges.cloudflare.com/turnstile/v0/siteverify"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(formData))
                    .build();

            java.net.http.HttpResponse<String> response = client.send(httpRequest, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && !response.body().contains("\"success\":true")) {
                log.warn("Cloudflare Turnstile token verification failed: {}", response.body());
                throw new IllegalArgumentException("Invalid Turnstile verification token");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Turnstile verification check warning: {}", e.getMessage());
        }
    }
}
