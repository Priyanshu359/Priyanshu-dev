# Content System Guide — priyanshu.dev

Every word on **priyanshu.dev** lives inside the root `content/` directory. All content is editable through the browser via **Keystatic CMS**, strongly typed and validated at build time with **Zod**, and consumed exclusively through typed loaders (`apps/web/src/content/loader.ts`).

---

## Architecture Overview

```
priyanshu-dev/
├── content/
│   ├── site/               # Global & home singletons (home, about, nav, profile)
│   ├── labs/<slug>/        # Lab specifications (lab.yaml) & deep-dives (story.mdx)
│   ├── ai/                 # AI architecture (walkthrough, diagram, voice, concepts)
│   ├── ask/                # Preset Q&As (presets.yaml) & retriever chunks (knowledge/*.md)
│   ├── connect/            # Connect & hire pages (recruiters, services, stack, client-work...)
│   └── journey/            # Autobiographical chapters (*.mdx) & images (images/)
├── apps/web/src/content/
│   ├── schema.ts           # Zod validation schemas
│   ├── loader.ts           # Build-time typed loaders with validation
│   └── index.ts            # Public barrel exports
└── apps/web/keystatic.config.ts # Keystatic CMS schema configuration
```

### Build-Time Validation
When running `pnpm --filter web build` or running tests, every content file is loaded and validated against the Zod schemas in `apps/web/src/content/schema.ts`. If any required field is missing or contains an invalid type, the build fails immediately with a descriptive `[Content ValidationError]` pointing directly to the offending file and field.

---

## 1. How to Add a Journey Chapter

Journey chapters live in `content/journey/` as individual `.mdx` files sorted chronologically by their `order` frontmatter property.

### Step 1: Create the MDX File
Create a new file in `content/journey/` with a descriptive name, e.g. `07-new-city.mdx`:

```mdx
---
title: "The Next Frontier"
order: 7
place: "Bengaluru, India"
period: "2026–PRESENT"
mood: "Focused, building at scale"
moodColor: "#EAE7DF"
isDark: false
photo: "/content/journey/images/bengaluru-chapter.jpg"
photoAlt: "Engineering workstation in Bengaluru"
photoPlaceholder: "[Workstation setup]"
cta: "Read architecture logs"
ctaHref: "/ai"
---

## What Changed

Write the chapter story here using Markdown or MDX.

Paragraphs capture the personal and technical context of this phase in your engineering career.
```

### Frontmatter Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | The chapter title. |
| `order` | integer | Yes | Sequence number for chronological sorting (1, 2, 3...). |
| `place` | string | Yes | Geographic location or milestone place (e.g. `Gurugram`, `Chandigarh`). |
| `period` | string | Yes | Time period label (e.g. `2021–2025`, `DEC 2025`). |
| `mood` | string | Yes | One-line phrase summarizing the mood of this chapter. |
| `moodColor` | hex string | Yes | Background hex color used for the card / section (e.g. `#F3E6C8`, `#111111`). |
| `isDark` | boolean | No | If `true`, renders with dark background and light text (defaults to `false`). |
| `photo` | string | No | Path to photo under `/content/journey/images/`. |
| `photoAlt` | string | No | Accessible description for the photo. |
| `photoPlaceholder` | string | No | Bracketed placeholder text if photo is pending (e.g. `[Childhood photo]`). |
| `cta` | string | No | Optional button label (e.g. `Say hello`). |
| `ctaHref` | string | No | Optional button destination link (e.g. `/hire`). |

### Adding Images
Store all chapter images in `content/journey/images/`. No external storage or third-party buckets are used; images are committed to the repository and served locally through `next/image`.

---

## 2. How to Add an Interactive Lab

Labs live in subdirectories under `content/labs/<slug>/`. Each lab consists of two files:
1. `lab.yaml`: Settings, interactive controls, diagram nodes and edges, experiment copy, code snippets, and trade-offs.
2. `story.mdx`: The technical deep-dive story and production post-mortem.

### Step 1: Create the Lab Directory
Create `content/labs/<slug>/`, for example `content/labs/caching/`.

### Step 2: Create `lab.yaml`

```yaml
id: "caching"
number: "03"
title: "Distributed Caching"
tagline: "Cache invalidation, dogpiling, and cache-aside at 100K RPM."
status: "soon" # "live" or "soon"
order: 3
kicker: "Lab / 03 · Caching"
headline: "How do you protect your database when a cache key expires under peak load?"
intro: "Explore cache stampede prevention using probabilistic early expiration and Redis distributed locks."
liveBadge: "SOON · Spring Cache + Redis"
settings:
  capacity: 1000
  refillRateMs: 5000
  refillTokens: 50
diagram:
  title: "Cache-Aside Architecture"
  subtitle: "Read hits Redis; misses query PostgreSQL and populate the cache."
  alertNote: "Cache miss under peak load triggers distributed lock."
  nodes:
    - id: "client"
      label: "Client"
      sub: "API request"
    - id: "cache"
      label: "Redis Cache"
      sub: "cluster mode"
      highlight: true
    - id: "db"
      label: "Postgres DB"
      sub: "read replica"
  edges:
    - from: "client"
      to: "cache"
      label: "1. GET key"
    - from: "cache"
      to: "db"
      label: "2. Miss → query"
experimentCopy:
  sendOneLabel: "Fetch user profile"
  burstLabel: "Simulate 50 concurrent requests"
  networkHeading: "// Telemetry & Redis Latency"
codeSection:
  title: "Cache-Aside Implementation"
  filename: "UserProfileCache.java"
  code: |
    @Cacheable(value = "users", key = "#userId")
    public UserProfile getUserProfile(String userId) {
        return userRepository.findById(userId).orElseThrow();
    }
tradeOffsHeading: "Architectural Trade-offs"
tradeOffs:
  - title: "Cache-Aside vs. Write-Through"
    text: "Cache-aside is lazy and resilient to intermittent cache failures, but initial requests endure a cold-start latency hit."
```

### Step 3: Create `story.mdx`

```mdx
---
title: "Distributed Caching Under High Traffic"
labId: "caching"
order: 3
---

## The Problem: Cache Stampede

When a frequently requested cache key expires during peak traffic, dozens of threads simultaneously encounter a cache miss and query the primary database.

### Mitigation Strategies

1. **Probabilistic Early Expiration (XFetch)**
2. **Mutex Locks with Redis SETNX**
3. **Background Refreshes**
```

The loader automatically detects new lab folders, validates both `lab.yaml` and `story.mdx`, and includes them in `getLabs()` and `getLab(slug)`.

---

## 3. How to Add a Client Project

Client projects and case studies are managed in `content/connect/client-work.yaml`.

### Step 1: Open `content/connect/client-work.yaml`
Add a new item to the `projects` array:

```yaml
  - id: "fintech-billing-engine"
    clientType: "Fintech Startup · 2025"
    badge: "NDA"
    headline: "Led migration from synchronous billing to an idempotent, event-driven payment ledger."
    problem: "Duplicate transactions occurred when network timeouts prompted upstream payment gateways to retry requests."
    built: "Built an idempotent payment consumer using Spring Boot, Kafka, and Redis distributed locks with unique idempotency keys."
    outcome: "Eliminated double-charging incidents entirely across 50,000+ daily payment attempts while keeping ledger response times under 45ms."
    testimonial: "\"Priyanshu rebuilt our core payment pipeline with complete reliability. We scaled through our peak season without a single dropped transaction.\""
    testimonialAuthor: "— Head of Engineering"
```

### Fields Reference
- `id`: Unique kebab-case string identifier.
- `clientType`: Display subtitle showing company domain and year (e.g. `Fintech Startup · 2025`).
- `badge`: Privacy badge (e.g. `NDA`, `CLIENT`, `LIVE`).
- `headline`: One-sentence summary of what was accomplished.
- `problem`: The engineering challenge or architectural bottleneck.
- `built`: Concrete technical stack and systems implemented.
- `outcome`: Quantifiable business or performance impact.
- `testimonial`: Quote from client or engineering leader.
- `testimonialAuthor`: Attribution with role/title.

---

## 4. How to Add a Knowledge Chunk (AI Retriever)

The AI Ask retriever searches markdown knowledge chunks stored in `content/ask/knowledge/`. These chunks are vectorized and retrieved when answering user questions through the AI pipeline.

### Step 1: Create a New Markdown File
Create a new file in `content/ask/knowledge/<slug>.md`, e.g. `content/ask/knowledge/observability-and-metrics.md`:

```markdown
---
title: "Observability and Metrics"
keywords: "Prometheus, Grafana, Micrometer, APM, tracing, latency percentiles, p99, alerting, SLI, SLO"
category: "architecture"
---

# Observability and Production Monitoring

## Metrics Architecture

At StudyIQ, microservice telemetry is instrumented using Micrometer and exported to Prometheus. We monitor:

1. **Golden Signals**: Latency, Traffic (RPM), Errors (HTTP 5xx rate), and Saturation (CPU, JVM heap, DB pool active connections).
2. **P99 Latency Budgets**: Dashboards alert when p99 response times exceed 120ms for three consecutive 1-minute evaluation windows.
3. **Distributed Tracing**: Request IDs generated at the API Gateway propagate through HTTP headers and Kafka records for end-to-end trace correlation.
```

### Guidelines for Effective Chunks
- **Concise & Factual**: Keep chunks focused on one architectural topic (caching, Kafka, database indexes, etc.).
- **Rich Keywords**: Add synonyms, technology names, and domain terms to the `keywords` frontmatter to ensure accurate semantic and keyword retrieval.
- **Concrete Details**: Include real numbers (RPM, memory, timeouts, thread pool sizes) rather than vague generalities.

---

## 5. Editing via Keystatic CMS

You can manage all site content through the visual CMS interface.

### Running Locally
1. Start the web application:
   ```bash
   pnpm --filter web dev
   ```
2. Navigate in your browser to:
   ```
   http://localhost:3000/keystatic
   ```
3. All collections (**Journey Chapters**, **Knowledge Chunks**, **Interactive Labs**, **Lab Deep-Dive Stories**) and singletons (**Home Page**, **Navigation Bar**, **Developer Profile**, **About**, **Connect**, **AI Walkthrough**, **Architecture Diagram**, etc.) are listed in the sidebar.
4. When you edit and save changes in local mode, Keystatic modifies the YAML and Markdown files in `content/` directly.

### GitHub Mode (Production)
In production, Keystatic switches to GitHub mode (`KEYSTATIC_STORAGE_KIND=github`):
- Content edits commit directly to the GitHub repository via the GitHub REST API or create pull requests.
- Configure `NEXT_PUBLIC_KEYSTATIC_GITHUB_OWNER` and `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO` in your deployment environment variables.
