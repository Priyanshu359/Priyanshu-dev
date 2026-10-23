"use client";

import React, { useState, useTransition, useEffect } from "react";

interface CircuitBreakerCallLog {
  id: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  downstreamHealthy: boolean;
  fallbackUsed: boolean;
  latencyMs: number;
  message: string;
  time: string;
}

interface CircuitBreakerWidgetProps {
  liveBadge?: string;
  liveNote?: string;
  benchmarkResults?: Record<string, any>;
}

export function CircuitBreakerWidget({
  liveBadge = "LIVE · Resilience4j State Machine · 60% Threshold",
  liveNote = "On the live site, requests hit real Spring Boot endpoints managing thread-safe sliding windows and automatic probe timers.",
  benchmarkResults: _benchmarkResults,
}: CircuitBreakerWidgetProps) {
  const [currentState, setCurrentState] = useState<"CLOSED" | "OPEN" | "HALF_OPEN">("CLOSED");
  const [downstreamHealthy, setDownstreamHealthy] = useState(true);
  const [windowCalls, setWindowCalls] = useState<boolean[]>([]);
  const [log, setLog] = useState<CircuitBreakerCallLog[]>([]);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

  // Verify backend connection on mount
  useEffect(() => {
    fetch(`${apiUrl}/lab/circuit-breaker/call`)
      .then((res) => {
        if (!res.ok) throw new Error("Call failed");
        return res.json();
      })
      .then((data) => {
        setConnectionError(null);
        setCurrentState(data.state);
        setDownstreamHealthy(data.downstreamHealthy);
      })
      .catch(() => {
        setConnectionError(`Cannot reach Spring Boot at ${apiUrl}. Ensure backend is running.`);
      });
  }, [apiUrl]);

  const executeCall = async (): Promise<CircuitBreakerCallLog | null> => {
    const start = performance.now();
    try {
      const res = await fetch(`${apiUrl}/lab/circuit-breaker/call`, { method: "GET" });
      if (!res.ok) throw new Error("Call failed: HTTP " + res.status);
      const data = await res.json();
      setConnectionError(null);
      setIsReplayMode(false);
      setCurrentState(data.state);
      setDownstreamHealthy(data.downstreamHealthy);

      setWindowCalls((prev) => {
        const next = [...prev, !data.fallbackUsed];
        return next.slice(-5);
      });

      return {
        id: Math.random().toString(36).substring(2, 9),
        state: data.state,
        downstreamHealthy: data.downstreamHealthy,
        fallbackUsed: data.fallbackUsed,
        latencyMs: data.latencyMs || Math.round(performance.now() - start),
        message: data.message,
        time: new Date().toLocaleTimeString(),
      };
    } catch (err: any) {
      setConnectionError(`Circuit breaker call failed: cannot reach backend at ${apiUrl}/lab/circuit-breaker/call`);
      return null;
    }
  };

  const handleSendOne = () => {
    startTransition(async () => {
      const entry = await executeCall();
      if (entry) {
        setLog((prev) => [entry, ...prev.slice(0, 49)]);
      }
    });
  };

  const handleBurst = () => {
    startTransition(async () => {
      for (let i = 0; i < 5; i++) {
        const entry = await executeCall();
        if (entry) {
          setLog((prev) => [entry, ...prev.slice(0, 49)]);
        }
        await new Promise((r) => setTimeout(r, 60));
      }
    });
  };

  const handleToggleDownstream = () => {
    startTransition(async () => {
      const nextHealth = !downstreamHealthy;
      try {
        const res = await fetch(`${apiUrl}/lab/circuit-breaker/toggle?healthy=${nextHealth}`, { method: "POST" });
        if (res.ok) setConnectionError(null);
      } catch {
        setConnectionError(`Toggle downstream failed: backend unreachable at ${apiUrl}`);
      }
      setDownstreamHealthy(nextHealth);
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl}/lab/circuit-breaker/reset`, { method: "POST" });
        if (res.ok) setConnectionError(null);
      } catch {
        setConnectionError(`Reset failed: backend unreachable at ${apiUrl}`);
      }
      setCurrentState("CLOSED");
      setDownstreamHealthy(true);
      setWindowCalls([]);
      setLog([]);
    });
  };

  const stateColors = {
    CLOSED: { bg: "rgba(46, 160, 67, 0.15)", text: "var(--color-green)", border: "rgba(46, 160, 67, 0.3)" },
    OPEN: { bg: "rgba(224, 108, 117, 0.15)", text: "#E06C75", border: "rgba(224, 108, 117, 0.4)" },
    HALF_OPEN: { bg: "rgba(242, 178, 99, 0.15)", text: "#F2B263", border: "rgba(242, 178, 99, 0.4)" },
  };

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px 80px", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Top Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "16px 20px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: connectionError ? "#FF7B72" : "var(--color-green)",
              boxShadow: connectionError ? "0 0 10px rgba(255,123,114,0.6)" : "0 0 10px var(--color-green)",
            }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: connectionError ? "#FF7B72" : "inherit" }}>
            {connectionError ? "BACKEND OFFLINE · Spring Boot :3333" : liveBadge}
          </span>
        </div>
        <div style={{ display: "flex", gap: "16px", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
          <span>
            Circuit State:{" "}
            <strong style={{ color: stateColors[currentState].text }}>{currentState}</strong>
          </span>
          <span>
            Downstream:{" "}
            <strong style={{ color: downstreamHealthy ? "var(--color-green)" : "#E06C75" }}>
              {downstreamHealthy ? "HEALTHY" : "BROKEN (503)"}
            </strong>
          </span>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Left Column: State Machine & Controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "24px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Active State Card */}
          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-bg)",
              border: `1px solid ${stateColors[currentState].border}`,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-muted)", textTransform: "uppercase" }}>
                Current Circuit State
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "100px",
                  backgroundColor: stateColors[currentState].bg,
                  color: stateColors[currentState].text,
                  border: `1px solid ${stateColors[currentState].border}`,
                }}
              >
                {currentState}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text)", lineHeight: 1.4 }}>
              {currentState === "CLOSED" && "Circuit is CLOSED. All requests pass through to downstream service normally."}
              {currentState === "OPEN" && "Circuit is OPEN. Fail-fast mode active! Calls return cached fallbacks in <1ms without tying up threads."}
              {currentState === "HALF_OPEN" && "Circuit is HALF-OPEN. Permitting trial probe request to test downstream recovery."}
            </p>

            {/* Sliding Window Visualization */}
            <div>
              <span style={{ fontSize: "11px", color: "var(--color-muted)", display: "block", marginBottom: "6px" }}>
                Sliding Window (Last 5 Calls):
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                {Array.from({ length: 5 }).map((_, idx) => {
                  const call = windowCalls[idx];
                  const hasCall = call !== undefined;
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: "28px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor: !hasCall
                          ? "rgba(255, 255, 255, 0.05)"
                          : call
                          ? "rgba(46, 160, 67, 0.2)"
                          : "rgba(224, 108, 117, 0.2)",
                        color: !hasCall ? "var(--color-muted)" : call ? "var(--color-green)" : "#E06C75",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {!hasCall ? "·" : call ? "200" : "503"}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSendOne}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-text)",
                  color: "var(--color-bg)",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  cursor: isPending ? "wait" : "pointer",
                }}
              >
                Call Downstream Service
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleBurst}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                  fontFamily: "inherit",
                  fontWeight: 500,
                  fontSize: "14px",
                  border: "1px solid var(--color-border)",
                  cursor: isPending ? "wait" : "pointer",
                }}
              >
                Burst 5 Requests
              </button>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={handleToggleDownstream}
              style={{
                padding: "12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: downstreamHealthy ? "rgba(224, 108, 117, 0.15)" : "rgba(46, 160, 67, 0.15)",
                color: downstreamHealthy ? "#E06C75" : "var(--color-green)",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "13px",
                border: `1px solid ${downstreamHealthy ? "rgba(224, 108, 117, 0.4)" : "rgba(46, 160, 67, 0.4)"}`,
                cursor: isPending ? "wait" : "pointer",
              }}
            >
              {downstreamHealthy ? "Inject Downstream Failure (Simulate 503)" : "Heal Downstream Service (Restore 200)"}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleReset}
              style={{
                padding: "10px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                color: "var(--color-muted)",
                fontFamily: "inherit",
                fontSize: "13px",
                border: "1px solid var(--color-border)",
                cursor: isPending ? "wait" : "pointer",
              }}
            >
              Reset Circuit (To CLOSED)
            </button>
          </div>
        </div>

        {/* Right Column: Execution Telemetry */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "var(--color-term)",
            color: "#E8EAED",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            maxHeight: "560px",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9AA0A8" }}>// Circuit Breaker Execution Log</span>
            {isReplayMode && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(242, 178, 99, 0.2)",
                  color: "#F2B263",
                  border: "1px solid rgba(242, 178, 99, 0.4)",
                }}
              >
                client replay mode
              </span>
            )}
          </div>

          {log.length === 0 ? (
            <div style={{ color: "#9AA0A8", fontStyle: "italic", padding: "20px 0" }}>
              Send requests or break downstream service to watch the state transitions.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {log.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color:
                          entry.state === "CLOSED"
                            ? "var(--color-green)"
                            : entry.state === "OPEN"
                            ? "#E06C75"
                            : "#F2B263",
                      }}
                    >
                      STATE: {entry.state}
                    </span>
                    <span style={{ color: entry.latencyMs <= 2 ? "var(--color-green)" : "#E8EAED", fontSize: "12px" }}>
                      {entry.latencyMs}ms {entry.fallbackUsed && "(FAST-FAIL / FALLBACK)"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#C4C7C5" }}>{entry.message}</div>
                  <div style={{ fontSize: "11px", color: "#9AA0A8", marginTop: "2px" }}>{entry.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explanatory Live Note */}
      {liveNote && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {liveNote}
        </p>
      )}
    </div>
  );
}
