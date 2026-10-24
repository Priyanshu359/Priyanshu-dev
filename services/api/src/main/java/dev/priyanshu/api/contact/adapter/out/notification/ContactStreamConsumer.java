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

    // Sweeper checks PostgreSQL every 2 minutes for any lingering queued messages.
    // Zero Redis commands consumed while idle.
    @Scheduled(fixedDelay = 120000)
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
