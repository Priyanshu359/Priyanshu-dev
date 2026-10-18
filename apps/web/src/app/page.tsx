import React from "react";
import Link from "next/link";
import {
  getNav,
  getHome,
  getAskPresets,
  getProfile,
  getLabs,
  getAbout,
} from "@/content";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";
import { HomePipelineWidget } from "@/components/home/HomePipelineWidget";

export default function HomePage() {
  const navData = getNav();
  const homeData = getHome();
  const presetsData = getAskPresets();
  const profileData = getProfile();
  const labsData = getLabs();
  const aboutData = getAbout();

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Nav data={navData} />

      {/* Hero Section */}
      <section
        aria-label="Introduction"
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "136px 24px 112px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-mono)",
            fontSize: "16px",
            color: "var(--color-accent)",
            fontWeight: 500,
          }}
        >
          {homeData.hero.greeting}
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: "84px",
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: "-0.035em",
          }}
        >
          {homeData.hero.name}
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "44px",
            lineHeight: 1.15,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--color-muted)",
            maxWidth: "900px",
          }}
        >
          {homeData.hero.tagline}
        </p>

        <p
          style={{
            margin: 0,
            fontSize: "19px",
            color: "var(--color-body)",
            maxWidth: "640px",
            lineHeight: 1.6,
          }}
        >
          {homeData.hero.bio}
        </p>

        {/* Quick Facts Strip */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px 40px",
            padding: "20px 0",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
            fontSize: "15px",
            maxWidth: "900px",
          }}
        >
          {homeData.hero.facts.map((fact) => (
            <div key={fact.tag}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--color-muted)",
                }}
              >
                {fact.tag}
              </div>
              <div
                style={{
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {fact.active && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-green)",
                      display: "inline-block",
                    }}
                  />
                )}
                {fact.value}
              </div>
            </div>
          ))}
        </div>

        {/* Hero Actions */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <a
            href={homeData.hero.actions.primary.href}
            style={{
              backgroundColor: "var(--color-btnBg)",
              color: "var(--color-btnText)",
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: "var(--radius-md)",
              fontWeight: 500,
              fontSize: "15px",
              display: "inline-block",
              transition: "opacity 0.2s, transform 0.15s",
            }}
          >
            {homeData.hero.actions.primary.label}
          </a>

          <Link
            href={homeData.hero.actions.secondary.href}
            style={{
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: "var(--radius-md)",
              fontWeight: 500,
              fontSize: "15px",
              border: "1px solid var(--color-border2)",
              color: "var(--color-text)",
              display: "inline-block",
              transition: "border-color 0.2s, background-color 0.2s",
            }}
          >
            {homeData.hero.actions.secondary.label}
          </Link>

          {homeData.hero.actions.socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target={social.href.startsWith("http") ? "_blank" : undefined}
              rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{
                padding: "14px 10px",
                fontWeight: 500,
                color: "var(--color-text)",
                textDecoration: "none",
                fontSize: "15px",
                transition: "opacity 0.2s",
              }}
            >
              {social.label}
            </a>
          ))}
        </div>
      </section>

      {/* Demo Intro Section */}
      {/* Demo Intro Section */}
      <section style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-tint)" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "88px 24px 32px" }}>
          <p
            style={{
              margin: "0 0 16px",
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              color: "var(--color-muted)",
            }}
          >
            {homeData.demoIntro.kicker}
          </p>
          <h2
            style={{
              margin: 0,
              fontSize: "44px",
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              maxWidth: "860px",
            }}
          >
            {homeData.demoIntro.title}
          </h2>
          <p
            style={{
              margin: "20px 0 0",
              fontSize: "19px",
              color: "var(--color-muted)",
              maxWidth: "680px",
              lineHeight: 1.6,
            }}
          >
            {homeData.demoIntro.subtitle}
          </p>
        </div>
      </section>

      {/* Interactive Request Pipeline Demo */}
      <section id="demo" aria-label="Live request journey" style={{ backgroundColor: "var(--color-tint)" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px 96px" }}>
          <HomePipelineWidget
            demoConfig={homeData.demoConfig}
            presets={presetsData.presets}
            pipelineStages={presetsData.pipelineStages}
          />
        </div>
      </section>

      {/* For Developers Section */}
      <section
        aria-label="For developers"
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "96px 24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 340px" }}>
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              color: "var(--color-muted)",
            }}
          >
            {homeData.developerTerminal.kicker}
          </p>
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "36px",
              lineHeight: 1.15,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {homeData.developerTerminal.title}
          </h2>
          <p style={{ margin: 0, fontSize: "18px", color: "var(--color-muted)", lineHeight: 1.6 }}>
            {homeData.developerTerminal.text}
          </p>
        </div>

        <div
          style={{
            flex: "999 1 520px",
            minWidth: 0,
            backgroundColor: "var(--color-term)",
            color: "#E8EAED",
            borderRadius: "10px",
            padding: "22px 24px",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            lineHeight: 1.7,
            overflowX: "auto",
            whiteSpace: "pre",
          }}
        >
          <span style={{ color: "#9AA0A8" }}>$</span> {homeData.developerTerminal.command}
          {"\n{\n  "}
          <span style={{ color: "#8FB4FF" }}>&quot;name&quot;</span>: <span style={{ color: "#7FD1A5" }}>&quot;{profileData.name}&quot;</span>,{"\n  "}
          <span style={{ color: "#8FB4FF" }}>&quot;role&quot;</span>: <span style={{ color: "#7FD1A5" }}>&quot;{profileData.role}&quot;</span>,{"\n  "}
          <span style={{ color: "#8FB4FF" }}>&quot;stack&quot;</span>: [{profileData.stack.map((s, idx) => (
            <React.Fragment key={s}>
              <span style={{ color: "#7FD1A5" }}>&quot;{s}&quot;</span>
              {idx < profileData.stack.length - 1 ? ", " : ""}
            </React.Fragment>
          ))}],{"\n  "}
          <span style={{ color: "#8FB4FF" }}>&quot;openTo&quot;</span>: <span style={{ color: "#7FD1A5" }}>&quot;{profileData.openTo}&quot;</span>,{"\n  "}
          <span style={{ color: "#8FB4FF" }}>&quot;hireMe&quot;</span>: <span style={{ color: "#7FD1A5" }}>&quot;{profileData.hireMe}&quot;</span>{"\n}"}
        </div>
      </section>

      {/* Three Sections Index Cards */}
      <section aria-label="Sections" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
          {homeData.sectionsIndex.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              style={{
                flex: "1 1 320px",
                textDecoration: "none",
                color: "var(--color-text)",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                transition: "opacity 0.2s",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  color: "var(--color-accent)",
                  fontWeight: 500,
                }}
              >
                {section.tag}
              </span>
              <span style={{ fontSize: "24px", fontWeight: 600, lineHeight: 1.2 }}>
                {section.heading}
              </span>
              <span style={{ color: "var(--color-muted)", lineHeight: 1.6, fontSize: "15px" }}>
                {section.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Inside the Lab Overview Section */}
      <Section bg="surface" borderTop padding="96px 24px">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "32px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {homeData.labOverview.title}
          </h2>
          <Link
            href={homeData.labOverview.ctaHref}
            style={{ fontWeight: 500, color: "var(--color-accent)", textDecoration: "none" }}
          >
            {homeData.labOverview.cta}
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--color-border)" }}>
          {labsData.map((lab) => {
            const isLive = lab.status === "live";

            if (!isLive) {
              return (
                <div
                  key={lab.id}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "8px 24px",
                    padding: "20px 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 600, flex: "1 1 260px" }}>{lab.title}</span>
                  <span style={{ color: "var(--color-muted)", flex: "999 1 400px" }}>
                    {lab.tagline}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      color: "var(--color-muted)",
                    }}
                  >
                    SOON
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={lab.id}
                href={`/lab/${lab.id}`}
                style={{
                  textDecoration: "none",
                  color: "var(--color-text)",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "8px 24px",
                  padding: "20px 0",
                  borderBottom: "1px solid var(--color-border)",
                  transition: "opacity 0.2s",
                }}
              >
                <span style={{ fontWeight: 600, flex: "1 1 260px" }}>{lab.title}</span>
                <span style={{ color: "var(--color-muted)", flex: "999 1 400px" }}>
                  {lab.tagline}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    color: "var(--color-green)",
                    fontWeight: 600,
                  }}
                >
                  LIVE
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* About Section */}
      <section
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "96px 24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "48px",
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {aboutData.title}
          </h2>
        </div>
        <div
          style={{
            flex: "999 1 520px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            fontSize: "18px",
            color: "var(--color-body)",
            lineHeight: 1.6,
          }}
        >
          {aboutData.paragraphs.map((p, i) => (
            <p key={i} style={{ margin: 0 }}>
              {p}
            </p>
          ))}
          <a
            href={aboutData.resumeLink.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontWeight: 500,
              color: "var(--color-accent)",
              textDecoration: "none",
              marginTop: "8px",
            }}
          >
            {aboutData.resumeLink.label}
          </a>
        </div>
      </section>

      {/* Site Footer */}
      <Footer data={homeData.footer} />
    </div>
  );
}
