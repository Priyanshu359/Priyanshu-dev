import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getNav,
  getAIWalkthrough,
  getAIDiagram,
  getAIVoice,
  getAIConcepts,
  getKnowledgeChunks,
} from "@/content";
import { Nav } from "@/components/Nav";
import { AIWalkthroughWidget } from "@/components/ai/AIWalkthroughWidget";

export const metadata: Metadata = {
  title: "Why backend is the hero of AI — Priyanshu Sinha",
  description: "A 9-step scroll-driven walkthrough across 16 boxes in the AI inference path.",
};

export default function AIPage() {
  const navData = getNav();
  const walkthroughData = getAIWalkthrough();
  const diagramData = getAIDiagram();
  const voiceData = getAIVoice();
  const conceptsData = getAIConcepts();
  const knowledgeChunks = getKnowledgeChunks();

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Nav data={navData} />

      {/* Hero Header */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "96px 24px 72px" }}>
        <p
          style={{
            margin: "0 0 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--color-muted)",
          }}
        >
          {walkthroughData.kicker}
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(36px, 6vw, 56px)",
            lineHeight: 1.06,
            fontWeight: 600,
            letterSpacing: "var(--tracking-tight)",
            maxWidth: "900px",
          }}
        >
          {walkthroughData.title}
        </h1>

        <p
          style={{
            margin: "24px 0 0",
            fontSize: "20px",
            color: "var(--color-muted)",
            maxWidth: "680px",
            lineHeight: 1.6,
          }}
        >
          {walkthroughData.intro}
        </p>

        <div
          style={{
            marginTop: "32px",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--color-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-full)",
            padding: "8px 16px",
          }}
        >
          type a question below and follow it through the system ↓
        </div>
      </section>

      {/* Sticky 16-box Diagram and 9 Step Cards Walkthrough */}
      <AIWalkthroughWidget
        walkthroughData={walkthroughData}
        diagramData={diagramData}
        knowledgeChunks={knowledgeChunks}
      />

      {/* Voice Agents Pipeline Section */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "96px 24px 40px" }}>
        <p
          style={{
            margin: "0 0 8px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--color-accent)",
            fontWeight: 500,
          }}
        >
          {voiceData.kicker}
        </p>
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: "32px",
            fontWeight: 600,
            letterSpacing: "var(--tracking-snug)",
          }}
        >
          {voiceData.title}
        </h2>
        <p style={{ margin: "0 0 32px", color: "var(--color-muted)", maxWidth: "680px", lineHeight: 1.6 }}>
          {voiceData.subtitle}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {voiceData.stages.map((stage) => {
            const isEscape = stage.isEscapeHatch;
            const isHighlight = stage.highlight;

            let border = "1px solid var(--color-border2)";
            let badgeColor = "var(--color-muted)";
            if (isHighlight) {
              border = "2px solid var(--color-accent)";
            } else if (isEscape) {
              border = "1px dashed var(--color-blocked)";
              badgeColor = "var(--color-blocked)";
            }

            return (
              <div
                key={stage.id}
                style={{
                  flex: "1 1 200px",
                  border,
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: badgeColor,
                  }}
                >
                  {stage.badge}
                </div>
                <div style={{ fontWeight: 600, fontSize: "16px" }}>{stage.title}</div>
                <div style={{ fontSize: "14px", color: "var(--color-body)", marginTop: "4px" }}>
                  {stage.description}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Concepts Section */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "56px 24px 96px" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: "24px", fontWeight: 600 }}>
          {conceptsData.heading}
        </h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: "14px" }}>
          {conceptsData.items.map((concept) => (
            <span
              key={concept.id}
              style={{
                border: "1px solid var(--color-border2)",
                borderRadius: "var(--radius-md)",
                padding: "8px 14px",
                backgroundColor: "var(--color-surface)",
              }}
            >
              {concept.label}
            </span>
          ))}
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginTop: "64px",
            paddingTop: "32px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <Link
            href="/lab/rate-limiting"
            style={{ fontWeight: 500, color: "var(--color-text)", textDecoration: "none" }}
          >
            ← Back to the Lab
          </Link>
          <Link
            href="/connect"
            style={{ fontWeight: 500, color: "var(--color-accent)", textDecoration: "none" }}
          >
            Building an AI feature? Let’s talk →
          </Link>
        </div>
      </section>
    </div>
  );
}
