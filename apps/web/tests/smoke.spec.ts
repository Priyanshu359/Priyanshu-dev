import { test, expect } from "@playwright/test";

test.describe("Portfolio Site Smoke Tests", () => {
  test("Home page (/) loads, displays pipeline widget and developer endpoints", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Priyanshu Sinha/);

    // Check heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // Verify developer curl commands point to domain
    const curlSnippet = page.locator("text=curl https://api.priyanshu.dev/me");
    await expect(curlSnippet).toBeVisible();

    // Verify request journey interactive simulator
    const sendButton = page.locator("button:has-text('Send request')");
    await expect(sendButton).toBeVisible();

    // Click Send request and verify response inspector updates
    await sendButton.click();
    await expect(page.locator("text=200 OK")).toBeVisible({ timeout: 10000 });
  });

  test("Rate limiting lab (/lab/rate-limiting) token bucket demo and live response log", async ({
    page,
  }) => {
    await page.goto("/lab/rate-limiting");
    await expect(page).toHaveTitle(/Rate limiting/);

    // Send single request
    const sendBtn = page.locator("button:has-text('Send 1 request')");
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();
    await expect(page.locator("text=200 OK").first()).toBeVisible();

    // Burst requests to deplete bucket
    const burstBtn = page.locator("button:has-text('Burst 10')");
    await expect(burstBtn).toBeVisible();
    await burstBtn.click();

    // Verify 429 appears in log
    await expect(page.locator("text=429 Too Many Requests").first()).toBeVisible();
  });

  test("Databases lab (/lab/databases) index explorer, N+1 counter, transactions timeline", async ({
    page,
  }) => {
    await page.goto("/lab/databases");
    await expect(page).toHaveTitle(/Databases/);

    // Experiment 1: Index strategy
    const runExplainBtn = page.locator("button:has-text('Run EXPLAIN ANALYZE')");
    await expect(runExplainBtn).toBeVisible();
    await runExplainBtn.click();
    await expect(page.locator("text=Seq Scan on orders").or(page.locator("text=Index Scan"))).toBeVisible();

    // Experiment 2: N+1 queries
    const callEndpointBtn = page.locator("button:has-text('Call the endpoint')");
    await expect(callEndpointBtn).toBeVisible();

    // Experiment 3: Transactions
    const runTxBtn = page.locator("button:has-text('Fire both requests')");
    await expect(runTxBtn).toBeVisible();
  });

  test("AI page (/ai) pinned 16-box diagram and scroll-driven steps without answer text", async ({
    page,
  }) => {
    await page.goto("/ai");
    await expect(page).toHaveTitle(/AI/);

    // Verify diagram header exists
    const diagramHeader = page.locator("text=AI-POWERED PLATFORM");
    await expect(diagramHeader).toBeVisible();

    // Test question input in client app box
    const questionInput = page.locator("#ai-input");
    await expect(questionInput).toBeVisible();
    await questionInput.fill("What is your current role?");

    const sendBtn = page.locator("button:has-text('Send')").first();
    await sendBtn.click();

    // Verify telemetry panels updated without leaking answer text
    await expect(page.locator("text=YOUR REQUEST").first()).toBeVisible();
  });

  test("Connect page (/connect & /hire) adaptive contact form and path cards", async ({
    page,
  }) => {
    await page.goto("/connect");
    await expect(page).toHaveTitle(/Let’s talk/);

    // Verify 3 path cards
    await expect(page.locator("text=“Considering me for a role?”")).toBeVisible();
    await expect(page.locator("text=“We need something built.”")).toBeVisible();
    await expect(page.locator("text=“Just saying hi.”")).toBeVisible();

    // Verify form adaptation
    const recruiterBtn = page.locator("button:has-text('Recruiter')");
    const clientBtn = page.locator("button:has-text('Client')");
    const studentBtn = page.locator("button:has-text('Student / developer')");

    await expect(recruiterBtn).toBeVisible();
    await clientBtn.click();
    await expect(page.locator("label:has-text('What do you need?')")).toBeVisible();

    await studentBtn.click();
    await expect(page.locator("label:has-text('What’s on your mind?')")).toBeVisible();

    // Form fill and submission test
    await page.fill("#c-name", "Test User");
    await page.fill("#c-email", "test@example.com");
    await page.fill("#c-msg", "Hello from automated test!");

    const submitBtn = page.locator("button:has-text('Say hi')");
    await submitBtn.click();

    // Confirmation screen
    await expect(page.locator("text=202 Accepted · queued for delivery")).toBeVisible();

    // Verify /hire route renders same
    await page.goto("/hire");
    await expect(page).toHaveTitle(/Let’s talk/);
  });

  test("Journey page (/journey) warm styling, Newsreader font and 6 chapters", async ({
    page,
  }) => {
    await page.goto("/journey");
    await expect(page).toHaveTitle(/Journey/);

    // Verify title and subtitle
    await expect(page.locator("text=Not everything I’ve built runs on a server.")).toBeVisible();

    // Verify chapters 1 through 6
    await expect(page.locator("text=Where it began")).toBeVisible();
    await expect(page.locator("text=Four years, one scholarship, a lot of late nights")).toBeVisible();
    await expect(page.locator("text=A new city, and real code for real people")).toBeVisible();
    await expect(page.locator("text=The first real job")).toBeVisible();
    await expect(page.locator("text=Still being written.")).toBeVisible();
  });

  test("Theme toggle switches between light and dark mode and persists", async ({
    page,
  }) => {
    await page.goto("/");
    const themeBtn = page.locator("header nav button[aria-label*='mode']");
    await expect(themeBtn).toBeVisible();

    // Check initial html data-theme
    const initialTheme = await page.locator("html").getAttribute("data-theme");

    // Click toggle
    await themeBtn.click();
    const expectedTheme = initialTheme === "dark" ? "light" : "dark";
    await expect(page.locator("html")).toHaveAttribute("data-theme", expectedTheme);

    // Reload page and verify persisted
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", expectedTheme);
  });
});
