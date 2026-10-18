# Contact Module

## Responsibilities
The `contact` module handles inbound hiring and client communication:
1. **Unified Ingestion**: `POST /hire-me` serves both the website's interactive contact form and direct CLI/curl API requests.
2. **Deduplication**: Computes a deterministic `content_hash = SHA-256(type:email:message)` to eliminate duplicate submissions.
3. **Abuse Protection**: Implements a strict per-IP rate limit of 3 submissions per hour backed by Redis.
4. **Transactional Outbox**: Persists `app.contact_message` and an outbox event `CONTACT_RECEIVED` to `app.outbox_event` in a single atomic database transaction.
5. **Asynchronous Notification**: A Redis Stream listener processes `CONTACT_RECEIVED` events and delivers email notifications (with log-only mode for development).
6. **Self-Documenting Terminal Endpoint**: `GET /hire-me` returns JSON instructions and curl payload examples.
