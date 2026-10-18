# Ask Module (`dev.priyanshu.api.ask`)

The `ask` module powers the interactive Ask pipeline behind the **Home Hero** (`/`) and the **AI Architecture Walkthrough** (`/ai`).

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      POST /ask                         │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                         ┌─────────────────────▼────────────────────┐
                         │ Stage 1: API Gateway & Rate Limiter      │
                         └─────────────────────┬────────────────────┘
                                               │
                         ┌─────────────────────▼────────────────────┐
                         │ Stage 2: Embedding & Redis Semantic Cache│
                         └─────────────────────┬────────────────────┘
                                               │
                         ┌─────────────────────▼────────────────────┐
                         │ Stage 3: Postgres Session Orchestration  │
                         └─────────────────────┬────────────────────┘
                                               │
                         ┌─────────────────────▼────────────────────┐
                         │ Stage 4: pgvector HNSW Cosine Retrieval  │
                         └─────────────────────┬────────────────────┘
                                               │
                         ┌─────────────────────▼────────────────────┐
                         │ Stage 5: Resilience4j LLM Gateway        │
                         └─────────────────────┬────────────────────┘
                                               │
                         ┌─────────────────────▼────────────────────┐
                         │ Stage 6: SSE Token & Telemetry Stream    │
                         └─────────────────────┬────────────────────┘
                                               │
                         ┌─────────────────────▼────────────────────┐
                         │ Stage 7: Outbox & Redis Stream Usage     │
                         └─────────────────────┬────────────────────┘
                                               │
                         ┌─────────────────────▼────────────────────┐
                         │ Stage 8: Idempotent Ingestion Status     │
                         └─────────────────────┬────────────────────┘
                                               │
                         ┌─────────────────────▼────────────────────┐
                         │ Stage 9: Architecture Box Count (15 + 1) │
                         └──────────────────────────────────────────┘
```

---

## Design Philosophy: Real Backend, Zero Generative Cost

A core principle of this project is that **in every AI product, the backend is the real hero**:
- **16 boxes** make up the architecture; **only 1** is the model itself.
- On the `/ai` page, visitors inspect live telemetry across all step cards without generating paid conversational text.
- On the `/` Home hero, preset questions stream verified, curated answers from `content/ask/presets.yaml`.
- The pipeline executes real local sentence embeddings (384-dim, `all-MiniLM-L6-v2`), real Redis cache checks, real Postgres pgvector cosine distance lookups (`1 - <=>`), real session counter updates, and real transactional outbox events to Redis Streams (`app:events`).

---

## Hexagonal Ports & Adapters Architecture

The module strictly follows Ports and Adapters:

```
dev.priyanshu.api.ask/
├── application/
│   ├── AskPipelineService.java       # Coordinates the 9 pipeline stages
│   ├── KnowledgeSyncService.java     # Startup chunking & embedding of markdown docs
│   ├── LlmGatewayService.java        # Resilience4j Timeout, Retry & CircuitBreaker
│   ├── UsageStreamConsumer.java      # Background consumer writing app.usage_event
│   └── port/
│       ├── AnswerProvider.java       # Inbound SPI for model generation
│       ├── EmbeddingPort.java        # Inbound SPI for text vectorization
│       ├── RetrievalPort.java        # Outbound SPI for pgvector lookups
│       ├── SemanticCachePort.java    # Outbound SPI for Redis vector caching
│       ├── SessionPort.java          # Outbound SPI for session state
│       └── UsageEventOutboxPort.java # Outbound SPI for event streaming
├── adapter/
│   ├── in/web/
│   │   └── AskController.java        # POST /ask and GET /ask (text/event-stream)
│   └── out/
│       ├── cache/RedisSemanticCacheAdapter.java
│       ├── db/
│       │   ├── PostgresRetrievalAdapter.java
│       │   └── PostgresSessionAdapter.java
│       ├── embedding/LocalMiniLmEmbeddingAdapter.java
│       ├── messaging/OutboxUsageAdapter.java
│       └── model/
│           ├── NoModelAnswerProvider.java    # Default: zero cost, architecture inspection
│           └── PresetAnswerProvider.java     # Home hero: presets.yaml answers
└── domain/
    ├── AskSession.java
    ├── KnowledgeChunkEntity.java
    ├── ScoredChunk.java
    ├── StageEvent.java
    └── UsageEvent.java
```

---

## How to Plug In a Real Generative Model Later

Because the model interaction is isolated behind the `AnswerProvider` port, connecting a live LLM requires **zero changes** to the pipeline coordinator, rate limiter, semantic cache, vector retriever, session store, or SSE stream.

### Step 1: Implement `AnswerProvider`

Create a new adapter in `adapter/out/model/`:

```java
package dev.priyanshu.api.ask.adapter.out.model;

import dev.priyanshu.api.ask.application.port.AnswerProvider;
import dev.priyanshu.api.ask.domain.ScoredChunk;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Component
@ConditionalOnProperty(name = "priyanshu.ask.provider", havingValue = "openai")
public class OpenAiAnswerProvider implements AnswerProvider {

    private final String apiKey;
    private final String model;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public OpenAiAnswerProvider(
            @org.springframework.beans.factory.annotation.Value("${priyanshu.ask.openai.api-key:}") String apiKey,
            @org.springframework.beans.factory.annotation.Value("${priyanshu.ask.openai.model:gpt-4o-mini}") String model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public AnswerResult generateAnswer(
            String question,
            String assembledPrompt,
            List<ScoredChunk> retrievedChunks,
            boolean isHomePreset) {

        // For Home presets, PresetAnswerProvider still takes precedence if desired:
        if (isHomePreset) {
            return new AnswerResult("Preset Answer", "PresetAnswerProvider", true, false);
        }

        try {
            // Construct request payload to OpenAI Chat Completions API
            String payload = """
                {
                  "model": "%s",
                  "messages": [
                    {"role": "user", "content": %s}
                  ],
                  "temperature": 0.2
                }
                """.formatted(model, escapeJson(assembledPrompt));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();

            // Extract completion text from response JSON
            String answer = parseContentFromResponse(responseBody);
            return new AnswerResult(answer, "OpenAI (" + model + ")", false, false);
        } catch (Exception e) {
            throw new RuntimeException("OpenAI call failed", e);
        }
    }

    @Override
    public String getProviderName() {
        return "OpenAI (" + model + ")";
    }

    private String escapeJson(String raw) {
        return "\"" + raw.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }

    private String parseContentFromResponse(String json) {
        // Parse "choices[0].message.content"
        int idx = json.indexOf("\"content\":");
        if (idx == -1) return "Unable to parse response";
        int start = json.indexOf("\"", idx + 10) + 1;
        int end = json.indexOf("\"", start);
        return json.substring(start, end).replace("\\n", "\n").replace("\\\"", "\"");
    }
}
```

### Step 2: Configure `application.yml`

Set the provider property in `services/api/src/main/resources/application.yml`:

```yaml
priyanshu:
  ask:
    provider: openai
    semantic-cache-similarity-threshold: 0.90
    openai:
      api-key: ${OPENAI_API_KEY}
      model: gpt-4o-mini
```

### Step 3: Run the Pipeline

Run the application:
```bash
OPENAI_API_KEY=sk-... ./mvnw spring-boot:run
```

When a request arrives at `POST /ask`:
1. **Rate Limiter** checks the IP token bucket.
2. **Semantic Cache** checks Redis for existing questions (similarity >= 0.90).
3. **Session Store** tracks user query history in Postgres.
4. **Vector Search** retrieves top-3 grounded context chunks via pgvector.
5. **LLM Gateway** executes `OpenAiAnswerProvider` under Resilience4j circuit breaker, timeout (10s), and retry rules.
6. **SSE Stream** streams tokens directly back to the client.
7. **Transactional Outbox** publishes token counts and latency metrics to Redis Stream `app:events`.
8. **Consumer** asynchronously updates `app.usage_event`.
