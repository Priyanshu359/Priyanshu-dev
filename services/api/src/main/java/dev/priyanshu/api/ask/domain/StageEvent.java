package dev.priyanshu.api.ask.domain;

import java.util.List;
import java.util.Map;

public record StageEvent(
    String type,
    int stageNumber,
    String stageName,
    long durationMs,
    Map<String, Object> data,
    List<String> boxesTouched,
    String tokenChunk
) {
    public static StageEvent started(int num, String name, List<String> boxes) {
        return new StageEvent("stage.started", num, name, 0, Map.of(), boxes, null);
    }

    public static StageEvent done(int num, String name, long durationMs, Map<String, Object> data, List<String> boxes) {
        return new StageEvent("stage.done", num, name, durationMs, data, boxes, null);
    }

    public static StageEvent streamToken(String token) {
        return new StageEvent("stream.token", 6, "stream", 0, Map.of(), List.of("sse", "client"), token);
    }

    public static StageEvent completed(long totalDurationMs, Map<String, Object> summary) {
        return new StageEvent("pipeline.done", 9, "complete", totalDurationMs, summary, List.of(), null);
    }
}
