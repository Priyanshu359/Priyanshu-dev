package dev.priyanshu.api.contact.application;

import dev.priyanshu.api.contact.domain.ContactMessage;

import java.util.Optional;
import java.util.UUID;

public interface ContactPersistencePort {
    Optional<UUID> findIdByContentHash(String contentHash);
    void saveMessageAndOutboxEvent(ContactMessage message, String eventPayload);
    boolean markDeliveredIfQueued(UUID messageId);
}
