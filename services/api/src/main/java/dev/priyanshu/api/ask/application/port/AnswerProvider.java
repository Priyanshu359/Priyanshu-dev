package dev.priyanshu.api.ask.application.port;

import dev.priyanshu.api.ask.domain.ScoredChunk;

import java.util.List;

public interface AnswerProvider {
    record AnswerResult(
        String answer,
        String providerName,
        boolean isPreset,
        boolean modelNotConnected
    ) {}

    AnswerResult generateAnswer(String question, String prompt, List<ScoredChunk> context, boolean isHomePreset);
}
