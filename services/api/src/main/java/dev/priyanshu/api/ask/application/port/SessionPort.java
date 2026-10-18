package dev.priyanshu.api.ask.application.port;

import dev.priyanshu.api.ask.domain.AskSession;

public interface SessionPort {
    AskSession getAndIncrementSession(String sessionId);
}
