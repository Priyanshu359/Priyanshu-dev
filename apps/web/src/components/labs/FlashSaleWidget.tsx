"use client";

import React, { useState, useTransition, useEffect } from "react";

interface FlashSaleEvent {
  orderId: string;
  userId: string;
  success: boolean;
  stockObserved: number;
  offsetMs: number;
  note: string;
}

interface FlashSaleSimulationSummary {
  strategy: string;
  initialStock: number;
  concurrentRequests: number;
  successfulOrders: number;
  failedOrders: number;
  oversoldAmount: number;
  finalStock: number;
  oversold: boolean;
  timeline: FlashSaleEvent[];
}

interface FlashSaleWidgetProps {
  liveBadge?: string;
  liveNote?: string;
  benchmarkResults?: Record<string, any>;
}

export function FlashSaleWidget({
  liveBadge = "LIVE · 10 Items Stock · Atomic Distributed Lock",
  liveNote = "On the live site, simulations fire real concurrent threads against Spring Boot using atomic Redis Lua scripts.",
  benchmarkResults: _benchmarkResults,
}: FlashSaleWidgetProps) {
  const [concurrency, setConcurrency] = useState(50);
  const [initialStock] = useState(10);
  const [currentStock, setCurrentStock] = useState(10);
  const [simSummary, setSimSummary] = useState<FlashSaleSimulationSummary | null>(null);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

  // Fetch initial stock on mount to verify backend
  useEffect(() => {
    fetch(`${apiUrl}/lab/flash-sale/stock`)
      .then((res) => {
        if (!res.ok) throw new Error("Stock fetch failed");
        return res.json();
      })
      .then((data) => {
        setConnectionError(null);
        if (data.stock !== undefined) setCurrentStock(data.stock);
      })
      .catch(() => {
        setConnectionError(`Cannot reach Spring Boot at ${apiUrl}. Ensure backend is running.`);
      });
  }, [apiUrl]);

  const runSim = (strategy: "atomic" | "naive") => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl}/lab/flash-sale/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ strategy, concurrency, stock: initialStock }),
        });
        if (!res.ok) throw new Error("API call failed");
        const data: FlashSaleSimulationSummary = await res.json();
        setConnectionError(null);
        setIsReplayMode(false);
        setSimSummary(data);
        setCurrentStock(data.finalStock);
      } catch (err: any) {
        setConnectionError(`Simulation failed: Unable to connect to Spring Boot at ${apiUrl}/lab/flash-sale/simulate`);
      }
    });
  };

  const handleBuySingle = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl}/lab/flash-sale/buy?userId=guest_${Math.floor(Math.random() * 1000)}&strategy=atomic`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setConnectionError(null);
        setCurrentStock(data.remainingStock);
      } catch {
        setConnectionError(`Buy order failed: backend unreachable at ${apiUrl}`);
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl}/lab/flash-sale/reset?stock=10`, { method: "POST" });
        if (res.ok) setConnectionError(null);
      } catch {
        setConnectionError(`Reset failed: backend unreachable at ${apiUrl}`);
      }
      setCurrentStock(10);
      setSimSummary(null);
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
        <div style={{ display: "flex", gap: "16px", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
          <span>
            Current Stock: <strong style={{ color: currentStock > 0 ? "var(--color-accent)" : "#E06C75" }}>{currentStock} / 10</strong>
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
        {/* Left Column: Controls & Visual Inventory */}
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
          {/* Inventory visual boxes */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Inventory Units (10 Available Initially)
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {Array.from({ length: 10 }).map((_, idx) => {
                const isClaimed = idx >= currentStock;
                return (
                  <div
                    key={idx}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: isClaimed ? "rgba(224, 108, 117, 0.15)" : "rgba(46, 160, 67, 0.15)",
                      color: isClaimed ? "#E06C75" : "var(--color-green)",
                      border: `1px solid ${isClaimed ? "rgba(224, 108, 117, 0.3)" : "rgba(46, 160, 67, 0.3)"}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    #{idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Concurrency Selector */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Simultaneous Buyers: {concurrency}
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[25, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setConcurrency(num)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                    border: concurrency === num ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                    backgroundColor: concurrency === num ? "rgba(79, 128, 255, 0.1)" : "transparent",
                    color: concurrency === num ? "var(--color-accent)" : "var(--color-text)",
                    cursor: "pointer",
                  }}
                >
                  {num} Buyers
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => runSim("atomic")}
              style={{
                padding: "14px 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-text)",
                color: "var(--color-bg)",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.7 : 1,
              }}
            >
              Simulate Atomic Lock (0 Oversold)
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => runSim("naive")}
              style={{
                padding: "14px 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(224, 108, 117, 0.1)",
                color: "#E06C75",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "14px",
                border: "1px solid rgba(224, 108, 117, 0.4)",
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.7 : 1,
              }}
            >
              Simulate Naive (Watch Overselling Race Condition)
            </button>

            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                disabled={isPending || currentStock <= 0}
                onClick={handleBuySingle}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  border: "1px solid var(--color-border)",
                  cursor: isPending || currentStock <= 0 ? "not-allowed" : "pointer",
                  opacity: currentStock <= 0 ? 0.5 : 1,
                }}
              >
                Buy 1 Item
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleReset}
                style={{
                  flex: 1,
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
                Reset Stock (10)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Concurrency Timeline & Audit Log */}
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
            <span style={{ color: "#9AA0A8" }}>{"// Concurrency Audit Trail"}</span>
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

          {/* Simulation Outcome Card */}
          {simSummary && (
            <div
              style={{
                padding: "14px",
                borderRadius: "8px",
                backgroundColor: simSummary.oversold ? "rgba(224, 108, 117, 0.15)" : "rgba(46, 160, 67, 0.15)",
                border: `1px solid ${simSummary.oversold ? "rgba(224, 108, 117, 0.4)" : "rgba(46, 160, 67, 0.4)"}`,
                color: "#FFFFFF",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
                {simSummary.oversold ? "CRITICAL RACE CONDITION: OVERSELLING OCCURRED" : "LOCK INTEGRITY VERIFIED: ZERO OVERSELLING"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px" }}>
                <span>Buyers Fired: <strong>{simSummary.concurrentRequests}</strong></span>
                <span>Initial Stock: <strong>{simSummary.initialStock}</strong></span>
                <span>Orders Confirmed: <strong style={{ color: simSummary.oversold ? "#FF6B6B" : "var(--color-green)" }}>{simSummary.successfulOrders}</strong></span>
                <span>Final Stock Level: <strong style={{ color: simSummary.finalStock < 0 ? "#FF6B6B" : "var(--color-green)" }}>{simSummary.finalStock}</strong></span>
              </div>
            </div>
          )}

          {!simSummary ? (
            <div style={{ color: "#9AA0A8", fontStyle: "italic", padding: "20px 0" }}>
              Click either simulation button to execute concurrent purchases against the inventory.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {simSummary.timeline.map((evt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 80px 1fr 60px",
                    gap: "8px",
                    alignItems: "center",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <span style={{ color: "#9AA0A8" }}>+{evt.offsetMs}ms</span>
                  <span style={{ color: evt.success ? "var(--color-green)" : "#E06C75", fontWeight: 600 }}>
                    {evt.success ? "CONFIRMED" : "REJECTED"}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#C4C7C5" }}>
                    {evt.note}
                  </span>
                  <span style={{ textAlign: "right", color: evt.stockObserved < 0 ? "#FF6B6B" : "#8AB4F8" }}>
                    stk:{evt.stockObserved}
                  </span>
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
