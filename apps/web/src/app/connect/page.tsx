import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getNav,
  getHome,
  getConnectRecruiters,
  getConnectServices,
  getConnectStack,
  getConnectProcess,
  getConnectClientWork,
  getConnectDevelopers,
  getConnectForm,
} from "@/content";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ConnectContactFormView } from "@/components/connect/ConnectContactForm";

export const metadata: Metadata = {
  title: "Let’s talk — recruiters, clients, students — Priyanshu Sinha",
  description:
    "Whoever you are, there’s a way in. Hiring, building something, or just starting out in backend — pick the path that fits.",
};

export default function ConnectPage() {
  const nav = getNav();
  const home = getHome();
  const recruiters = getConnectRecruiters();
  const services = getConnectServices();
  const stack = getConnectStack();
  const process = getConnectProcess();
  const clientWork = getConnectClientWork();
  const developers = getConnectDevelopers();
  const form = getConnectForm();

  return (
    <div style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)", transition: "background 0.25s, color 0.25s", minHeight: "100vh" }}>
      <Nav data={nav} />

      <main>
        {/* Hero Section */}
        <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "96px 24px 56px" }}>
          <p style={{ margin: "0 0 16px", fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--color-muted)" }}>
            Let’s talk
          </p>
          <h1 style={{ margin: 0, fontSize: "56px", lineHeight: 1.08, fontWeight: 600, letterSpacing: "-0.025em", maxWidth: "820px" }}>
            Whoever you are, there’s a way in.
          </h1>
          <p style={{ margin: "24px 0 0", fontSize: "19px", color: "var(--color-muted)", maxWidth: "640px" }}>
            Thinking of hiring me, need something built, or just want to talk backend? Pick the path that fits and I’ll take it from there.
          </p>
        </section>

        {/* Choose your path cards */}
        <section aria-label="Choose your path" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px 96px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <a
              href="#recruiters"
              style={{
                flex: "1 1 300px",
                textDecoration: "none",
                color: "inherit",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-accent)" }}>
                01 · Recruiters &amp; hiring managers
              </span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>Considering me for a role?</span>
              <span style={{ color: "var(--color-muted)" }}>
                My 30-second snapshot, résumé, and the fastest way to reach me.
              </span>
              <span style={{ marginTop: "8px", fontWeight: 500, color: "var(--color-accent)" }}>
                See my snapshot ↓
              </span>
            </a>

            <a
              href="#clients"
              style={{
                flex: "1 1 300px",
                textDecoration: "none",
                color: "inherit",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-green)" }}>
                02 · Clients &amp; founders
              </span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>Need something built?</span>
              <span style={{ color: "var(--color-muted)" }}>
                Web, mobile and backend projects — what I build and how we’d work.
              </span>
              <span style={{ marginTop: "8px", fontWeight: 500, color: "var(--color-green)" }}>
                See services ↓
              </span>
            </a>

            <a
              href="#students"
              style={{
                flex: "1 1 300px",
                textDecoration: "none",
                color: "inherit",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-warm)" }}>
                03 · Students &amp; developers
              </span>
              <span style={{ fontSize: "24px", fontWeight: 600 }}>Just want to say hi?</span>
              <span style={{ color: "var(--color-muted)" }}>
                Fellow learner? No agenda needed — let’s just talk.
              </span>
              <span style={{ marginTop: "8px", fontWeight: 500, color: "var(--color-warm)" }}>
                Say hi ↓
              </span>
            </a>
          </div>
        </section>

        {/* Section 1: Recruiters */}
        <section id="recruiters" style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "88px 24px" }}>
            <p style={{ margin: "0 0 8px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-accent)" }}>
              {recruiters.kicker}
            </p>
            <h2 style={{ margin: "0 0 12px", fontSize: "36px", fontWeight: 600, letterSpacing: "-0.02em" }}>
              {recruiters.title}
            </h2>
            <p style={{ margin: "0 0 40px", color: "var(--color-muted)", maxWidth: "640px" }}>
              {recruiters.subtitle}
            </p>

            {/* 30-second snapshot grid */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1px",
                backgroundColor: "var(--color-border)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {recruiters.snapshot.map((item, idx) => (
                <div key={idx} style={{ flex: "1 1 260px", backgroundColor: "var(--color-surface)", padding: "20px 24px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-muted)" }}>
                    {item.tag}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "17px" }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Production metrics */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", marginTop: "40px" }}>
              {recruiters.metrics.map((m, idx) => (
                <div key={idx} style={{ flex: "1 1 200px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "32px", color: "var(--color-accent)" }}>
                    {m.value}
                  </div>
                  <div style={{ color: "var(--color-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "40px", alignItems: "center" }}>
              <a
                href={recruiters.actions.resume.href}
                style={{
                  backgroundColor: "var(--color-btnBg)",
                  color: "var(--color-btnText)",
                  textDecoration: "none",
                  padding: "14px 22px",
                  borderRadius: "6px",
                  fontWeight: 500,
                }}
              >
                {recruiters.actions.resume.label}
              </a>
              <a
                href={recruiters.actions.email.href}
                style={{
                  textDecoration: "none",
                  padding: "14px 22px",
                  borderRadius: "6px",
                  fontWeight: 500,
                  border: "1px solid var(--color-border2)",
                  color: "inherit",
                }}
              >
                {recruiters.actions.email.label}
              </a>
              <a
                href={recruiters.actions.linkedin.href}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  padding: "14px 22px",
                  borderRadius: "6px",
                  fontWeight: 500,
                  border: "1px solid var(--color-border2)",
                  color: "inherit",
                }}
              >
                {recruiters.actions.linkedin.label}
              </a>
              <Link
                href={recruiters.actions.labLink.href}
                style={{ padding: "14px 10px", fontWeight: 500, color: "var(--color-accent)", textDecoration: "none" }}
              >
                {recruiters.actions.labLink.label}
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Clients */}
        <section id="clients" style={{ maxWidth: "1120px", margin: "0 auto", padding: "88px 24px" }}>
          <p style={{ margin: "0 0 8px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-green)" }}>
            {services.kicker}
          </p>
          <h2 style={{ margin: "0 0 12px", fontSize: "36px", fontWeight: 600, letterSpacing: "-0.02em" }}>
            {services.title}
          </h2>
          <p style={{ margin: "0 0 40px", color: "var(--color-muted)", maxWidth: "680px" }}>
            {services.subtitle}
          </p>

          {/* Services cards */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {services.services.map((srv) => (
              <div
                key={srv.id}
                style={{
                  flex: "1 1 320px",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "24px",
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: "19px", fontWeight: 600 }}>{srv.title}</h3>
                <p style={{ margin: 0, color: "var(--color-body)" }}>{srv.description}</p>
              </div>
            ))}
          </div>

          {/* Tech stack row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "24px 48px",
              marginTop: "56px",
              padding: "28px 0",
              borderTop: "1px solid var(--color-border)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            {stack.categories.map((cat) => (
              <div key={cat.id} style={{ flex: "1 1 200px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-muted)" }}>
                  {cat.tag}
                </div>
                <div style={{ fontWeight: 500 }}>{cat.items.join(", ")}</div>
              </div>
            ))}
          </div>

          {/* Process steps */}
          <h3 style={{ margin: "56px 0 24px", fontSize: "24px", fontWeight: 600 }}>{process.heading}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            {process.steps.map((st) => (
              <div key={st.id} style={{ flex: "1 1 220px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "24px", color: "var(--color-green)" }}>
                  {st.num}
                </div>
                <h4 style={{ margin: "2px 0 4px", fontSize: "17px", fontWeight: 600 }}>{st.title}</h4>
                <p style={{ margin: 0, color: "var(--color-body)" }}>{st.description}</p>
              </div>
            ))}
          </div>

          {/* Why clients can trust me section */}
          <div style={{ margin: "72px 0 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {clientWork.title || "Why clients can trust me with their project"}
            </h3>
            <Link
              href={clientWork.linkHref || "/services"}
              style={{
                color: "var(--color-accent)",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "15px",
              }}
            >
              {clientWork.linkText || "Services, a sample project plan and answers to common questions are on the Services page →"}
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "20px",
            }}
          >
            {clientWork.reasons?.map((reason) => (
              <div
                key={reason.id}
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "19px", fontWeight: 700, lineHeight: 1.35 }}>
                  {reason.title}
                </h4>
                <p style={{ margin: 0, color: "var(--color-body)", fontSize: "15px", lineHeight: 1.6 }}>
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Students & Developers */}
        <section id="students" style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-warmBg)" }}>
          <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "88px 24px" }}>
            <p style={{ margin: "0 0 8px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-warm)" }}>
              {developers.kicker}
            </p>
            <h2 style={{ margin: "0 0 12px", fontSize: "36px", fontWeight: 600, letterSpacing: "-0.02em" }}>
              {developers.title}
            </h2>
            <p style={{ margin: "0 0 40px", color: "var(--color-muted)", maxWidth: "680px" }}>
              {developers.subtitle}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              {developers.cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    flex: "1 1 260px",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-warmBorder)",
                    borderRadius: "10px",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 600 }}>{card.title}</h3>
                  <p style={{ margin: 0, color: "var(--color-body)" }}>{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Adaptive Contact Form */}
        <ConnectContactFormView content={form} />
      </main>

      <Footer data={home.footer} />
    </div>
  );
}
