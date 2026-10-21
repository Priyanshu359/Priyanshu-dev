"use client";

import React, { useState, useTransition, useEffect } from "react";

interface QueueMessage {
  id: string;
  payload: string;
  attempts: number;
  maxAttempts: number;
  status: "PENDING" | "PROCESSING" | "RETRYING" | "SUCCESS" | "DLQ";
  queue: "main" | "retry" | "dlq" | "completed";
  lastError?: string;
  timestamp: number;
}

interface QueuePipelineResult {
  mainQueue: QueueMessage[];
  retryQueue: QueueMessage[];
  dlq: QueueMessage[];
  processed: QueueMessage[];
  totalProcessed: number;
  totalInDlq: number;
}

interface QueuesWidgetProps {
  liveBadge?: string;
  liveNote?: string;
  benchmarkResults?: Record<string, any>;
}

export function QueuesWidget({
  liveBadge = "LIVE · Max 3 Retries · Exponential Backoff & DLQ",
  liveNote = "On the live site, messages are routed through real Spring Boot event channels with exponential backoff and replay capabilities.",
  benchmarkResults: _benchmarkResults,
}: QueuesWidgetProps) {
  const [mainQueue, setMainQueue] = useState<QueueMessage[]>([
    { id: "MSG-001", payload: "Generate monthly invoice PDF", attempts: 0, maxAttempts: 3, status: "PENDING", queue: "main", timestamp: Date.now() },
    { id: "MSG-002", payload: "[POISON_PILL] Malformed JSON metadata", attempts: 0, maxAttempts: 3, status: "PENDING", queue: "main", timestamp: Date.now() },
    { id: "MSG-003", payload: "Send welcome onboarding email", attempts: 0, maxAttempts: 3, status: "PENDING", queue: "main", timestamp: Date.now() },
  ]);
  const [retryQueue, setRetryQueue] = useState<QueueMessage[]>([]);
  const [dlq, setDlq] = useState<QueueMessage[]>([]);
  const [processed, setProcessed] = useState<QueueMessage[]>([]);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

  const syncStateFromBackend = (data: QueuePipelineResult) => {
    setMainQueue(data.mainQueue || []);
    setRetryQueue(data.retryQueue || []);
    setDlq(data.dlq || []);
    setProcessed(data.processed || []);
  };

  // Fetch initial queue state from backend on mount
  useEffect(() => {
    fetch(`${apiUrl}/lab/queues/state`)
      .then((res) => {
        if (!res.ok) throw new Error("Queues state failed");
        return res.json();
      })
      .then((data) => {
        setConnectionError(null);
        syncStateFromBackend(data);
      })
      .catch(() => {
        setConnectionError(`Cannot reach Spring Boot at ${apiUrl}. Ensure backend is running.`);
      });
  }, [apiUrl]);

  const handlePublish = (isPoison: boolean) => {
    startTransition(async () => {
      const payload = isPoison
        ? "[POISON_PILL] Unparseable syntax payload"
        : `Send transactional webhook #${Math.floor(Math.random() * 1000)}`;
      try {
        const res = await fetch(`${apiUrl}/lab/queues/publish?payload=${encodeURIComponent(payload)}&isPoisonPill=${isPoison}`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("publish failed: HTTP " + res.status);
        const msg = await res.json();
        setConnectionError(null);
        setIsReplayMode(false);
        setMainQueue((prev) => [...prev, msg]);
      } catch (err: any) {
        setConnectionError(`Publish message failed: backend unreachable at ${apiUrl}/lab/queues/publish`);
      }
    });
  };

  const handleProcessStep = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl}/lab/queues/process-step`, { method: "POST" });
        if (!res.ok) throw new Error("process step failed: HTTP " + res.status);
        const data = await res.json();
        setConnectionError(null);
        setIsReplayMode(false);
        syncStateFromBackend(data);
      } catch (err: any) {
        setConnectionError(`Process step failed: backend unreachable at ${apiUrl}/lab/queues/process-step`);
      }
    });
  };

  const handleReplayDlq = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl}/lab/queues/replay-dlq`, { method: "POST" });
        if (!res.ok) throw new Error("replay failed: HTTP " + res.status);
        const data = await res.json();
        setConnectionError(null);
        setIsReplayMode(false);
        syncStateFromBackend(data);
      } catch (err: any) {
        setConnectionError(`DLQ replay failed: backend unreachable at ${apiUrl}/lab/queues/replay-dlq`);
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl}/lab/queues/reset`, { method: "POST" });
        if (res.ok) setConnectionError(null);
      } catch {
        setConnectionError(`Reset failed: backend unreachable at ${apiUrl}`);
      }
      setMainQueue([]);
      setRetryQueue([]);
      setDlq([]);
      setProcessed([]);
    });
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
        <div style={{ display: "flex", gap: "16px", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
          <span>Processed: <strong style={{ color: "var(--color-green)" }}>{processed.length}</strong></span>
          <span>In DLQ: <strong style={{ color: dlq.length > 0 ? "#E06C75" : "var(--color-muted)" }}>{dlq.length}</strong></span>
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
      </div>

      {/* Action Controls */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={isPending}
          onClick={handleProcessStep}
          style={{
            padding: "12px 20px",
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
          Process Next Step →
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => handlePublish(false)}
          style={{
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(46, 160, 67, 0.15)",
            color: "var(--color-green)",
            fontFamily: "inherit",
            fontWeight: 500,
            fontSize: "13px",
            border: "1px solid rgba(46, 160, 67, 0.4)",
            cursor: isPending ? "wait" : "pointer",
          }}
        >
          + Enqueue Healthy Message
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => handlePublish(true)}
          style={{
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(224, 108, 117, 0.15)",
            color: "#E06C75",
            fontFamily: "inherit",
            fontWeight: 500,
            fontSize: "13px",
            border: "1px solid rgba(224, 108, 117, 0.4)",
            cursor: isPending ? "wait" : "pointer",
          }}
        >
          + Enqueue Poison Pill
        </button>

        {dlq.length > 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleReplayDlq}
            style={{
              padding: "12px 18px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(242, 178, 99, 0.15)",
              color: "#F2B263",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: "13px",
              border: "1px solid rgba(242, 178, 99, 0.4)",
              cursor: isPending ? "wait" : "pointer",
            }}
          >
            Replay {dlq.length} Dead Letters
          </button>
        )}

        <button
          type="button"
          disabled={isPending}
          onClick={handleReset}
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "transparent",
            color: "var(--color-muted)",
            fontFamily: "inherit",
            fontSize: "13px",
            border: "1px solid var(--color-border)",
            cursor: isPending ? "wait" : "pointer",
          }}
        >
          Reset Queues
        </button>
      </div>

      {/* 4-Column Pipeline Stage */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}
      >
        {/* 1. Main Queue */}
        <div
          style={{
            padding: "18px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-muted)", textTransform: "uppercase" }}>
              Main Queue ({mainQueue.length})
            </span>
            <span style={{ fontSize: "11px", color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>tasks.inbox</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "180px" }}>
            {mainQueue.length === 0 ? (
              <div style={{ color: "var(--color-muted)", fontStyle: "italic", fontSize: "12px", margin: "auto" }}>
                Queue empty
              </div>
            ) : (
              mainQueue.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-text)", marginBottom: "4px" }}>
                    {m.id}
                  </div>
                  <div style={{ color: m.payload.includes("[POISON_PILL]") ? "#E06C75" : "var(--color-muted)" }}>
                    {m.payload}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Retry Queue with Backoff */}
        <div
          style={{
            padding: "18px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-muted)", textTransform: "uppercase" }}>
              Retry Queue ({retryQueue.length})
            </span>
            <span style={{ fontSize: "11px", color: "#F2B263", fontFamily: "var(--font-mono)" }}>tasks.retry</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "180px" }}>
            {retryQueue.length === 0 ? (
              <div style={{ color: "var(--color-muted)", fontStyle: "italic", fontSize: "12px", margin: "auto" }}>
                No active retries
              </div>
            ) : (
              retryQueue.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(242, 178, 99, 0.08)",
                    border: "1px solid rgba(242, 178, 99, 0.3)",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "#F2B263" }}>{m.id}</span>
                    <span style={{ fontSize: "11px", color: "#F2B263" }}>Attempt {m.attempts}/{m.maxAttempts}</span>
                  </div>
                  <div style={{ color: "#E06C75", fontSize: "11px" }}>{m.lastError}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Dead Letter Queue */}
        <div
          style={{
            padding: "18px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "#E06C75", textTransform: "uppercase", fontWeight: 700 }}>
              Dead Letter Queue ({dlq.length})
            </span>
            <span style={{ fontSize: "11px", color: "#E06C75", fontFamily: "var(--font-mono)" }}>tasks.dlq</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "180px" }}>
            {dlq.length === 0 ? (
              <div style={{ color: "var(--color-muted)", fontStyle: "italic", fontSize: "12px", margin: "auto" }}>
                Zero dead letters (Healthy)
              </div>
            ) : (
              dlq.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(224, 108, 117, 0.1)",
                    border: "1px solid rgba(224, 108, 117, 0.4)",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, color: "#E06C75" }}>{m.id}</span>
                    <span style={{ fontSize: "11px", color: "#E06C75" }}>FAILED ({m.attempts}/{m.maxAttempts})</span>
                  </div>
                  <div style={{ color: "#C4C7C5", fontSize: "11px", marginBottom: "4px" }}>{m.payload}</div>
                  <div style={{ color: "#E06C75", fontSize: "10px", fontStyle: "italic" }}>{m.lastError}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Processed / Completed */}
        <div
          style={{
            padding: "18px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-muted)", textTransform: "uppercase" }}>
              Completed ({processed.length})
            </span>
            <span style={{ fontSize: "11px", color: "var(--color-green)", fontFamily: "var(--font-mono)" }}>ACK / 200</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "180px", maxHeight: "300px", overflowY: "auto" }}>
            {processed.length === 0 ? (
              <div style={{ color: "var(--color-muted)", fontStyle: "italic", fontSize: "12px", margin: "auto" }}>
                None processed yet
              </div>
            ) : (
              processed.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(46, 160, 67, 0.08)",
                    border: "1px solid rgba(46, 160, 67, 0.25)",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-green)" }}>{m.id}</span>
                    <span style={{ fontSize: "11px", color: "var(--color-green)" }}>SUCCESS</span>
                  </div>
                  <div style={{ color: "var(--color-muted)", fontSize: "11px" }}>{m.payload}</div>
                </div>
              ))
            )}
          </div>
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
