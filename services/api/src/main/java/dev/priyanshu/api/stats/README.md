# Stats Module

## Responsibilities
The `stats` module tracks live site telemetry counters:
1. **Telemetry Metrics**:
   - `requests_served`: Total HTTP requests processed across the platform.
   - `cache_hits`: Requests answered from cache without model or DB invocation.
   - `rate_limits_triggered`: Requests intercepted by the distributed rate limiter.
2. **Persistent Fast Storage**: Counters reside in atomic Redis keys (`stats:*`).
3. **Endpoint**: `GET /stats` returns JSON consumed directly by the portfolio site's footer.
