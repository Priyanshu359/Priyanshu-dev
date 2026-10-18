# services/api — Modular Monolith Backend

Production-grade Spring Boot 3 modular monolith running on Java 21, adhering to Hexagonal Architecture (Ports & Adapters) and verified by **Spring Modulith**.

## Architecture Overview

```
services/api/src/main/java/dev/priyanshu/api/
├── ApiApplication.java
├── platform/      # Cross-cutting: rate limiting, RFC 7807 errors, tracing, CORS, outbox relay
├── profile/       # Developer profile from content/site/profile.yaml, cached in Redis
├── contact/       # POST /hire-me, content deduplication, transactional outbox & email streaming
└── stats/         # Live Redis telemetry counters (requests served, cache hits, 429s)
```

Inside each module:
- `domain/`: Business entities, value objects, domain logic (framework-independent).
- `application/`: Use cases, input ports, output ports.
- `adapter/in/web/`: Spring MVC controllers, request validation, headers.
- `adapter/out/...`: Persistence (JDBC), notification (SMTP/log), Redis integration.

## Database & Schemas
- **Production**: Supabase Postgres (PostgreSQL 16 with `pgvector`).
- **Local Dev / Test**: Containerized PostgreSQL via `infra/docker-compose.yml`.
- **Flyway Migrations** (`src/main/resources/db/migration/`):
  - `V1`: Extensions (`uuid-ossp`, `pgcrypto`, `vector`) and schemas `app` & `lab`. Public schema is revoked.
  - `V2`: `app.contact_message`, `app.outbox_event`, `app.knowledge_chunk`, `app.ask_session`, `app.usage_event`. Row Level Security (RLS) enabled on all tables.
  - `V3`: `lab.orders_noidx`, `lab.orders_user_idx`, `lab.orders_composite_idx`, `lab.instructor`, `lab.course`, `lab.wallet`. RLS enabled.

## Endpoints (Served on api.priyanshu.dev without /api prefix)

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Service health and status |
| `GET` | `/me` | Developer profile (compact JSON for curl, pretty for browser) |
| `POST` | `/hire-me` | Submit hiring inquiry / contact form (validated, deduplicated, outbox event emitted) |
| `GET` | `/hire-me` | Terminal-friendly curl documentation & usage guidelines |
| `GET` | `/stats` | Live telemetry counters for website footer |
| `GET` | `/actuator/health` | Spring Boot actuator health probe |
| `GET` | `/actuator/prometheus` | Micrometer metrics for Prometheus scraping |

## Running Locally

### 1. Start Local Infrastructure (Postgres + Redis)
```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. Run the Application
Using Gradle:
```bash
cd services/api
./gradlew bootRun
```
Or using Maven:
```bash
cd services/api
mvn spring-boot:run
```

### 3. Verify with Curl
```bash
# Developer profile
curl -i http://localhost:8080/me

# Telemetry stats
curl -i http://localhost:8080/stats

# Contact submission
curl -i -X POST http://localhost:8080/hire-me \
  -H "Content-Type: application/json" \
  -d '{
    "type": "client",
    "name": "Alex Smith",
    "email": "alex@example.com",
    "message": "We need an AI gateway and high-throughput Redis caching layer.",
    "details": { "projectType": "Backend / APIs", "timeline": "1–3 months" }
  }'
```
