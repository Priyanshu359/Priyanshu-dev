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

export const HomeBusinessCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  href: z.string().default("/services"),
});

export const HomeBusinessesSchema = z.object({
  label: z.string(),
  heading: z.string(),
  subline: z.string(),
  cards: z.array(HomeBusinessCardSchema),
  actions: z.object({
    primary: z.object({
      label: z.string(),
      href: z.string(),
    }),
    secondary: z.object({
      label: z.string(),
      href: z.string(),
    }),
  }),
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
  businesses: HomeBusinessesSchema.optional(),
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

export const ConnectTrustReasonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export const ConnectClientWorkSchema = z.object({
  title: z.string().default("Why clients can trust me with their project"),
  linkText: z.string().optional(),
  linkHref: z.string().optional(),
  reasons: z.array(ConnectTrustReasonSchema).default([]),
  heading: z.string().optional(),
  subheading: z.string().optional(),
  projects: z.array(ConnectClientProjectSchema).optional(),
  note: z.string().optional(),
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
  foundingOfferNote: z.string().optional(),
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

export const JourneyPaletteEnum = z.enum(["blue", "sand", "green", "dark", "indigo"]);
export type JourneyPalette = z.infer<typeof JourneyPaletteEnum>;

export const JourneyPhotoSchema = z.object({
  src: z.string().min(1, "Photo src is required"),
  alt: z.string().min(1, "Photo alt is required whenever src is set"),
});
export type JourneyPhoto = z.infer<typeof JourneyPhotoSchema>;

export const JourneyPrologueSchema = z.object({
  place: z.string().min(1, "Place is required"),
  title: z.string().min(1, "Title is required"),
  caption: z.string().min(1, "Caption is required"),
  photo: JourneyPhotoSchema.optional(),
  content: z.string(),
});
export type JourneyPrologue = z.infer<typeof JourneyPrologueSchema>;

export const JourneyChapterSchema = z.object({
  slug: z.string(),
  order: z.number(),
  place: z.string().optional(),
  period: z.string(),
  mood: z.string(),
  title: z.string(),
  lesson: z.string(),
  palette: JourneyPaletteEnum,
  photo: JourneyPhotoSchema.optional(),
  content: z.string(),
  label: z.string().optional(),
});
export type JourneyChapter = z.infer<typeof JourneyChapterSchema>;

export const JourneyEndingSchema = z.object({
  label: z.string(),
  title: z.string(),
  text: z.string(),
  button: z
    .object({
      label: z.string(),
      link: z.string(),
    })
    .optional(),
  buttonLabel: z.string().optional(),
  buttonLink: z.string().optional(),
});
export type JourneyEnding = z.infer<typeof JourneyEndingSchema>;

// --- Services Schemas ---

export const ServicesHeroActionSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const ServicesHeroSchema = z.object({
  status: z.string(),
  headline: z.string(),
  subline: z.string(),
  actions: z.object({
    primary: ServicesHeroActionSchema,
    secondary: ServicesHeroActionSchema,
  }),
});

export const ServicesItemSchema = z.object({
  number: z.string(),
  title: z.string(),
  description: z.string(),
  goodFor: z.string(),
  timeline: z.string(),
  tech: z.string(),
});

export const ServicesListSchema = z.object({
  heading: z.string(),
  subline: z.string(),
  items: z.array(ServicesItemSchema),
});

export const ServicesQuoteSchema = z.object({
  heading: z.string(),
  text: z.string(),
  button: z.object({
    label: z.string(),
    href: z.string(),
  }),
});

export const ServicesProcessStepSchema = z.object({
  number: z.string(),
  title: z.string(),
  description: z.string(),
});

export const ServicesProcessSchema = z.object({
  heading: z.string(),
  steps: z.array(ServicesProcessStepSchema),
});

export const ServicesProofCardSchema = z.object({
  label: z.string(),
  title: z.string(),
  text: z.string(),
  link: z
    .object({
      label: z.string(),
      href: z.string(),
    })
    .optional(),
});

export const ServicesSampleMilestoneSchema = z.object({
  milestone: z.string(),
  title: z.string(),
  description: z.string(),
});

export const ServicesSamplePlanSchema = z.object({
  label: z.string(),
  title: z.string(),
  subline: z.string(),
  milestones: z.array(ServicesSampleMilestoneSchema),
});

export const ServicesFoundingOfferSchema = z.object({
  enabled: z.boolean(),
  title: z.string(),
  text: z.string(),
  button: z.object({
    label: z.string(),
    href: z.string(),
  }),
});

export const ServicesProofSchema = z.object({
  anchor: z.string().default("work"),
  heading: z.string(),
  subline: z.string(),
  cards: z.array(ServicesProofCardSchema),
  samplePlan: ServicesSamplePlanSchema,
  foundingOffer: ServicesFoundingOfferSchema,
});

export const ServicesTrustCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  link: z
    .object({
      label: z.string(),
      href: z.string(),
    })
    .optional(),
});

export const ServicesTrustSchema = z.object({
  heading: z.string(),
  cards: z.array(ServicesTrustCardSchema),
});

export const ServicesWorkingItemSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const ServicesWorkingSchema = z.object({
  heading: z.string(),
  items: z.array(ServicesWorkingItemSchema),
});

export const ServicesFaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
});

export const ServicesFaqSchema = z.object({
  heading: z.string(),
  items: z.array(ServicesFaqItemSchema),
});

export const ServicesCtaSchema = z.object({
  heading: z.string(),
  button: z.object({
    label: z.string(),
    href: z.string(),
  }),
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
export type ServicesHero = z.infer<typeof ServicesHeroSchema>;
export type ServicesList = z.infer<typeof ServicesListSchema>;
export type ServicesQuote = z.infer<typeof ServicesQuoteSchema>;
export type ServicesProcess = z.infer<typeof ServicesProcessSchema>;
export type ServicesProof = z.infer<typeof ServicesProofSchema>;
export type ServicesTrust = z.infer<typeof ServicesTrustSchema>;
export type ServicesWorking = z.infer<typeof ServicesWorkingSchema>;
export type ServicesFaq = z.infer<typeof ServicesFaqSchema>;
export type ServicesCta = z.infer<typeof ServicesCtaSchema>;
