# 1. Monorepo Structure and Technology Stack Choices

Date: 2026-10-18

## Status

Accepted

## Context

The `priyanshu.dev` portfolio is designed to showcase the expertise of a backend engineer (Java/Spring Boot) who also builds end-to-end web, mobile, and AI applications. The repository itself is part of the portfolio, meaning code structure, architectural documentation, CI/CD discipline, and developer experience are evaluated alongside running features.

We need to decide:
1. Repository architecture (monorepo vs polyrepo)
2. Frontend technology stack
3. Backend service stack
4. Local infrastructure and containerization
5. Content and design token separation strategy

## Decisions

### 1. Monorepo Architecture with pnpm Workspaces
* **Decision**: Use a structured monorepo containing `apps/web`, `services/api`, `content/`, `infra/`, `docs/`, and `design/`.
* **Rationale**:
  * Single atomic pull requests can touch the API, frontend, content, and architecture docs in tandem.
  * Ensures unified CI/CD pipelines and reproducible local developer setup.
  * pnpm workspaces provide fast, hardlinked, disk-efficient dependency management for the Node.js/TypeScript frontend without bloating `node_modules`.

### 2. Frontend: Next.js (App Router) + Strict TypeScript
* **Decision**: Next.js 15+ using App Router, React Server Components (RSC), and strict TypeScript.
* **Rationale**:
  * Server components provide optimal SEO, instant first paint, and direct streaming capabilities.
  * Static generation for editorial pages (like Journey and Project Brief) combined with client hydration for interactive widgets (Rate Limiter and Request Journey).
  * Strict TypeScript (`strict: true`, no implicit any, strict null checks) enforces high code quality.

### 3. Backend: Spring Boot 3 + Java 21 + Gradle (Kotlin DSL)
* **Decision**: Spring Boot 3.4+ running on OpenJDK 21 LTS, built with Gradle Kotlin DSL (`build.gradle.kts`).
* **Rationale**:
  * Directly reflects Priyanshu's primary professional stack at StudyIQ (Java / Spring Boot microservices).
  * Java 21 provides Virtual Threads (Project Loom) for high-concurrency request handling, pattern matching, and modern language features.
  * Gradle Kotlin DSL provides type-safe, declarative, and IDE-friendly build scripts.
  * Spring Boot Actuator provides standardized `/actuator/health` and `/actuator/metrics` endpoints for observability.

### 4. Local Infrastructure: Postgres 16 (pgvector) + Redis 7
* **Decision**: Containerized local environment managed via `infra/docker-compose.yml`.
* **Rationale**:
  * **Redis 7**: Powers atomic sub-millisecond token bucket rate limiting (via Lua scripts), semantic cache keys, and ephemeral session tracking.
  * **PostgreSQL 16 with pgvector**: Standard relational data storage combined with vector embeddings for AI similarity retrieval, matching the 16-box AI architecture specification without requiring a separate vector database.

### 5. Content & Design Tokens Separation
* **Decision**:
  * All site copy, narratives, and labels live strictly in `content/`. Components never hardcode text strings.
  * Design tokens are maintained in `apps/web/src/styles/tokens.json` as the single source of truth and generated into CSS custom properties (`tokens.css`) via `generate-tokens.mjs`.
  * Theme switching (`light`, `dark`, and `journey`) operates via the `data-theme` HTML attribute.

## Consequences

* **Positive**:
  * Cohesive developer workflow with single-command local setup (`docker compose up`).
  * High maintainability: updating copy or color schemes never requires editing component JSX.
  * Clear demonstration of senior backend architectural practices.
* **Trade-offs / Mitigations**:
  * Mixed language tooling (Node.js/pnpm for web, JVM/Gradle for API) requires CI workflows to install both JDK 21 and Node.js. Handled via matrix/parallelized GitHub Actions workflows.
