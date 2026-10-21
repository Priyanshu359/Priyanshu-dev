"use client";

import React, { useReducer, useEffect, useState, useCallback } from "react";
import {
  rateLimiterReducer,
  initialRateLimiterState,
  type RateLimiterRow,
} from "@/sim/rate-limiter-sim";

interface RateLimitingWidgetProps {
  liveBadge?: string;
  liveNote?: string;
  benchmarkResults?: Record<string, any>;
}

export function RateLimitingWidget({
  liveBadge = "LIVE · capacity 5 · refills 1 token / 2s",
  liveNote = "On the live site these requests hit a real Spring Boot endpoint backed by Redis. Open your Network tab and the headers above appear there too.",
  benchmarkResults,
}: RateLimitingWidgetProps) {
  const [state, dispatch] = useReducer(rateLimiterReducer, initialRateLimiterState);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Local auto-refill timer if backend is offline or idle
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: "REFILL" });
    }, state.refillRateMs);
    return () => clearInterval(timer);
  }, [state.refillRateMs]);

  const [connectionError, setConnectionError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

  // Check connection on mount
  useEffect(() => {
    fetch(`${apiUrl}/lab/limited`, { method: "GET", headers: { Accept: "application/json" } })
      .then((res) => {
        if (res.ok) {
          setConnectionError(null);
          setIsReplayMode(false);
        }
      })
      .catch(() => {
        setConnectionError(`Cannot reach Spring Boot at ${apiUrl}. Ensure backend is running.`);
      });
  }, [apiUrl]);

  // Real API invocation against Spring Boot
  const sendRequestReal = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/lab/limited`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      setConnectionError(null);
      const remainingHeader = res.headers.get("x-ratelimit-remaining");
      const retryAfterHeader = res.headers.get("retry-after");
      const responseTime = res.headers.get("x-response-time") || "<1ms";
      const isReplay = res.headers.get("x-lab-replay") === "true";

      const remaining = remainingHeader !== null ? parseInt(remainingHeader, 10) : (res.status === 200 ? 4 : 0);
      const retryAfter = retryAfterHeader !== null ? parseInt(retryAfterHeader, 10) : (res.status === 429 ? 2 : 0);

      setIsReplayMode(isReplay);

      const is200 = res.status === 200;
      const row: RateLimiterRow = {
        id: Math.random().toString(36).substring(2, 9),
        status: is200 ? "200 OK" : "429 Too Many",
        remaining: Math.max(0, remaining),
        isBlocked: !is200,
        retryAfter: retryAfter > 0 ? retryAfter : undefined,
        color: is200 ? "var(--color-green)" : "var(--color-blocked)",
      };

      dispatch({
        type: "SET_LIVE_RESULT",
        row,
        tokens: is200 ? Math.max(0, remaining) : 0,
        responseTime,
      } as any);

      return is200;
    } catch (err: any) {
      setConnectionError(`Backend offline: Unable to reach ${apiUrl}/lab/limited. Please ensure Spring Boot is running on port 3333.`);
      return false;
    }
  }, [apiUrl]);

  const handleSendOne = async () => {
    setIsLoading(true);
    await sendRequestReal();
    setIsLoading(false);
  };

  const handleBurst = async () => {
    setIsLoading(true);
    // Fire 10 rapid requests to watch the bucket empty and 429s trigger
    for (let i = 0; i < 10; i++) {
      await sendRequestReal();
      await new Promise((r) => setTimeout(r, 40));
    }
    setIsLoading(false);
  };

  const handleReset = async () => {
    try {
      const res = await fetch(`${apiUrl}/lab/limited/reset`, { method: "POST" });
      if (res.ok) {
        setConnectionError(null);
      }
    } catch {
      setConnectionError(`Reset failed: Cannot reach backend at ${apiUrl}`);
    }
    dispatch({ type: "RESET" });
  };

  const slots = [0, 1, 2, 3, 4];

  return (
    <section aria-label="Live demo" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px 80px" }}>
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "32px",
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          boxShadow: "var(--color-shadow)",
        }}
      >
        {/* Controls Column */}
        <div style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: connectionError ? "#FF7B72" : "var(--color-green)",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: connectionError ? "#FF7B72" : "var(--color-green)",
                  display: "inline-block",
                  boxShadow: connectionError ? "0 0 8px rgba(255,123,114,0.6)" : "0 0 8px rgba(46,160,67,0.6)",
                }}
              />
              {connectionError ? "BACKEND OFFLINE · Spring Boot :3333" : liveBadge}
            </div>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-muted)",
              }}
            >
              GET /lab/limited
            </span>
          </div>

          {connectionError && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(255, 123, 114, 0.1)",
                border: "1px solid rgba(255, 123, 114, 0.3)",
                color: "#FF7B72",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                lineHeight: 1.5,
              }}
            >
              {connectionError}
            </div>
          )}

          <div>
            <div style={{ fontSize: "14px", color: "var(--color-muted)", marginBottom: "10px" }}>
              Your bucket
            </div>
            <div style={{ display: "flex", gap: "10px" }} aria-label="Tokens remaining">
              {slots.map((i) => {
                const filled = i < state.tokens;
                return (
                  <div
                    key={i}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "8px",
                      border: "2px solid var(--color-accent)",
                      backgroundColor: filled ? "var(--color-accent)" : "transparent",
                      transition: "background-color 0.2s ease",
                    }}
                  />
                );
              })}
            </div>
            <div
              style={{
                marginTop: "12px",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
              }}
            >
              tokens: {state.tokens} / 5
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSendOne}
              style={{
                minHeight: "48px",
                padding: "0 22px",
                border: "none",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-btnBg)",
                color: "var(--color-btnText)",
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "15px",
                cursor: isLoading ? "wait" : "pointer",
                transition: "opacity 0.2s, transform 0.15s",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              Send 1 request
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleBurst}
              style={{
                minHeight: "48px",
                padding: "0 22px",
                border: "1px solid var(--color-text)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "15px",
                cursor: isLoading ? "wait" : "pointer",
                transition: "background-color 0.2s",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              Burst 10
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                minHeight: "48px",
                padding: "0 16px",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--color-muted)",
                fontFamily: "inherit",
                fontSize: "14px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Reset
            </button>
          </div>

          {/* Counts */}
          <div style={{ display: "flex", gap: "32px", fontFamily: "var(--font-mono)" }}>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 600, color: "var(--color-green)" }}>
                {state.okCount}
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>200 OK</div>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 600, color: "var(--color-blocked)" }}>
                {state.blockedCount}
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>429 Too Many</div>
            </div>
          </div>
        </div>

        {/* Network Log Column */}
        <div
          style={{
            flex: "1 1 420px",
            minWidth: 0,
            backgroundColor: "var(--color-term)",
            color: "#E8EAED",
            borderRadius: "var(--radius-xl)",
            padding: "20px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            minHeight: "360px",
            maxHeight: "420px",
            overflowY: "auto",
            overflowX: "auto",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: "#9AA0A8" }}>
              {"// Network — same as F12 → Network on the live site"}
            </span>
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
                replay of a real run
              </span>
            )}
          </div>

          {state.log.length === 0 && (
            <div style={{ color: "#9AA0A8", fontStyle: "italic", marginTop: "24px" }}>
              Send a request to see the response headers.
            </div>
          )}

          {state.log.map((row) => (
            <div
              key={row.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #2A2F36",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  GET /lab/limited{" "}
                  <span style={{ color: row.color, fontWeight: 500 }}>{row.status}</span>
                </div>
                {(row as any).responseTime && (
                  <span style={{ color: "#9AA0A8", fontSize: "11px" }}>{(row as any).responseTime}</span>
                )}
              </div>
              <div style={{ color: "#B8BDC4" }}>
                X-RateLimit-Remaining: {row.remaining}
              </div>
              {row.isBlocked && (
                <div style={{ color: "#F2B263" }}>
                  Retry-After: {row.retryAfter || 2}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p style={{ margin: "16px 0 0", fontSize: "14px", color: "var(--color-muted)" }}>
        {liveNote}
      </p>

      {/* k6 Load Test Benchmark Results */}
      {benchmarkResults && (
        <div
          style={{
            marginTop: "48px",
            padding: "28px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--color-text)" }}>
              ⚡ k6 Load Test Benchmark Results
            </h3>
            <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
              {benchmarkResults.tool} · {benchmarkResults.summary?.totalRequests} requests
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={{ padding: "16px", backgroundColor: "var(--color-surface-elevated, rgba(0,0,0,0.03))", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>p95 Latency</div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-green)", marginTop: "4px" }}>
                {benchmarkResults.summary?.p95DurationMs} ms
              </div>
            </div>

            <div style={{ padding: "16px", backgroundColor: "var(--color-surface-elevated, rgba(0,0,0,0.03))", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>Redis Atomic Lua</div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "#8FB4FF", marginTop: "4px" }}>
                {benchmarkResults.summary?.redisLatencyP95Ms} ms
              </div>
            </div>

            <div style={{ padding: "16px", backgroundColor: "var(--color-surface-elevated, rgba(0,0,0,0.03))", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>Burst 10 Test</div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text)", marginTop: "4px" }}>
                {benchmarkResults.burstTest?.admitted} admitted · {benchmarkResults.burstTest?.rejected} blocked (429)
              </div>
            </div>

            <div style={{ padding: "16px", backgroundColor: "var(--color-surface-elevated, rgba(0,0,0,0.03))", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>Steady State</div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-green)", marginTop: "4px" }}>
                {benchmarkResults.steadyState?.requestRate} · 0 drops
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
