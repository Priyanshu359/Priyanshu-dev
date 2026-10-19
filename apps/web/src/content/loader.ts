import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "yaml";
import { ZodError, type ZodSchema } from "zod";
import {
  AboutSchema,
  AIConceptsSchema,
  AIDiagramSchema,
  AIVoiceSchema,
  AIWalkthroughSchema,
  AskPresetsSchema,
  ConnectClientWorkSchema,
  ConnectContactFormSchema,
  ConnectDevelopersSchema,
  ConnectProcessSchema,
  ConnectRecruitersSchema,
  ConnectServicesSchema,
  ConnectStackSchema,
  HomeSchema,
  JourneyChapterSchema,
  JourneyPrologueSchema,
  JourneyEndingSchema,
  KnowledgeChunkSchema,
  LabSchema,
  LabStorySchema,
  NavSchema,
  ProfileSchema,
  ServicesCtaSchema,
  ServicesFaqSchema,
  ServicesHeroSchema,
  ServicesListSchema,
  ServicesProcessSchema,
  ServicesProofSchema,
  ServicesQuoteSchema,
  ServicesTrustSchema,
  ServicesWorkingSchema,
  type AboutContent,
  type AIConcepts,
  type AIDiagram,
  type AIVoice,
  type AIWalkthrough,
  type AskPresets,
  type ConnectClientWork,
  type ConnectContactForm,
  type ConnectDevelopers,
  type ConnectProcess,
  type ConnectRecruiters,
  type ConnectServices,
  type ConnectStack,
  type HomeContent,
  type JourneyChapter,
  type JourneyPrologue,
  type JourneyEnding,
  type JourneyPhoto,
  type KnowledgeChunk,
  type LabContent,
  type LabStoryContent,
  type Nav,
  type ProfileContent,
  type ServicesCta,
  type ServicesFaq,
  type ServicesHero,
  type ServicesList,
  type ServicesProcess,
  type ServicesProof,
  type ServicesQuote,
  type ServicesTrust,
  type ServicesWorking,
} from "./schema";

/**
 * Locate the `content/` directory regardless of whether the process
 * was launched from the workspace root or from `apps/web/`.
 */
export function getContentDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "content"),
    path.resolve(process.cwd(), "../../content"),
    path.resolve(__dirname, "../../../../content"),
    path.resolve(__dirname, "../../content"),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return dir;
    }
  }

  throw new Error(
    `[Content Loader] Unable to locate 'content/' directory. Checked paths:\n${candidates.join(
      "\n"
    )}`
  );
}

function parseAndValidate<T>(
  filePath: string,
  raw: unknown,
  schema: ZodSchema<T>
): T {
  try {
    return schema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .map((issue) => `  - [${issue.path.join(".") || "root"}]: ${issue.message}`)
        .join("\n");
      throw new Error(
        `[Content ValidationError] Validation failed for file "${filePath}":\n${issues}`
      );
    }
    throw error;
  }
}

function readYamlFile<T>(relativePath: string, schema: ZodSchema<T>): T {
  const fullPath = path.join(getContentDir(), relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`[Content Loader] File not found: ${fullPath}`);
  }
  const fileContent = fs.readFileSync(fullPath, "utf-8");
  const parsed = yaml.parse(fileContent);
  return parseAndValidate(relativePath, parsed, schema);
}

// --- Site Loaders ---

export function getNav(): Nav {
  return readYamlFile("site/nav.yaml", NavSchema);
}

export function getHome(): HomeContent {
  return readYamlFile("site/home.yaml", HomeSchema);
}

export function getAbout(): AboutContent {
  return readYamlFile("site/about.yaml", AboutSchema);
}

export function getProfile(): ProfileContent {
  return readYamlFile("site/profile.yaml", ProfileSchema);
}

// --- Labs Loaders ---

export function getLabSlugs(): string[] {
  const labsDir = path.join(getContentDir(), "labs");
  if (!fs.existsSync(labsDir)) return [];
  return fs
    .readdirSync(labsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function getLab(slug: string): {
  lab: LabContent;
  story?: LabStoryContent;
  results?: Record<string, any>;
} {
  const labYamlPath = path.join("labs", slug, "lab.yaml");
  const lab = readYamlFile(labYamlPath, LabSchema);

  const storyFullPath = path.join(getContentDir(), "labs", slug, "story.mdx");
  let story: LabStoryContent | undefined;

  if (fs.existsSync(storyFullPath)) {
    const raw = fs.readFileSync(storyFullPath, "utf-8");
    const { data, content } = matter(raw);
    story = parseAndValidate(
      path.join("labs", slug, "story.mdx"),
      {
        ...data,
        content: content.trim(),
      },
      LabStorySchema
    );
  }

  const resultsFullPath = path.join(getContentDir(), "labs", slug, "results.json");
  let results: Record<string, any> | undefined;
  if (fs.existsSync(resultsFullPath)) {
    try {
      results = JSON.parse(fs.readFileSync(resultsFullPath, "utf-8"));
    } catch {
      results = undefined;
    }
  }

  return { lab, story, results };
}

export function getLabResults(slug: string): Record<string, any> | undefined {
  const fullPath = path.join(getContentDir(), "labs", slug, "results.json");
  if (!fs.existsSync(fullPath)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  } catch {
    return undefined;
  }
}

export function getLabs(): LabContent[] {
  return getLabSlugs()
    .map((slug) => getLab(slug).lab)
    .sort((a, b) => a.order - b.order);
}

// --- AI Loaders ---

export function getAIWalkthrough(): AIWalkthrough {
  return readYamlFile("ai/walkthrough.yaml", AIWalkthroughSchema);
}

export function getAIDiagram(): AIDiagram {
  return readYamlFile("ai/diagram.yaml", AIDiagramSchema);
}

export function getAIVoice(): AIVoice {
  return readYamlFile("ai/voice.yaml", AIVoiceSchema);
}

export function getAIConcepts(): AIConcepts {
  return readYamlFile("ai/concepts.yaml", AIConceptsSchema);
}

// --- Ask Loaders ---

export function getAskPresets(): AskPresets {
  return readYamlFile("ask/presets.yaml", AskPresetsSchema);
}

export function getKnowledgeChunks(): KnowledgeChunk[] {
  const knowledgeDir = path.join(getContentDir(), "ask/knowledge");
  if (!fs.existsSync(knowledgeDir)) return [];

  const files = fs
    .readdirSync(knowledgeDir)
    .filter((file) => file.endsWith(".md"));

  return files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const fullPath = path.join(knowledgeDir, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);
    return parseAndValidate(
      path.join("ask/knowledge", file),
      {
        slug,
        ...data,
        content: content.trim(),
      },
      KnowledgeChunkSchema
    );
  });
}

export function getKnowledgeChunk(slug: string): KnowledgeChunk {
  const fullPath = path.join(getContentDir(), "ask/knowledge", `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`[Content Loader] Knowledge chunk not found: ${fullPath}`);
  }
  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);
  return parseAndValidate(
    path.join("ask/knowledge", `${slug}.md`),
    {
      slug,
      ...data,
      content: content.trim(),
    },
    KnowledgeChunkSchema
  );
}

// --- Connect Loaders ---

export function getConnectRecruiters(): ConnectRecruiters {
  return readYamlFile("connect/recruiters.yaml", ConnectRecruitersSchema);
}

export function getConnectServices(): ConnectServices {
  return readYamlFile("connect/services.yaml", ConnectServicesSchema);
}

export function getConnectStack(): ConnectStack {
  return readYamlFile("connect/stack.yaml", ConnectStackSchema);
}

export function getConnectProcess(): ConnectProcess {
  return readYamlFile("connect/process.yaml", ConnectProcessSchema);
}

export function getConnectClientWork(): ConnectClientWork {
  return readYamlFile("connect/client-work.yaml", ConnectClientWorkSchema);
}

export function getConnectDevelopers(): ConnectDevelopers {
  return readYamlFile("connect/developers.yaml", ConnectDevelopersSchema);
}

export function getConnectForm(): ConnectContactForm {
  return readYamlFile("connect/contact-form.yaml", ConnectContactFormSchema);
}

// --- Journey Loaders ---

export function validateJourneyPhoto(
  photo: JourneyPhoto,
  sourceFile: string
): void {
  if (!photo.src || photo.src.trim() === "") {
    throw new Error(
      `[Content ValidationError] Photo in "${sourceFile}" must have a valid "src" path.`
    );
  }
  if (!photo.alt || photo.alt.trim() === "") {
    throw new Error(
      `[Content ValidationError] Photo in "${sourceFile}" must have a non-empty "alt" description.`
    );
  }

  // Validate that the file actually exists on disk in content/journey/images
  const journeyDir = path.join(getContentDir(), "journey");
  let resolvedFilePath = path.resolve(journeyDir, photo.src);
  if (!fs.existsSync(resolvedFilePath)) {
    // Also try direct images folder
    const directImagesPath = path.join(journeyDir, "images", path.basename(photo.src));
    if (fs.existsSync(directImagesPath)) {
      resolvedFilePath = directImagesPath;
    } else {
      throw new Error(
        `[Content ValidationError] Journey photo file does not exist: "${photo.src}" referenced in "${sourceFile}". Target path: ${resolvedFilePath}`
      );
    }
  }
}

export function formatJourneyPhotoSrc(src: string): string {
  // Map ./images/file.jpg or images/file.jpg to /content/journey/images/file.jpg
  const filename = path.basename(src);
  return `/content/journey/images/${filename}`;
}

export function getJourneyPrologue(): JourneyPrologue {
  const filePath = path.join(getContentDir(), "journey", "prologue.mdx");
  if (!fs.existsSync(filePath)) {
    throw new Error(`[Content Loader] Journey prologue not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const validated = parseAndValidate(
    path.join("journey", "prologue.mdx"),
    {
      ...data,
      content: content.trim(),
    },
    JourneyPrologueSchema
  );

  if (validated.photo) {
    validateJourneyPhoto(validated.photo, "prologue.mdx");
  }

  return validated;
}

export function getJourneyChapters(): JourneyChapter[] {
  const chaptersDir = path.join(getContentDir(), "journey", "chapters");
  if (!fs.existsSync(chaptersDir)) {
    // Fallback: check journey root if chapters/ doesn't exist
    const journeyDir = path.join(getContentDir(), "journey");
    if (!fs.existsSync(journeyDir)) return [];
    return [];
  }

  const files = fs
    .readdirSync(chaptersDir)
    .filter((file) => file.endsWith(".mdx"))
    .sort();

  const chapters = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const fullPath = path.join(chaptersDir, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);

    const validated = parseAndValidate(
      path.join("journey", "chapters", file),
      {
        slug,
        ...data,
        content: content.trim(),
      },
      JourneyChapterSchema
    );

    if (validated.photo) {
      validateJourneyPhoto(validated.photo, file);
    }

    // Generate label: CHAPTER 0N · PLACE · PERIOD · MOOD (or CHAPTER 04 · PERIOD · MOOD)
    const num = String(validated.order).padStart(2, "0");
    const parts = [`CHAPTER ${num}`];
    if (validated.place && validated.place.trim().length > 0) {
      parts.push(validated.place.toUpperCase());
    }
    parts.push(validated.period.toUpperCase());
    parts.push(validated.mood.toUpperCase());
    validated.label = parts.join(" · ");

    return validated;
  });

  return chapters.sort((a, b) => a.order - b.order);
}

export function getJourneyChapter(slug: string): JourneyChapter {
  let fullPath = path.join(getContentDir(), "journey", "chapters", `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(getContentDir(), "journey", `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`[Content Loader] Journey chapter not found: ${slug}`);
    }
  }
  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);
  const validated = parseAndValidate(
    path.join("journey", `${slug}.mdx`),
    {
      slug,
      ...data,
      content: content.trim(),
    },
    JourneyChapterSchema
  );

  if (validated.photo) {
    validateJourneyPhoto(validated.photo, `${slug}.mdx`);
  }

  const num = String(validated.order).padStart(2, "0");
  const parts = [`CHAPTER ${num}`];
  if (validated.place && validated.place.trim().length > 0) {
    parts.push(validated.place.toUpperCase());
  }
  parts.push(validated.period.toUpperCase());
  parts.push(validated.mood.toUpperCase());
  validated.label = parts.join(" · ");

  return validated;
}

export function getJourneyEnding(): JourneyEnding {
  const filePath = path.join(getContentDir(), "journey", "ending.yaml");
  if (!fs.existsSync(filePath)) {
    throw new Error(`[Content Loader] Journey ending not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = yaml.parse(raw);
  const validated = parseAndValidate(
    path.join("journey", "ending.yaml"),
    parsed,
    JourneyEndingSchema
  );

  // Normalize button object if buttonLabel / buttonLink are provided
  if (!validated.button && validated.buttonLabel && validated.buttonLink) {
    validated.button = {
      label: validated.buttonLabel,
      link: validated.buttonLink,
    };
  }

  return validated;
}

// --- Services Loaders ---

export function getServicesHero(): ServicesHero {
  return readYamlFile("services/hero.yaml", ServicesHeroSchema);
}

export function getServicesList(): ServicesList {
  return readYamlFile("services/services.yaml", ServicesListSchema);
}

export function getServicesQuote(): ServicesQuote {
  return readYamlFile("services/quote.yaml", ServicesQuoteSchema);
}

export function getServicesProcess(): ServicesProcess {
  return readYamlFile("services/process.yaml", ServicesProcessSchema);
}

export function getServicesProof(): ServicesProof {
  return readYamlFile("services/proof.yaml", ServicesProofSchema);
}

export function getServicesTrust(): ServicesTrust {
  return readYamlFile("services/trust.yaml", ServicesTrustSchema);
}

export function getServicesWorking(): ServicesWorking {
  return readYamlFile("services/working.yaml", ServicesWorkingSchema);
}

export function getServicesFaq(): ServicesFaq {
  return readYamlFile("services/faq.yaml", ServicesFaqSchema);
}

export function getServicesCta(): ServicesCta {
  return readYamlFile("services/cta.yaml", ServicesCtaSchema);
}

/**
 * Validates and returns all site content in one call.
 * Useful for build-time validation and tests.
 */
export function getAllContent() {
  return {
    nav: getNav(),
    home: getHome(),
    about: getAbout(),
    profile: getProfile(),
    labs: getLabs(),
    aiWalkthrough: getAIWalkthrough(),
    aiDiagram: getAIDiagram(),
    aiVoice: getAIVoice(),
    aiConcepts: getAIConcepts(),
    askPresets: getAskPresets(),
    knowledgeChunks: getKnowledgeChunks(),
    connectRecruiters: getConnectRecruiters(),
    connectServices: getConnectServices(),
    connectStack: getConnectStack(),
    connectProcess: getConnectProcess(),
    connectClientWork: getConnectClientWork(),
    connectDevelopers: getConnectDevelopers(),
    connectForm: getConnectForm(),
    journeyPrologue: getJourneyPrologue(),
    journeyChapters: getJourneyChapters(),
    journeyEnding: getJourneyEnding(),
    servicesHero: getServicesHero(),
    servicesList: getServicesList(),
    servicesQuote: getServicesQuote(),
    servicesProcess: getServicesProcess(),
    servicesProof: getServicesProof(),
    servicesTrust: getServicesTrust(),
    servicesWorking: getServicesWorking(),
    servicesFaq: getServicesFaq(),
    servicesCta: getServicesCta(),
  };
}
