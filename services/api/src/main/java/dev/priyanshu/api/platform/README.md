# Platform Module

## Responsibilities
The `platform` module encapsulates cross-cutting infrastructure services:
1. **Global Rate Limiter**: Servlet filter backed by a Redis Lua script implementing a distributed token bucket algorithm (`X-RateLimit-Remaining`, `X-RateLimit-Limit`, and HTTP 429 with `Retry-After`).
2. **Response Telemetry**: Populates `X-Request-Id` and `X-Response-Time` on all outgoing responses.
3. **RFC 7807 Error Handling**: `GlobalExceptionHandler` formats all errors, validation failures, and exceptions into standard `application/problem+json` documents.
4. **CORS Configuration**: Binds frontend domain origins from `@ConfigurationProperties("priyanshu.cors")`.
5. **Transactional Outbox Relay**: Polls `app.outbox_event` for unpublished events, publishes them to Redis Stream `app:events`, and marks them published.
