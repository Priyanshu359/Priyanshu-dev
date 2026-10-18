# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Portfolio Site Smoke Tests >> Rate limiting lab (/lab/rate-limiting) token bucket demo and live response log
- Location: tests/smoke.spec.ts:27:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=429 Too Many Requests').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=429 Too Many Requests').first() with timeout 5000ms
  - waiting for locator('text=429 Too Many Requests').first()

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
- link "01 Rate limiting":
  - /url: /lab/rate-limiting
- link "02 Databases":
  - /url: /lab/databases
- text: 03 Caching · soon 04 Flash sale · soon
- paragraph: Lab / 01 · Rate limiting
- heading "How do you stop one user from taking down your API?" [level=1]
- paragraph: A rate limiter decides, in under a millisecond, whether a request gets through. Here’s a token bucket running live. Give each user a bucket of tokens; every request spends one; tokens refill at a steady rate. Empty bucket means 429.
- region "Live demo":
  - text: "LIVE · capacity 5 · refills 1 token / 2s Your bucket tokens: 5 / 5"
  - button "Send 1 request"
  - button "Burst 10"
  - button "Reset"
  - text: 0 200 OK 0 429 Too Many // Network — same as F12 → Network on the live site Send a request to see the response headers.
  - paragraph: On the live site these requests hit a real Spring Boot endpoint backed by Redis. Open your Network tab and the headers above appear there too.
- heading "The architecture" [level=2]
- paragraph: The check happens before your request ever reaches business logic, and the counter lives in Redis so every server instance shares one view of each user.
- text: Client your browser Rate-limit filter Spring OncePerRequestFilter Redis Lua script, atomic Controller only if allowed bucket empty → 429 + Retry-After, controller never runs
- heading "The core of it" [level=2]
- text: "-- token_bucket.lua (runs atomically inside Redis) local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens') or ARGV[1]) local last = tonumber(redis.call('HGET', KEYS[1], 'ts') or ARGV[3]) local refill = math.floor((ARGV[3] - last) / ARGV[2]) tokens = math.min(ARGV[1], tokens + refill) if tokens < 1 then return {0, tokens} end redis.call('HSET', KEYS[1], 'tokens', tokens - 1, 'ts', ARGV[3]) return {1, tokens - 1}"
- link "Full source on GitHub →":
  - /url: https://github.com
- heading "Trade-offs I weighed" [level=2]
- heading "Token bucket" [level=3]
- paragraph: Allows short bursts, smooth over time. Good default for user-facing APIs.
- heading "Sliding window" [level=3]
- paragraph: Stricter and fairer at window edges, but costs more memory per user.
- heading "Why Lua in Redis" [level=3]
- paragraph: Read-check-write in one atomic step, so two servers can’t both spend the last token.
- link "← All demos":
  - /url: /
- 'link "Next: 02 Databases →"':
  - /url: /lab/databases
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
> 45  |     await expect(page.locator("text=429 Too Many Requests").first()).toBeVisible();
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
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
```