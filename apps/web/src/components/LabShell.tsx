import React from "react";
import Link from "next/link";
import { Nav } from "./Nav";
import { LabTabs } from "./LabTabs";
import { Section } from "./Section";
import { getLabs } from "@/content";
import type { Nav as NavData, LabContent as LabData } from "@/content/schema";

interface LabShellProps {
  navData: NavData;
  labData: LabData;
  prevLink?: { label: string; href: string };
  nextLink?: { label: string; href: string };
  children: React.ReactNode;
}

export function LabShell({
  navData,
  labData,
  prevLink,
  nextLink,
  children,
}: LabShellProps) {
  const allLabs = getLabs().map((l) => ({
    id: l.id,
    number: l.number,
    title: l.title,
    href: `/lab/${l.id}`,
    status: l.status,
  }));

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Nav data={navData} />
      <LabTabs labs={allLabs} />

      {/* Hero Header */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "56px 24px 40px" }}>
        <p
          style={{
            margin: "0 0 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--color-muted)",
          }}
        >
          {labData.kicker || `Lab / ${labData.number} · ${labData.title}`}
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: "50px",
            lineHeight: 1.08,
            fontWeight: 600,
            letterSpacing: "var(--tracking-tight)",
            maxWidth: "860px",
          }}
        >
          {labData.headline || labData.tagline}
        </h1>

        {labData.intro && (
          <p
            style={{
              margin: "24px 0 0",
              fontSize: "19px",
              color: "var(--color-muted)",
              maxWidth: "680px",
              lineHeight: 1.6,
            }}
          >
            {labData.intro}
          </p>
        )}

        {labData.note && (
          <p
            style={{
              margin: "16px 0 0",
              fontSize: "14px",
              color: "var(--color-muted)",
              maxWidth: "680px",
            }}
          >
            {labData.note}
          </p>
        )}
      </section>

      {/* Interactive Experiment Content */}
      {children}

      {/* Architecture Section if provided */}
      {labData.diagram && (
        <Section bg="surface" borderTop padding="88px 24px">
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "var(--tracking-snug)",
            }}
          >
            {labData.diagram.title}
          </h2>
          <p style={{ margin: "0 0 40px", color: "var(--color-muted)", maxWidth: "640px" }}>
            {labData.diagram.subtitle}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {labData.diagram.nodes.map((node: { id: string; label: string; sub: string; highlight?: boolean }, i: number) => (
              <React.Fragment key={node.id}>
                <div
                  style={{
                    flex: "1 1 180px",
                    border: node.highlight ? "2px solid var(--color-accent)" : "1px solid var(--color-border2)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: node.highlight ? "var(--color-activeBg)" : "var(--color-surface)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "16px" }}>{node.label}</div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--color-muted)",
                      fontFamily: "var(--font-mono)",
                      marginTop: "4px",
                    }}
                  >
                    {node.sub}
                  </div>
                </div>

                {i < labData.diagram!.nodes.length - 1 && (
                  <div
                    aria-hidden="true"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-muted)",
                      fontSize: "18px",
                      userSelect: "none",
                    }}
                  >
                    {labData.diagram!.edges[i]?.label || "→"}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {labData.diagram.alertNote && (
            <div
              style={{
                marginTop: "20px",
                display: "inline-block",
                border: "1px dashed var(--color-blocked)",
                color: "var(--color-blocked)",
                borderRadius: "var(--radius-lg)",
                padding: "10px 16px",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
              }}
            >
              {labData.diagram.alertNote}
            </div>
          )}
        </Section>
      )}

      {/* Code Section if provided */}
      {labData.codeSection && (
        <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "88px 24px" }}>
          <h2
            style={{
              margin: "0 0 32px",
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "var(--tracking-snug)",
            }}
          >
            {labData.codeSection.title}
          </h2>
          <div
            style={{
              backgroundColor: "var(--color-term)",
              color: "#E8EAED",
              borderRadius: "var(--radius-xl)",
              padding: "24px",
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              lineHeight: 1.7,
              overflowX: "auto",
              whiteSpace: "pre",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {labData.codeSection.code}
          </div>
          {labData.codeSection.githubUrl && (
            <a
              href={labData.codeSection.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                marginTop: "16px",
                fontWeight: 500,
                color: "var(--color-accent)",
              }}
            >
              {labData.codeSection.githubLinkText || "Full source on GitHub →"}
            </a>
          )}
        </section>
      )}

      {/* Trade-offs Section if provided */}
      {labData.tradeOffs && labData.tradeOffs.length > 0 && (
        <Section bg="surface" borderTop padding="88px 24px">
          <h2
            style={{
              margin: "0 0 32px",
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "var(--tracking-snug)",
            }}
          >
            {labData.tradeOffsHeading || "Trade-offs I weighed"}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            {labData.tradeOffs?.map((tradeOff: { title: string; text: string }) => (
              <div key={tradeOff.title} style={{ flex: "1 1 300px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>
                  {tradeOff.title}
                </h3>
                <p style={{ margin: 0, color: "var(--color-body)", lineHeight: 1.6 }}>
                  {tradeOff.text}
                </p>
              </div>
            ))}
          </div>

          {/* Navigation Links (Prev / Next) */}
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
            {prevLink ? (
              <Link
                href={prevLink.href}
                style={{
                  fontWeight: 500,
                  color: "var(--color-text)",
                  textDecoration: "none",
                }}
              >
                ← {prevLink.label}
              </Link>
            ) : (
              <Link
                href="/"
                style={{
                  fontWeight: 500,
                  color: "var(--color-text)",
                  textDecoration: "none",
                }}
              >
                ← All demos
              </Link>
            )}

            {nextLink ? (
              <Link
                href={nextLink.href}
                style={{
                  fontWeight: 500,
                  color: "var(--color-accent)",
                  textDecoration: "none",
                }}
              >
                {nextLink.label} →
              </Link>
            ) : null}
          </div>
        </Section>
      )}
    </div>
  );
}
