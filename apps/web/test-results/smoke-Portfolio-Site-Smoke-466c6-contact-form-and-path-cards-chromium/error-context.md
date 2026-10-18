# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Portfolio Site Smoke Tests >> Connect page (/connect & /hire) adaptive contact form and path cards
- Location: tests/smoke.spec.ts:91:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('label:has-text(\'What do you need?\')')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('label:has-text(\'What do you need?\')') with timeout 5000ms
  - waiting for locator('label:has-text(\'What do you need?\')')

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
- main:
  - paragraph: Let’s talk
  - heading "Whoever you are, there’s a way in." [level=1]
  - paragraph: Hiring, building something, or just starting out in backend — pick the path that fits and I’ll take it from there.
  - region "Choose your path":
    - link "01 · Recruiters & hiring managers “We’re hiring.” A 30-second snapshot, my résumé, and the fastest way to reach me. See the snapshot ↓":
      - /url: "#recruiters"
    - link "02 · Clients & founders “We need something built.” Web, mobile and backend projects — what I build and how we’d work. See services ↓":
      - /url: "#clients"
    - link "03 · Students & developers “Just saying hi.” Fellow learner? No agenda needed — let’s just talk. Say hi ↓":
      - /url: "#students"
  - paragraph: FOR RECRUITERS
  - heading "The 30-second snapshot" [level=2]
  - paragraph: Everything you’d look for first, in one place. Want the depth? The Lab shows how I actually build.
  - text: CURRENT ROLE SDE-1 Backend · StudyIQ EXPERIENCE 1.5+ years, production backend CORE STACK Java, Spring Boot, Kafka, Redis, AWS LOCATION Gurugram · [open to relocation?] LOOKING FOR [Backend / SDE roles] NOTICE PERIOD [X days] 20+ microservices owned in production 100K+ requests/minute at observed peaks 92% cache hit rate on read-heavy paths
  - link "Download résumé (PDF)":
    - /url: /resume.pdf
  - link "Email me":
    - /url: mailto:priyanshu.kr.sinha74@gmail.com
  - link "LinkedIn":
    - /url: https://linkedin.com
  - link "See how I build →":
    - /url: /lab/rate-limiting
  - paragraph: FOR CLIENTS & FOUNDERS
  - heading "Your app, end to end — with a backend that holds up" [level=2]
  - paragraph: "I build web and mobile products for startups and small teams: the React or Flutter app your users see, and the APIs, database and infrastructure underneath it."
  - heading "Full product builds" [level=3]
  - paragraph: React web app, Flutter mobile app, backend and database — one developer, one plan.
  - heading "Backend & APIs" [level=3]
  - paragraph: REST APIs, auth, payments, notifications and admin panels, built to scale.
  - heading "AI features" [level=3]
  - paragraph: Chat over your documents, smart search, voice assistants — wired in properly.
  - heading "Performance rescue" [level=3]
  - paragraph: Slow pages, timeouts, crashes at peak traffic. I find the bottleneck and fix it.
  - heading "Database design" [level=3]
  - paragraph: Schemas, indexes and migrations that keep working as your data grows.
  - heading "Deployment & DevOps" [level=3]
  - paragraph: Docker, CI/CD and AWS, so releases are boring and rollbacks are one click.
  - text: FRONTEND React, Flutter BACKEND Spring Boot, Node.js, Express DATA MySQL, PostgreSQL, Redis CLOUD AWS, Docker, CI/CD
  - heading "How we’d work together" [level=3]
  - text: "01"
  - heading "Discovery call" [level=4]
  - paragraph: The problem, your users, your budget.
  - text: "02"
  - heading "Plan & quote" [level=4]
  - paragraph: Screens, architecture, milestones, fixed price.
  - text: "03"
  - heading "Build in sprints" [level=4]
  - paragraph: Weekly demos on a live staging link.
  - text: "04"
  - heading "Launch & handover" [level=4]
  - paragraph: Deployed, documented, and yours.
  - heading "Client work" [level=3]
  - text: under NDA · walkthroughs on a call
  - article:
    - text: "[CLIENT TYPE] · [YEAR] NDA"
    - heading "[What you built, in one line]" [level=4]
    - paragraph:
      - strong: "Problem:"
      - text: "[what the client needed]."
      - strong: "Built:"
      - text: "[your part]."
      - strong: "Outcome:"
      - text: "[a result you can share]."
    - paragraph: “[Client testimonial]” — [Name, role]
  - article:
    - text: "[CLIENT TYPE] · [YEAR] NDA"
    - heading "[What you built, in one line]" [level=4]
    - paragraph:
      - strong: "Problem:"
      - text: "[what the client needed]."
      - strong: "Built:"
      - text: "[your part]."
      - strong: "Outcome:"
      - text: "[a result you can share]."
    - paragraph: “[Client testimonial]” — [Name, role]
  - paragraph: FOR STUDENTS & DEVELOPERS
  - heading "No agenda. Just a conversation." [level=2]
  - paragraph: I’m still learning too. If you’re a student or a developer and something here clicked with you, write to me. Some of the best people I know started as a random “hey, saw your work.”
  - heading "Tell me what you’re building" [level=3]
  - paragraph: Side project, college project, something at work — I’d genuinely like to hear about it.
  - heading "Share something you learned" [level=3]
  - paragraph: A bug that taught you something, an article you loved. I’ll probably share one back.
  - heading "Or just say hi" [level=3]
  - paragraph: That’s reason enough.
  - heading "Send me a message" [level=2]
  - paragraph: Tell me who you are and the form adapts to what I need to know.
  - paragraph:
    - text: "Or email directly:"
    - link "priyanshu.kr.sinha74@gmail.com":
      - /url: mailto:priyanshu.kr.sinha74@gmail.com
  - paragraph: This form is rate-limited too. Of course it is.
  - group "I am a":
    - button "Recruiter" [pressed]
    - button "Client"
    - button "Student / developer"
  - text: Name
  - textbox "Name"
  - text: Work email
  - textbox "Work email"
  - text: Company
  - textbox "Company"
  - text: Role / link to job description
  - textbox "Role / link to job description"
  - text: Anything else I should know?
  - textbox "Anything else I should know?"
  - button "Send to Priyanshu"
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
> 109 |     await expect(page.locator("label:has-text('What do you need?')")).toBeVisible();
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
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