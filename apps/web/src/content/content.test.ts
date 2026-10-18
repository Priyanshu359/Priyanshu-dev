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
  getKnowledgeChunk,
  getKnowledgeChunks,
  getLab,
  getLabs,
  getNav,
  getProfile,
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
    expect(all.journeyChapters).toHaveLength(6);
  });

  describe("Site Content", () => {
    it("loads nav with valid structure", () => {
      const nav = getNav();
      expect(nav.brand).toBe("priyanshu.dev");
      expect(nav.items.map((i) => i.label)).toEqual(["Lab", "AI", "Journey"]);
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
      expect(profile.stack).toEqual(["Java", "Spring Boot", "Kafka", "Redis"]);
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
      expect(noticePeriod?.value).toBe("[X days]");
    });

    it("loads services, stack, process, client work, and developers", () => {
      expect(getConnectServices().services).toHaveLength(6);
      expect(getConnectStack().categories).toHaveLength(4);
      expect(getConnectProcess().steps).toHaveLength(4);
      expect(getConnectClientWork().projects).toHaveLength(2);
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
    it("loads 6 chapters in chronological order", () => {
      const chapters = getJourneyChapters();
      expect(chapters).toHaveLength(6);
      expect(chapters.map((c) => c.order)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(chapters[0].title).toBe("Where it began");
      expect(chapters[3].isDark).toBe(true);
      expect(chapters[5].title).toBe("Still being written.");
    });

    it("loads specific chapter by slug", () => {
      const ch1 = getJourneyChapter("01-where-it-began");
      expect(ch1.place).toBe("[HOMETOWN]");
      expect(ch1.photoPlaceholder).toBe("[Childhood photo]");
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
  });
});
