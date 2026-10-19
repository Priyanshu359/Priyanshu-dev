# PROJECT_BRIEF — priyanshu.dev

## 1. Executive Summary & Vision

`priyanshu.dev` is the personal portfolio and interactive technical playground for Priyanshu Sinha, an SDE-1 Backend Engineer at StudyIQ. Because Priyanshu is a backend engineer specializing in distributed systems, high throughput, and AI system design, the repository itself is an artifact of the portfolio. Code quality, architecture, documentation, and mechanical sympathy matter as much as user-facing features.

The site is designed to immediately establish credibility with three primary audiences:
1. **Engineering Leaders & Recruiters**: Proving deep systems knowledge through live production-grade demonstrations (not mock fluff), concrete scale metrics (20+ microservices, 100K+ req/min peaks, 92%+ cache hits), and architectural rigor.
2. **Founders & Freelance Clients**: Demonstrating full-cycle capability across web, mobile, robust backends, and AI engineering.
3. **Engineers & Students**: Engaging peer-to-peer with candid technical writeups, interactive lab simulations, and personal journey stories.

---

## 2. Core Non-Negotiable Rules

1. **Content Separation**: No user-facing text, copy, or labels may be hardcoded into UI components. All copy lives strictly in `content/` (structured JSON, markdown, or TypeScript dictionaries). Components only consume content via structured interfaces.
2. **AI Page Answer Constraint**: Under **no circumstances** is an actual AI answer text ever generated or displayed on the AI architecture walkthrough page (`/ai`). The purpose of the AI page is to demystify backend architecture—rate limiting, semantic caching, vector retrieval, token budgeting, orchestration, and streaming—without running expensive or irrelevant LLM generation. The UI explicitly states: *"Nothing is answered — you'll see how it flows."*
3. **Database Operations Policy**: Per workspace safety constraints, automated database operations or unmonitored scripts against live databases are strictly prohibited. The developer/user executes DB operations directly.
4. **Theme Architecture**: Themes must switch cleanly via the HTML `data-theme` attribute (`"light"` vs `"dark"`), driven by centralized CSS variables generated from tokens.

---

## 3. Themes, Typography & Design Tokens

### Themes & Color Palettes
The site supports two primary themes, plus an editorial warm variation for the Journey page:

#### 1. Light Theme — "Ink & Blue"
* Clean, authoritative, editorial ink aesthetic.
* **Background (`bg`)**: `#FBFBFA`
* **Surface (`surface`)**: `#FFFFFF`
* **Tint / Sub-surface (`tint`)**: `#F4F4F2`
* **Primary Text (`text`)**: `#111418`
* **Body Text (`body`)**: `#3A3F47`
* **Muted / Secondary Text (`muted`)**: `#4A5059`
* **Borders (`border`, `border2`)**: `#E6E6E3`, `#D4D4D0` (or `#E3E3DF`)
* **Primary Accent (`accent`)**: `#1F4FD1` (Electric Blue)
* **Button Background / Text**: `#111418` / `#FFFFFF`
* **Status Success / Active (`green`, `dot`, `ok`)**: `#0F6B52`
* **Status Warning / Blocked (`blocked`)**: `#B4400E`
* **Terminal Background (`term`)**: `#111418`
* **Active Stage Background (`activeBg`)**: `#EEF2FD`
* **Done Stage Background (`doneBg`)**: `#EEF6F2`

#### 2. Dark Theme — "Midnight"
* Sleek, high-contrast, deeply focused dark mode.
* **Background (`bg`)**: `#0B0D10`
* **Surface (`surface`)**: `#14171C`
* **Tint / Sub-surface (`tint`)**: `#101318`
* **Primary Text (`text`)**: `#E8EAED`
* **Body Text (`body`)**: `#C9CDD3`
* **Muted / Secondary Text (`muted`)**: `#A3A9B3`
* **Borders (`border`, `border2`)**: `#262B33`, `#3A404A`
* **Primary Accent (`accent`)**: `#7AA2FF` (Vibrant Sky Blue)
* **Button Background / Text**: `#E8EAED` / `#0B0D10`
* **Status Success / Active (`green`, `dot`, `ok`)**: `#5FD39B`
* **Status Warning / Blocked (`blocked`)**: `#FF9A7A`
* **Terminal Background (`term`)**: `#05070A`
* **Active Stage Background (`activeBg`)**: `#18213A`
* **Done Stage Background (`doneBg`)**: `#12261D`

#### 3. Journey Theme — "Warm Memoir"
* Applied to the Journey narrative chapters. Always rendered in warm paper tones.
* **Background**: `#F6F1E9`
* **Text**: `#2A2420`
* **Border**: `#E2D9CB`
* **Muted**: `#6B5F55` / `#5A4F46`
* **Accent**: `#8A3B1F`
* **Chapter Accents**: Individual chapter palette shifts (Muted Slate `#E8EEF2`, Amber `#F3E6C8`, Sage `#DDEBDF`, Deep Charcoal `#2F2A33`, Indigo `#E3E7F3`).

### Typography
* **UI & Body**: `IBM Plex Sans`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` (weights: 400, 500, 600)
* **Code & Telemetry**: `IBM Plex Mono`, `ui-monospace`, `Menlo`, `monospace` (weights: 400, 500)
* **Journey Editorial**: `Newsreader`, `Georgia`, `serif` (weights: 400, 500, italic)

---

## 4. Page-by-Page Specifications & Interactive Widgets

### 4.1 Home (`/` — `Main.dc.html`)
* **Header / Nav**: Site logo `priyanshu.dev`, theme toggle button (Sun/Moon SVG icon), links: `Lab`, `AI`, `Journey`, `Services`, and CTA button `Let’s talk`.
* **Hero Section**:
  * Mono badge: `"Hi, I'm"`
  * Title: `"Priyanshu Sinha."`
  * Subheading: *"I build the backends that keep products fast — and the AI that runs on top of them."*
  * Bio paragraph: Backend engineer at StudyIQ, where I own 20+ Java/Spring Boot microservices in a 35+ service ecosystem, handling traffic peaks of 100K+ requests a minute. Outside work, I help businesses launch web and mobile apps, AI agents and reliable backends.
  * Quick-facts bar: NOW (`SDE-1 Backend · StudyIQ`), BASED IN (`Gurugram, India`), FOCUS (`Distributed systems + AI`), OPEN TO (`● Freelance projects`).
  * CTAs: `"See my backend in action ↓"`, `"Start a project" → /services`, GitHub, LinkedIn, Résumé.
* **Interactive Widget — Live Request Journey (`#demo`)**:
  * **Demonstration**: Visualizes a request traversing a modern AI backend pipeline step-by-step.
  * **State & Metrics**: Tracks total requests, cache hits, and remaining tokens (`remaining/5`).
  * **Controls**:
    * Speed switch: Toggle between `"Playback: slow-mo"` (default, slowed down for comprehension) and `"Playback: real speed"`.
    * Question selector pills: 3 pre-configured questions (`"What does Priyanshu work on?"`, `"How does he handle traffic spikes?"`, `"Has he built AI systems?"`).
    * Action button: `"Send request →"` (shows `"Sending..."` while executing).
  * **Pipeline Stages (6 interactive boxes)**:
    1. `01 API gateway` (`auth + routing` · 2 ms)
    2. `02 Rate limiter` (`Redis token bucket` · 1 ms)
    3. `03 Cache` (`Redis lookup` · 1 ms)
    4. `04 Retriever` (`vector search, top-3` · 38 ms)
    5. `05 LLM` (`generate answer` · 840 ms)
    6. `06 Stream` (`SSE to browser` · streamed)
  * **Visual Execution**:
    * Progress track with an animated indicator dot travelling across stages.
    * Stage cards change styles based on status: `waiting`, `active` (accent highlight), `done` (green), `skipped` (dashed border for cache hits), or `blocked` (red for 429).
    * Terminal display: Shows HTTP status (`200 OK` or `429 Too Many Requests`), headers (`X-Cache: HIT/MISS`, `X-RateLimit-Remaining: N`, `X-Response-Time`), and streamed response text.
    * Token bucket refills automatically over time (refill interval: 3s).
* **For Businesses Section**:
  * Label: `For businesses`
  * Heading: *"Building something? The same engineering, for your product."*
  * Subline: *"I take on a few client projects alongside my job. Fixed quote up front, pay per milestone, and you own the code."*
  * 3 Cards linking to `/services`:
    1. *Launch your web or mobile app* — React and Flutter apps with the backend, database and admin panel behind them.
    2. *Automate with AI* — Agents on WhatsApp or your website that answer customers and book appointments.
    3. *Fix slow or crashing systems* — Find the bottleneck, fix it, and show before-and-after numbers.
  * CTAs: `"Get a fixed quote" → /connect?type=client#contact` and `"Services, timelines & FAQ →" → /services`.
* **Terminal Curl Section ("For developers")**:
  * Mock terminal showing `curl priyanshu.dev/api/me` returning JSON with name, role, stack, openTo, and `POST /api/hire-me`.
* **Section Index Cards**:
  * Highlights `01 / The Lab`, `02 / AI`, `03 / Journey`.
* **Inside the Lab List**:
  * Lists upcoming and live lab experiments (Rate limiting `LIVE`, Databases `LIVE`, Caching `SOON`, Flash sale `SOON`, Idempotent payments `SOON`, Circuit breaker `SOON`, Queues & DLQ `SOON`).
* **About & Footer**:
  * Summary, résumé download link, footer button (`"Start a project" → /services`), and live telemetry counter placeholder (`served today`, `cache hits`, `rate limits triggered`).

---

### 4.2 Lab 01: Rate Limiting (`/lab/rate-limiting` — `RateLimiter.dc.html`)
* **Header & Experiment Sub-Nav**: Lab experiments sub-bar linking `01 Rate limiting` (active), `02 Databases`, `03 Caching · soon`, `04 Flash sale · soon`.
* **Intro Header**: *"How do you stop one user from taking down your API?"* Explains token bucket mechanics in under a millisecond.
* **Interactive Widget — Live Token Bucket Demo**:
  * **Demonstration**: Visual token capacity and burst rejection under concurrent load.
  * **Visual Bucket**: 5 visual slot boxes that fill/drain dynamically (capacity 5, refills 1 token every 2s).
  * **Actions**:
    * `"Send 1 request"`: Drains 1 token, logs `200 OK` (or `429` if empty).
    * `"Burst 10"`: Instantly fires 10 requests, exhausting available tokens and triggering `429 Too Many Requests` with `Retry-After: 2`.
    * `"Reset"`: Restores bucket to capacity 5 and clears log.
  * **Telemetry Counter**: Live count of `200 OK` vs `429 Too Many`.
  * **Network Inspection Log**: Terminal displaying request history in reverse-chronological order with status, color, and `X-RateLimit-Remaining` header.
* **Architecture Diagram**:
  * Flow diagram: `Client (browser)` → `Rate-limit filter (Spring OncePerRequestFilter)` ⇄ `Redis (Lua script, atomic)` → `Controller (only if allowed)`.
  * Callout: `bucket empty → 429 + Retry-After, controller never runs`.
* **Source Code Inspection**:
  * Displays atomic `token_bucket.lua` script executed inside Redis (`KEYS[1]`, `HGET`, `HSET`, `math.min`, etc.).
* **Trade-Off Analysis**:
  * Comparison between Token Bucket, Sliding Window, and Lua Atomic Execution.

---

### 4.3 Lab 02: Databases (`/lab/databases` — `Database.dc.html`)
* **Intro Header**: *"Most 'slow APIs' are really slow queries."* 3 production case studies tested against realistic data.
* **Experiment 01 Widget — Indexes & Query Plans**:
  * Scenario: *"Show me a user's last 20 orders"* (`SELECT * FROM orders WHERE user_id = 4821 AND created_at > now() - interval '30 days' ORDER BY created_at DESC LIMIT 20;`).
  * Strategies (pills):
    1. `No index`: 1,000,000 rows scanned, ~418 ms, Seq Scan with Sort.
    2. `Index on user_id`: 1,180 rows scanned, ~6 ms, Index Scan with Sort filter.
    3. `Composite (user_id, created_at)`: 20 rows scanned, ~0.1 ms, Index Scan backward (no sort needed, stops at limit).
  * Widget displays rows scanned, execution time, log-scale work done bar, and full PostgreSQL `EXPLAIN ANALYZE` output.
* **Experiment 02 Widget — The N+1 Problem**:
  * Scenario: `GET /api/courses` (50 courses, each with its instructor).
  * Strategies:
    1. `Lazy loading (naive)`: Fires 1 query for courses + 50 individual queries for instructors (51 queries total, high latency).
    2. `JOIN FETCH`: Single query `SELECT c.*, i.* FROM courses c JOIN instructors i ON i.id = c.instructor_id` (1 query total).
  * Live animation of queries executing into a SQL log terminal with `X-Query-Count`.
* **Experiment 03 Widget — Transactions & Race Conditions**:
  * Scenario: Two simultaneous ₹700 withdrawals hit a ₹1,000 balance wallet.
  * Strategies:
    1. `Read, then write (no lock)`: Thread 1 and Thread 2 both read ₹1,000 balance, both deduct ₹700; final balance ₹300, lost update paying out ₹1,400 from a ₹1,000 wallet (bug!).
    2. `SELECT … FOR UPDATE`: Pessimistic write lock (`@Lock(PESSIMISTIC_WRITE)`). T1 locks row; T2 blocks until T1 commits; T2 reads updated balance ₹300, check fails, rolls back with `409 Insufficient funds`.
    3. `Optimistic (version column)`: `@Version` column. T1 succeeds with `version=7`; T2 update matches 0 rows (stale version), retries, reads ₹300, safely rejects with 409.
  * Visual timeline log showing T1 vs T2 step interleaving, final balance, and transaction code snippets.

---

### 4.4 AI Architecture Walkthrough (`/ai` — `AI.dc.html`)
* **Intro Header**: *"In every AI product, the backend is the real hero."*
* **Interactive Client App & Walkthrough**:
  * **Input box**: Type any question (e.g., *"What does he do at StudyIQ?"*, *"How does he use Redis?"*, *"Who won the cricket match yesterday?"*).
  * **Rule Reminder**: Submitting a question runs client-side analysis and simulates backend traversal; **it never outputs an answer text**.
* **16-Box Architecture Diagram (Sticky Left Column)**:
  * Organized in 4 functional rows:
    1. **Request Path**: `Client`, `API gateway`, `Rate limiter`, `Semantic cache`, `Orchestrator`, `Postgres`, `Vector DB`, `LLM gateway`, `Model`, `Stream (SSE)`.
    2. **Async / After Response**: `Kafka queue`, `Usage & cost`, `Feedback & evals`.
    3. **Ingestion / Offline**: `New docs`, `Embed workers`, `Vector DB upsert`.
  * Highlighted boxes illuminate with accents based on the currently selected step.
* **9-Step Walkthrough (Scrollable Right Column / Next-Prev Stepper)**:
  1. *A question arrives*: Auth + Redis token budget check (429 if empty).
  2. *Check the semantic cache*: 256-dim embedding cosine similarity against query cache (HIT if similarity >= 0.90, bypasses model).
  3. *Orchestrate the request*: Session load from Postgres, tool registry resolution.
  4. *Retrieve only what matters*: pgvector top-k retrieval with similarity scores.
  5. *Call the model — safely*: Resilience4j timeouts, exponential backoff, circuit breakers, fallback routing.
  6. *Stream it back*: Server-Sent Events (SSE) with backpressure.
  7. *Do the bookkeeping later*: Async Kafka events for token usage, billing, and evaluation.
  8. *Keep knowledge fresh*: Idempotent background embedding ingestion via content hashing.
  9. *Now count the boxes*: 16 boxes total, only 1 is the LLM—the rest is distributed backend engineering.
* **Voice Agent Pipeline Section**:
  * Three-stage streaming: `Listen (ASR)` → `Think (LLM)` → `Speak (TTS)` + `Escape Hatch (Human handoff)`.
* **Concept Badges**:
  * Embeddings, Semantic caching, Token budgets, Retries & fallbacks, Streaming SSE, Structured outputs, Tool calling, ASR/TTS, Evals & guardrails.

---

### 4.5 Let’s Talk / Contact (`/connect` & `/hire` — `Hire.dc.html`)
* **Intro Header**: *"Thinking of hiring me, need something built, or just want to talk backend? Pick the path that fits and I’ll take it from there."*
* **Audience Paths (Plain Questions)**:
  1. `01 · Recruiters & hiring managers`: *"Considering me for a role?"* → My 30-second snapshot, résumé, and the fastest way to reach me (`#recruiters`).
  2. `02 · Clients & founders`: *"Need something built?"* → Web, mobile and backend projects — what I build and how we’d work (`#clients`).
  3. `03 · Students & developers`: *"Just want to say hi?"* → Fellow learner? No agenda needed — let’s just talk (`#students`).
* **Recruiter Section**:
  * Label: `FOR RECRUITERS & HIRING MANAGERS`
  * Heading: *"Considering me for your team? Here’s my 30-second snapshot"*
  * Subline: *"Everything you’d check first about me, in one place. Want the depth? The Lab shows how I actually build."*
  * Snapshot Details: Current role (`SDE-1 Backend · StudyIQ`), Experience (`1.5+ years, production backend`), Core stack (`Java, Spring Boot, Kafka, Redis, AWS`), Metrics (`20+ microservices owned, 100K+ req/min peaks, 92%+ cache hits`).
  * CTAs: Download Résumé, Email, LinkedIn, Lab link.
* **Client Section**:
  * 6 Services cards, tech stack row, 4-step process.
  * Heading: *"Why clients can trust me with their project"* followed by *"Services, a sample project plan and answers to common questions are on the Services page →"* (linking to `/services`).
  * 6 Trust cards.
* **Adaptive Contact Form**:
  * URL query param preselection: `?type=client|recruiter|student` automatically selects the audience segment.
  * Founding client offer: When accessed via `?type=client&offer=founding#contact`, displays the note *"Founding client offer: 20% off your first project"* above the message field and includes `offer: "founding"` in the message details payload.
  * Segmented selector: `Recruiter` | `Client` | `Student / developer`.
  * Dynamic form fields and submission state: Displays `202 Accepted · queued for delivery` confirmation card.

---

### 4.6 Services (`/services` — `WorkWithMe.dc.html`)
The dedicated client path page for founders and businesses looking to hire Priyanshu for full-cycle development, reliable backends, and AI agent workflows.
* **1. Hero**:
  * Status badge (green dot): *"Taking on new projects"*
  * Headline: *"Need something built? I’ll build it like it has to survive production — because that’s my day job."*
  * Subline: *"Web and mobile apps, AI agents and backends for startups and small businesses. Fixed quote up front, pay per milestone, and you own the code."*
  * Buttons: `"Get a fixed quote" → /connect?type=client#contact` and `"See how I build ↓" → #work`.
* **2. Services (What I Can Do)**:
  * Heading: *"What I can do for your business"*
  * Subline: *"Tell me the problem in plain words. I’ll suggest the simplest thing that solves it."*
  * 4 Cards (with timeline bracketed placeholders and tech stacks):
    1. *Launch your web or mobile app* (`[6–10 weeks]` · React · Flutter · Spring Boot / Node)
    2. *Automate with AI* (`[2–4 weeks]` · AI agents · WhatsApp · Google Calendar)
    3. *Build reliable backends & APIs* (`[3–6 weeks]` · Spring Boot · Node · Postgres · Redis)
    4. *Fix a slow or crashing system* (`[1–2 weeks]` · profiling · caching · query tuning)
  * Fixed-quote strip: *"Every project gets a fixed quote"* / *"Priced on what you actually need, once I understand your request — no hourly surprises."* / `"Get my quote" → /connect?type=client#contact`.
* **3. How a Project Works**:
  * 4 Sequential Steps: `01 Send your request`, `02 Fixed quote & plan`, `03 Build, demo, pay`, `04 Launch & handover` (`[30 days]` free bug fixes).
* **4. Proof of How I Build (`#work`)**:
  * Heading: *"Proof of how I build"*
  * 3 Proof Cards: Mentors Buddy sole backend developer, 100K+ req/min StudyIQ systems, and live interactive Lab demos.
  * Sample Project Plan Panel: Real milestone breakdown for an AI booking agent clinic project.
  * Founding Client Offer Banner: Controlled by `enabled: true` in `proof.yaml` (20% off first project).
* **5. Why You Can Trust Me With Your Project**:
  * 6 Cards: Production experience, see before you pay, IP ownership, NDA confidentiality, live testable Lab proof, plain-English updates.
* **6. Working Together Strip**:
  * 4 Metrics: Time zone (India IST), Payments (INR, USD, EUR, GBP), Response time (`[within 24 hours]`), Paperwork (written agreement, invoices, NDA).
* **7. FAQ**:
  * Accessible accordion: Single open item, keyboard accessible, 8 client questions addressing costs, timelines, IP ownership, NDA, and post-launch support.
* **8. Footer CTA**:
  * Dark band: *"Tell me what you want to build. You’ll get a fixed quote, not a sales pitch."* / `"Get a fixed quote" → /connect?type=client#contact`.

---

### 4.7 Journey (`/journey` — `Journey.dc.html`)
* **Editorial Layout**: Warm aesthetic (`#F6F1E9`), elegant `Newsreader` serif typography, personal memoir tone. Maintains its warm palette across both site themes (never flips to dark mode, except Chapter 4's dark band).
* **Content Hierarchy**:
  * **Hero**: *"Not everything I’ve built runs on a server."* Subline: *"The chapters of my life so far — the good days, the hard years, and the people who got me through them."*
  * **Prologue** (`Patratu, Jharkhand`): Printed photo effect with white frame, soft drop shadow, rotated −2.5° (or paper-coloured card when no photo is uploaded), italic caption, and story of home before code.
  * **Chapter 01** (`palette: blue`, `#E8EEF2`): *"A borrowed keyboard and my father’s phone"* (`Patratu, Jharkhand · Age 15 · Curious`). Home setup photo, Python from textbooks, pullquote lesson: *"You don’t need the right tools to start. You start with whatever you have."*
  * **Chapter 02** (`palette: sand`, `#F3E6C8`): *"Four years, one scholarship, and a loan worth every rupee"* (`Chandigarh · 2021–2025 · Grateful`). Campus photo, Anidex Flutter app, pullquote lesson: *"When your family gives everything to get you there, you make every semester count."*
  * **Chapter 03** (`palette: green`, `#DDEBDF`): *"A lonely city and my first real bug"* (`Ahmedabad · 2025 · On my own`). Ahmedabad photo, dark-store night shifts, first production bug, pullquote lesson: *"The day you fix a real user’s problem is the day you stop feeling like a student."*
  * **Chapter 04** (`palette: dark`, `#2F2A33`): *"Seven months that tested everything"* (`2025 · Lost`). Centered text-only band, loan repayment stress, resilience, pullquote lesson below thin divider: *"Doubt doesn’t mean you’re on the wrong road. Sometimes the road is just long."*
  * **Chapter 05** (`palette: indigo`, `#E3E7F3`): *"I never chose backend. Backend chose me."* (`Gurugram · 2025 – now · Back on track`). Typographic mood card (large Newsreader period, uppercase mono place, italic mood on `#C9D0E6` box), Mentors Buddy launch, 20+ microservices ownership, pullquote lesson: *"Somewhere along the way, I started choosing it back."*
  * **Ending** (`Chapter 06`): *"Still being written."* Call to action: *"If any of this felt familiar, I’d love to hear your story too."* → Button: *"Say hello"* (`/connect`).
* **Photo Privacy & Optimization Pipeline**:
  * Automated script `pnpm journey:photos` runs before build (`prebuild`).
  * Strips all EXIF metadata and GPS location tags, normalizes orientation, and downscales images to a maximum 2000 px on the long side.
  * Strict validation: build fails if a photo has no alt text or if its referenced file is missing. Chapters without photos cleanly display typographic mood cards.

---

## 5. Architecture & Implementation Blueprint

```mermaid
graph TD
    Client["Browser / Client"] --> NextWeb["Next.js Web App (apps/web)"]
    NextWeb --> NextAPI["Next.js API Routes / BFF"]
    NextAPI --> SpringAPI["Spring Boot 3 API (services/api)"]
    SpringAPI --> Redis["Redis 7 (Rate Limiting, Cache)"]
    SpringAPI --> Postgres["Postgres 16 + pgvector (Data, Chunks)"]
```

### Repository Structure
```
priyanshu-dev/
├── apps/
│   └── web/                   # Next.js 15, App Router, TypeScript (strict)
│       ├── src/
│       │   ├── app/           # App Router pages and layouts
│       │   ├── components/    # Reusable UI components (consume content/)
│       │   └── styles/
│       │       ├── tokens.json# Centralized design tokens
│       │       └── tokens.css # Generated CSS custom properties
│       ├── tsconfig.json
│       └── package.json
├── services/
│   └── api/                   # Spring Boot 3, Java 21, Gradle Kotlin DSL
│       ├── src/main/kotlin/   # (or java/)
│       ├── src/main/resources/
│       │   └── application.yml
│       ├── build.gradle.kts
│       └── settings.gradle.kts
├── content/                   # All text copy lives here (JSON/TS/MD)
├── infra/
│   └── docker-compose.yml     # Postgres 16 (pgvector) + Redis 7
├── docs/
│   ├── PROJECT_BRIEF.md       # This document
│   └── adr/
│       └── 0001-monorepo-and-stack.md
├── design/                    # Untouched HTML reference prototypes
├── .github/
│   └── workflows/
│       └── ci.yml             # Lint, test, build CI workflow
├── .editorconfig
├── .gitignore
├── .env.example
├── README.md
└── LICENSE
```

### Engineering Standards
* **TypeScript Strictness**: `strict: true`, no implicit `any`, strict null checks.
* **Spring Boot Standards**: Clean layered architecture (Controller, Service, Repository), Actuator health probes (`/actuator/health`).
* **Content Immutability**: Code contains zero hardcoded copywriting. Changing copy requires zero JSX/TSX alterations.
