import { collection, config, fields, singleton } from "@keystatic/core";

const isProduction = process.env.NODE_ENV === "production";
const useGithubStorage =
  isProduction && process.env.KEYSTATIC_STORAGE_KIND === "github";

export default config({
  storage: useGithubStorage
    ? {
        kind: "github",
        repo: {
          owner:
            process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_OWNER || "priyanshu-sinha",
          name:
            process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO || "priyanshu.dev",
        },
      }
    : {
        kind: "local",
      },

  collections: {
    journey: collection({
      label: "Journey Chapters",
      slugField: "title",
      path: "../../content/journey/chapters/*",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Chapter Title" } }),
        order: fields.integer({ label: "Order", defaultValue: 1, validation: { isRequired: true } }),
        place: fields.text({ label: "Place (e.g. Patratu, Chandigarh)" }),
        period: fields.text({ label: "Period (e.g. 2021–2025, Age 15)", validation: { isRequired: true } }),
        mood: fields.text({ label: "Mood (e.g. Curious, Grateful)", validation: { isRequired: true } }),
        lesson: fields.text({ label: "Lesson Pullquote", validation: { isRequired: true } }),
        palette: fields.select({
          label: "Palette",
          options: [
            { label: "Blue", value: "blue" },
            { label: "Sand", value: "sand" },
            { label: "Green", value: "green" },
            { label: "Dark", value: "dark" },
            { label: "Indigo", value: "indigo" },
          ],
          defaultValue: "blue",
        }),
        photo: fields.object({
          src: fields.image({
            label: "Chapter Photo",
            directory: "../../content/journey/images",
            publicPath: "./images/",
          }),
          alt: fields.text({ label: "Photo Alt Description" }),
        }),
        content: fields.mdx({
          label: "Chapter Story Content",
          extension: "mdx",
        }),
      },
    }),

    knowledge: collection({
      label: "Knowledge Chunks (AI Retriever)",
      slugField: "title",
      path: "../../content/ask/knowledge/*",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Topic Title" } }),
        keywords: fields.text({
          label: "Keywords for Vector / Semantic Search",
        }),
        category: fields.text({ label: "Category" }),
        content: fields.mdx({
          label: "Knowledge Text",
          extension: "md",
        }),
      },
    }),

    labs: collection({
      label: "Interactive Labs",
      slugField: "title",
      path: "../../content/labs/*/lab",
      format: { data: "yaml" },
      schema: {
        id: fields.text({ label: "Lab ID (e.g. rate-limiting)" }),
        number: fields.text({ label: "Lab Number (e.g. 01)" }),
        title: fields.slug({ name: { label: "Lab Title" } }),
        tagline: fields.text({ label: "Tagline", multiline: true }),
        status: fields.select({
          label: "Status",
          options: [
            { label: "Live", value: "live" },
            { label: "Coming Soon", value: "soon" },
          ],
          defaultValue: "live",
        }),
        order: fields.integer({ label: "Order", defaultValue: 1 }),
        kicker: fields.text({ label: "Kicker" }),
        headline: fields.text({ label: "Headline" }),
        intro: fields.text({ label: "Intro", multiline: true }),
        note: fields.text({ label: "Note" }),
        liveBadge: fields.text({ label: "Live Badge" }),
        settings: fields.object(
          {
            capacity: fields.integer({ label: "Bucket Capacity" }),
            refillRateMs: fields.integer({ label: "Refill Rate (ms)" }),
            refillTokens: fields.integer({ label: "Refill Tokens" }),
          },
          { label: "Settings" }
        ),
        diagram: fields.object(
          {
            title: fields.text({ label: "Diagram Title" }),
            subtitle: fields.text({ label: "Diagram Subtitle" }),
            alertNote: fields.text({ label: "Diagram Alert Note" }),
            nodes: fields.array(
              fields.object({
                id: fields.text({ label: "Node ID" }),
                label: fields.text({ label: "Label" }),
                sub: fields.text({ label: "Subtitle" }),
                highlight: fields.checkbox({ label: "Highlight" }),
              }),
              { label: "Nodes", itemLabel: (p) => p.fields.label.value }
            ),
            edges: fields.array(
              fields.object({
                from: fields.text({ label: "From Node ID" }),
                to: fields.text({ label: "To Node ID" }),
                label: fields.text({ label: "Edge Label" }),
              }),
              { label: "Edges" }
            ),
          },
          { label: "Architecture Diagram" }
        ),
        tradeOffsHeading: fields.text({ label: "Trade-offs Heading" }),
        tradeOffs: fields.array(
          fields.object({
            title: fields.text({ label: "Title" }),
            text: fields.text({ label: "Text", multiline: true }),
          }),
          { label: "Trade-offs", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),

    labStories: collection({
      label: "Lab Deep-Dive Stories",
      slugField: "title",
      path: "../../content/labs/*/story",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Story Title" } }),
        labId: fields.text({ label: "Lab ID" }),
        order: fields.integer({ label: "Order", defaultValue: 1 }),
        content: fields.mdx({
          label: "Story (MDX)",
          extension: "mdx",
        }),
      },
    }),
  },

  singletons: {
    // Journey
    journeyPrologue: singleton({
      label: "Journey Prologue",
      path: "../../content/journey/prologue",
      format: { contentField: "content" },
      schema: {
        place: fields.text({ label: "Place (e.g. Patratu, Jharkhand)", validation: { isRequired: true } }),
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        caption: fields.text({ label: "Photo Caption", validation: { isRequired: true } }),
        photo: fields.object({
          src: fields.image({
            label: "Photo Image",
            directory: "../../content/journey/images",
            publicPath: "./images/",
          }),
          alt: fields.text({ label: "Photo Alt Description" }),
        }),
        content: fields.mdx({
          label: "Prologue Body",
          extension: "mdx",
        }),
      },
    }),

    journeyEnding: singleton({
      label: "Journey Ending (Chapter 06)",
      path: "../../content/journey/ending",
      format: { data: "yaml" },
      schema: {
        label: fields.text({ label: "Label", defaultValue: "CHAPTER 06" }),
        title: fields.text({ label: "Title", defaultValue: "Still being written." }),
        text: fields.text({ label: "Text", multiline: true }),
        button: fields.object({
          label: fields.text({ label: "Button Label", defaultValue: "Say hello" }),
          link: fields.text({ label: "Button Link", defaultValue: "/connect" }),
        }),
      },
    }),

    // Site
    nav: singleton({
      label: "Navigation Bar",
      path: "../../content/site/nav",
      format: { data: "yaml" },
      schema: {
        brand: fields.text({ label: "Brand Name" }),
        items: fields.array(
          fields.object({
            label: fields.text({ label: "Label" }),
            href: fields.text({ label: "Link URL" }),
          }),
          { label: "Nav Items", itemLabel: (p) => p.fields.label.value }
        ),
        cta: fields.object(
          {
            label: fields.text({ label: "CTA Button Label" }),
            href: fields.text({ label: "CTA Button Link" }),
          },
          { label: "CTA Button" }
        ),
        themeToggle: fields.object(
          {
            lightLabel: fields.text({ label: "Light Mode Toggle Label" }),
            darkLabel: fields.text({ label: "Dark Mode Toggle Label" }),
          },
          { label: "Theme Toggle" }
        ),
      },
    }),

    home: singleton({
      label: "Home Page",
      path: "../../content/site/home",
      format: { data: "yaml" },
      schema: {
        hero: fields.object(
          {
            greeting: fields.text({ label: "Greeting" }),
            name: fields.text({ label: "Name" }),
            tagline: fields.text({ label: "Tagline", multiline: true }),
            bio: fields.text({ label: "Bio", multiline: true }),
            facts: fields.array(
              fields.object({
                tag: fields.text({ label: "Tag" }),
                value: fields.text({ label: "Value" }),
                active: fields.checkbox({ label: "Active Pulse Highlight" }),
              }),
              { label: "Hero Quick Facts", itemLabel: (p) => p.fields.tag.value }
            ),
            actions: fields.object(
              {
                primary: fields.object(
                  {
                    label: fields.text({ label: "Label" }),
                    href: fields.text({ label: "Href" }),
                  },
                  { label: "Primary Action" }
                ),
                secondary: fields.object(
                  {
                    label: fields.text({ label: "Label" }),
                    href: fields.text({ label: "Href" }),
                  },
                  { label: "Secondary Action" }
                ),
                socials: fields.array(
                  fields.object({
                    label: fields.text({ label: "Label" }),
                    href: fields.text({ label: "Href" }),
                  }),
                  { label: "Social Links", itemLabel: (p) => p.fields.label.value }
                ),
              },
              { label: "Hero Actions" }
            ),
          },
          { label: "Hero Section" }
        ),
        demoIntro: fields.object(
          {
            kicker: fields.text({ label: "Kicker" }),
            title: fields.text({ label: "Title" }),
            subtitle: fields.text({ label: "Subtitle", multiline: true }),
          },
          { label: "Demo Intro" }
        ),
        demoConfig: fields.object(
          {
            liveBadge: fields.text({ label: "Live Badge" }),
            note: fields.text({ label: "Note", multiline: true }),
            rateLimitBlockedText: fields.text({
              label: "Rate Limit Blocked Notice",
            }),
          },
          { label: "Demo Config" }
        ),
        businesses: fields.object(
          {
            label: fields.text({ label: "Label" }),
            heading: fields.text({ label: "Heading" }),
            subline: fields.text({ label: "Subline", multiline: true }),
            cards: fields.array(
              fields.object({
                title: fields.text({ label: "Title" }),
                description: fields.text({ label: "Description", multiline: true }),
                href: fields.text({ label: "Link" }),
              }),
              { label: "Business Cards", itemLabel: (p) => p.fields.title.value }
            ),
            actions: fields.object({
              primary: fields.object({
                label: fields.text({ label: "Primary Button Label" }),
                href: fields.text({ label: "Primary Button Link" }),
              }),
              secondary: fields.object({
                label: fields.text({ label: "Secondary Button Label" }),
                href: fields.text({ label: "Secondary Button Link" }),
              }),
            }),
          },
          { label: "For Businesses Section" }
        ),
        developerTerminal: fields.object(
          {
            kicker: fields.text({ label: "Kicker" }),
            title: fields.text({ label: "Title" }),
            text: fields.text({ label: "Text", multiline: true }),
            command: fields.text({ label: "Command" }),
          },
          { label: "Developer Terminal" }
        ),
        sectionsIndex: fields.array(
          fields.object({
            id: fields.text({ label: "ID" }),
            tag: fields.text({ label: "Tag" }),
            heading: fields.text({ label: "Heading" }),
            description: fields.text({ label: "Description", multiline: true }),
            href: fields.text({ label: "Href" }),
          }),
          { label: "Sections Index Cards", itemLabel: (p) => p.fields.heading.value }
        ),
        labOverview: fields.object(
          {
            title: fields.text({ label: "Title" }),
            cta: fields.text({ label: "CTA Button Text" }),
            ctaHref: fields.text({ label: "CTA Button Link" }),
          },
          { label: "Lab Overview Footer CTA" }
        ),
        footer: fields.object(
          {
            heading: fields.text({ label: "Heading" }),
            primaryCta: fields.object(
              {
                label: fields.text({ label: "Label" }),
                href: fields.text({ label: "Href" }),
              },
              { label: "Primary CTA" }
            ),
            secondaryLinks: fields.array(
              fields.object({
                label: fields.text({ label: "Label" }),
                href: fields.text({ label: "Href" }),
              }),
              { label: "Secondary Links", itemLabel: (p) => p.fields.label.value }
            ),
            telemetryFormat: fields.text({ label: "Telemetry Text Template" }),
          },
          { label: "Site Footer" }
        ),
      },
    }),

    profile: singleton({
      label: "Developer Profile (feeds /api/me)",
      path: "../../content/site/profile",
      format: { data: "yaml" },
      schema: {
        name: fields.text({ label: "Full Name" }),
        role: fields.text({ label: "Current Role" }),
        stack: fields.array(fields.text({ label: "Technology" }), {
          label: "Core Stack",
        }),
        openTo: fields.text({ label: "Open To" }),
        hireMe: fields.text({ label: "Hire Me Endpoint" }),
        company: fields.text({ label: "Company" }),
        location: fields.text({ label: "Location" }),
        email: fields.text({ label: "Email Address" }),
        github: fields.text({ label: "GitHub Profile URL" }),
        linkedin: fields.text({ label: "LinkedIn Profile URL" }),
        resumeUrl: fields.text({ label: "Résumé Path/URL" }),
        microservicesCount: fields.integer({
          label: "Microservices Count Owned",
        }),
        peakRpm: fields.text({ label: "Peak RPM" }),
        cacheHitRate: fields.text({ label: "Cache Hit Rate" }),
        experienceYears: fields.text({ label: "Experience Years" }),
        education: fields.object(
          {
            institution: fields.text({ label: "Institution" }),
            degree: fields.text({ label: "Degree" }),
            period: fields.text({ label: "Period" }),
            cgpa: fields.text({ label: "CGPA" }),
            scholarship: fields.text({ label: "Scholarship" }),
          },
          { label: "Education" }
        ),
        priorExperience: fields.object(
          {
            company: fields.text({ label: "Company" }),
            role: fields.text({ label: "Role" }),
            location: fields.text({ label: "Location" }),
            period: fields.text({ label: "Period" }),
            stack: fields.array(fields.text({ label: "Tech" }), {
              label: "Stack",
            }),
            domain: fields.text({ label: "Domain" }),
          },
          { label: "Prior Experience" }
        ),
      },
    }),

    about: singleton({
      label: "About Section",
      path: "../../content/site/about",
      format: { data: "yaml" },
      schema: {
        title: fields.text({ label: "Section Title" }),
        paragraphs: fields.array(fields.text({ label: "Paragraph", multiline: true }), {
          label: "Paragraphs",
        }),
        resumeLink: fields.object(
          {
            label: fields.text({ label: "Link Label" }),
            href: fields.text({ label: "Link URL" }),
          },
          { label: "Resume Link" }
        ),
      },
    }),

    // Connect & Hire
    connectRecruiters: singleton({
      label: "Connect: For Recruiters",
      path: "../../content/connect/recruiters",
      format: { data: "yaml" },
      schema: {
        kicker: fields.text({ label: "Kicker" }),
        title: fields.text({ label: "Title" }),
        subtitle: fields.text({ label: "Subtitle", multiline: true }),
        snapshot: fields.array(
          fields.object({
            tag: fields.text({ label: "Tag (e.g. CURRENT ROLE)" }),
            value: fields.text({ label: "Value" }),
          }),
          { label: "30-Second Snapshot Items", itemLabel: (p) => p.fields.tag.value }
        ),
        metrics: fields.array(
          fields.object({
            value: fields.text({ label: "Metric Value (e.g. 20+)" }),
            label: fields.text({ label: "Metric Description" }),
          }),
          { label: "Key Metrics", itemLabel: (p) => p.fields.value.value }
        ),
        actions: fields.object(
          {
            resume: fields.object(
              { label: fields.text({ label: "Label" }), href: fields.text({ label: "Href" }) },
              { label: "Resume Action" }
            ),
            email: fields.object(
              { label: fields.text({ label: "Label" }), href: fields.text({ label: "Href" }) },
              { label: "Email Action" }
            ),
            linkedin: fields.object(
              { label: fields.text({ label: "Label" }), href: fields.text({ label: "Href" }) },
              { label: "LinkedIn Action" }
            ),
            labLink: fields.object(
              { label: fields.text({ label: "Label" }), href: fields.text({ label: "Href" }) },
              { label: "Lab Link Action" }
            ),
          },
          { label: "Action Buttons" }
        ),
      },
    }),

    connectServices: singleton({
      label: "Connect: Client Services",
      path: "../../content/connect/services",
      format: { data: "yaml" },
      schema: {
        kicker: fields.text({ label: "Kicker" }),
        title: fields.text({ label: "Title" }),
        subtitle: fields.text({ label: "Subtitle", multiline: true }),
        services: fields.array(
          fields.object({
            id: fields.text({ label: "ID" }),
            title: fields.text({ label: "Service Title" }),
            description: fields.text({ label: "Service Description", multiline: true }),
          }),
          { label: "Services", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),

    connectStack: singleton({
      label: "Connect: Tech Stack",
      path: "../../content/connect/stack",
      format: { data: "yaml" },
      schema: {
        categories: fields.array(
          fields.object({
            id: fields.text({ label: "Category ID" }),
            tag: fields.text({ label: "Category Tag (e.g. FRONTEND)" }),
            items: fields.array(fields.text({ label: "Technology" }), {
              label: "Technologies",
            }),
          }),
          { label: "Stack Categories", itemLabel: (p) => p.fields.tag.value }
        ),
      },
    }),

    connectProcess: singleton({
      label: "Connect: Process (How we work together)",
      path: "../../content/connect/process",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        steps: fields.array(
          fields.object({
            id: fields.text({ label: "Step ID" }),
            num: fields.text({ label: "Step Number (e.g. 01)" }),
            title: fields.text({ label: "Title" }),
            description: fields.text({ label: "Description", multiline: true }),
          }),
          { label: "Steps", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),

    connectClientWork: singleton({
      label: "Connect: Client Work (Case Studies)",
      path: "../../content/connect/client-work",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        subheading: fields.text({ label: "Subheading" }),
        projects: fields.array(
          fields.object({
            id: fields.text({ label: "Project ID" }),
            clientType: fields.text({ label: "Client Type / Year" }),
            badge: fields.text({ label: "Badge (e.g. NDA)" }),
            headline: fields.text({ label: "Headline" }),
            problem: fields.text({ label: "Problem" }),
            built: fields.text({ label: "Built" }),
            outcome: fields.text({ label: "Outcome" }),
            testimonial: fields.text({ label: "Testimonial Quote" }),
            testimonialAuthor: fields.text({ label: "Testimonial Author" }),
          }),
          { label: "Case Studies", itemLabel: (p) => p.fields.headline.value }
        ),
      },
    }),

    connectDevelopers: singleton({
      label: "Connect: For Students & Developers",
      path: "../../content/connect/developers",
      format: { data: "yaml" },
      schema: {
        kicker: fields.text({ label: "Kicker" }),
        title: fields.text({ label: "Title" }),
        subtitle: fields.text({ label: "Subtitle", multiline: true }),
        cards: fields.array(
          fields.object({
            id: fields.text({ label: "Card ID" }),
            title: fields.text({ label: "Card Title" }),
            description: fields.text({ label: "Description", multiline: true }),
          }),
          { label: "Connect Cards", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),

    connectContactForm: singleton({
      label: "Connect: Adaptive Contact Form",
      path: "../../content/connect/contact-form",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        subheading: fields.text({ label: "Subheading" }),
        directEmailPrefix: fields.text({ label: "Direct Email Prefix" }),
        emailAddress: fields.text({ label: "Email Address" }),
        rateLimitNotice: fields.text({ label: "Rate Limit Notice" }),
        commonLabels: fields.object(
          { nameLabel: fields.text({ label: "Name Input Label" }) },
          { label: "Common Labels" }
        ),
        segments: fields.object(
          {
            recruiter: fields.object({
              id: fields.text({ label: "Segment ID" }),
              label: fields.text({ label: "Tab Label" }),
              emailLabel: fields.text({ label: "Email Label" }),
              companyLabel: fields.text({ label: "Company Label" }),
              roleLabel: fields.text({ label: "Role Label" }),
              msgLabel: fields.text({ label: "Message Label" }),
              sendLabel: fields.text({ label: "Send Button Label" }),
              sentNote: fields.text({ label: "Sent Note" }),
            }),
            client: fields.object({
              id: fields.text({ label: "Segment ID" }),
              label: fields.text({ label: "Tab Label" }),
              emailLabel: fields.text({ label: "Email Label" }),
              projectTypeLabel: fields.text({ label: "Project Type Label" }),
              projectTypes: fields.array(fields.text({ label: "Type" })),
              timelineLabel: fields.text({ label: "Timeline Label" }),
              timelines: fields.array(fields.text({ label: "Timeline Option" })),
              msgLabel: fields.text({ label: "Message Label" }),
              sendLabel: fields.text({ label: "Send Button Label" }),
              sentNote: fields.text({ label: "Sent Note" }),
            }),
            student: fields.object({
              id: fields.text({ label: "Segment ID" }),
              label: fields.text({ label: "Tab Label" }),
              emailLabel: fields.text({ label: "Email Label" }),
              stageLabel: fields.text({ label: "Stage Label" }),
              stages: fields.array(fields.text({ label: "Stage Option" })),
              topicLabel: fields.text({ label: "Topic Label" }),
              topics: fields.array(fields.text({ label: "Topic Option" })),
              msgLabel: fields.text({ label: "Message Label" }),
              sendLabel: fields.text({ label: "Send Button Label" }),
              sentNote: fields.text({ label: "Sent Note" }),
            }),
          },
          { label: "Audience Segments" }
        ),
        confirmation: fields.object(
          {
            statusBadge: fields.text({ label: "Status Badge" }),
            title: fields.text({ label: "Title" }),
            againButtonLabel: fields.text({ label: "Send Another Button Label" }),
          },
          { label: "Confirmation State" }
        ),
      },
    }),

    // AI
    aiWalkthrough: singleton({
      label: "AI: 9-Step Walkthrough",
      path: "../../content/ai/walkthrough",
      format: { data: "yaml" },
      schema: {
        kicker: fields.text({ label: "Kicker" }),
        title: fields.text({ label: "Title" }),
        intro: fields.text({ label: "Intro", multiline: true }),
        clientKicker: fields.text({ label: "Client Kicker" }),
        clientHeader: fields.text({ label: "Client Header" }),
        inputPlaceholder: fields.text({ label: "Input Placeholder" }),
        buttonLabel: fields.text({ label: "Button Label" }),
        samplePrompts: fields.array(fields.text({ label: "Prompt" }), {
          label: "Sample Prompts",
        }),
        metaDefault: fields.text({ label: "Meta Notice Default" }),
        steps: fields.array(
          fields.object({
            step: fields.integer({ label: "Step Number" }),
            num: fields.text({ label: "Step Display Number (e.g. 01)" }),
            title: fields.text({ label: "Step Title" }),
            nodes: fields.array(fields.text({ label: "Active Box Node ID" })),
            text: fields.text({ label: "Description", multiline: true }),
            tech: fields.text({ label: "Technologies Used" }),
          }),
          { label: "Walkthrough Steps", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),

    aiDiagram: singleton({
      label: "AI: 16-Box Architecture Diagram",
      path: "../../content/ai/diagram",
      format: { data: "yaml" },
      schema: {
        title: fields.text({ label: "Title" }),
        totalBoxes: fields.integer({ label: "Total Boxes", defaultValue: 16 }),
        modelBoxes: fields.integer({ label: "Model Boxes", defaultValue: 1 }),
        backendBoxes: fields.integer({ label: "Backend Boxes", defaultValue: 15 }),
        lanes: fields.array(
          fields.object({
            id: fields.text({ label: "Lane ID" }),
            label: fields.text({ label: "Lane Label" }),
            rows: fields.array(
              fields.object({
                id: fields.text({ label: "Row ID" }),
                arrow: fields.checkbox({ label: "Has Connecting Arrow" }),
                nodes: fields.array(
                  fields.object({
                    id: fields.text({ label: "Node ID" }),
                    label: fields.text({ label: "Label" }),
                    sub: fields.text({ label: "Subtitle" }),
                    lane: fields.text({ label: "Lane" }),
                    isModel: fields.checkbox({ label: "Is AI Model Box" }),
                  }),
                  { label: "Row Nodes", itemLabel: (p) => p.fields.label.value }
                ),
              }),
              { label: "Lane Rows", itemLabel: (p) => p.fields.id.value }
            ),
          }),
          { label: "Diagram Lanes", itemLabel: (p) => p.fields.label.value }
        ),
      },
    }),

    aiVoice: singleton({
      label: "AI: Voice Agent Pipeline",
      path: "../../content/ai/voice",
      format: { data: "yaml" },
      schema: {
        kicker: fields.text({ label: "Kicker" }),
        title: fields.text({ label: "Title" }),
        subtitle: fields.text({ label: "Subtitle", multiline: true }),
        stages: fields.array(
          fields.object({
            id: fields.text({ label: "Stage ID" }),
            badge: fields.text({ label: "Badge Number" }),
            title: fields.text({ label: "Title" }),
            description: fields.text({ label: "Description" }),
            highlight: fields.checkbox({ label: "Highlight" }),
            isEscapeHatch: fields.checkbox({ label: "Is Escape Hatch" }),
          }),
          { label: "Voice Pipeline Stages", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),

    aiConcepts: singleton({
      label: "AI: Concepts List",
      path: "../../content/ai/concepts",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        items: fields.array(
          fields.object({
            id: fields.text({ label: "ID" }),
            label: fields.text({ label: "Label" }),
          }),
          { label: "Concepts", itemLabel: (p) => p.fields.label.value }
        ),
      },
    }),

    // Ask
    askPresets: singleton({
      label: "Ask: Hero Presets & Stages",
      path: "../../content/ask/presets",
      format: { data: "yaml" },
      schema: {
        presets: fields.array(
          fields.object({
            id: fields.text({ label: "ID" }),
            question: fields.text({ label: "Question" }),
            answer: fields.text({ label: "Curated Answer", multiline: true }),
          }),
          { label: "Preset Questions & Answers", itemLabel: (p) => p.fields.question.value }
        ),
        pipelineStages: fields.array(
          fields.object({
            id: fields.text({ label: "Stage ID" }),
            num: fields.text({ label: "Number (e.g. 01)" }),
            name: fields.text({ label: "Stage Name" }),
            sub: fields.text({ label: "Subtitle" }),
            ms: fields.text({ label: "Timing (e.g. 2 ms)" }),
          }),
          { label: "Pipeline Stages", itemLabel: (p) => p.fields.name.value }
        ),
      },
    }),

    // Services
    servicesHero: singleton({
      label: "Services: Hero",
      path: "../../content/services/hero",
      format: { data: "yaml" },
      schema: {
        status: fields.text({ label: "Status Badge" }),
        headline: fields.text({ label: "Headline", multiline: true }),
        subline: fields.text({ label: "Subline", multiline: true }),
        actions: fields.object({
          primary: fields.object({
            label: fields.text({ label: "Primary Button Label" }),
            href: fields.text({ label: "Primary Button Link" }),
          }),
          secondary: fields.object({
            label: fields.text({ label: "Secondary Button Label" }),
            href: fields.text({ label: "Secondary Button Link" }),
          }),
        }),
      },
    }),

    servicesList: singleton({
      label: "Services: What I Can Do",
      path: "../../content/services/services",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        subline: fields.text({ label: "Subline", multiline: true }),
        items: fields.array(
          fields.object({
            number: fields.text({ label: "Number (e.g. 01)" }),
            title: fields.text({ label: "Title" }),
            description: fields.text({ label: "Description", multiline: true }),
            goodFor: fields.text({ label: "Good for" }),
            timeline: fields.text({ label: "Typical timeline" }),
            tech: fields.text({ label: "Tech line" }),
          }),
          { label: "Services Offerings", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),

    servicesQuote: singleton({
      label: "Services: Fixed Quote Strip",
      path: "../../content/services/quote",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        text: fields.text({ label: "Description", multiline: true }),
        button: fields.object({
          label: fields.text({ label: "Button Label" }),
          href: fields.text({ label: "Button Link" }),
        }),
      },
    }),

    servicesProcess: singleton({
      label: "Services: How a Project Works",
      path: "../../content/services/process",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        steps: fields.array(
          fields.object({
            number: fields.text({ label: "Step Number (e.g. 01)" }),
            title: fields.text({ label: "Step Title" }),
            description: fields.text({ label: "Description", multiline: true }),
          }),
          { label: "Process Steps", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),

    servicesProof: singleton({
      label: "Services: Proof of How I Build",
      path: "../../content/services/proof",
      format: { data: "yaml" },
      schema: {
        anchor: fields.text({ label: "Anchor (e.g. work)" }),
        heading: fields.text({ label: "Heading" }),
        subline: fields.text({ label: "Subline", multiline: true }),
        cards: fields.array(
          fields.object({
            label: fields.text({ label: "Card Label" }),
            title: fields.text({ label: "Title" }),
            text: fields.text({ label: "Text", multiline: true }),
            link: fields.object({
              label: fields.text({ label: "Link Label" }),
              href: fields.text({ label: "Link Href" }),
            }),
          }),
          { label: "Proof Cards", itemLabel: (p) => p.fields.title.value }
        ),
        samplePlan: fields.object({
          label: fields.text({ label: "Panel Label" }),
          title: fields.text({ label: "Title" }),
          subline: fields.text({ label: "Subline", multiline: true }),
          milestones: fields.array(
            fields.object({
              milestone: fields.text({ label: "Milestone Tag (e.g. MILESTONE 1)" }),
              title: fields.text({ label: "Milestone Title" }),
              description: fields.text({ label: "Description", multiline: true }),
            }),
            { label: "Plan Milestones", itemLabel: (p) => p.fields.title.value }
          ),
        }),
        foundingOffer: fields.object({
          enabled: fields.checkbox({ label: "Founding Offer Enabled", defaultValue: true }),
          title: fields.text({ label: "Title" }),
          text: fields.text({ label: "Banner Text", multiline: true }),
          button: fields.object({
            label: fields.text({ label: "Button Label" }),
            href: fields.text({ label: "Button Link" }),
          }),
        }),
      },
    }),

    servicesTrust: singleton({
      label: "Services: Why You Can Trust Me",
      path: "../../content/services/trust",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        cards: fields.array(
          fields.object({
            id: fields.text({ label: "ID" }),
            title: fields.text({ label: "Title" }),
            description: fields.text({ label: "Description", multiline: true }),
            link: fields.object({
              label: fields.text({ label: "Link Text" }),
              href: fields.text({ label: "Link Href" }),
            }),
          }),
          { label: "Trust Cards", itemLabel: (p) => p.fields.title.value }
        ),
      },
    }),

    servicesWorking: singleton({
      label: "Services: Working Together Strip",
      path: "../../content/services/working",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        items: fields.array(
          fields.object({
            label: fields.text({ label: "Label" }),
            value: fields.text({ label: "Value" }),
          }),
          { label: "Working Items", itemLabel: (p) => p.fields.label.value }
        ),
      },
    }),

    servicesFaq: singleton({
      label: "Services: Questions Clients Ask (FAQ)",
      path: "../../content/services/faq",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        items: fields.array(
          fields.object({
            id: fields.text({ label: "ID" }),
            question: fields.text({ label: "Question" }),
            answer: fields.text({ label: "Answer", multiline: true }),
          }),
          { label: "FAQ Items", itemLabel: (p) => p.fields.question.value }
        ),
      },
    }),

    servicesCta: singleton({
      label: "Services: Footer CTA",
      path: "../../content/services/cta",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({ label: "Heading" }),
        button: fields.object({
          label: fields.text({ label: "Button Label" }),
          href: fields.text({ label: "Button Link" }),
        }),
      },
    }),
  },
});
