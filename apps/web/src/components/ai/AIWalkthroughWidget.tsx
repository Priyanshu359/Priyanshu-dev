"use client";

import React, { useReducer, useEffect, useRef, useState } from "react";
import { PipelineDiagram } from "@/components/PipelineDiagram";
import {
  aiSimReducer,
  initialAISimState,
  type AISimBar,
  type AISimStepTelemetry,
} from "@/sim/ai-sim";
import { useEventStream, type StageStreamEvent } from "@/hooks/useEventStream";
import type {
  AIWalkthrough as AIWalkthroughData,
  AIDiagram as AIDiagramData,
  KnowledgeChunk,
} from "@/content/schema";

interface AIWalkthroughWidgetProps {
  walkthroughData: AIWalkthroughData;
  diagramData: AIDiagramData;
  knowledgeChunks: KnowledgeChunk[];
}

function buildTelemetryFromEvents(
  events: StageStreamEvent[],
  q: string
): {
  telemetry: Record<number, AISimStepTelemetry>;
  blocked: boolean;
  hit: boolean;
  remaining: number;
} {
  const telemetry: Record<number, AISimStepTelemetry> = {};
  let isBlocked = false;
  let isHit = false;
  let remaining = 4;

  for (const ev of events) {
    const d = ev.data || {};
    const dur = ev.durationMs || 1;

    if (ev.type === "stage.done") {
      switch (ev.stageNumber) {
        case 1: {
          isBlocked = !!d.blocked;
          remaining = d.rateLimitRemaining ?? (isBlocked ? 0 : 4);
          telemetry[0] = {
            stepIndex: 0,
            label: isBlocked ? "429 BLOCKED" : `ALLOWED · ${dur} ms`,
            data: `POST /ask\n{ "q": "${q}" }\nrequest-id: ${d.requestId || "req_live"}\nclient-ip: ${d.clientIp || "127.0.0.1"}\nauth: ${d.authStatus || "Anonymous visitor"} ✓\n${
              isBlocked
                ? "rate limit: bucket empty → 429 Too Many Requests\nRetry-After: 4s\nthe request stops here — nothing else runs"
                : `rate limit: allowed · ${remaining}/${d.rateLimitCapacity || 5} requests left`
            }`,
            ms: `${dur} ms`,
          };
          break;
        }
        case 2: {
          isHit = !!d.cacheHit;
          const tokens = (d.tokens as string[]) || [];
          telemetry[1] = {
            stepIndex: 1,
            label: isHit ? `CACHE HIT · ${dur} ms` : `CACHE MISS · ${dur} ms`,
            data: `tokens: [${tokens.map((w) => `"${w}"`).join(", ")}]\nvector: ${d.vectorDimensions || 384} dims (${d.embeddingModel || "all-MiniLM-L6-v2"})\n${
              d.closestCachedQuestion && d.closestCachedQuestion !== "none"
                ? `closest earlier question: "${d.closestCachedQuestion}"\nsimilarity ${Number(d.similarity || 0).toFixed(2)} → ${isHit ? "HIT" : "MISS"} (threshold ${d.threshold || 0.90})`
                : "cache is empty → MISS"
            }${isHit ? "\nthe stored answer would be returned in ~1 ms" : ""}`,
            ms: `${dur} ms`,
          };
          break;
        }
        case 3: {
          telemetry[2] = {
            stepIndex: 2,
            label: isHit ? "SKIPPED" : `CONTEXT LOADED · ${dur} ms`,
            data: isHit
              ? "Skipped — the semantic cache already covers this question, so no retrieval and no model call."
              : `session ${d.sessionId || "sess_live"} · ${Math.max(0, (d.sessionQuestionCount || 1) - 1)} earlier questions loaded from Postgres\nengine: ${d.orchestrationEngine || "Spring Boot 3.4 (Hexagonal Architecture)"}\nplan: search knowledge base → call model with context\ntools allowed: knowledge_search`,
            ms: `${dur} ms`,
          };
          break;
        }
        case 4: {
          const chunks = (d.chunks as any[]) || [];
          const bars: AISimBar[] = chunks.map((c) => ({
            title: c.title,
            score: Number(c.score || 0).toFixed(2),
            width: `${Math.max(4, Math.round(Number(c.score || 0) * 100))}%`,
          }));
          telemetry[3] = {
            stepIndex: 3,
            label: isHit ? "SKIPPED" : `TOP ${chunks.length} CHUNKS · ${dur} ms`,
            data: isHit
              ? "Skipped — cached query bypasses vector retrieval."
              : `${d.strategy || "pgvector HNSW Cosine Distance (1 - <=>)"} · top ${d.topK || 3}:\n${
                  chunks.length
                    ? chunks.map((c) => `[${c.title}] score ${Number(c.score || 0).toFixed(2)} (${c.source || "knowledge"})`).join("\n")
                    : "nothing above threshold"
                }`,
            ms: `${dur} ms`,
            bars: isHit ? undefined : bars,
          };
          break;
        }
        case 5: {
          const chunks = (events.find((e) => e.stageNumber === 4)?.data?.chunks as any[]) || [];
          telemetry[4] = {
            stepIndex: 4,
            label: isHit ? "SKIPPED" : `PROMPT ${d.promptTokens || 120} TOKENS · ${dur} ms`,
            data: isHit
              ? "Skipped — no LLM gateway call required."
              : `prompt assembled:\nSYSTEM: Answer only from CONTEXT. If it is not there, say so.\nCONTEXT: ${chunks.map((c) => `[${c.title}]`).join(" ") || "knowledge base"}\nQUESTION: ${q}\n≈ ${d.promptTokens || 120} tokens · budget 2,000 ✓\n\n→ LLM gateway: timeout 10s · 2 retries · circuit breaker closed\n→ provider: ${d.provider || "NoModelAnswerProvider"}\n→ ${d.architectureNotice || "Model call intercepted safely — zero generative API cost"}`,
            ms: `${dur} ms`,
          };
          break;
        }
        case 6: {
          telemetry[5] = {
            stepIndex: 5,
            label: isHit ? "CACHED STREAM" : `SSE READY · ${dur} ms`,
            data: `Content-Type: text/event-stream\nX-Cache: ${isHit ? "HIT" : "MISS"}\nprotocol: ${d.protocol || "Server-Sent Events (SSE)"}\nmode: ${d.streamingMode || "Architecture telemetry stream (zero answer text)"}\nNotice: AI page architecture walkthrough — zero generative model text transmitted`,
            ms: "ready",
          };
          break;
        }
        case 7: {
          telemetry[6] = {
            stepIndex: 6,
            label: "QUEUED · REDIS STREAM",
            data: `→ stream ${d.stream || "app:events"} via outbox (${d.outboxTable || "app.outbox_event"})\n→ consumer: usage-stream-consumer writes ${d.usageTable || "app.usage_event"}\ntokens recorded: ${d.tokensRecorded || 0} · cost incurred: ${d.costIncurred || "$0.0000"}\nprocessed asynchronously in background`,
            ms: "queued",
          };
          break;
        }
        case 8: {
          telemetry[7] = {
            stepIndex: 7,
            label: "READ-ONLY",
            data: `index: ${d.totalChunksIndexed || 3} chunks · 384-dim vectors (${d.embeddingModel || "all-MiniLM-L6-v2"})\nupserts keyed by ${d.deduplicationKey || "content_hash (SHA-256)"} → re-runs never duplicate\nyour question read the index; it didn't change it`,
            ms: "read-only",
          };
          break;
        }
      }
    } else if (ev.type === "pipeline.done") {
      const touched = isHit ? 8 : 13;
      telemetry[8] = {
        stepIndex: 8,
        label: `${touched} / 16 BOXES`,
        data: `your request touched ${touched} of ${d.totalArchitectureBoxes || 16} boxes in ${dur} ms\nmodel calls: 0 — free architecture walkthrough\neverything else: distributed backend (Spring Boot, Redis, Postgres, pgvector, SSE)\n${d.summary || "16 boxes in the architecture. Only 1 is the LLM — the remaining 15 are distributed backend systems."}`,
        ms: `${touched}/16`,
      };
    }
  }

  return { telemetry, blocked: isBlocked, hit: isHit, remaining };
}

export function AIWalkthroughWidget({
  walkthroughData,
  diagramData,
  knowledgeChunks,
}: AIWalkthroughWidgetProps) {
  const [state, dispatch] = useReducer(aiSimReducer, initialAISimState);
  const [loading, setLoading] = useState(false);
  const { streamAsk } = useEventStream();
  const cardsRef = useRef<HTMLDivElement>(null);

  // Auto-refill rate limit bucket
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: "REFILL_BUCKET" });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // IntersectionObserver to sync active step with user scroll (NEVER auto-scroll)
  useEffect(() => {
    const elements = document.querySelectorAll("[data-ai-step]");
    if (!elements.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const step = parseInt(entry.target.getAttribute("data-ai-step") || "0", 10);
            dispatch({ type: "SET_ACTIVE_STEP", step });
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSend = async (text?: string) => {
    if (loading) return;
    const q = text || state.question || walkthroughData.samplePrompts[0];
    dispatch({ type: "SET_QUESTION", question: q });
    setLoading(true);

    const events: StageStreamEvent[] = [];
    const success = await streamAsk(
      { q },
      {
        onEvent: (event) => {
          events.push(event);
        },
        onError: (err) => {
          console.warn("Live /ask stream error, falling back to simulator:", err);
        },
      }
    );

    setLoading(false);

    if (success && events.length > 0) {
      const liveResult = buildTelemetryFromEvents(events, q);
      dispatch({
        type: "SET_LIVE_RESULT",
        question: q,
        telemetry: liveResult.telemetry,
        blocked: liveResult.blocked,
        hit: liveResult.hit,
        remaining: liveResult.remaining,
        isReplay: false,
      });
    } else {
      // Simulator offline fallback labelled "replay of a real request"
      dispatch({
        type: "EXECUTE_QUESTION",
        question: q,
        knowledgeChunks,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const activeStepData = walkthroughData.steps[state.activeStep] || walkthroughData.steps[0];
  const progressPercent = `${((state.activeStep + 1) / walkthroughData.steps.length) * 100}%`;

  return (
    <section aria-label="Architecture walkthrough" style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-tint)" }}>
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "64px 24px 96px",
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          alignItems: "flex-start",
        }}
      >
        {/* Sticky Left Column: 16-box diagram and interactive query input */}
        <div
          style={{
            flex: "1 1 520px",
            minWidth: 0,
            position: "sticky",
            top: "88px",
            alignSelf: "flex-start",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-3xl)",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "var(--color-shadow)",
            zIndex: 10,
          }}
        >
          {/* Header indicator */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--color-muted)",
                fontWeight: 500,
              }}
            >
              AI-POWERED PLATFORM · STEP {state.activeStep + 1} / {walkthroughData.steps.length}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_ACTIVE_STEP", step: Math.max(0, state.activeStep - 1) })}
                disabled={state.activeStep === 0}
                aria-label="Previous step"
                style={{
                  width: "40px",
                  height: "36px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border2)",
                  background: "transparent",
                  color: "var(--color-text)",
                  cursor: state.activeStep === 0 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: state.activeStep === 0 ? 0.4 : 1,
                }}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_ACTIVE_STEP",
                    step: Math.min(walkthroughData.steps.length - 1, state.activeStep + 1),
                  })
                }
                disabled={state.activeStep === walkthroughData.steps.length - 1}
                aria-label="Next step"
                style={{
                  width: "40px",
                  height: "36px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border2)",
                  background: "transparent",
                  color: "var(--color-text)",
                  cursor: state.activeStep === walkthroughData.steps.length - 1 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: state.activeStep === walkthroughData.steps.length - 1 ? 0.4 : 1,
                }}
              >
                →
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: "4px", backgroundColor: "var(--color-border)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                height: "4px",
                width: progressPercent,
                backgroundColor: "var(--color-accent)",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {/* Client app simulation frame */}
          <div
            style={{
              border: "1px solid var(--color-border2)",
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: "var(--color-bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: "var(--color-tint)",
              }}
            >
              <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF5F56", display: "inline-block" }} />
              <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FFBD2E", display: "inline-block" }} />
              <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27C93F", display: "inline-block" }} />
              <span style={{ marginLeft: "6px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-muted)" }}>
                {walkthroughData.clientHeader || "client · priyanshu.dev/ask"}
              </span>
            </div>

            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <label htmlFor="ai-input" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                  Ask a question
                </label>
                <input
                  id="ai-input"
                  type="text"
                  maxLength={200}
                  value={state.question}
                  onChange={(e) => dispatch({ type: "SET_QUESTION", question: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder={walkthroughData.inputPlaceholder || "Type any question…"}
                  style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    minHeight: "44px",
                    border: "1px solid var(--color-border2)",
                    borderRadius: "6px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                    fontSize: "15px",
                    color: "inherit",
                    backgroundColor: "var(--color-surface)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  style={{
                    minHeight: "44px",
                    minWidth: "64px",
                    padding: "0 18px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-accentBtnText)",
                    fontFamily: "inherit",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                >
                  {walkthroughData.buttonLabel || "Send"}
                </button>
              </div>

              {/* Sample prompts */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {walkthroughData.samplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    style={{
                      minHeight: "32px",
                      padding: "0 10px",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--color-border2)",
                      backgroundColor: "transparent",
                      color: "var(--color-muted)",
                      fontFamily: "inherit",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "6px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: state.blocked ? "var(--color-blocked)" : "var(--color-muted)",
                }}
              >
                <span>
                  {loading
                    ? "streaming live architecture telemetry…"
                    : state.hasRun
                    ? `rate limit: ${state.bucket}/5 requests left · ${state.hit ? "cache HIT" : "cache MISS"}`
                    : walkthroughData.metaDefault || "token budget: 5/5 requests left"}
                </span>
                {state.hasRun && (
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      backgroundColor: state.isReplay ? "var(--color-tint)" : "rgba(39, 201, 63, 0.15)",
                      color: state.isReplay ? "var(--color-muted)" : "var(--color-green)",
                      border: "1px solid var(--color-border2)",
                    }}
                  >
                    {state.isReplay ? "replay of a real request" : "live backend · POST /ask"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 16-box Architecture Diagram with dynamic step highlighting */}
          <PipelineDiagram
            data={diagramData}
            activeNodes={activeStepData.nodes}
          />
        </div>

        {/* Right Column: 9 Scroll-Driven Step Cards */}
        <div
          ref={cardsRef}
          style={{
            flex: "1 1 360px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {walkthroughData.steps.map((step, idx) => {
            const isActive = state.activeStep === idx;
            const stepTelemetry = state.telemetry[idx];

            return (
              <div
                key={step.num}
                data-ai-step={idx}
                onClick={() => dispatch({ type: "SET_ACTIVE_STEP", step: idx })}
                style={{
                  minHeight: "340px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "12px",
                  padding: "28px",
                  borderRadius: "var(--radius-xl)",
                  cursor: "pointer",
                  backgroundColor: isActive ? "var(--color-surface)" : "transparent",
                  border: isActive ? "2px solid var(--color-accent)" : "1px solid var(--color-border2)",
                  boxShadow: isActive ? "var(--color-shadow)" : "none",
                  transition: "background-color 0.25s, border-color 0.25s",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isActive ? "var(--color-accent)" : "var(--color-muted)",
                  }}
                >
                  {step.num}
                </span>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    color: "var(--color-body)",
                    lineHeight: 1.6,
                  }}
                >
                  {step.text}
                </p>

                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--color-muted)",
                  }}
                >
                  {step.tech}
                </div>

                {/* "YOUR REQUEST" Telemetry Panel on Send (Never shows answer text) */}
                {state.hasRun && stepTelemetry && (
                  <div
                    style={{
                      marginTop: "10px",
                      paddingTop: "14px",
                      borderTop: "1px dashed var(--color-border2)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: state.blocked && idx === 0 ? "var(--color-blocked)" : "var(--color-accent)",
                        }}
                      >
                        YOUR REQUEST · {stepTelemetry.label}
                      </span>
                      {state.isReplay && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            color: "var(--color-muted)",
                          }}
                        >
                          replay of a real request
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        backgroundColor: "var(--color-term)",
                        color: "#E8EAED",
                        borderRadius: "var(--radius-md)",
                        padding: "12px 14px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {stepTelemetry.data}
                    </div>

                    {stepTelemetry.bars && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {stepTelemetry.bars.map((bar) => (
                          <div
                            key={bar.title}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              fontSize: "13px",
                            }}
                          >
                            <span style={{ flex: "0 0 130px", fontWeight: 500 }}>{bar.title}</span>
                            <span
                              style={{
                                flex: "1 1 auto",
                                height: "8px",
                                backgroundColor: "var(--color-tint)",
                                borderRadius: "4px",
                                overflow: "hidden",
                                display: "block",
                              }}
                            >
                              <span
                                style={{
                                  display: "block",
                                  height: "8px",
                                  width: bar.width,
                                  backgroundColor: "var(--color-accent)",
                                  transition: "width 0.5s ease",
                                }}
                              />
                            </span>
                            <span
                              style={{
                                flex: "0 0 40px",
                                textAlign: "right",
                                fontFamily: "var(--font-mono)",
                                fontSize: "12px",
                              }}
                            >
                              {bar.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
