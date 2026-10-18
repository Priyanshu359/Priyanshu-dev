package dev.priyanshu.api.ask.application.port;

import dev.priyanshu.api.ask.domain.UsageEvent;

public interface UsageEventOutboxPort {
    void publishUsage(UsageEvent event);
}
