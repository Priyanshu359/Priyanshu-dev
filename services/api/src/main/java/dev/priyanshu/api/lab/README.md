# Lab Module

The `lab` module houses interactive engineering experiments exposed on the portfolio site:

1. **Rate Limiting Lab (`/lab/limited`)**:
   - Backed by an atomic Redis Lua token bucket (`RateLimitLabService`).
   - Configured with `capacity: 5` and refill rate `1 token / 2s` (matching `content/labs/rate-limiting/lab.yaml`).
   - Emits real response headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`, `X-Response-Time`).

2. **Database Lab (`/lab/db/*`)**:
   - `POST /lab/db/explain`: Queries pre-indexed tables (`lab.orders_noidx`, `lab.orders_user_idx`, `lab.orders_composite_idx`) and executes `EXPLAIN (ANALYZE, FORMAT JSON)` with strict 3-second statement timeouts.
   - `GET /lab/db/courses?mode=naive|fetch`: Compares naive N+1 lazy queries against a single `JOIN FETCH` query, exposing the real `X-Query-Count` and query statements.
   - `POST /lab/db/withdraw-race`: Runs concurrent withdrawals against an ephemeral wallet demonstrating lost updates under naive mode, pessimistic row locking (`SELECT ... FOR UPDATE`), and optimistic concurrency control (`@Version`).
   - `LabCleanupScheduler`: Purges ephemeral wallets older than 1 hour.
