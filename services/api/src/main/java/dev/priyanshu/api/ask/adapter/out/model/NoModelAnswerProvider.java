package dev.priyanshu.api.ask.adapter.out.model;

import dev.priyanshu.api.ask.application.port.AnswerProvider;
import dev.priyanshu.api.ask.domain.ScoredChunk;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Primary
public class NoModelAnswerProvider implements AnswerProvider {

    private final PresetAnswerProvider presetProvider;

    public NoModelAnswerProvider(PresetAnswerProvider presetProvider) {
        this.presetProvider = presetProvider;
    }

    @Override
    public AnswerResult generateAnswer(String question, String prompt, List<ScoredChunk> context, boolean isHomePreset) {
        if (isHomePreset) {
            AnswerResult preset = presetProvider.generateAnswer(question, prompt, context, true);
            if (!preset.modelNotConnected()) {
                return preset;
            }
        }

        // Return model not connected with null answer so AI page displays 0 answer text
        return new AnswerResult(
            null,
            "NoModelAnswerProvider (zero-cost architecture sandbox)",
            false,
            true
        );
    }
}
