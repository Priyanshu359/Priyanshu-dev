# ADR 0004: Lab Isolation, Fixed-Index Strategies, and Ephemeral Execution

* **Status**: Accepted
* **Date**: 2026-10-18
* **Deciders**: Priyanshu Sinha

## Context & Problem Statement

The interactive Lab section of `priyanshu.dev` exposes real backend systems behaviors:
1. **Rate Limiting**: Draining a Redis token bucket to trigger live HTTP 429s.
2. **Database Query Plans**: Comparing query performance with different indexing strategies.
3. **The N+1 Problem**: Comparing naive lazy loading (51 queries) against eager `JOIN FETCH` (1 query).
4. **Race Conditions**: Demonstrating lost updates in concurrent withdrawals and comparing pessimistic row locks (`SELECT ... FOR UPDATE`) with optimistic version checks (`@Version`).

Allowing arbitrary public visitors to interact with live database tables presents critical safety and operational risks:
- Running dynamic DDL (`CREATE INDEX`, `DROP INDEX`) at runtime creates shared-state race conditions between concurrent visitors, locks tables, and degrades stability.
- Visitors running unconstrained queries could exhaust database connection pools or trigger long-running sequential scans.
- Concurrency experiments on shared wallet rows would cause interference between simultaneous visitors.

## Decision Drivers

* **Real Systems, Not Stubs**: Visitors must observe real SQL queries, real HTTP response headers, real `EXPLAIN ANALYZE` plans, and real thread interleaving in their browser Network tab.
* **Zero Interference**: Simultaneous users must never mutate each other's experiment state.
* **No Runtime DDL**: The schema structure must remain immutable during runtime.
* **Bounded Resource Usage**: Guardrails against connection starvation, CPU spikes, and database bloat on free-tier infrastructure.

## Decision Outcome

We decided on **isolated schemas, pre-indexed tables, ephemeral per-run entities, and strict statement timeouts**:

### 1. Schema Separation & Role Lockdown
- Lab tables reside exclusively in schema `lab`, completely segregated from production tables in schema `app`.
- All tables have Row Level Security (RLS) enabled.
- Lab endpoints execute with strict statement timeouts (e.g. `SET LOCAL statement_timeout = '3000ms'`) preventing denial of service via runaway queries.

### 2. Fixed-Index Strategy Tables (No Runtime DDL)
Rather than executing `CREATE INDEX` or `DROP INDEX` dynamically when a user tests an indexing option, the database pre-provisions three structurally identical tables in `lab`:
- `lab.orders_noidx`: Primary key only. Demonstrates sequential scans (`Seq Scan`) across large row sets.
- `lab.orders_user_idx`: Includes a single B-Tree index on `user_id`. Demonstrates bitmap index scans and filtering.
- `lab.orders_composite_idx`: Includes a composite index on `(user_id, created_at, status)`. Demonstrates index-only scans without sorting.

When a user selects an index strategy, the endpoint queries the corresponding pre-indexed table and executes `EXPLAIN (ANALYZE, FORMAT JSON)`.

### 3. Ephemeral Per-Run Concurrency Testing
For the concurrent withdrawal race condition experiment:
- Each experiment execution generates an isolated, ephemeral wallet row in `lab.wallet` with a unique ID and initial balance.
- Two asynchronous tasks are dispatched concurrently against that specific wallet ID.
- An automated scheduled cleanup job (`LabCleanupScheduler`) purges ephemeral wallets older than one hour:
  ```sql
  DELETE FROM lab.wallet WHERE created_at < now() - interval '1 hour';
  ```

### 4. Dedicated Rate Limiting
- `GET /lab/limited` uses an independent Redis token bucket namespace (`ratelimit:lab:limited:{ip}`) with settings matching `content/labs/rate-limiting/lab.yaml` (capacity 5, refills 1 token every 2s).
- Database lab endpoints (`/lab/db/*`) are protected by dedicated per-IP rate limiters preventing automated denial of service.

## Consequences

* **Positive**:
  - Zero shared-state mutation or cross-visitor interference.
  - No database locking caused by runtime DDL.
  - Safe, predictable execution timing with guaranteed timeouts.
  - Low storage overhead with automatic ephemeral record reaping.
* **Negative**:
  - Requires maintaining three identical order tables, mitigated by automated Flyway migrations.
