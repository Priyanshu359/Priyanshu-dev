# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Portfolio Site Smoke Tests >> Home page (/) loads, displays pipeline widget and developer endpoints
- Location: tests/smoke.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=200 OK')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=200 OK') with timeout 5000ms
  - waiting for locator('text=200 OK')

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
- region "Introduction":
  - paragraph: Hi, I’m
  - heading "Priyanshu Sinha." [level=1]
  - paragraph: I build the backends that keep products fast — and the AI that runs on top of them.
  - paragraph: Backend engineer at StudyIQ, where I own 20+ Java/Spring Boot microservices serving traffic peaks of 100K+ requests a minute. Outside work, I build web, mobile and backend products for clients.
  - text: NOW SDE-1 Backend · StudyIQ BASED IN Gurugram, India FOCUS Distributed systems + AI OPEN TO Freelance projects
  - link "See my backend in action ↓":
    - /url: "#demo"
  - link "Work with me":
    - /url: /hire
  - link "GitHub":
    - /url: https://github.com
  - link "LinkedIn":
    - /url: https://linkedin.com
  - link "Résumé":
    - /url: /resume.pdf
- paragraph: Backend + AI, live
- heading "Ask me anything. Then watch your question travel through my backend." [level=2]
- paragraph: "Every AI answer is a backend problem: rate limits, caches, retrieval, streaming. Send a question and see each hop. Then ask the same one again."
- region "Live request journey":
  - text: "LIVE · POST /api/ask requests:"
  - strong: "0"
  - text: "cache hits:"
  - strong: "0"
  - text: "tokens left:"
  - strong: 5/5
  - 'button "Playback: slow-mo"'
  - button "What does Priyanshu work on?" [pressed]
  - button "How does he handle traffic spikes?"
  - button "Has he built AI systems?"
  - button "Send request →"
  - text: "01 API gateway auth + routing 2 ms 02 Rate limiter Redis token bucket 1 ms 03 Cache Redis lookup 1 ms 04 Retriever vector search, top-3 38 ms 05 LLM generate answer 840 ms 06 Stream SSE to browser streamed HTTP/1.1 — X-Cache: — X-RateLimit-Remaining: 5 X-Response-Time: — Pick a question and send it."
  - paragraph: "Try it: send a question, then send the same one again — the cache answers it without touching the model. Spam it and the rate limiter steps in. Stages are slowed down so you can see them; the labels show real timings. Switch to real speed to see how fast it actually is."
- region "For developers":
  - paragraph: For developers
  - heading "Prefer the terminal? So do I." [level=2]
  - paragraph: My whole profile is an API. Fetch it, pipe it through jq, or hire me straight from the command line.
  - text: $curl https://api.priyanshu.dev/me
  - button "Copy to clipboard": copy
  - text: "{ \"name\": \"Priyanshu Sinha\", \"role\": \"Backend Engineer (SDE-1)\", \"stack\": [ \"Java\", \"Spring Boot\", \"Kafka\", \"Redis\" ], \"openTo\": \"freelance\", \"hireMe\": \"POST https://api.priyanshu.dev/hire-me\" }"
- region "Sections":
  - link "01 / The Lab Backend concepts, running live Rate limiting, caching, locks, retries — each with a diagram, a live demo and the code.":
    - /url: /lab/rate-limiting
  - link "02 / AI How I design AI-powered systems RAG, LLM gateways and voice pipelines, explained from the backend up.":
    - /url: /ai
  - link "03 / Journey The person behind the code Every phase so far — the wins, the hard years and what they taught me.":
    - /url: /journey
- heading "Inside the Lab" [level=2]
- link "Start with rate limiting →":
  - /url: /lab/rate-limiting
- link "Rate limiting Spam a button, watch the token bucket drain and the 429s arrive. LIVE":
  - /url: /lab/rate-limiting
- link "Databases Query plans and indexes, the N+1 problem, and a race condition that pays out twice. LIVE":
  - /url: /lab/databases
- text: Caching Same request twice — see the latency drop and X-Cache flip to HIT. SOON Flash sale without overselling Hundreds of buyers, ten items, one distributed lock. SOON Idempotent payments Double-click “Pay” and still get charged once. SOON Circuit breaker Break a downstream service and watch it fail fast, then recover. SOON Queues, retries and dead letters Messages fail, back off, retry, and land safely in a DLQ. SOON
- heading "About" [level=2]
- paragraph: I started as a backend intern on a U.S. healthcare platform and now run production services at StudyIQ. On the side I take on freelance projects — web, mobile and the backends behind them.
- paragraph: "I care about the parts of software nobody sees until they break: queues, caches, transactions, and what happens at peak traffic. I build AI-powered features the same way — backend first."
- link "Download résumé (PDF)":
  - /url: /resume.pdf
- contentinfo:
  - heading "Need a backend built — or fixed? Let’s talk." [level=2]
  - link "Work with me":
    - /url: /hire
  - link "GitHub":
    - /url: https://github.com
  - link "LinkedIn":
    - /url: https://linkedin.com
  - paragraph: "served today: [live count] · cache hits: [live count] · rate limits triggered: [live count]"
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
> 24  |     await expect(page.locator("text=200 OK")).toBeVisible();
      |                                               ^ Error: expect(locator).toBeVisible() failed
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
  88  |     await expect(page.locator("text=YOUR REQUEST").first()).toBeVisible();
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
```