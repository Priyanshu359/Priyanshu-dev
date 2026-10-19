import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getNav,
  getHome,
  getJourneyPrologue,
  getJourneyChapters,
  getJourneyEnding,
  formatJourneyPhotoSrc,
  type JourneyChapter,
  type JourneyPrologue,
  type JourneyEnding,
} from "@/content";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Journey — Priyanshu Sinha",
  description:
    "The chapters of my life so far — the good days, the hard years, and the people who got me through them.",
};

const PALETTES = {
  blue: { bg: "#E8EEF2", box: "#CFDAE2", ink: "#3E4C57" },
  sand: { bg: "#F3E6C8", box: "#E6D3A6", ink: "#6B4E12" },
  green: { bg: "#DDEBDF", box: "#C3D9C7", ink: "#2F5238" },
  indigo: { bg: "#E3E7F3", box: "#C9D0E6", ink: "#2E3A63" },
  dark: { bg: "#2F2A33", box: "#3D3742", ink: "#F1ECE6", text: "#F1ECE6" },
} as const;

// Base64 blur placeholder for responsive next/image rendering
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjRTVEOUNDIi8+PC9zdmc+";

function PrologueSection({ prologue }: { prologue: JourneyPrologue }) {
  const prologueLabel = `PROLOGUE · ${prologue.place.toUpperCase()}`;

  return (
    <section
      aria-label="Prologue"
      className="journey-prologue-wrap"
      style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "0 24px 112px",
        display: "flex",
        flexWrap: "wrap",
        gap: "56px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <figure
        style={{
          flex: "0 1 420px",
          width: "100%",
          maxWidth: "420px",
          margin: 0,
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            padding: "14px 14px 18px",
            boxShadow: "0 10px 30px rgba(42, 36, 32, 0.16)",
            transform: "rotate(-2.5deg)",
          }}
        >
          {prologue.photo && prologue.photo.src ? (
            <div
              style={{
                aspectRatio: "4 / 3",
                position: "relative",
                overflow: "hidden",
                backgroundColor: "#E7DCCB",
              }}
            >
              <Image
                src={formatJourneyPhotoSrc(prologue.photo.src)}
                alt={prologue.photo.alt}
                fill
                priority
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                sizes="(max-width: 768px) 100vw, 420px"
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                aspectRatio: "4 / 3",
                backgroundColor: "#E7DCCB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6B5F55",
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                fontSize: "13px",
                textAlign: "center",
                padding: "16px",
                lineHeight: 1.6,
              }}
            >
              [Our first family photo]
            </div>
          )}
        </div>
        <figcaption
          style={{
            marginTop: "22px",
            textAlign: "center",
            fontFamily: "'Newsreader', Georgia, serif",
            fontStyle: "italic",
            fontSize: "16px",
            color: "#6B5F55",
            lineHeight: 1.5,
          }}
        >
          {prologue.caption}
        </figcaption>
      </figure>

      <div style={{ flex: "1 1 420px", minWidth: 0, maxWidth: "560px" }}>
        <p
          style={{
            margin: "0 0 12px",
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            fontSize: "12px",
            letterSpacing: "0.14em",
            color: "#6B5F55",
            textTransform: "uppercase",
          }}
        >
          {prologueLabel}
        </p>
        <h2
          style={{
            margin: "0 0 20px",
            fontFamily: "'Newsreader', Georgia, serif",
            fontWeight: 400,
            fontStyle: "italic",
            fontSize: "44px",
            lineHeight: 1.12,
            color: "#2A2420",
          }}
        >
          {prologue.title}
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: "20px",
            lineHeight: 1.7,
            color: "#2A2420",
          }}
        >
          {prologue.content}
        </p>
      </div>
    </section>
  );
}

function ChapterCard({
  chapter,
  isReverse,
}: {
  chapter: JourneyChapter;
  isReverse: boolean;
}) {
  const palette = PALETTES[chapter.palette] || PALETTES.blue;
  const num = String(chapter.order).padStart(2, "0");
  const label =
    chapter.label ||
    (chapter.place && chapter.place.trim().length > 0
      ? `CHAPTER ${num} · ${chapter.place.toUpperCase()} · ${chapter.period.toUpperCase()} · ${chapter.mood.toUpperCase()}`
      : `CHAPTER ${num} · ${chapter.period.toUpperCase()} · ${chapter.mood.toUpperCase()}`);

  if (chapter.palette === "dark") {
    return (
      <article style={{ background: "#2F2A33", color: "#F1ECE6", width: "100%" }}>
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            padding: "120px 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              fontSize: "13px",
              color: "#C9BFD2",
            }}
          >
            {label}
          </p>
          <h2
            style={{
              margin: "0 0 24px",
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 500,
              fontSize: "44px",
              lineHeight: 1.15,
              color: "#F1ECE6",
            }}
          >
            {chapter.title}
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: "21px",
              lineHeight: 1.7,
              color: "#E3DCE8",
            }}
          >
            {chapter.content}
          </p>
          <p
            style={{
              margin: "36px auto 0",
              maxWidth: "560px",
              paddingTop: "24px",
              borderTop: "1px solid rgba(241, 236, 230, 0.2)",
              fontFamily: "'Newsreader', Georgia, serif",
              fontStyle: "italic",
              fontSize: "23px",
              lineHeight: 1.45,
              color: "#F1ECE6",
            }}
          >
            {chapter.lesson}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article
      style={{
        backgroundColor: palette.bg,
        color: "#2A2420",
        width: "100%",
      }}
    >
      <div
        className="journey-chapter-grid"
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "96px 24px",
          display: "flex",
          flexWrap: "wrap",
          flexDirection: isReverse ? "row-reverse" : "row",
          gap: "48px",
          alignItems: "center",
        }}
      >
        {/* Media Column (First on mobile via order: 1) */}
        <div
          className="journey-media"
          style={{ flex: "1 1 380px", minWidth: 0, width: "100%" }}
        >
          {chapter.photo && chapter.photo.src ? (
            <div
              style={{
                aspectRatio: "4 / 3",
                position: "relative",
                borderRadius: "4px",
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(42, 36, 32, 0.08)",
              }}
            >
              <Image
                src={formatJourneyPhotoSrc(chapter.photo.src)}
                alt={chapter.photo.alt}
                fill
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                sizes="(max-width: 768px) 100vw, 500px"
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                aspectRatio: "4 / 3",
                backgroundColor: palette.box,
                borderRadius: "4px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                gap: "8px",
                padding: "36px",
                boxSizing: "border-box",
                color: palette.ink,
              }}
            >
              {chapter.place && (
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                    fontSize: "13px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {chapter.place}
                </span>
              )}
              <span
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontSize: "64px",
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                {chapter.period}
              </span>
              <span
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "20px",
                }}
              >
                {chapter.mood}
              </span>
            </div>
          )}
        </div>

        {/* Text Column */}
        <div
          className="journey-text"
          style={{ flex: "1 1 420px", minWidth: 0, width: "100%" }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              fontSize: "13px",
              color: palette.ink,
            }}
          >
            {label}
          </p>
          <h2
            style={{
              margin: "0 0 20px",
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 500,
              fontSize: "40px",
              lineHeight: 1.15,
              color: "#2A2420",
            }}
          >
            {chapter.title}
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: "20px",
              lineHeight: 1.65,
              color: "#2A2420",
            }}
          >
            {chapter.content}
          </p>
          <p
            style={{
              margin: "28px 0 0",
              paddingLeft: "18px",
              borderLeft: `3px solid ${palette.ink}`,
              fontFamily: "'Newsreader', Georgia, serif",
              fontStyle: "italic",
              fontSize: "22px",
              lineHeight: 1.45,
              color: palette.ink,
            }}
          >
            {chapter.lesson}
          </p>
        </div>
      </div>
    </article>
  );
}

function EndingSection({ ending }: { ending: JourneyEnding }) {
  const buttonLabel = ending.button?.label || ending.buttonLabel || "Say hello";
  const buttonLink = ending.button?.link || ending.buttonLink || "/connect";

  return (
    <section
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "120px 24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          fontSize: "13px",
          color: "#6B5F55",
          textTransform: "uppercase",
        }}
      >
        {ending.label}
      </p>
      <h2
        style={{
          margin: "0 0 20px",
          fontFamily: "'Newsreader', Georgia, serif",
          fontWeight: 400,
          fontSize: "44px",
          color: "#2A2420",
        }}
      >
        {ending.title}
      </h2>
      <p
        style={{
          margin: "0 0 36px",
          fontFamily: "'Newsreader', Georgia, serif",
          fontStyle: "italic",
          fontSize: "20px",
          color: "#5A4F46",
        }}
      >
        {ending.text}
      </p>
      <Link
        href={buttonLink}
        style={{
          display: "inline-block",
          background: "#2A2420",
          color: "#FFFFFF",
          textDecoration: "none",
          padding: "14px 24px",
          borderRadius: "6px",
          fontWeight: 500,
          fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
          fontSize: "16px",
        }}
      >
        {buttonLabel}
      </Link>
    </section>
  );
}

export default function JourneyPage() {
  const nav = getNav();
  const home = getHome();
  const prologue = getJourneyPrologue();
  const chapters = getJourneyChapters();
  const ending = getJourneyEnding();

  // Track alternating light chapters
  let lightChapterIndex = 0;

  return (
    <div
      data-theme="journey"
      style={{
        backgroundColor: "#F6F1E9",
        color: "#2A2420",
        fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "16px",
        lineHeight: 1.6,
        minHeight: "100vh",
      }}
    >
      {/* Inline styles for responsive stacking and header warm theme overrides */}
      <style>{`
        [data-theme="journey"] header {
          background-color: #F6F1E9 !important;
          border-bottom: 1px solid #E2D9CB !important;
        }
        [data-theme="journey"] header nav a:not(.nav-cta-btn) {
          color: #2A2420 !important;
        }
        [data-theme="journey"] header nav a:not(.nav-cta-btn):hover {
          color: #8A3B1F !important;
        }
        [data-theme="journey"] .nav-cta-btn,
        [data-theme="journey"] header nav a[href="/connect"] {
          background-color: #2A2420 !important;
          color: #FFFFFF !important;
        }
        [data-theme="journey"] .nav-cta-btn:hover,
        [data-theme="journey"] header nav a[href="/connect"]:hover {
          background-color: #1A1614 !important;
          color: #FFFFFF !important;
          opacity: 0.95 !important;
        }
        [data-theme="journey"] header nav button {
          border-color: #E2D9CB !important;
          color: #2A2420 !important;
        }
        @media (max-width: 768px) {
          .journey-prologue-wrap {
            flex-direction: column !important;
            gap: 40px !important;
          }
          .journey-chapter-grid {
            flex-direction: column !important;
            gap: 36px !important;
            padding: 64px 20px !important;
          }
          .journey-media {
            order: 1 !important;
          }
          .journey-text {
            order: 2 !important;
          }
          .journey-hero-h1 {
            font-size: 42px !important;
          }
          .journey-hero-sub {
            font-size: 18px !important;
          }
        }
      `}</style>

      <Nav data={nav} />

      <main>
        {/* Hero Section */}
        <section
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            padding: "120px 24px 96px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 20px",
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              fontSize: "13px",
              letterSpacing: "0.08em",
              color: "#6B5F55",
              textTransform: "uppercase",
            }}
          >
            THE JOURNEY
          </p>
          <h1
            className="journey-hero-h1"
            style={{
              margin: 0,
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 400,
              fontSize: "64px",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              color: "#2A2420",
            }}
          >
            Not everything I’ve built runs on a server.
          </h1>
          <p
            className="journey-hero-sub"
            style={{
              margin: "28px auto 0",
              fontFamily: "'Newsreader', Georgia, serif",
              fontStyle: "italic",
              fontSize: "22px",
              lineHeight: 1.5,
              color: "#5A4F46",
              maxWidth: "560px",
            }}
          >
            The chapters of my life so far — the good days, the hard years, and
            the people who got me through them.
          </p>
        </section>

        {/* Prologue */}
        <PrologueSection prologue={prologue} />

        {/* Chapters */}
        <div>
          {chapters.map((chapter) => {
            const isDark = chapter.palette === "dark";
            const isReverse = !isDark && lightChapterIndex % 2 === 1;
            if (!isDark) {
              lightChapterIndex += 1;
            }
            return (
              <ChapterCard
                key={chapter.slug}
                chapter={chapter}
                isReverse={isReverse}
              />
            );
          })}
        </div>

        {/* Ending */}
        <EndingSection ending={ending} />
      </main>

      <Footer data={home.footer} />
    </div>
  );
}
