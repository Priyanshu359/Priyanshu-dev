import { describe, expect, it } from "vitest";
import {
  getAbout,
  getAIConcepts,
  getAIDiagram,
  getAIVoice,
  getAIWalkthrough,
  getAllContent,
  getAskPresets,
  getConnectClientWork,
  getConnectDevelopers,
  getConnectForm,
  getConnectProcess,
  getConnectRecruiters,
  getConnectServices,
  getConnectStack,
  getHome,
  getJourneyChapter,
  getJourneyChapters,
  getJourneyPrologue,
  getJourneyEnding,
  validateJourneyPhoto,
  getKnowledgeChunk,
  getKnowledgeChunks,
  getLab,
  getLabs,
  getNav,
  getProfile,
  getServicesCta,
  getServicesFaq,
  getServicesHero,
  getServicesList,
  getServicesProcess,
  getServicesProof,
  getServicesQuote,
  getServicesTrust,
  getServicesWorking,
} from "./loader";
import { LabSchema, ProfileSchema } from "./schema";

describe("Content System Validation", () => {
  it("parses all content files successfully", () => {
    const all = getAllContent();
    expect(all).toBeDefined();
    expect(all.nav.brand).toBe("priyanshu.dev");
    expect(all.home.hero.name).toBe("Priyanshu Sinha.");
    expect(all.profile.name).toBe("Priyanshu Sinha");
    expect(all.labs.length).toBeGreaterThanOrEqual(2);
    expect(all.aiWalkthrough.steps).toHaveLength(9);
    expect(all.aiDiagram.totalBoxes).toBe(16);
    expect(all.aiVoice.stages).toHaveLength(4);
    expect(all.aiConcepts.items).toHaveLength(9);
    expect(all.askPresets.presets).toHaveLength(3);
    expect(all.knowledgeChunks).toHaveLength(14);
    expect(all.journeyChapters).toHaveLength(5);
    expect(all.journeyPrologue.title).toBe("Before the code, there was home.");
    expect(all.journeyEnding.label).toBe("CHAPTER 06");
    expect(all.servicesList.items).toHaveLength(4);
    expect(all.servicesFaq.items).toHaveLength(8);
  });

  describe("Site Content", () => {
    it("loads nav with valid structure", () => {
      const nav = getNav();
      expect(nav.brand).toBe("priyanshu.dev");
      expect(nav.items.map((i) => i.label)).toEqual(["Lab", "AI", "Journey", "Services"]);
      expect(nav.cta.label).toBe("Let’s talk");
    });

    it("loads home with all facts and actions", () => {
      const home = getHome();
      expect(home.hero.greeting).toBe("Hi, I’m");
      expect(home.hero.facts).toHaveLength(4);
      expect(home.sectionsIndex).toHaveLength(3);
      expect(home.demoConfig.liveBadge).toContain("POST /api/ask");
    });

    it("loads about with both paragraphs", () => {
      const about = getAbout();
      expect(about.paragraphs).toHaveLength(2);
      expect(about.resumeLink.label).toBe("Download résumé (PDF)");
    });

    it("loads profile suitable for /api/me", () => {
      const profile = getProfile();
      expect(profile.role).toBe("Backend Engineer (SDE-1)");
      expect(profile.stack).toContain("Java");
      expect(profile.stack).toContain("Spring Boot");
      expect(profile.stack).toContain("AI Agents");
      expect(profile.hireMe).toBe("POST https://api.priyanshu.dev/hire-me");
    });
  });

  describe("Labs Content", () => {
    it("loads rate limiting lab with settings and story", () => {
      const { lab, story } = getLab("rate-limiting");
      expect(lab.status).toBe("live");
      expect(lab.number).toBe("01");
      expect(lab.settings?.capacity).toBe(5);
      expect(lab.diagram?.nodes).toHaveLength(4);
      expect(story).toBeDefined();
      expect(story?.labId).toBe("rate-limiting");
    });

    it("loads databases lab with 3 experiments", () => {
      const { lab, story } = getLab("databases");
      expect(lab.status).toBe("live");
      expect(lab.number).toBe("02");
      expect(lab.experiments).toBeDefined();
      expect(lab.experiments?.indexes).toBeDefined();
      expect(lab.experiments?.n1).toBeDefined();
      expect(lab.experiments?.transactions).toBeDefined();
      expect(story).toBeDefined();
    });

    it("loads all labs in correct order", () => {
      const labs = getLabs();
      const orders = labs.map((l) => l.order);
      const sorted = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sorted);
    });
  });

  describe("AI Content", () => {
    it("loads 9-step walkthrough with highlighted nodes", () => {
      const ai = getAIWalkthrough();
      expect(ai.steps).toHaveLength(9);
      expect(ai.steps[0].nodes).toContain("client");
      expect(ai.steps[8].nodes).toEqual(["model"]);
    });

    it("loads 16-box diagram with model marked", () => {
      const diagram = getAIDiagram();
      expect(diagram.totalBoxes).toBe(16);
      const allNodes = diagram.lanes.flatMap((lane) =>
        lane.rows.flatMap((r) => r.nodes)
      );
      expect(allNodes).toHaveLength(16);
      const modelNode = allNodes.find((n) => n.id === "model");
      expect(modelNode?.isModel).toBe(true);
    });

    it("loads voice agent pipeline with escape hatch", () => {
      const voice = getAIVoice();
      expect(voice.stages).toHaveLength(4);
      const escape = voice.stages.find((s) => s.id === "escape");
      expect(escape?.isEscapeHatch).toBe(true);
    });

    it("loads concepts list", () => {
      const concepts = getAIConcepts();
      expect(concepts.items.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe("Ask & Knowledge", () => {
    it("loads 3 preset Q&A pairs and 6 pipeline stages", () => {
      const presets = getAskPresets();
      expect(presets.presets).toHaveLength(3);
      expect(presets.pipelineStages).toHaveLength(6);
    });

    it("loads all 14 knowledge chunks", () => {
      const chunks = getKnowledgeChunks();
      expect(chunks).toHaveLength(14);
      const titles = chunks.map((c) => c.title);
      expect(titles).toContain("Current role");
      expect(titles).toContain("Scale & traffic");
      expect(titles).toContain("Mentors Buddy");
    });

    it("retrieves a single knowledge chunk by slug", () => {
      const chunk = getKnowledgeChunk("current-role");
      expect(chunk.title).toBe("Current role");
      expect(chunk.keywords).toContain("studyiq");
      expect(chunk.content).toContain("StudyIQ in Gurugram");
    });
  });

  describe("Connect Content", () => {
    it("loads recruiters snapshot with metrics and placeholders", () => {
      const rec = getConnectRecruiters();
      expect(rec.metrics).toHaveLength(3);
      const noticePeriod = rec.snapshot.find((s) => s.tag === "NOTICE PERIOD");
      expect(noticePeriod?.value).toBe("30 days");
    });

    it("loads services, stack, process, client work, and developers", () => {
      expect(getConnectServices().services).toHaveLength(6);
      expect(getConnectStack().categories).toHaveLength(5);
      expect(getConnectProcess().steps).toHaveLength(4);
      expect(getConnectClientWork().reasons).toHaveLength(6);
      expect(getConnectDevelopers().cards).toHaveLength(3);
    });

    it("loads contact form configuration with 3 segments", () => {
      const form = getConnectForm();
      expect(form.segments.recruiter.label).toBe("Recruiter");
      expect(form.segments.client.label).toBe("Client");
      expect(form.segments.student.label).toBe("Student / developer");
      expect(form.confirmation.statusBadge).toContain("202 Accepted");
    });
  });

  describe("Journey Content", () => {
    it("loads prologue with valid place, title, caption and text", () => {
      const prologue = getJourneyPrologue();
      expect(prologue.place).toBe("Patratu, Jharkhand");
      expect(prologue.title).toBe("Before the code, there was home.");
      expect(prologue.caption).toBe(
        "My mother, father, grandmother, sister and me, at ten."
      );
      expect(prologue.content).toContain("This is our first family photo.");
      expect(prologue.photo?.src).toBe("./images/00-family.jpg");
      expect(prologue.photo?.alt).toBe(
        "My mother, father, grandmother, sister and me, at ten."
      );
    });

    it("loads 5 chapters in chronological order with generated labels and palettes", () => {
      const chapters = getJourneyChapters();
      expect(chapters).toHaveLength(5);
      expect(chapters.map((c) => c.order)).toEqual([1, 2, 3, 4, 5]);

      // Chapter 01
      expect(chapters[0].title).toBe("A borrowed keyboard and my father’s phone");
      expect(chapters[0].palette).toBe("blue");
      expect(chapters[0].label).toBe(
        "CHAPTER 01 · PATRATU, JHARKHAND · AGE 15 · CURIOUS"
      );
      expect(chapters[0].photo?.src).toBe("./images/01-home-setup.jpg");
      expect(chapters[0].photo?.alt).toBe("My home setup at 21");

      // Chapter 02
      expect(chapters[1].title).toBe(
        "Four years, one scholarship, and a loan worth every rupee"
      );
      expect(chapters[1].palette).toBe("sand");
      expect(chapters[1].label).toBe(
        "CHAPTER 02 · CHANDIGARH · 2021–2025 · GRATEFUL"
      );
      expect(chapters[1].photo?.alt).toBe("Chandigarh University campus");

      // Chapter 03
      expect(chapters[2].title).toBe("A lonely city and my first real bug");
      expect(chapters[2].palette).toBe("green");
      expect(chapters[2].label).toBe(
        "CHAPTER 03 · AHMEDABAD · 2025 · ON MY OWN"
      );
      expect(chapters[2].photo?.alt).toBe("Ahmedabad");

      // Chapter 04 (Dark, no photo, no place)
      expect(chapters[3].title).toBe("Seven months that tested everything");
      expect(chapters[3].palette).toBe("dark");
      expect(chapters[3].place).toBeUndefined();
      expect(chapters[3].label).toBe("CHAPTER 04 · 2025 · LOST");
      expect(chapters[3].photo).toBeUndefined();

      // Chapter 05 (Indigo, with photo 05-gurugram.jpg)
      expect(chapters[4].title).toBe("I never chose backend. Backend chose me.");
      expect(chapters[4].palette).toBe("indigo");
      expect(chapters[4].label).toBe(
        "CHAPTER 05 · GURUGRAM · 2025 – NOW · BACK ON TRACK"
      );
      expect(chapters[4].photo?.src).toBe("./images/05-gurugram.jpg");
      expect(chapters[4].photo?.alt).toBe("Gurugram");
    });

    it("loads specific chapter by slug", () => {
      const ch1 = getJourneyChapter("01-patratu");
      expect(ch1.place).toBe("Patratu, Jharkhand");
      expect(ch1.lesson).toBe(
        "You don’t need the right tools to start. You start with whatever you have."
      );
    });

    it("loads journey ending with chapter 06 and call to action", () => {
      const ending = getJourneyEnding();
      expect(ending.label).toBe("CHAPTER 06");
      expect(ending.title).toBe("Still being written.");
      expect(ending.text).toBe(
        "If any of this felt familiar, I’d love to hear your story too."
      );
      expect(ending.button?.label).toBe("Say hello");
      expect(ending.button?.link).toBe("/connect");
    });
  });

  describe("Services Content", () => {
    it("loads services hero with headline and actions", () => {
      const hero = getServicesHero();
      expect(hero.status).toBe("Taking on new projects");
      expect(hero.headline).toContain("Need something built?");
      expect(hero.actions.primary.href).toBe("/connect?type=client#contact");
      expect(hero.actions.secondary.href).toBe("#work");
    });

    it("loads services list with 4 offerings and timeline placeholders", () => {
      const list = getServicesList();
      expect(list.items).toHaveLength(4);
      expect(list.items[0].timeline).toBe("[6–10 weeks]");
      expect(list.items[1].timeline).toBe("[2–4 weeks]");
      expect(list.items[2].timeline).toBe("[3–6 weeks]");
      expect(list.items[3].timeline).toBe("[1–2 weeks]");
    });

    it("loads quote strip with fixed quote messaging", () => {
      const quote = getServicesQuote();
      expect(quote.heading).toBe("Every project gets a fixed quote");
      expect(quote.button.href).toBe("/connect?type=client#contact");
    });

    it("loads process steps with 4 sequential stages", () => {
      const proc = getServicesProcess();
      expect(proc.steps).toHaveLength(4);
      expect(proc.steps[0].number).toBe("01");
      expect(proc.steps[3].description).toContain("[30 days]");
    });

    it("loads proof panel with cards, sample plan, and founding offer banner", () => {
      const proof = getServicesProof();
      expect(proof.cards).toHaveLength(3);
      expect(proof.samplePlan.milestones).toHaveLength(3);
      expect(proof.foundingOffer.enabled).toBe(true);
      expect(proof.foundingOffer.button.href).toBe("/connect?type=client&offer=founding#contact");
    });

    it("loads trust reasons and working together strip", () => {
      const trust = getServicesTrust();
      expect(trust.cards).toHaveLength(6);
      const working = getServicesWorking();
      expect(working.items).toHaveLength(4);
      expect(working.items[2].value).toContain("[within 24 hours]");
    });

    it("loads FAQ with 8 items and footer CTA", () => {
      const faq = getServicesFaq();
      expect(faq.items).toHaveLength(8);
      const cta = getServicesCta();
      expect(cta.button.href).toBe("/connect?type=client#contact");
    });
  });

  describe("Validation Failure Tests", () => {
    it("fails when a lab has an invalid status", () => {
      const invalidLab = {
        id: "bad-lab",
        number: "99",
        title: "Bad Lab",
        tagline: "Invalid",
        status: "invalid-status", // Not "live" or "soon"
        order: 99,
      };

      expect(() => LabSchema.parse(invalidLab)).toThrow();
    });

    it("fails when profile has an invalid email", () => {
      const invalidProfile = {
        name: "Test",
        role: "Dev",
        stack: ["Java"],
        openTo: "work",
        hireMe: "call",
        company: "Test",
        location: "Test",
        email: "not-an-email", // Invalid email
        github: "https://github.com",
        linkedin: "https://linkedin.com",
        resumeUrl: "/resume.pdf",
        microservicesCount: 1,
        peakRpm: "1K",
        cacheHitRate: "90%",
        experienceYears: "1",
        education: {
          institution: "Test",
          degree: "CS",
          period: "2020",
          cgpa: "8.0",
        },
        priorExperience: {
          company: "Test",
          role: "Dev",
          location: "Test",
          period: "2020",
          stack: ["Java"],
          domain: "Test",
        },
      };

      expect(() => ProfileSchema.parse(invalidProfile)).toThrow();
    });

    it("fails when required fields are missing", () => {
      expect(() => LabSchema.parse({ title: "Incomplete" })).toThrow();
    });

    it("fails when a journey photo has missing or empty alt text", () => {
      expect(() =>
        validateJourneyPhoto(
          { src: "./images/01-home-setup.jpg", alt: "" },
          "test-chapter.mdx"
        )
      ).toThrow(/non-empty "alt" description/);
    });

    it("fails when a journey photo file is missing on disk", () => {
      expect(() =>
        validateJourneyPhoto(
          { src: "./images/nonexistent-file.jpg", alt: "Valid alt description" },
          "test-chapter.mdx"
        )
      ).toThrow(/photo file does not exist/);
    });

    it("succeeds when a journey photo has both alt text and valid file", () => {
      expect(() =>
        validateJourneyPhoto(
          { src: "./images/01-home-setup.jpg", alt: "My home setup at 21" },
          "01-patratu.mdx"
        )
      ).not.toThrow();
    });
  });
});
