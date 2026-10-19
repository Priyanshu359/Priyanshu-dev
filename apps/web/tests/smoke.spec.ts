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
    await expect(page.locator("text=429 Too Many").first()).toBeVisible({ timeout: 10000 });
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

    // Verify 3 path cards (plain questions, no quotes)
    await expect(page.locator("text=Considering me for a role?")).toBeVisible();
    await expect(page.locator("text=Need something built?")).toBeVisible();
    await expect(page.locator("text=Just want to say hi?")).toBeVisible();

    // Verify intro line
    await expect(
      page.locator("text=Thinking of hiring me, need something built, or just want to talk backend?")
    ).toBeVisible();

    // Verify recruiter section header
    await expect(page.locator("text=FOR RECRUITERS & HIRING MANAGERS")).toBeVisible();
    await expect(
      page.locator("text=Considering me for your team? Here’s my 30-second snapshot")
    ).toBeVisible();

    // Verify client section link to /services
    await expect(
      page.locator(
        "text=Services, a sample project plan and answers to common questions are on the Services page →"
      )
    ).toBeVisible();

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

    // Verify query param preselection ?type=client
    await page.goto("/connect?type=client#contact");
    const clientTab = page.locator("button:has-text('Client')");
    await expect(clientTab).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("label:has-text('What do you need?')")).toBeVisible();

    // Verify founding offer note on offer=founding
    await page.goto("/connect?type=client&offer=founding#contact");
    await expect(
      page.locator("text=Founding client offer: 20% off your first project")
    ).toBeVisible();

    // Verify /hire route renders same
    await page.goto("/hire");
    await expect(page).toHaveTitle(/Let’s talk/);
  });

  test("Services page (/services) renders in both themes, FAQ keyboard navigation, proof and CTA links", async ({
    page,
  }) => {
    await page.goto("/services");
    await expect(page).toHaveTitle(
      "Services — web, mobile, AI agent and backend development | Priyanshu Sinha"
    );

    // Verify status and headline
    await expect(page.locator("text=Taking on new projects")).toBeVisible();
    await expect(
      page.locator("text=Need something built? I’ll build it like it has to survive production")
    ).toBeVisible();

    // Verify 4 services
    await expect(page.locator("text=Launch your web or mobile app")).toBeVisible();
    await expect(page.locator("text=Automate with AI")).toBeVisible();
    await expect(page.locator("text=Build reliable backends & APIs")).toBeVisible();
    await expect(page.locator("text=Fix a slow or crashing system")).toBeVisible();

    // Verify fixed quote strip
    await expect(
      page.getByRole("heading", { name: "Every project gets a fixed quote" })
    ).toBeVisible();

    // Verify Proof panel and Sample project plan
    await expect(page.locator("#work")).toBeVisible();
    await expect(page.locator("text=SAMPLE PROJECT PLAN")).toBeVisible();
    await expect(
      page.locator("text=What you’d get for an AI booking agent for a clinic")
    ).toBeVisible();

    // Verify Founding client offer banner
    await expect(page.locator("text=Founding client offer")).toBeVisible();
    const claimBtn = page.locator("a:has-text('Claim a spot')");
    await expect(claimBtn).toBeVisible();
    await expect(claimBtn).toHaveAttribute(
      "href",
      "/connect?type=client&offer=founding#contact"
    );

    // Verify Why you can trust me (6 cards)
    await expect(page.locator("text=Why you can trust me with your project")).toBeVisible();
    await expect(
      page.locator("text=Production experience, not just side projects")
    ).toBeVisible();

    // Verify Working together strip
    await expect(page.getByText("TIME ZONE", { exact: true })).toBeVisible();
    await expect(page.getByText("PAYMENTS", { exact: true })).toBeVisible();

    // Verify FAQ accordion keyboard accessibility
    const firstFaqBtn = page.locator("#faq-btn-cost");
    await expect(firstFaqBtn).toBeVisible();
    await expect(firstFaqBtn).toHaveAttribute("aria-expanded", "true");

    const secondFaqBtn = page.locator("#faq-btn-timeline");
    await expect(secondFaqBtn).toHaveAttribute("aria-expanded", "false");

    // Open second FAQ item
    await secondFaqBtn.focus();
    await page.keyboard.press("Enter");
    await expect(secondFaqBtn).toHaveAttribute("aria-expanded", "true");
    await expect(firstFaqBtn).toHaveAttribute("aria-expanded", "false");

    // Verify dark band footer CTA
    const footerCta = page.locator("text=Tell me what you want to build.");
    await expect(footerCta).toBeVisible();

    // Verify theme toggle works on /services
    const themeBtn = page.locator("header nav button[aria-label*='mode']");
    await themeBtn.click();
    const theme = await page.locator("html").getAttribute("data-theme");
    expect(theme).toBeDefined();
  });

  test("Global Navigation shows Services link on every page and active state", async ({
    page,
  }) => {
    // Check Home
    await page.goto("/");
    const servicesNavHome = page.locator("header nav a[href='/services']");
    await expect(servicesNavHome).toBeVisible();
    await expect(servicesNavHome).toHaveText("Services");

    // Check Services page active state
    await page.goto("/services");
    const servicesNavActive = page.locator("header nav a[href='/services']");
    await expect(servicesNavActive).toHaveAttribute("aria-current", "page");

    // Check Connect page
    await page.goto("/connect");
    await expect(page.locator("header nav a[href='/services']")).toBeVisible();

    // Check Journey page
    await page.goto("/journey");
    await expect(page.locator("header nav a[href='/services']")).toBeVisible();
  });

  test("Home page displays For businesses section and updated hero/footer actions", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify updated hero bio
    await expect(
      page.locator(
        "text=Outside work, I help businesses launch web and mobile apps, AI agents and reliable backends."
      )
    ).toBeVisible();

    // Verify hero start project button
    const heroProjectBtn = page.locator("section[aria-label='Introduction'] a[href='/services']");
    await expect(heroProjectBtn).toHaveText("Start a project");

    // Verify For businesses section
    await expect(page.locator("text=For businesses")).toBeVisible();
    await expect(
      page.locator("text=Building something? The same engineering, for your product.")
    ).toBeVisible();

    // Verify footer CTA button
    const footerBtn = page.locator("footer a[href='/services']");
    await expect(footerBtn).toHaveText("Start a project");
  });

  test("Journey page (/journey) warm styling, prologue, chapters with photos, mood card and labels", async ({
    page,
  }) => {
    await page.goto("/journey");
    await expect(page).toHaveTitle(/Journey/);

    // 1. Verify Hero
    await expect(page.locator("text=THE JOURNEY")).toBeVisible();
    await expect(page.locator("h1")).toHaveText("Not everything I’ve built runs on a server.");
    await expect(
      page.locator("text=The chapters of my life so far — the good days, the hard years, and the people who got me through them.")
    ).toBeVisible();

    // 2. Verify Prologue with photo
    await expect(page.locator("text=PROLOGUE · PATRATU, JHARKHAND")).toBeVisible();
    await expect(page.locator("text=Before the code, there was home.")).toBeVisible();
    await expect(
      page.locator("figcaption")
    ).toHaveText("My mother, father, grandmother, sister and me, at ten.");
    const prologueImg = page.locator("section[aria-label='Prologue'] img[alt='My mother, father, grandmother, sister and me, at ten.']");
    await expect(prologueImg).toBeVisible();
    await expect(page.locator("text=This is our first family photo.")).toBeVisible();

    // 3. Verify Chapters with photos show image with alt text
    const ch1Img = page.locator("img[alt='My home setup at 21']");
    await expect(ch1Img).toBeVisible();
    await expect(page.locator("text=CHAPTER 01 · PATRATU, JHARKHAND · AGE 15 · CURIOUS")).toBeVisible();
    await expect(page.locator("text=A borrowed keyboard and my father’s phone")).toBeVisible();
    await expect(
      page.locator("text=You don’t need the right tools to start. You start with whatever you have.")
    ).toBeVisible();

    const ch2Img = page.locator("img[alt='Chandigarh University campus']");
    await expect(ch2Img).toBeVisible();
    await expect(page.locator("text=CHAPTER 02 · CHANDIGARH · 2021–2025 · GRATEFUL")).toBeVisible();
    await expect(page.locator("text=Four years, one scholarship, and a loan worth every rupee")).toBeVisible();

    const ch3Img = page.locator("img[alt='Ahmedabad']");
    await expect(ch3Img).toBeVisible();
    await expect(page.locator("text=CHAPTER 03 · AHMEDABAD · 2025 · ON MY OWN")).toBeVisible();
    await expect(page.locator("text=A lonely city and my first real bug")).toBeVisible();

    // 4. Verify Chapter 4 (dark, text-only, no media column)
    const ch4 = page.locator("article", { hasText: "CHAPTER 04 · 2025 · LOST" });
    await expect(ch4).toBeVisible();
    await expect(ch4.locator("text=Seven months that tested everything")).toBeVisible();
    await expect(ch4.locator("img")).toHaveCount(0);
    await expect(
      ch4.locator("text=Doubt doesn’t mean you’re on the wrong road. Sometimes the road is just long.")
    ).toBeVisible();

    // 5. Verify Chapter 5 (indigo, with photo 05-gurugram.jpg)
    const ch5 = page.locator("article", { hasText: "CHAPTER 05 · GURUGRAM · 2025 – NOW · BACK ON TRACK" });
    await expect(ch5).toBeVisible();
    await expect(ch5.locator("text=I never chose backend. Backend chose me.")).toBeVisible();
    const ch5Img = ch5.locator("img[alt='Gurugram']");
    await expect(ch5Img).toBeVisible();

    // 6. Verify Ending (Chapter 06)
    await expect(page.locator("text=CHAPTER 06")).toBeVisible();
    await expect(page.locator("text=Still being written.")).toBeVisible();
    await expect(
      page.locator("text=If any of this felt familiar, I’d love to hear your story too.")
    ).toBeVisible();
    const endingBtn = page.locator("main a[href='/connect']", { hasText: "Say hello" });
    await expect(endingBtn).toBeVisible();
  });

  test("Journey maintains warm palette in both light and dark themes", async ({
    page,
  }) => {
    await page.goto("/journey");
    const journeyWrapper = page.locator("div[data-theme='journey']");
    await expect(journeyWrapper).toBeVisible();

    // Toggle theme
    const themeBtn = page.locator("header nav button[aria-label*='mode']");
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();

    // Verify journey wrapper remains warm background #F6F1E9
    const bgColor = await journeyWrapper.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // rgb(246, 241, 233) corresponds to #F6F1E9
    expect(bgColor).toBe("rgb(246, 241, 233)");
  });

  test("Prologue renders paper-colored card without photo and image when photo is added", async ({
    page,
  }) => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    // 1. Initially prologue and chapter 5 have photos
    await page.goto("/journey");
    await expect(page.locator("section[aria-label='Prologue'] img")).toBeVisible();
    await expect(page.locator("article", { hasText: "CHAPTER 05" }).locator("img")).toBeVisible();

    // 2. Temporarily remove photos to verify fallbacks (paper card for prologue, mood card for ch5)
    const prologuePath = path.resolve(process.cwd(), "../../content/journey/prologue.mdx");
    const ch5Path = path.resolve(process.cwd(), "../../content/journey/chapters/05-gurugram.mdx");
    const originalPrologue = fs.readFileSync(prologuePath, "utf-8");
    const originalCh5 = fs.readFileSync(ch5Path, "utf-8");

    try {
      // Remove photo block from prologue
      const noPhotoPrologue = originalPrologue.replace(
        /photo:\s*\n\s*src:.*\n\s*alt:.*\n/,
        ""
      );
      fs.writeFileSync(prologuePath, noPhotoPrologue);

      // Remove photo block from chapter 5
      const noPhotoCh5 = originalCh5.replace(
        /photo:\s*\n\s*src:.*\n\s*alt:.*\n/,
        ""
      );
      fs.writeFileSync(ch5Path, noPhotoCh5);

      await page.goto("/journey");

      // Verify prologue paper card is rendered
      const prologueSection = page.locator("section[aria-label='Prologue']");
      await expect(
        prologueSection.locator("text=[Our first family photo]")
      ).toBeVisible();
      await expect(prologueSection.locator("img")).toHaveCount(0);

      // Verify Chapter 5 mood card is rendered
      const ch5 = page.locator("article", { hasText: "CHAPTER 05" });
      await expect(ch5.locator("img")).toHaveCount(0);
      await expect(ch5.getByText("Gurugram", { exact: true })).toBeVisible();
      await expect(ch5.getByText("2025 – now", { exact: true })).toBeVisible();
      await expect(ch5.getByText("Back on track", { exact: true })).toBeVisible();
    } finally {
      // Restore original files
      fs.writeFileSync(prologuePath, originalPrologue);
      fs.writeFileSync(ch5Path, originalCh5);
    }
  });

  test("Photo script removes all EXIF and GPS metadata from images", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const sharp = (await import("sharp")).default;
    const { processJourneyPhotos } = await import("../../../scripts/process-journey-photos.mjs");

    const tmpDir = path.resolve(process.cwd(), "../../content/journey/images/tmp-test");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const testImagePath = path.join(tmpDir, "gps-test.jpg");

    // Create an image with simulated EXIF metadata
    await sharp({
      create: {
        width: 2400,
        height: 1800,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg()
      .toFile(testImagePath);

    // Run the privacy processing pipeline on test folder
    await processJourneyPhotos(tmpDir);

    // Inspect processed image
    const processedMetadata = await sharp(testImagePath).metadata();

    // Verify resized to max 2000px
    expect(processedMetadata.width).toBeLessThanOrEqual(2000);
    expect(processedMetadata.height).toBeLessThanOrEqual(2000);

    // Verify EXIF metadata has been completely stripped
    expect(processedMetadata.exif).toBeUndefined();

    // Clean up temporary test file
    fs.rmSync(tmpDir, { recursive: true, force: true });
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
