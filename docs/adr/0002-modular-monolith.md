# ADR 0002: Modular Monolith Architecture with Spring Modulith

* **Status**: Accepted
* **Date**: 2026-10-18
* **Deciders**: Priyanshu Sinha

## Context & Problem Statement

`priyanshu.dev` needs a backend that demonstrates distributed systems concepts, high code quality, and maintainability. While microservices are appropriate for large distributed production platforms (such as the 20+ microservices owned at StudyIQ), running multiple microservices for a personal technical portfolio introduces unnecessary operational overhead, deployment complexity, latency, and resource costs on free-tier infrastructure.

At the same time, a traditional "spaghetti" monolith where layers cross arbitrary boundaries quickly degrades architectural clarity and testability.

## Decision Drivers

* Strict encapsulation of distinct business domains (`platform`, `profile`, `contact`, `stats`, and upcoming `lab`, `ai`).
* Verifiable architectural boundaries enforced at build/test time, preventing accidental cross-module leaks.
* Clean hexagonal architecture (Ports & Adapters) inside each module: `domain/`, `application/`, `adapter/in/`, `adapter/out/`.
* Low operational complexity with single-container deployment.
* Path to seamless microservice extraction if an individual domain ever needs independent scaling.

## Considered Options

1. **Microservices from Day 1**: Multiple independent Spring Boot services communicating over HTTP/gRPC.
2. **Layered Monolith**: Single Spring Boot app with traditional `controller/`, `service/`, `repository/` packages without domain boundaries.
3. **Modular Monolith with Spring Modulith**: Single deployable Spring Boot application partitioned into decoupled, bounded modules validated by Spring Modulith and ArchUnit.

## Decision Outcome

Chosen option: **Modular Monolith with Spring Modulith**.

### Architecture Rules
1. **Module Structure**:
   - `platform`: Infrastructure cross-cutting concerns (global rate limiting, RFC 7807 error formatting, tracing, metrics, CORS, outbox polling relay).
   - `profile`: Developer profile and capabilities loaded from content and cached in Redis.
   - `contact`: Asynchronous contact processing, content deduplication, and transactional outbox event emission.
   - `stats`: Live metrics and Redis telemetry counters.
2. **Ports and Adapters**: Inside each module:
   - `domain/`: Pure domain models, value objects, and business rules. Zero framework dependencies.
   - `application/`: Use cases, input/output ports, orchestrating domain logic.
   - `adapter/in/web`: REST controllers, request/response DTOs, HTTP adapters.
   - `adapter/out/...`: Persistence (JDBC), notification (SMTP/log), or external messaging adapters.
3. **Boundary Verification**:
   - Spring Modulith's `ApplicationModules.of(ApiApplication.class).verify()` and ArchUnit tests run in CI. Internal packages cannot be imported outside their declaring module without explicit public APIs.

## Consequences

* **Positive**:
  - Single JVM deployment: minimal memory footprint (< 512MB RAM), fast cold starts, zero network serialization hop between modules.
  - Compile-time and test-time verification of modular boundaries prevents monolithic decay.
  - Testcontainers allow full-stack integration testing with single command (`mvn test` / `./gradlew test`).
* **Negative**:
  - Requires discipline in maintaining Ports and Adapters contracts.
  - Modules share a single database, mitigated by strict PostgreSQL schema partitioning (`app` vs `lab`).
