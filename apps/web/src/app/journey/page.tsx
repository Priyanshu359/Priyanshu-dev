import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getNav, getHome, getJourneyChapters, type JourneyChapter } from "@/content";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Journey — Priyanshu Sinha",
  description:
    "The chapters of my life so far — the good days, the hard years, and the people who got me through them.",
};

function TypographicMoodCard({ chapter }: { chapter: JourneyChapter }) {
  const isDark = chapter.isDark;
  return (
    <div
      style={{
        flex: "1 1 380px",
        aspectRatio: "4 / 3",
        backgroundColor: chapter.moodColor ? `${chapter.moodColor}dd` : "#CFDAE2",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        color: isDark ? "#F1ECE6" : "#2A2420",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "40px",
          fontWeight: 500,
          lineHeight: 1.15,
        }}
      >
        {chapter.place || chapter.title}
      </span>
      {chapter.period && (
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "20px",
            opacity: 0.85,
            marginTop: "6px",
          }}
        >
          {chapter.period}
        </span>
      )}
      {chapter.photoPlaceholder && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            opacity: 0.6,
            marginTop: "12px",
            border: "1px solid currentColor",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          {chapter.photoPlaceholder}
        </span>
      )}
    </div>
  );
}

export default function JourneyPage() {
  const nav = getNav();
  const home = getHome();
  const chapters = getJourneyChapters();

  return (
    <div
      style={{
        backgroundColor: "#F6F1E9",
        color: "#2A2420",
        fontFamily: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
        fontSize: "16px",
        lineHeight: 1.6,
        minHeight: "100vh",
      }}
    >
      <Nav data={nav} />

      <main>
        {/* Hero Section */}
        <section style={{ maxWidth: "760px", margin: "0 auto", padding: "120px 24px 96px", textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 20px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              letterSpacing: "0.08em",
              color: "#6B5F55",
            }}
          >
            THE JOURNEY
          </p>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontSize: "64px",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            Not everything I’ve built runs on a server.
          </h1>
          <p
            style={{
              margin: "28px auto 0",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "22px",
              color: "#5A4F46",
              maxWidth: "560px",
            }}
          >
            The chapters of my life so far — the good days, the hard years, and the people who got me through them.
          </p>
        </section>

        {/* Chapters */}
        <div>
          {chapters.map((chapter) => {
            const isCentered = chapter.order === 4 || chapter.order === 6;
            const isReverse = chapter.order % 2 === 0 && !isCentered;
            const formattedNum = String(chapter.order).padStart(2, "0");

            if (chapter.order === 6) {
              return (
                <section
                  key={chapter.slug}
                  style={{ maxWidth: "760px", margin: "0 auto", padding: "120px 24px", textAlign: "center" }}
                >
                  <p style={{ margin: "0 0 12px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "#6B5F55" }}>
                    CHAPTER {formattedNum}
                  </p>
                  <h2
                    style={{
                      margin: "0 0 20px",
                      fontFamily: "var(--font-serif)",
                      fontWeight: 400,
                      fontSize: "44px",
                    }}
                  >
                    {chapter.title}
                  </h2>
                  <p
                    style={{
                      margin: "0 0 36px",
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                      fontSize: "20px",
                      color: "#5A4F46",
                    }}
                  >
                    {chapter.content}
                  </p>
                  {chapter.cta && (
                    <Link
                      href={chapter.ctaHref || "/hire"}
                      style={{
                        display: "inline-block",
                        backgroundColor: "#2A2420",
                        color: "#FFFFFF",
                        textDecoration: "none",
                        padding: "14px 24px",
                        borderRadius: "6px",
                        fontWeight: 500,
                      }}
                    >
                      {chapter.cta}
                    </Link>
                  )}
                </section>
              );
            }

            if (isCentered) {
              return (
                <article
                  key={chapter.slug}
                  style={{
                    backgroundColor: chapter.moodColor || "#2F2A33",
                    color: chapter.isDark ? "#F1ECE6" : "#2A2420",
                  }}
                >
                  <div style={{ maxWidth: "760px", margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        color: chapter.isDark ? "#C9BFD2" : "#6B5F55",
                      }}
                    >
                      CHAPTER {formattedNum} · {chapter.period || "[WHEN]"} · {chapter.mood || "[MOOD]"}
                    </p>
                    <h2
                      style={{
                        margin: "0 0 24px",
                        fontFamily: "var(--font-serif)",
                        fontWeight: 500,
                        fontSize: "44px",
                        lineHeight: 1.15,
                      }}
                    >
                      {chapter.title}
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-serif)",
                        fontSize: "21px",
                        lineHeight: 1.7,
                        color: chapter.isDark ? "#E3DCE8" : "#5A4F46",
                      }}
                    >
                      {chapter.content}
                    </p>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={chapter.slug}
                style={{
                  backgroundColor: chapter.moodColor || "#FAF6F0",
                }}
              >
                <div
                  style={{
                    maxWidth: "1120px",
                    margin: "0 auto",
                    padding: "96px 24px",
                    display: "flex",
                    flexWrap: isReverse ? "wrap-reverse" : "wrap",
                    gap: "48px",
                    alignItems: "center",
                  }}
                >
                  {/* Photo or Typographic Mood Card */}
                  {chapter.photo ? (
                    <div style={{ flex: "1 1 380px", aspectRatio: "4 / 3", position: "relative", borderRadius: "4px", overflow: "hidden" }}>
                      <Image
                        src={chapter.photo}
                        alt={chapter.photoAlt || chapter.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 45vw"
                        style={{ objectFit: "cover" }}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <TypographicMoodCard chapter={chapter} />
                  )}

                  {/* Chapter Text */}
                  <div style={{ flex: "1 1 420px", minWidth: 0 }}>
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        color: chapter.order === 1 ? "#3E4C57" : chapter.order === 2 ? "#6B4E12" : chapter.order === 3 ? "#2F5238" : "#2E3A63",
                      }}
                    >
                      CHAPTER {formattedNum} · {chapter.place || "[PLACE]"} · {chapter.period || "[PERIOD]"} · {chapter.mood || "[MOOD]"}
                    </p>
                    <h2
                      style={{
                        margin: "0 0 20px",
                        fontFamily: "var(--font-serif)",
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
                        fontFamily: "var(--font-serif)",
                        fontSize: "20px",
                        lineHeight: 1.65,
                        color: "#2A2420",
                      }}
                    >
                      {chapter.content}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <Footer data={home.footer} />
    </div>
  );
}
