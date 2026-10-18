import { z } from "zod";

// --- Site Schemas ---

export const NavItemSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const NavSchema = z.object({
  brand: z.string(),
  items: z.array(NavItemSchema),
  cta: NavItemSchema,
  themeToggle: z.object({
    lightLabel: z.string(),
    darkLabel: z.string(),
  }),
});

export const HomeHeroFactSchema = z.object({
  tag: z.string(),
  value: z.string(),
  active: z.boolean().optional(),
});

export const HomeSectionIndexItemSchema = z.object({
  id: z.string(),
  tag: z.string(),
  heading: z.string(),
  description: z.string(),
  href: z.string(),
});

export const HomeSchema = z.object({
  hero: z.object({
    greeting: z.string(),
    name: z.string(),
    tagline: z.string(),
    bio: z.string(),
    facts: z.array(HomeHeroFactSchema),
    actions: z.object({
      primary: z.object({
        label: z.string(),
        href: z.string(),
      }),
      secondary: z.object({
        label: z.string(),
        href: z.string(),
      }),
      socials: z.array(
        z.object({
          label: z.string(),
          href: z.string(),
        })
      ),
    }),
  }),
  demoIntro: z.object({
    kicker: z.string(),
    title: z.string(),
    subtitle: z.string(),
  }),
  demoConfig: z.object({
    liveBadge: z.string(),
    note: z.string(),
    rateLimitBlockedText: z.string(),
  }),
  developerTerminal: z.object({
    kicker: z.string(),
    title: z.string(),
    text: z.string(),
    command: z.string(),
  }),
  sectionsIndex: z.array(HomeSectionIndexItemSchema),
  labOverview: z.object({
    title: z.string(),
    cta: z.string(),
    ctaHref: z.string(),
  }),
  footer: z.object({
    heading: z.string(),
    primaryCta: z.object({
      label: z.string(),
      href: z.string(),
    }),
    secondaryLinks: z.array(
      z.object({
        label: z.string(),
        href: z.string(),
      })
    ),
    telemetryFormat: z.string(),
  }),
});

export const AboutSchema = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()),
  resumeLink: z.object({
    label: z.string(),
    href: z.string(),
  }),
});

export const ProfileSchema = z.object({
  name: z.string(),
  role: z.string(),
  stack: z.array(z.string()),
  openTo: z.string(),
  hireMe: z.string(),
  company: z.string(),
  location: z.string(),
  email: z.string().email(),
  github: z.string().url(),
  linkedin: z.string().url(),
  resumeUrl: z.string(),
  microservicesCount: z.number(),
  peakRpm: z.string(),
  cacheHitRate: z.string(),
  experienceYears: z.string(),
  education: z.object({
    institution: z.string(),
    degree: z.string(),
    period: z.string(),
    cgpa: z.string(),
    scholarship: z.string().optional(),
  }),
  priorExperience: z.object({
    company: z.string(),
    role: z.string(),
    location: z.string(),
    period: z.string(),
    stack: z.array(z.string()),
    domain: z.string(),
  }),
});

// --- Lab Schemas ---

export const LabDiagramNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sub: z.string(),
  highlight: z.boolean().optional(),
});

export const LabDiagramEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string(),
});

export const LabDiagramSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  alertNote: z.string().optional(),
  nodes: z.array(LabDiagramNodeSchema),
  edges: z.array(LabDiagramEdgeSchema),
});

export const LabSettingsSchema = z.object({
  capacity: z.number().optional(),
  refillRateMs: z.number().optional(),
  refillTokens: z.number().optional(),
});

export const LabTradeOffSchema = z.object({
  title: z.string(),
  text: z.string(),
});

export const LabNavigationSchema = z.object({
  prev: z
    .object({
      label: z.string(),
      href: z.string(),
    })
    .optional(),
  next: z
    .object({
      label: z.string(),
      href: z.string(),
    })
    .optional(),
});

export const LabSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  tagline: z.string(),
  status: z.enum(["live", "soon"]),
  order: z.number(),
  kicker: z.string().optional(),
  headline: z.string().optional(),
  intro: z.string().optional(),
  note: z.string().optional(),
  liveBadge: z.string().optional(),
  settings: LabSettingsSchema.optional(),
  diagram: LabDiagramSchema.optional(),
  experimentCopy: z.record(z.string(), z.string()).optional(),
  experiments: z.record(z.string(), z.any()).optional(),
  codeSection: z
    .object({
      title: z.string(),
      filename: z.string(),
      code: z.string(),
      githubLinkText: z.string().optional(),
      githubUrl: z.string().optional(),
    })
    .optional(),
  tradeOffsHeading: z.string().optional(),
  tradeOffs: z.array(LabTradeOffSchema).optional(),
  navigation: LabNavigationSchema.optional(),
});

export const LabStorySchema = z.object({
  title: z.string(),
  labId: z.string(),
  order: z.number(),
  content: z.string(),
});

// --- AI Schemas ---

export const AIWalkthroughStepSchema = z.object({
  step: z.number(),
  num: z.string(),
  title: z.string(),
  nodes: z.array(z.string()),
  text: z.string(),
  tech: z.string(),
});

export const AIWalkthroughSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  intro: z.string(),
  clientKicker: z.string(),
  clientHeader: z.string(),
  inputPlaceholder: z.string(),
  buttonLabel: z.string(),
  samplePrompts: z.array(z.string()),
  metaDefault: z.string(),
  steps: z.array(AIWalkthroughStepSchema),
  navigation: z
    .object({
      prev: z.object({ label: z.string(), href: z.string() }),
      next: z.object({ label: z.string(), href: z.string() }),
    })
    .optional(),
});

export const AIDiagramNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sub: z.string(),
  lane: z.string(),
  isModel: z.boolean().optional(),
});

export const AIDiagramRowSchema = z.object({
  id: z.string(),
  arrow: z.boolean(),
  nodes: z.array(AIDiagramNodeSchema),
});

export const AIDiagramLaneSchema = z.object({
  id: z.string(),
  label: z.string(),
  rows: z.array(AIDiagramRowSchema),
});

export const AIDiagramSchema = z.object({
  title: z.string(),
  totalBoxes: z.number(),
  modelBoxes: z.number(),
  backendBoxes: z.number(),
  lanes: z.array(AIDiagramLaneSchema),
});

export const AIVoiceStageSchema = z.object({
  id: z.string(),
  badge: z.string(),
  title: z.string(),
  description: z.string(),
  highlight: z.boolean().optional(),
  isEscapeHatch: z.boolean().optional(),
});

export const AIVoiceSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  subtitle: z.string(),
  stages: z.array(AIVoiceStageSchema),
});

export const AIConceptItemSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const AIConceptsSchema = z.object({
  heading: z.string(),
  items: z.array(AIConceptItemSchema),
});

// --- Ask & Knowledge Schemas ---

export const AskPresetItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
});

export const AskPipelineStageSchema = z.object({
  id: z.string(),
  num: z.string(),
  name: z.string(),
  sub: z.string(),
  ms: z.string(),
});

export const AskPresetsSchema = z.object({
  presets: z.array(AskPresetItemSchema),
  pipelineStages: z.array(AskPipelineStageSchema),
});

export const KnowledgeChunkSchema = z.object({
  slug: z.string(),
  title: z.string(),
  keywords: z.string(),
  category: z.string().optional(),
  content: z.string(),
});

// --- Connect / Hire Schemas ---

export const ConnectRecruiterSnapshotItemSchema = z.object({
  tag: z.string(),
  value: z.string(),
});

export const ConnectRecruiterMetricSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const ConnectRecruitersSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  subtitle: z.string(),
  snapshot: z.array(ConnectRecruiterSnapshotItemSchema),
  metrics: z.array(ConnectRecruiterMetricSchema),
  actions: z.object({
    resume: z.object({ label: z.string(), href: z.string() }),
    email: z.object({ label: z.string(), href: z.string() }),
    linkedin: z.object({ label: z.string(), href: z.string() }),
    labLink: z.object({ label: z.string(), href: z.string() }),
  }),
});

export const ConnectServiceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export const ConnectServicesSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  subtitle: z.string(),
  services: z.array(ConnectServiceItemSchema),
});

export const ConnectStackCategorySchema = z.object({
  id: z.string(),
  tag: z.string(),
  items: z.array(z.string()),
});

export const ConnectStackSchema = z.object({
  categories: z.array(ConnectStackCategorySchema),
});

export const ConnectProcessStepSchema = z.object({
  id: z.string(),
  num: z.string(),
  title: z.string(),
  description: z.string(),
});

export const ConnectProcessSchema = z.object({
  heading: z.string(),
  steps: z.array(ConnectProcessStepSchema),
});

export const ConnectClientProjectSchema = z.object({
  id: z.string(),
  clientType: z.string(),
  badge: z.string(),
  headline: z.string(),
  problem: z.string(),
  built: z.string(),
  outcome: z.string(),
  testimonial: z.string(),
  testimonialAuthor: z.string(),
});

export const ConnectClientWorkSchema = z.object({
  heading: z.string(),
  subheading: z.string(),
  projects: z.array(ConnectClientProjectSchema),
});

export const ConnectDeveloperCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export const ConnectDevelopersSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  subtitle: z.string(),
  cards: z.array(ConnectDeveloperCardSchema),
});

export const ConnectContactFormSchema = z.object({
  heading: z.string(),
  subheading: z.string(),
  directEmailPrefix: z.string(),
  emailAddress: z.string().email(),
  rateLimitNotice: z.string(),
  commonLabels: z.object({
    nameLabel: z.string(),
  }),
  segments: z.object({
    recruiter: z.object({
      id: z.literal("recruiter"),
      label: z.string(),
      emailLabel: z.string(),
      companyLabel: z.string(),
      roleLabel: z.string(),
      msgLabel: z.string(),
      sendLabel: z.string(),
      sentNote: z.string(),
    }),
    client: z.object({
      id: z.literal("client"),
      label: z.string(),
      emailLabel: z.string(),
      projectTypeLabel: z.string(),
      projectTypes: z.array(z.string()),
      timelineLabel: z.string(),
      timelines: z.array(z.string()),
      msgLabel: z.string(),
      sendLabel: z.string(),
      sentNote: z.string(),
    }),
    student: z.object({
      id: z.literal("student"),
      label: z.string(),
      emailLabel: z.string(),
      stageLabel: z.string(),
      stages: z.array(z.string()),
      topicLabel: z.string(),
      topics: z.array(z.string()),
      msgLabel: z.string(),
      sendLabel: z.string(),
      sentNote: z.string(),
    }),
  }),
  confirmation: z.object({
    statusBadge: z.string(),
    title: z.string(),
    againButtonLabel: z.string(),
  }),
});

// --- Journey Schemas ---

export const JourneyChapterSchema = z.object({
  slug: z.string(),
  title: z.string(),
  order: z.number(),
  place: z.string().optional(),
  period: z.string().optional(),
  mood: z.string().optional(),
  moodColor: z.string().optional(),
  isDark: z.boolean().optional(),
  photo: z.string().optional(),
  photoAlt: z.string().optional(),
  photoPlaceholder: z.string().optional(),
  cta: z.string().optional(),
  ctaHref: z.string().optional(),
  content: z.string(),
});

// Inferred TypeScript Types
export type Nav = z.infer<typeof NavSchema>;
export type HomeContent = z.infer<typeof HomeSchema>;
export type AboutContent = z.infer<typeof AboutSchema>;
export type ProfileContent = z.infer<typeof ProfileSchema>;
export type LabContent = z.infer<typeof LabSchema>;
export type LabStoryContent = z.infer<typeof LabStorySchema>;
export type AIWalkthrough = z.infer<typeof AIWalkthroughSchema>;
export type AIDiagram = z.infer<typeof AIDiagramSchema>;
export type AIVoice = z.infer<typeof AIVoiceSchema>;
export type AIConcepts = z.infer<typeof AIConceptsSchema>;
export type AskPresets = z.infer<typeof AskPresetsSchema>;
export type KnowledgeChunk = z.infer<typeof KnowledgeChunkSchema>;
export type ConnectRecruiters = z.infer<typeof ConnectRecruitersSchema>;
export type ConnectServices = z.infer<typeof ConnectServicesSchema>;
export type ConnectStack = z.infer<typeof ConnectStackSchema>;
export type ConnectProcess = z.infer<typeof ConnectProcessSchema>;
export type ConnectClientWork = z.infer<typeof ConnectClientWorkSchema>;
export type ConnectDevelopers = z.infer<typeof ConnectDevelopersSchema>;
export type ConnectContactForm = z.infer<typeof ConnectContactFormSchema>;
export type JourneyChapter = z.infer<typeof JourneyChapterSchema>;
