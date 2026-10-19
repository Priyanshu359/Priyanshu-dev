import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getNav,
  getHome,
  getServicesHero,
  getServicesList,
  getServicesQuote,
  getServicesProcess,
  getServicesProof,
  getServicesTrust,
  getServicesWorking,
  getServicesFaq,
  getServicesCta,
} from "@/content";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ServicesFaqAccordion } from "@/components/services/ServicesFaqAccordion";

export const metadata: Metadata = {
  title: {
    absolute: "Services — web, mobile, AI agent and backend development | Priyanshu Sinha",
  },
  description:
    "Web and mobile apps, AI agents and backends for startups and small businesses. Fixed quote up front, pay per milestone, and you own the code.",
  openGraph: {
    title: "Services — web, mobile, AI agent and backend development | Priyanshu Sinha",
    description:
      "Web and mobile apps, AI agents and backends for startups and small businesses. Fixed quote up front, pay per milestone, and you own the code.",
    url: "https://priyanshu.dev/services",
    siteName: "priyanshu.dev",
    type: "website",
  },
};

export default function ServicesPage() {
  const nav = getNav();
  const home = getHome();
  const hero = getServicesHero();
  const services = getServicesList();
  const quote = getServicesQuote();
  const process = getServicesProcess();
  const proof = getServicesProof();
  const trust = getServicesTrust();
  const working = getServicesWorking();
  const faq = getServicesFaq();
  const cta = getServicesCta();

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        transition: "background 0.25s, color 0.25s",
        minHeight: "100vh",
      }}
    >
      <Nav data={nav} />

      <main>
        {/* 1. Hero Section */}
        <section
          aria-label="Services overview"
          style={{ maxWidth: "1120px", margin: "0 auto", padding: "104px 24px 80px" }}
        >
          {/* Status Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "999px",
              backgroundColor: "var(--color-doneBg)",
              border: "1px solid var(--color-green)",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--color-green)",
                display: "inline-block",
              }}
              aria-hidden="true"
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-green)",
              }}
            >
              {hero.status}
            </span>
          </div>

          <h1
            style={{
              margin: "0 0 24px",
              fontSize: "52px",
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              maxWidth: "920px",
            }}
          >
            {hero.headline}
          </h1>

          <p
            style={{
              margin: "0 0 36px",
              fontSize: "20px",
              lineHeight: 1.5,
              color: "var(--color-muted)",
              maxWidth: "760px",
            }}
          >
            {hero.subline}
          </p>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href={hero.actions.primary.href}
              style={{
                backgroundColor: "var(--color-btnBg)",
                color: "var(--color-btnText)",
                textDecoration: "none",
                padding: "14px 24px",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "15px",
                display: "inline-block",
                transition: "opacity 0.2s",
              }}
            >
              {hero.actions.primary.label}
            </Link>

            <a
              href={hero.actions.secondary.href}
              style={{
                textDecoration: "none",
                padding: "14px 22px",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "15px",
                border: "1px solid var(--color-border2)",
                color: "var(--color-text)",
                display: "inline-block",
              }}
            >
              {hero.actions.secondary.label}
            </a>
          </div>
        </section>

        {/* 2. Services Section */}
        <section
          style={{
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            padding: "88px 24px",
          }}
        >
          <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "36px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {services.heading}
            </h2>
            <p
              style={{
                margin: "0 0 48px",
                fontSize: "18px",
                color: "var(--color-muted)",
                maxWidth: "680px",
              }}
            >
              {services.subline}
            </p>

            {/* Four Service Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "24px",
                marginBottom: "48px",
              }}
            >
              {services.items.map((srv) => (
                <div
                  key={srv.number}
                  style={{
                    backgroundColor: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    padding: "28px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "20px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-accent)",
                      }}
                    >
                      {srv.number}
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "20px",
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {srv.title}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: "var(--color-body)",
                        fontSize: "15px",
                        lineHeight: 1.6,
                      }}
                    >
                      {srv.description}
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid var(--color-border)",
                      paddingTop: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--color-muted)" }}>Good for: </span>
                      <span style={{ fontWeight: 500, color: "var(--color-text)" }}>
                        {srv.goodFor}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-muted)" }}>Typical timeline: </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 500,
                          color: "var(--color-accent)",
                        }}
                      >
                        {srv.timeline}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-muted)",
                        marginTop: "4px",
                      }}
                    >
                      {srv.tech}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fixed-quote strip */}
            <div
              style={{
                backgroundColor: "var(--color-tint)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "24px 28px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
              }}
            >
              <div style={{ maxWidth: "680px" }}>
                <h3 style={{ margin: "0 0 6px", fontSize: "19px", fontWeight: 600 }}>
                  {quote.heading}
                </h3>
                <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "15px" }}>
                  {quote.text}
                </p>
              </div>
              <Link
                href={quote.button.href}
                style={{
                  backgroundColor: "var(--color-btnBg)",
                  color: "var(--color-btnText)",
                  textDecoration: "none",
                  padding: "12px 20px",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                }}
              >
                {quote.button.label}
              </Link>
            </div>
          </div>
        </section>

        {/* 3. How a project works */}
        <section
          style={{
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg)",
            padding: "88px 24px",
          }}
        >
          <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
            <h2
              style={{
                margin: "0 0 48px",
                fontSize: "36px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {process.heading}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "28px",
              }}
            >
              {process.steps.map((st) => (
                <div
                  key={st.number}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "var(--color-green)",
                    }}
                  >
                    {st.number}
                  </div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{st.title}</h3>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--color-body)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                    }}
                  >
                    {st.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Proof of how I build (anchor #work) */}
        <section
          id="work"
          style={{
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            padding: "88px 24px",
          }}
        >
          <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "36px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {proof.heading}
            </h2>
            <p
              style={{
                margin: "0 0 48px",
                fontSize: "18px",
                color: "var(--color-muted)",
                maxWidth: "720px",
              }}
            >
              {proof.subline}
            </p>

            {/* Three Proof Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
                marginBottom: "48px",
              }}
            >
              {proof.cards.map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    padding: "28px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: "var(--color-accent)",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {card.label}
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "19px",
                        fontWeight: 600,
                        lineHeight: 1.35,
                      }}
                    >
                      {card.title}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: "var(--color-body)",
                        fontSize: "14px",
                        lineHeight: 1.6,
                      }}
                    >
                      {card.text}
                    </p>
                  </div>

                  {card.link && (
                    <Link
                      href={card.link.href}
                      style={{
                        color: "var(--color-accent)",
                        textDecoration: "none",
                        fontWeight: 500,
                        fontSize: "14px",
                      }}
                    >
                      {card.link.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Sample Project Plan Panel */}
            <div
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "32px",
                marginBottom: "36px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--color-muted)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  marginBottom: "8px",
                }}
              >
                {proof.samplePlan.label}
              </div>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: "24px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {proof.samplePlan.title}
              </h3>
              <p
                style={{
                  margin: "0 0 28px",
                  color: "var(--color-muted)",
                  fontSize: "15px",
                  maxWidth: "760px",
                }}
              >
                {proof.samplePlan.subline}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {proof.samplePlan.milestones.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border2)",
                      borderRadius: "8px",
                      padding: "18px 22px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px 24px",
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--color-accent)",
                        minWidth: "110px",
                      }}
                    >
                      {m.milestone}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: "16px", minWidth: "130px" }}>
                      {m.title}
                    </span>
                    <span
                      style={{
                        color: "var(--color-body)",
                        fontSize: "14px",
                        flex: "1 1 300px",
                        lineHeight: 1.5,
                      }}
                    >
                      {m.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Founding Client Offer Banner (controlled by enabled in proof.yaml) */}
            {proof.foundingOffer.enabled && (
              <div
                style={{
                  backgroundColor: "var(--color-doneBg)",
                  border: "1px solid var(--color-green)",
                  borderRadius: "12px",
                  padding: "28px 32px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "24px",
                }}
              >
                <div style={{ maxWidth: "700px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--color-green)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: "6px",
                    }}
                  >
                    {proof.foundingOffer.title}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      lineHeight: 1.55,
                      color: "var(--color-text)",
                    }}
                  >
                    I’m taking on a small number of founding clients this year:{" "}
                    <strong>20% off your first project</strong>, in exchange for honest feedback
                    when we’re done.
                  </p>
                </div>

                <Link
                  href={proof.foundingOffer.button.href}
                  style={{
                    backgroundColor: "var(--color-btnBg)",
                    color: "var(--color-btnText)",
                    textDecoration: "none",
                    padding: "12px 24px",
                    borderRadius: "6px",
                    fontWeight: 500,
                    fontSize: "15px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {proof.foundingOffer.button.label}
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 5. Why you can trust me with your project */}
        <section
          style={{
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg)",
            padding: "88px 24px",
          }}
        >
          <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
            <h2
              style={{
                margin: "0 0 48px",
                fontSize: "36px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {trust.heading}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
              }}
            >
              {trust.cards.map((card) => {
                const isLabCard = card.id === "testable-proof";
                return (
                  <div
                    key={card.id}
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "10px",
                      padding: "26px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{card.title}</h3>
                    <p
                      style={{
                        margin: 0,
                        color: "var(--color-body)",
                        fontSize: "14px",
                        lineHeight: 1.6,
                      }}
                    >
                      {isLabCard ? (
                        <>
                          The{" "}
                          <Link
                            href="/lab/rate-limiting"
                            style={{
                              color: "var(--color-accent)",
                              textDecoration: "underline",
                              fontWeight: 500,
                            }}
                          >
                            Lab
                          </Link>{" "}
                          on this site runs on my own backend. Try it before you ever message me.
                        </>
                      ) : (
                        card.description
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Working together strip */}
        <section
          style={{
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-tint)",
            padding: "48px 24px",
          }}
        >
          <div
            style={{
              maxWidth: "1120px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
            }}
          >
            {working.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--color-muted)",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "var(--color-text)",
                    fontWeight: 500,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. FAQ */}
        <section
          style={{
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            padding: "88px 24px",
          }}
        >
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            <h2
              style={{
                margin: "0 0 40px",
                fontSize: "36px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                textAlign: "left",
              }}
            >
              {faq.heading}
            </h2>

            <ServicesFaqAccordion data={faq} />
          </div>
        </section>

        {/* 8. Footer CTA (dark band) */}
        <section
          style={{
            backgroundColor: "var(--color-term)",
            color: "#E8EAED",
            padding: "88px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "28px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "36px",
                fontWeight: 600,
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
              }}
            >
              {cta.heading}
            </h2>
            <Link
              href={cta.button.href}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#111418",
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "15px",
                display: "inline-block",
                transition: "opacity 0.2s",
              }}
            >
              {cta.button.label}
            </Link>
          </div>
        </section>
      </main>

      <Footer data={home.footer} />
    </div>
  );
}
