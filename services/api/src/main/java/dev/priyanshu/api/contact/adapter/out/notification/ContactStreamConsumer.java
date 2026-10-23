package dev.priyanshu.api.contact.adapter.out.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.contact.application.ContactPersistencePort;
import dev.priyanshu.api.contact.application.NotificationPort;
import dev.priyanshu.api.contact.domain.ContactMessage;
import dev.priyanshu.api.platform.PlatformProperties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class ContactStreamConsumer {

    private static final Logger log = LoggerFactory.getLogger(ContactStreamConsumer.class);
    private static final String OFFSET_KEY = "stream:offset:contact";
    private static final String NOTIF_SENT_PREFIX = "notif:sent:";

    private final StringRedisTemplate redisTemplate;
    private final NotificationPort notificationPort;
    private final ContactPersistencePort persistencePort;
    private final ObjectMapper objectMapper;
    private final PlatformProperties properties;
    private String lastOffset = "$";

    public ContactStreamConsumer(StringRedisTemplate redisTemplate,
                                 NotificationPort notificationPort,
                                 ContactPersistencePort persistencePort,
                                 ObjectMapper objectMapper,
                                 PlatformProperties properties) {
        this.redisTemplate = redisTemplate;
        this.notificationPort = notificationPort;
        this.persistencePort = persistencePort;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    @PostConstruct
    public void initOffset() {
        try {
            String saved = redisTemplate.opsForValue().get(OFFSET_KEY);
            if (saved != null && !saved.isBlank() && !"$".equals(saved)) {
                this.lastOffset = saved;
                log.info("Initialized ContactStreamConsumer offset from Redis: {}", this.lastOffset);
            } else {
                this.lastOffset = "0-0";
                log.info("ContactStreamConsumer offset initialized to 0-0 (reading all unread stream events)");
            }
        } catch (Exception e) {
            log.warn("Could not retrieve stream offset from Redis, using 0-0: {}", e.getMessage());
            this.lastOffset = "0-0";
        }
    }

    @Scheduled(fixedDelay = 2000)
    public void consumeContactEvents() {
        String streamKey = properties.getOutbox().getStreamName();
        try {
            List<MapRecord<String, Object, Object>> records = redisTemplate.opsForStream().read(
                StreamReadOptions.empty().count(10),
                StreamOffset.create(streamKey, org.springframework.data.redis.connection.stream.ReadOffset.from(lastOffset))
            );

            if (records == null || records.isEmpty()) {
                return;
            }

            log.info("ContactStreamConsumer received {} event(s) from stream: {}", records.size(), streamKey);

            for (MapRecord<String, Object, Object> record : records) {
                String recordId = record.getId().getValue();
                this.lastOffset = recordId;
                try {
                    redisTemplate.opsForValue().set(OFFSET_KEY, recordId);
                } catch (Exception ignored) {}

                Map<Object, Object> value = record.getValue();
                String eventType = (String) value.get("eventType");

                if ("CONTACT_RECEIVED".equalsIgnoreCase(eventType)) {
                    String payloadJson = (String) value.get("payload");
                    if (payloadJson != null) {
                        try {
                            ContactMessage message = objectMapper.readValue(payloadJson, ContactMessage.class);

                            // 1. Atomic DB lock: only send if status in Postgres is still 'queued'
                            boolean shouldDeliver = persistencePort.markDeliveredIfQueued(message.id());
                            if (!shouldDeliver) {
                                log.info("Contact message {} already marked as delivered, skipping duplicate.", message.id());
                                continue;
                            }

                            // 2. Redis duplicate check for 7 days
                            String dedupKey = NOTIF_SENT_PREFIX + message.id();
                            redisTemplate.opsForValue().set(dedupKey, "1", Duration.ofDays(7));

                            log.info("Contact notification dispatching for message {} [{}] from {}",
                                message.id(), message.type(), message.email());
                            notificationPort.sendNotification(message);
                        } catch (Exception ex) {
                            log.error("Failed to parse or notify contact event: {}", payloadJson, ex);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Contact stream consumer error: {}", ex.getMessage());
        }
    }

    @Scheduled(fixedDelay = 15000)
    public void sweepQueuedMessages() {
        try {
            List<ContactMessage> queued = persistencePort.findQueuedMessagesOlderThan(10);
            if (!queued.isEmpty()) {
                log.info("Sweeper found {} unhandled queued contact message(s) in database", queued.size());
            }
            for (ContactMessage msg : queued) {
                if (persistencePort.markDeliveredIfQueued(msg.id())) {
                    log.info("Delivering queued contact message via sweeper fallback: {} [{}] from {}",
                        msg.id(), msg.type(), msg.email());
                    notificationPort.sendNotification(msg);
                }
            }
        } catch (Exception e) {
            log.warn("Sweeper fallback exception: {}", e.getMessage());
        }
    }
}
