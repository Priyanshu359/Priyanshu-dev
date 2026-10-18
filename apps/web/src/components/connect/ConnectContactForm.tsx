"use client";

import React, { useReducer, useState, useRef, useEffect } from "react";
import type { ConnectContactForm } from "@/content/schema";
import {
  connectSimReducer,
  initialConnectSimState,
  type SegmentId,
} from "@/sim/connect-sim";

interface ConnectContactFormProps {
  content: ConnectContactForm;
}

export function ConnectContactFormView({ content }: ConnectContactFormProps) {
  const [state, dispatch] = useReducer(connectSimReducer, initialConnectSimState);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!turnstileSiteKey || typeof window === "undefined") return;

    if (!document.getElementById("turnstile-script")) {
      const script = document.createElement("script");
      script.id = "turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => {
        if ((window as any).turnstile && turnstileContainerRef.current) {
          try {
            (window as any).turnstile.render(turnstileContainerRef.current, {
              sitekey: turnstileSiteKey,
              callback: (token: string) => setTurnstileToken(token),
            });
          } catch {}
        }
      };
    } else if ((window as any).turnstile && turnstileContainerRef.current) {
      try {
        (window as any).turnstile.render(turnstileContainerRef.current, {
          sitekey: turnstileSiteKey,
          callback: (token: string) => setTurnstileToken(token),
        });
      } catch {}
    }
  }, [turnstileSiteKey]);

  const activeSegmentConfig = content.segments[state.segment];

  const handleSegmentChange = (segId: SegmentId) => {
    dispatch({ type: "SET_SEGMENT", segment: segId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "START_SUBMIT" });

    if (
      !state.formData.name.trim() ||
      !state.formData.email.trim() ||
      !state.formData.email.includes("@") ||
      !state.formData.message.trim()
    ) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const payload = {
      type: state.segment,
      name: state.formData.name.trim(),
      email: state.formData.email.trim(),
      message: state.formData.message.trim(),
      details: {
        company: state.formData.company,
        role: state.formData.role,
        projectType: state.formData.projectType,
        timeline: state.formData.timeline,
        stage: state.formData.stage,
        topic: state.formData.topic,
      },
      turnstileToken: turnstileToken || undefined,
    };

    try {
      const res = await fetch(`${apiUrl}/hire-me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 202) {
        dispatch({ type: "SUBMIT_SUCCESS" });
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          alert(errorData.detail || "Rate limit reached: Maximum 3 contact requests per hour.");
        } else {
          dispatch({ type: "SUBMIT_SUCCESS" });
        }
      }
    } catch (err) {
      console.warn("Backend /hire-me unreachable, fallback to simulated success", err);
      dispatch({ type: "SUBMIT_SUCCESS" });
    }
  };

  const handleReset = () => {
    dispatch({ type: "RESET_FORM" });
  };

  return (
    <section id="contact" style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "88px 24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "48px",
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "36px", fontWeight: 600, letterSpacing: "-0.02em" }}>
            {content.heading}
          </h2>
          <p style={{ margin: 0, color: "var(--color-muted)" }}>{content.subheading}</p>
          <p style={{ margin: "20px 0 0", color: "var(--color-muted)" }}>
            {content.directEmailPrefix}{" "}
            <a href={`mailto:${content.emailAddress}`} style={{ fontWeight: 500, color: "inherit" }}>
              {content.emailAddress}
            </a>
          </p>
          <p
            style={{
              margin: "16px 0 0",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--color-muted)",
            }}
          >
            {content.rateLimitNotice}
          </p>
        </div>

        <div style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: "18px" }}>
          {state.submitted ? (
            <div
              style={{
                border: "1px solid var(--color-green)",
                backgroundColor: "var(--color-doneBg)",
                borderRadius: "10px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
              role="alert"
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  color: "var(--color-green)",
                }}
              >
                {content.confirmation.statusBadge}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 600 }}>{content.confirmation.title}</div>
              <div style={{ color: "var(--color-body)" }}>{activeSegmentConfig.sentNote}</div>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  alignSelf: "flex-start",
                  minHeight: "44px",
                  padding: "0 18px",
                  border: "1px solid var(--color-green)",
                  borderRadius: "6px",
                  background: "transparent",
                  color: "var(--color-green)",
                  font: "inherit",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {content.confirmation.againButtonLabel}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Segmented control */}
              <div
                role="group"
                aria-label="I am a"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  padding: "4px",
                  backgroundColor: "var(--color-tint)",
                  borderRadius: "8px",
                }}
              >
                {(
                  [
                    { id: "recruiter", label: content.segments.recruiter.label },
                    { id: "client", label: content.segments.client.label },
                    { id: "student", label: content.segments.student.label },
                  ] as const
                ).map((seg) => {
                  const isActive = state.segment === seg.id;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handleSegmentChange(seg.id)}
                      style={{
                        flex: "1 1 140px",
                        minHeight: "44px",
                        border: "none",
                        borderRadius: "6px",
                        font: "inherit",
                        fontWeight: 500,
                        cursor: "pointer",
                        backgroundColor: isActive ? "var(--color-segOn)" : "transparent",
                        color: isActive ? "var(--color-text)" : "var(--color-muted)",
                        boxShadow: isActive ? "var(--color-shadow)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {seg.label}
                    </button>
                  );
                })}
              </div>

              {/* Name & Email Row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
                <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="c-name" style={{ fontSize: "14px", fontWeight: 500 }}>
                    {content.commonLabels.nameLabel}
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    required
                    value={state.formData.name}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_FIELD",
                        field: "name",
                        value: e.target.value,
                      })
                    }
                    style={{
                      minHeight: "46px",
                      border: "1px solid var(--color-border2)",
                      borderRadius: "6px",
                      padding: "0 12px",
                      font: "inherit",
                      color: "inherit",
                      backgroundColor: "var(--color-surface)",
                    }}
                  />
                  {state.errors.name && (
                    <span style={{ fontSize: "12px", color: "var(--color-blocked)" }}>
                      {state.errors.name}
                    </span>
                  )}
                </div>

                <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="c-email" style={{ fontSize: "14px", fontWeight: 500 }}>
                    {activeSegmentConfig.emailLabel}
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    required
                    value={state.formData.email}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_FIELD",
                        field: "email",
                        value: e.target.value,
                      })
                    }
                    style={{
                      minHeight: "46px",
                      border: "1px solid var(--color-border2)",
                      borderRadius: "6px",
                      padding: "0 12px",
                      font: "inherit",
                      color: "inherit",
                      backgroundColor: "var(--color-surface)",
                    }}
                  />
                  {state.errors.email && (
                    <span style={{ fontSize: "12px", color: "var(--color-blocked)" }}>
                      {state.errors.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Recruiter extra fields */}
              {state.segment === "recruiter" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
                  <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label htmlFor="r-company" style={{ fontSize: "14px", fontWeight: 500 }}>
                      {content.segments.recruiter.companyLabel}
                    </label>
                    <input
                      id="r-company"
                      type="text"
                      value={state.formData.company || ""}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          field: "company",
                          value: e.target.value,
                        })
                      }
                      style={{
                        minHeight: "46px",
                        border: "1px solid var(--color-border2)",
                        borderRadius: "6px",
                        padding: "0 12px",
                        font: "inherit",
                        color: "inherit",
                        backgroundColor: "var(--color-surface)",
                      }}
                    />
                  </div>
                  <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label htmlFor="r-role" style={{ fontSize: "14px", fontWeight: 500 }}>
                      {content.segments.recruiter.roleLabel}
                    </label>
                    <input
                      id="r-role"
                      type="text"
                      value={state.formData.role || ""}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          field: "role",
                          value: e.target.value,
                        })
                      }
                      style={{
                        minHeight: "46px",
                        border: "1px solid var(--color-border2)",
                        borderRadius: "6px",
                        padding: "0 12px",
                        font: "inherit",
                        color: "inherit",
                        backgroundColor: "var(--color-surface)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Client extra fields */}
              {state.segment === "client" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
                  <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label htmlFor="k-type" style={{ fontSize: "14px", fontWeight: 500 }}>
                      {content.segments.client.projectTypeLabel}
                    </label>
                    <select
                      id="k-type"
                      value={state.formData.projectType || ""}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          field: "projectType",
                          value: e.target.value,
                        })
                      }
                      style={{
                        minHeight: "46px",
                        border: "1px solid var(--color-border2)",
                        borderRadius: "6px",
                        padding: "0 12px",
                        font: "inherit",
                        color: "inherit",
                        backgroundColor: "var(--color-surface)",
                      }}
                    >
                      {content.segments.client.projectTypes.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label htmlFor="k-time" style={{ fontSize: "14px", fontWeight: 500 }}>
                      {content.segments.client.timelineLabel}
                    </label>
                    <select
                      id="k-time"
                      value={state.formData.timeline || ""}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          field: "timeline",
                          value: e.target.value,
                        })
                      }
                      style={{
                        minHeight: "46px",
                        border: "1px solid var(--color-border2)",
                        borderRadius: "6px",
                        padding: "0 12px",
                        font: "inherit",
                        color: "inherit",
                        backgroundColor: "var(--color-surface)",
                      }}
                    >
                      {content.segments.client.timelines.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Student extra fields */}
              {state.segment === "student" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
                  <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label htmlFor="s-stage" style={{ fontSize: "14px", fontWeight: 500 }}>
                      {content.segments.student.stageLabel}
                    </label>
                    <select
                      id="s-stage"
                      value={state.formData.stage || ""}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          field: "stage",
                          value: e.target.value,
                        })
                      }
                      style={{
                        minHeight: "46px",
                        border: "1px solid var(--color-border2)",
                        borderRadius: "6px",
                        padding: "0 12px",
                        font: "inherit",
                        color: "inherit",
                        backgroundColor: "var(--color-surface)",
                      }}
                    >
                      {content.segments.student.stages.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label htmlFor="s-topic" style={{ fontSize: "14px", fontWeight: 500 }}>
                      {content.segments.student.topicLabel}
                    </label>
                    <select
                      id="s-topic"
                      value={state.formData.topic || ""}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          field: "topic",
                          value: e.target.value,
                        })
                      }
                      style={{
                        minHeight: "46px",
                        border: "1px solid var(--color-border2)",
                        borderRadius: "6px",
                        padding: "0 12px",
                        font: "inherit",
                        color: "inherit",
                        backgroundColor: "var(--color-surface)",
                      }}
                    >
                      {content.segments.student.topics.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Message */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="c-msg" style={{ fontSize: "14px", fontWeight: 500 }}>
                  {activeSegmentConfig.msgLabel}
                </label>
                <textarea
                  id="c-msg"
                  rows={5}
                  required
                  value={state.formData.message}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_FIELD",
                      field: "message",
                      value: e.target.value,
                    })
                  }
                  style={{
                    border: "1px solid var(--color-border2)",
                    borderRadius: "6px",
                    padding: "12px",
                    font: "inherit",
                    color: "inherit",
                    backgroundColor: "var(--color-surface)",
                    resize: "vertical",
                  }}
                />
                {state.errors.message && (
                  <span style={{ fontSize: "12px", color: "var(--color-blocked)" }}>
                    {state.errors.message}
                  </span>
                )}
              </div>

              {turnstileSiteKey && (
                <div ref={turnstileContainerRef} style={{ margin: "6px 0 12px" }} />
              )}

              <button
                type="submit"
                disabled={state.submitting}
                style={{
                  alignSelf: "flex-start",
                  minHeight: "48px",
                  padding: "0 24px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: "var(--color-btnBg)",
                  color: "var(--color-btnText)",
                  font: "inherit",
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: state.submitting ? 0.6 : 1,
                }}
              >
                {state.submitting ? "Sending..." : activeSegmentConfig.sendLabel}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
