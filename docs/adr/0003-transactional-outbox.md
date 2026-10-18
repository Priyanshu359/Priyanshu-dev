# ADR 0003: Transactional Outbox Pattern with Redis Streams

* **Status**: Accepted
* **Date**: 2026-10-18
* **Deciders**: Priyanshu Sinha

## Context & Problem Statement

When an action occurs (such as a visitor submitting the contact form on `/hire-me`), the backend must perform two operations:
1. Persist the business state (`app.contact_message`) to the PostgreSQL database.
2. Trigger external asynchronous side-effects (e.g., dispatching an email notification, updating metrics, or streaming events).

Dual-writing to both PostgreSQL and an external message broker/SMTP server within an HTTP request boundary introduces dual-write inconsistencies:
- If the database commit succeeds but the external network call fails, the event is permanently lost.
- If the external network call succeeds but the database transaction rolls back, phantom side-effects are produced.
- Holding the HTTP request open while connecting to an external mail server spikes request latency and degrades thread pool throughput.

## Decision Drivers

* **Zero Event Loss (At-Least-Once Delivery)**: Guarantee that every valid contact message and telemetry event is reliably delivered.
* **Fast User Response (< 50ms)**: Return `202 Accepted` to the client immediately after the database commit, without waiting for network I/O to mail providers.
* **Simplicity**: Avoid heavyweight message brokers (like Kafka or RabbitMQ) for local portfolio hosting, while maintaining production distributed systems design.

## Decision Outcome

Chosen option: **Transactional Outbox Pattern** with **Redis Streams** as the transient event bus.

### Mechanics
1. **Atomic Write**:
   In a single local database transaction (`@Transactional`), the application writes:
   - The business entity to `app.contact_message`.
   - The corresponding domain event to `app.outbox_event` (`aggregate: 'contact'`, `event_type: 'CONTACT_RECEIVED'`, `payload: {...}`, `published_at: null`).
2. **Outbox Relay (`platform`)**:
   A scheduled background poller queries unpublished rows (`SELECT * FROM app.outbox_event WHERE published_at IS NULL ORDER BY id LIMIT 50 FOR UPDATE SKIP LOCKED`).
   It publishes each event to a Redis Stream (`app:events`) and marks `published_at = now()`.
3. **Consumer & Notification (`contact`)**:
   A Redis Stream listener consumes `app:events` within a consumer group (`group: contact-notifications`), processes the payload, and dispatches the notification via SMTP (or log adapter in dev).
   Idempotency is maintained via `request_id` / `content_hash`.

## Consequences

* **Positive**:
  - Guaranteed consistency: If the DB transaction rolls back, no outbox event is persisted. If it commits, the event is guaranteed to be picked up.
  - Client response time is decoupled from email delivery latency.
  - Survives Redis and SMTP outages: unprocessed events remain safely in `app.outbox_event` until downstream services recover.
* **Negative**:
  - Requires consumers to be idempotent (handled via deterministic message/content hashing).
  - Outbox poller adds small polling latency (default interval: 1 second).
