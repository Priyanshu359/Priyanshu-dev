# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Portfolio Site Smoke Tests >> AI page (/ai) pinned 16-box diagram and scroll-driven steps without answer text
- Location: tests/smoke.spec.ts:69:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=YOUR REQUEST').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=YOUR REQUEST').first() with timeout 5000ms
  - waiting for locator('text=YOUR REQUEST').first()

```

```yaml
- banner:
  - navigation "Main":
    - link "priyanshu.dev":
      - /url: /
    - button "Switch to light mode"
    - link "Lab":
      - /url: /lab/rate-limiting
    - link "AI":
      - /url: /ai
    - link "Journey":
      - /url: /journey
    - link "Let’s talk":
      - /url: /hire
- paragraph: AI · architecture walkthrough
- heading "In every AI product, the backend is the real hero." [level=1]
- paragraph: The model gets the headlines. But what makes an AI feature fast, affordable and reliable is everything around it. Type any question into the app below, then scroll through the nine steps at your own pace and see exactly what each box does with it.
- text: type a question below and follow it through the system ↓
- region "Architecture walkthrough":
  - text: AI-POWERED PLATFORM · STEP 1 / 9
  - button "Previous step" [disabled]: ←
  - button "Next step": →
  - text: client · priyanshu.dev/ask Ask a question
  - textbox "Ask a question":
    - /placeholder: Type any question…
    - text: What is your current role?
  - button "Send"
  - button "What does he do at StudyIQ?"
  - button "How does he use Redis?"
  - button "Who won the cricket match yesterday?"
  - text: Type a question and press Send. Nothing is answered — you’ll see how it flows. REQUEST PATH Client browser / app API gateway auth, routing Rate limiter token budget · Redis Semantic cache Redis Orchestrator Spring Boot Postgres sessions, users Vector DB pgvector LLM gateway retry · breaker · fallback Model AI the AI Stream SSE to client ASYNC · AFTER THE RESPONSE Queue Kafka Usage & cost per feature Feedback evals INGESTION · OFFLINE New docs uploads, CMS Embed workers chunk + embed → Vector DB idempotent upsert 01
  - heading "A question arrives" [level=3]
  - paragraph: Auth first, then a per-user token budget checked in Redis. One runaway script can burn a month’s AI bill — the limiter is the first line of defence.
  - text: Spring Security · Redis Lua · 429 + Retry-After 02
  - heading "Check the semantic cache" [level=3]
  - paragraph: Similar questions often have the same answer. A cache hit returns in milliseconds and never touches the model — the cheapest AI call is the one you don’t make.
  - text: Redis · embedding similarity · TTL 03
  - heading "Orchestrate the request" [level=3]
  - paragraph: A Spring Boot service loads the user’s session and context from Postgres, decides what to retrieve, and which tools the model may call.
  - text: Spring Boot · Postgres · tool registry 04
  - heading "Retrieve only what matters" [level=3]
  - paragraph: Vector search finds the few chunks relevant to this question. Short, grounded prompts are faster, cheaper and hallucinate less.
  - text: pgvector · top-k · metadata filters 05
  - heading "Call the model — safely" [level=3]
  - paragraph: Timeouts, retries with backoff, a circuit breaker, and a cheaper fallback model when the main one struggles. The model is one box; the safety net around it is backend.
  - text: Resilience4j · backoff · fallback routing 06
  - heading "Stream it back" [level=3]
  - paragraph: Tokens flow back over Server-Sent Events as they’re generated, so the first word appears long before the answer is finished.
  - text: SSE · backpressure · cancellation 07
  - heading "Do the bookkeeping later" [level=3]
  - paragraph: Token usage, cost per feature and user feedback go onto a queue. The user never waits for analytics.
  - text: Kafka · consumers · idempotent writes 08
  - heading "Keep knowledge fresh" [level=3]
  - paragraph: New documents go through a queue to embedding workers. Jobs are idempotent, so a retry never creates duplicate vectors.
  - text: queue · workers · upsert by content hash 09
  - heading "Now count the boxes" [level=3]
  - paragraph: Sixteen boxes on this diagram. One of them is the model. Almost everything that makes the product fast, cheap and reliable is backend.
  - text: that’s the job I do
- paragraph: Built in production
- 'heading "Voice agents: same story, tighter deadline" [level=2]'
- paragraph: I’ve built an ASR → LLM → TTS pipeline to automate support calls. In voice, every stage has to stream into the next — silence on a phone call feels like a bug.
- text: 1 · LISTEN Speech → text Stream audio, detect end of turn 2 · THINK LLM + context Account lookup, intent, answer 3 · SPEAK Text → speech Speak the first sentence early ESCAPE HATCH Hand off to a human Low confidence or frustrated caller
- heading "Concepts I work with" [level=2]
- text: Embeddings & vector search Semantic caching Token budgets Retries & fallbacks Streaming (SSE) Structured outputs Tool calling ASR / TTS Evals & guardrails
- link "← Back to the Lab":
  - /url: /lab/rate-limiting
- link "Building an AI feature? Let’s talk →":
  - /url: /connect
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe("Portfolio Site Smoke Tests", () => {
  4   |   test("Home page (/) loads, displays pipeline widget and developer endpoints", async ({
  5   |     page,
  6   |   }) => {
  7   |     await page.goto("/");
  8   |     await expect(page).toHaveTitle(/Priyanshu Sinha/);
  9   | 
  10  |     // Check heading
  11  |     const heading = page.locator("h1");
  12  |     await expect(heading).toBeVisible();
  13  | 
  14  |     // Verify developer curl commands point to domain
  15  |     const curlSnippet = page.locator("text=curl https://api.priyanshu.dev/me");
  16  |     await expect(curlSnippet).toBeVisible();
  17  | 
  18  |     // Verify request journey interactive simulator
  19  |     const sendButton = page.locator("button:has-text('Send request')");
  20  |     await expect(sendButton).toBeVisible();
  21  | 
  22  |     // Click Send request and verify response inspector updates
  23  |     await sendButton.click();
  24  |     await expect(page.locator("text=200 OK")).toBeVisible();
  25  |   });
  26  | 
  27  |   test("Rate limiting lab (/lab/rate-limiting) token bucket demo and live response log", async ({
  28  |     page,
  29  |   }) => {
  30  |     await page.goto("/lab/rate-limiting");
  31  |     await expect(page).toHaveTitle(/Rate limiting/);
  32  | 
  33  |     // Send single request
  34  |     const sendBtn = page.locator("button:has-text('Send 1 request')");
  35  |     await expect(sendBtn).toBeVisible();
  36  |     await sendBtn.click();
  37  |     await expect(page.locator("text=200 OK").first()).toBeVisible();
  38  | 
  39  |     // Burst requests to deplete bucket
  40  |     const burstBtn = page.locator("button:has-text('Burst 10')");
  41  |     await expect(burstBtn).toBeVisible();
  42  |     await burstBtn.click();
  43  | 
  44  |     // Verify 429 appears in log
  45  |     await expect(page.locator("text=429 Too Many Requests").first()).toBeVisible();
  46  |   });
  47  | 
  48  |   test("Databases lab (/lab/databases) index explorer, N+1 counter, transactions timeline", async ({
  49  |     page,
  50  |   }) => {
  51  |     await page.goto("/lab/databases");
  52  |     await expect(page).toHaveTitle(/Databases/);
  53  | 
  54  |     // Experiment 1: Index strategy
  55  |     const runExplainBtn = page.locator("button:has-text('Run EXPLAIN ANALYZE')");
  56  |     await expect(runExplainBtn).toBeVisible();
  57  |     await runExplainBtn.click();
  58  |     await expect(page.locator("text=Seq Scan on orders").or(page.locator("text=Index Scan"))).toBeVisible();
  59  | 
  60  |     // Experiment 2: N+1 queries
  61  |     const callEndpointBtn = page.locator("button:has-text('Call the endpoint')");
  62  |     await expect(callEndpointBtn).toBeVisible();
  63  | 
  64  |     // Experiment 3: Transactions
  65  |     const runTxBtn = page.locator("button:has-text('Fire both requests')");
  66  |     await expect(runTxBtn).toBeVisible();
  67  |   });
  68  | 
  69  |   test("AI page (/ai) pinned 16-box diagram and scroll-driven steps without answer text", async ({
  70  |     page,
  71  |   }) => {
  72  |     await page.goto("/ai");
  73  |     await expect(page).toHaveTitle(/AI/);
  74  | 
  75  |     // Verify diagram header exists
  76  |     const diagramHeader = page.locator("text=AI-POWERED PLATFORM");
  77  |     await expect(diagramHeader).toBeVisible();
  78  | 
  79  |     // Test question input in client app box
  80  |     const questionInput = page.locator("#ai-input");
  81  |     await expect(questionInput).toBeVisible();
  82  |     await questionInput.fill("What is your current role?");
  83  | 
  84  |     const sendBtn = page.locator("button:has-text('Send')").first();
  85  |     await sendBtn.click();
  86  | 
  87  |     // Verify telemetry panels updated without leaking answer text
> 88  |     await expect(page.locator("text=YOUR REQUEST").first()).toBeVisible();
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  89  |   });
  90  | 
  91  |   test("Connect page (/connect & /hire) adaptive contact form and path cards", async ({
  92  |     page,
  93  |   }) => {
  94  |     await page.goto("/connect");
  95  |     await expect(page).toHaveTitle(/Let’s talk/);
  96  | 
  97  |     // Verify 3 path cards
  98  |     await expect(page.locator("text=“We’re hiring.”")).toBeVisible();
  99  |     await expect(page.locator("text=“We need something built.”")).toBeVisible();
  100 |     await expect(page.locator("text=“Just saying hi.”")).toBeVisible();
  101 | 
  102 |     // Verify form adaptation
  103 |     const recruiterBtn = page.locator("button:has-text('Recruiter')");
  104 |     const clientBtn = page.locator("button:has-text('Client')");
  105 |     const studentBtn = page.locator("button:has-text('Student / developer')");
  106 | 
  107 |     await expect(recruiterBtn).toBeVisible();
  108 |     await clientBtn.click();
  109 |     await expect(page.locator("label:has-text('What do you need?')")).toBeVisible();
  110 | 
  111 |     await studentBtn.click();
  112 |     await expect(page.locator("label:has-text('What’s on your mind?')")).toBeVisible();
  113 | 
  114 |     // Form fill and submission test
  115 |     await page.fill("#c-name", "Test User");
  116 |     await page.fill("#c-email", "test@example.com");
  117 |     await page.fill("#c-msg", "Hello from automated test!");
  118 | 
  119 |     const submitBtn = page.locator("button:has-text('Say hi')");
  120 |     await submitBtn.click();
  121 | 
  122 |     // Confirmation screen
  123 |     await expect(page.locator("text=202 Accepted · queued for delivery")).toBeVisible();
  124 | 
  125 |     // Verify /hire route renders same
  126 |     await page.goto("/hire");
  127 |     await expect(page).toHaveTitle(/Let’s talk/);
  128 |   });
  129 | 
  130 |   test("Journey page (/journey) warm styling, Newsreader font and 6 chapters", async ({
  131 |     page,
  132 |   }) => {
  133 |     await page.goto("/journey");
  134 |     await expect(page).toHaveTitle(/Journey/);
  135 | 
  136 |     // Verify title and subtitle
  137 |     await expect(page.locator("text=Not everything I’ve built runs on a server.")).toBeVisible();
  138 | 
  139 |     // Verify chapters 1 through 6
  140 |     await expect(page.locator("text=Where it began")).toBeVisible();
  141 |     await expect(page.locator("text=Four years, one scholarship, a lot of late nights")).toBeVisible();
  142 |     await expect(page.locator("text=A new city, and real code for real people")).toBeVisible();
  143 |     await expect(page.locator("text=The first real job")).toBeVisible();
  144 |     await expect(page.locator("text=Still being written.")).toBeVisible();
  145 |   });
  146 | 
  147 |   test("Theme toggle switches between light and dark mode and persists", async ({
  148 |     page,
  149 |   }) => {
  150 |     await page.goto("/");
  151 |     const themeBtn = page.locator("header nav button[aria-label*='mode']");
  152 |     await expect(themeBtn).toBeVisible();
  153 | 
  154 |     // Check initial html data-theme
  155 |     const initialTheme = await page.locator("html").getAttribute("data-theme");
  156 | 
  157 |     // Click toggle
  158 |     await themeBtn.click();
  159 |     const newTheme = await page.locator("html").getAttribute("data-theme");
  160 |     expect(newTheme).not.toBe(initialTheme);
  161 | 
  162 |     // Reload page and verify persisted
  163 |     await page.reload();
  164 |     const reloadedTheme = await page.locator("html").getAttribute("data-theme");
  165 |     expect(reloadedTheme).toBe(newTheme);
  166 |   });
  167 | });
  168 | 
```