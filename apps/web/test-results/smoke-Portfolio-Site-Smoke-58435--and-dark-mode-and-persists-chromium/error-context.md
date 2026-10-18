# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Portfolio Site Smoke Tests >> Theme toggle switches between light and dark mode and persists
- Location: tests/smoke.spec.ts:147:7

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "light"
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - navigation "Main" [ref=e4]:
      - generic [ref=e5]:
        - link "priyanshu.dev" [ref=e6] [cursor=pointer]:
          - /url: /
        - button "Switch to light mode" [active] [ref=e7] [cursor=pointer]
      - generic [ref=e10]:
        - link "Lab" [ref=e11] [cursor=pointer]:
          - /url: /lab/rate-limiting
        - link "AI" [ref=e12] [cursor=pointer]:
          - /url: /ai
        - link "Journey" [ref=e13] [cursor=pointer]:
          - /url: /journey
        - link "Let’s talk" [ref=e14] [cursor=pointer]:
          - /url: /hire
  - region "Introduction" [ref=e15]:
    - paragraph [ref=e16]: Hi, I’m
    - heading "Priyanshu Sinha." [level=1] [ref=e17]
    - paragraph [ref=e18]: I build the backends that keep products fast — and the AI that runs on top of them.
    - paragraph [ref=e19]: Backend engineer at StudyIQ, where I own 20+ Java/Spring Boot microservices serving traffic peaks of 100K+ requests a minute. Outside work, I build web, mobile and backend products for clients.
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: NOW
        - generic [ref=e23]: SDE-1 Backend · StudyIQ
      - generic [ref=e24]:
        - generic [ref=e25]: BASED IN
        - generic [ref=e26]: Gurugram, India
      - generic [ref=e27]:
        - generic [ref=e28]: FOCUS
        - generic [ref=e29]: Distributed systems + AI
      - generic [ref=e30]:
        - generic [ref=e31]: OPEN TO
        - generic [ref=e32]: Freelance projects
    - generic [ref=e34]:
      - link "See my backend in action ↓" [ref=e35] [cursor=pointer]:
        - /url: "#demo"
      - link "Work with me" [ref=e36] [cursor=pointer]:
        - /url: /hire
      - link "GitHub" [ref=e37] [cursor=pointer]:
        - /url: https://github.com
      - link "LinkedIn" [ref=e38] [cursor=pointer]:
        - /url: https://linkedin.com
      - link "Résumé" [ref=e39] [cursor=pointer]:
        - /url: /resume.pdf
  - generic [ref=e41]:
    - paragraph [ref=e42]: Backend + AI, live
    - heading "Ask me anything. Then watch your question travel through my backend." [level=2] [ref=e43]
    - paragraph [ref=e44]: "Every AI answer is a backend problem: rate limits, caches, retrieval, streaming. Send a question and see each hop. Then ask the same one again."
  - region "Live request journey" [ref=e45]:
    - generic [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]: LIVE · POST /api/ask
        - generic [ref=e51]:
          - generic [ref=e52]:
            - text: "requests:"
            - strong [ref=e53]: "0"
          - generic [ref=e54]:
            - text: "cache hits:"
            - strong [ref=e55]: "0"
          - generic [ref=e56]:
            - text: "tokens left:"
            - strong [ref=e57]: 5/5
          - 'button "Playback: slow-mo" [ref=e58] [cursor=pointer]'
      - generic [ref=e59]:
        - generic [ref=e60]:
          - button "What does Priyanshu work on?" [pressed] [ref=e61] [cursor=pointer]
          - button "How does he handle traffic spikes?" [ref=e62] [cursor=pointer]
          - button "Has he built AI systems?" [ref=e63] [cursor=pointer]
        - button "Send request →" [ref=e64] [cursor=pointer]
      - generic [ref=e65]:
        - generic [ref=e66]:
          - generic [ref=e67]: "01"
          - generic [ref=e68]: API gateway
          - generic [ref=e69]: auth + routing
          - generic [ref=e70]: 2 ms
        - generic [ref=e71]:
          - generic [ref=e72]: "02"
          - generic [ref=e73]: Rate limiter
          - generic [ref=e74]: Redis token bucket
          - generic [ref=e75]: 1 ms
        - generic [ref=e76]:
          - generic [ref=e77]: "03"
          - generic [ref=e78]: Cache
          - generic [ref=e79]: Redis lookup
          - generic [ref=e80]: 1 ms
        - generic [ref=e81]:
          - generic [ref=e82]: "04"
          - generic [ref=e83]: Retriever
          - generic [ref=e84]: vector search, top-3
          - generic [ref=e85]: 38 ms
        - generic [ref=e86]:
          - generic [ref=e87]: "05"
          - generic [ref=e88]: LLM
          - generic [ref=e89]: generate answer
          - generic [ref=e90]: 840 ms
        - generic [ref=e91]:
          - generic [ref=e92]: "06"
          - generic [ref=e93]: Stream
          - generic [ref=e94]: SSE to browser
          - generic [ref=e95]: streamed
      - generic [ref=e99]:
        - generic [ref=e100]: HTTP/1.1 —
        - generic [ref=e101]: "X-Cache: —"
        - generic [ref=e102]: "X-RateLimit-Remaining: 5"
        - generic [ref=e103]: "X-Response-Time: —"
        - generic [ref=e105]: Pick a question and send it.
      - paragraph [ref=e106]: "Try it: send a question, then send the same one again — the cache answers it without touching the model. Spam it and the rate limiter steps in. Stages are slowed down so you can see them; the labels show real timings. Switch to real speed to see how fast it actually is."
  - region "For developers" [ref=e107]:
    - generic [ref=e108]:
      - paragraph [ref=e109]: For developers
      - heading "Prefer the terminal? So do I." [level=2] [ref=e110]
      - paragraph [ref=e111]: My whole profile is an API. Fetch it, pipe it through jq, or hire me straight from the command line.
    - generic [ref=e113]:
      - generic [ref=e114]:
        - generic [ref=e115]: $curl https://api.priyanshu.dev/me
        - button "Copy to clipboard" [ref=e121] [cursor=pointer]: copy
      - generic [ref=e122]: "{ \"name\": \"Priyanshu Sinha\", \"role\": \"Backend Engineer (SDE-1)\", \"stack\": [ \"Java\", \"Spring Boot\", \"Kafka\", \"Redis\" ], \"openTo\": \"freelance\", \"hireMe\": \"POST https://api.priyanshu.dev/hire-me\" }"
  - region "Sections" [ref=e123]:
    - generic [ref=e124]:
      - link "01 / The Lab Backend concepts, running live Rate limiting, caching, locks, retries — each with a diagram, a live demo and the code." [ref=e125] [cursor=pointer]:
        - /url: /lab/rate-limiting
        - generic [ref=e126]: 01 / The Lab
        - generic [ref=e127]: Backend concepts, running live
        - generic [ref=e128]: Rate limiting, caching, locks, retries — each with a diagram, a live demo and the code.
      - link "02 / AI How I design AI-powered systems RAG, LLM gateways and voice pipelines, explained from the backend up." [ref=e129] [cursor=pointer]:
        - /url: /ai
        - generic [ref=e130]: 02 / AI
        - generic [ref=e131]: How I design AI-powered systems
        - generic [ref=e132]: RAG, LLM gateways and voice pipelines, explained from the backend up.
      - link "03 / Journey The person behind the code Every phase so far — the wins, the hard years and what they taught me." [ref=e133] [cursor=pointer]:
        - /url: /journey
        - generic [ref=e134]: 03 / Journey
        - generic [ref=e135]: The person behind the code
        - generic [ref=e136]: Every phase so far — the wins, the hard years and what they taught me.
  - generic [ref=e138]:
    - generic [ref=e139]:
      - heading "Inside the Lab" [level=2] [ref=e140]
      - link "Start with rate limiting →" [ref=e141] [cursor=pointer]:
        - /url: /lab/rate-limiting
    - generic [ref=e142]:
      - link "Rate limiting Spam a button, watch the token bucket drain and the 429s arrive. LIVE" [ref=e143] [cursor=pointer]:
        - /url: /lab/rate-limiting
        - generic [ref=e144]: Rate limiting
        - generic [ref=e145]: Spam a button, watch the token bucket drain and the 429s arrive.
        - generic [ref=e146]: LIVE
      - link "Databases Query plans and indexes, the N+1 problem, and a race condition that pays out twice. LIVE" [ref=e147] [cursor=pointer]:
        - /url: /lab/databases
        - generic [ref=e148]: Databases
        - generic [ref=e149]: Query plans and indexes, the N+1 problem, and a race condition that pays out twice.
        - generic [ref=e150]: LIVE
      - generic [ref=e151]:
        - generic [ref=e152]: Caching
        - generic [ref=e153]: Same request twice — see the latency drop and X-Cache flip to HIT.
        - generic [ref=e154]: SOON
      - generic [ref=e155]:
        - generic [ref=e156]: Flash sale without overselling
        - generic [ref=e157]: Hundreds of buyers, ten items, one distributed lock.
        - generic [ref=e158]: SOON
      - generic [ref=e159]:
        - generic [ref=e160]: Idempotent payments
        - generic [ref=e161]: Double-click “Pay” and still get charged once.
        - generic [ref=e162]: SOON
      - generic [ref=e163]:
        - generic [ref=e164]: Circuit breaker
        - generic [ref=e165]: Break a downstream service and watch it fail fast, then recover.
        - generic [ref=e166]: SOON
      - generic [ref=e167]:
        - generic [ref=e168]: Queues, retries and dead letters
        - generic [ref=e169]: Messages fail, back off, retry, and land safely in a DLQ.
        - generic [ref=e170]: SOON
  - generic [ref=e171]:
    - heading "About" [level=2] [ref=e173]
    - generic [ref=e174]:
      - paragraph [ref=e175]: I started as a backend intern on a U.S. healthcare platform and now run production services at StudyIQ. On the side I take on freelance projects — web, mobile and the backends behind them.
      - paragraph [ref=e176]: "I care about the parts of software nobody sees until they break: queues, caches, transactions, and what happens at peak traffic. I build AI-powered features the same way — backend first."
      - link "Download résumé (PDF)" [ref=e177] [cursor=pointer]:
        - /url: /resume.pdf
  - contentinfo [ref=e178]:
    - generic [ref=e179]:
      - heading "Need a backend built — or fixed? Let’s talk." [level=2] [ref=e180]
      - generic [ref=e181]:
        - link "Work with me" [ref=e182] [cursor=pointer]:
          - /url: /hire
        - link "GitHub" [ref=e183] [cursor=pointer]:
          - /url: https://github.com
        - link "LinkedIn" [ref=e184] [cursor=pointer]:
          - /url: https://linkedin.com
      - paragraph [ref=e185]: "served today: [live count] · cache hits: [live count] · rate limits triggered: [live count]"
```

# Test source

```ts
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
> 160 |     expect(newTheme).not.toBe(initialTheme);
      |                          ^ Error: expect(received).not.toBe(expected) // Object.is equality
  161 | 
  162 |     // Reload page and verify persisted
  163 |     await page.reload();
  164 |     const reloadedTheme = await page.locator("html").getAttribute("data-theme");
  165 |     expect(reloadedTheme).toBe(newTheme);
  166 |   });
  167 | });
  168 | 
```