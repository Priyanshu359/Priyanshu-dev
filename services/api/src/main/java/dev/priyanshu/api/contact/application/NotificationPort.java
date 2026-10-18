package dev.priyanshu.api.contact.application;

import dev.priyanshu.api.contact.domain.ContactMessage;

public interface NotificationPort {
    void sendNotification(ContactMessage message);
}
