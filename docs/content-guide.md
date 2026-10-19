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

## 1. How to Add or Edit Journey Chapters

Journey narrative content lives in `content/journey/`:
- `prologue.mdx`: Prologue opening story, childhood place, family photo/caption.
- `chapters/NN-slug.mdx`: Individual autobiographical chapters sorted chronologically by `order`.
- `ending.yaml`: Chapter 06 conclusion and call to action.
- `images/`: High-resolution photographs.

### Chapter Frontmatter Reference

Each file in `content/journey/chapters/NN-slug.mdx` has the following frontmatter:

```mdx
---
order: 1
place: "Patratu, Jharkhand"
period: "Age 15"
mood: "Curious"
title: "A borrowed keyboard and my father’s phone"
lesson: "You don’t need the right tools to start. You start with whatever you have."
palette: "blue" # one of blue | sand | green | dark | indigo
photo:
  src: "./images/01-home-setup.jpg"
  alt: "My home setup at 21"
---

Write chapter narrative here in Markdown or MDX.
```

| Field | Type | Required | Description |
|---|---|---|---|
| `order` | integer | Yes | Chronological sequence (1, 2, 3, 4, 5...). |
| `place` | string | No | Hometown or city (e.g. `Patratu, Jharkhand`, `Chandigarh`). Optional (e.g. Chapter 4 omits place). |
| `period` | string | Yes | Time period or age (e.g. `Age 15`, `2021–2025`, `2025 – now`). |
| `mood` | string | Yes | Mood keyword (e.g. `Curious`, `Grateful`, `On my own`, `Lost`, `Back on track`). |
| `title` | string | Yes | Chapter headline. |
| `lesson` | string | Yes | Pullquote takeaway displayed with a vertical rule in the chapter's ink color. |
| `palette` | enum | Yes | Color scheme: `blue` (#E8EEF2), `sand` (#F3E6C8), `green` (#DDEBDF), `dark` (#2F2A33), `indigo` (#E3E7F3). |
| `photo` | object | No | Optional `{ src, alt }`. If omitted, the chapter automatically displays the typographic mood card. |
| `photo.src` | string | If photo | Path to file, e.g. `./images/01-home-setup.jpg`. File must exist in `content/journey/images/`. |
| `photo.alt` | string | If photo | Accessible description of the photograph (required whenever `photo.src` is specified). |

The uppercase label is generated automatically: `"CHAPTER 0N · PLACE · PERIOD · MOOD"` (or `"CHAPTER 04 · PERIOD · MOOD"` if place is omitted).

---

## 1.1 Adding or changing Journey photos

Journey chapters support photographic memories or automatically fall back to typographic mood cards when no photograph is provided.

### Two Ways to Add or Change a Photo

#### A) In Keystatic CMS (No Code)
1. Open Keystatic at `/keystatic` in your browser.
2. Select **Journey Chapters** and click on the chapter you wish to update (or **Journey Prologue** for the prologue).
3. Scroll down to the **Chapter Photo** field.
4. Click **Upload** and select your image file from your computer.
5. In the **Photo Alt Description** field, type a concise, descriptive description of what appears in the image.
6. Click **Save** in the bottom bar.
7. Keystatic commits the image and text change, and the site rebuilds automatically.

#### B) By Hand (Git / File System)
1. Copy your image into `content/journey/images/` with a descriptive filename, e.g. `01-home-setup.jpg`.
2. Open the corresponding chapter file in `content/journey/chapters/NN-slug.mdx`.
3. Add or update the `photo` block in the frontmatter:
   ```yaml
   photo:
     src: "./images/01-home-setup.jpg"
     alt: "My home setup at 21"
   ```
4. Run `pnpm dev` in your terminal to inspect the photo on `http://localhost:3000/journey`.
5. Commit and push your changes to GitHub.

### Recommended Image Sizes
- **Chapters**: At least 1200 px wide (landscape or 4:3 aspect ratio).
- **Prologue**: At least 800 px wide (older, vintage family scans and smaller historic photos work beautifully in the rotated print frame).

### Privacy & Photo Optimization Pipeline
- Before each production build, the automated image pipeline (`pnpm journey:photos`) processes every image in `content/journey/images/`:
  - **EXIF & GPS Stripping**: Permanently removes all camera metadata, embedded GPS coordinates, timestamps, and device identifiers to protect privacy.
  - **Auto-Orientation**: Normalizes image rotation according to initial orientation tags before stripping.
  - **Downscaling**: Proportionally resizes images to a maximum of 2000 px on the long side.
- Never commit unneeded sensitive photos.

### What to Avoid
- **Faces without consent**: Do not upload photos showing friends, classmates, or colleagues without their explicit permission.
- **Identification & Addresses**: Avoid photos containing readable house numbers, street signs, vehicle number plates, badges, IDs, or diplomas with registration numbers.
- **Proprietary Work**: Avoid photos of computer screens showing internal employer/client code, Slack conversations, or confidential infrastructure.

### How to Remove a Photo
- To switch a chapter back to the typographic mood card (or tilted paper card in Prologue):
  1. Remove the `photo:` block completely from the chapter's frontmatter (or clear the photo field in Keystatic).
  2. (Optional) Delete the unused image file from `content/journey/images/`.
  3. Save and rebuild. When no photo is configured, the chapter renders the palette's typographic mood card.

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

## 5. Services Content & Founding Offer Configuration

All copy for the `/services` page lives under `content/services/` in nine validated YAML singletons:

```
content/services/
├── hero.yaml      # Status badge, headline, subline, primary and secondary CTAs
├── services.yaml  # 4 offerings with "Good for", timeline placeholders, and tech stack
├── quote.yaml     # Fixed-quote guarantee strip and CTA
├── process.yaml   # 4-stage project workflow (Send request → Fixed quote → Build → Handover)
├── proof.yaml     # StudyIQ scale proof, Lab proof, sample project plan, founding offer
├── trust.yaml     # 6 client trust cards (production engineering, IP ownership, NDA...)
├── working.yaml   # Operational details strip (Time zone, Payments, Response time, Paperwork)
├── faq.yaml       # 8 common client questions in an accessible accordion
└── cta.yaml       # Dark band footer closing CTA
```

### How to Turn the Founding Client Offer On or Off
The founding client offer banner (giving 20% off for the first project) is conditionally rendered:
1. Open `content/services/proof.yaml` (or edit **Services: Proof of How I Build** in Keystatic).
2. Set `enabled` under `foundingOffer` to `false`:
   ```yaml
   foundingOffer:
     enabled: false
     title: "Founding client offer"
     text: "..."
   ```
3. When `enabled: false`, the banner is completely omitted from the `/services` page at build and render time. Setting it back to `true` instantly re-enables it.

### How to Edit Bracketed Placeholders
All bracketed placeholders are meant to be updated with real data as timelines or policies evolve:
- **Service Timelines**: In `content/services/services.yaml`, update `timeline: "[6–10 weeks]"`, `"[2–4 weeks]"`, etc.
- **Bug Fix Period**: In `content/services/process.yaml` step 04, update `[30 days]`.
- **Response Time**: In `content/services/working.yaml`, update `[within 24 hours]`.
- **Notice Period & Location**: In `content/connect/recruiters.yaml`, update `[open to relocate]`, `[30 days]`.

All placeholders can also be edited through the browser at `http://localhost:3000/keystatic`.

---

## 6. Editing via Keystatic CMS

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
3. All collections (**Journey Chapters**, **Knowledge Chunks**, **Interactive Labs**, **Lab Deep-Dive Stories**) and singletons (**Home Page**, **Services Pages**, **Navigation Bar**, **Developer Profile**, **About**, **Connect**, **AI Walkthrough**, **Architecture Diagram**, etc.) are listed in the sidebar.
4. When you edit and save changes in local mode, Keystatic modifies the YAML and Markdown files in `content/` directly.

### GitHub Mode (Production)
In production, Keystatic switches to GitHub mode (`KEYSTATIC_STORAGE_KIND=github`):
- Content edits commit directly to the GitHub repository via the GitHub REST API or create pull requests.
- Configure `NEXT_PUBLIC_KEYSTATIC_GITHUB_OWNER` and `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO` in your deployment environment variables.
