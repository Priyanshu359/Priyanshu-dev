package dev.priyanshu.api.ask.adapter.in.web;

import dev.priyanshu.api.ask.application.AskPipelineService;
import dev.priyanshu.api.platform.adapter.in.web.RateLimitingFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
public class AskController {

    private static final Logger log = LoggerFactory.getLogger(AskController.class);

    private final AskPipelineService askPipelineService;

    public AskController(AskPipelineService askPipelineService) {
        this.askPipelineService = askPipelineService;
    }

    @PostMapping(value = "/ask", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter handleAskPost(
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request) {
        String question = body != null && body.get("q") != null ? String.valueOf(body.get("q")) : "";
        boolean isHomePreset = body != null && Boolean.TRUE.equals(body.get("isHomePreset"));
        String sessionId = body != null && body.get("sessionId") != null ? String.valueOf(body.get("sessionId")) : null;

        return streamPipeline(question, isHomePreset, sessionId, request);
    }

    @GetMapping(value = "/ask", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter handleAskGet(
            @RequestParam(name = "q", defaultValue = "What does Priyanshu work on?") String question,
            @RequestParam(name = "preset", defaultValue = "false") boolean isHomePreset,
            @RequestParam(name = "sessionId", required = false) String sessionId,
            HttpServletRequest request) {
        return streamPipeline(question, isHomePreset, sessionId, request);
    }

    private SseEmitter streamPipeline(
            String question,
            boolean isHomePreset,
            String sessionId,
            HttpServletRequest request) {
        String clientIp = RateLimitingFilter.extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        SseEmitter emitter = new SseEmitter(60_000L);

        CompletableFuture.runAsync(() -> {
            try {
                askPipelineService.runPipeline(
                    question,
                    clientIp,
                    userAgent,
                    sessionId,
                    isHomePreset,
                    event -> {
                        try {
                            emitter.send(SseEmitter.event()
                                .name(event.type())
                                .data(event));
                        } catch (Exception ex) {
                            log.trace("SSE client disconnected: {}", ex.getMessage());
                        }
                    }
                );
                emitter.complete();
            } catch (Exception e) {
                log.error("Ask pipeline execution failed: {}", e.getMessage(), e);
                try {
                    emitter.completeWithError(e);
                } catch (Exception ignored) {}
            }
        });

        return emitter;
    }
}
