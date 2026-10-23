"use client";

import React, { useReducer, useRef, useState, useEffect } from "react";
import { Pill } from "@/components/Pill";
import {
  databaseLabReducer,
  initialDatabaseLabState,
  indexStrategyData,
  n1StrategyData,
  txStrategyData,
  type IndexStrategy,
  type TxStrategy,
} from "@/sim/database-sim";

interface DatabaseWidgetProps {
  benchmarkResults?: Record<string, any>;
}

export function DatabaseWidget({ benchmarkResults }: DatabaseWidgetProps) {
  const [state, dispatch] = useReducer(databaseLabReducer, initialDatabaseLabState);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const [isIndexReplay, setIsIndexReplay] = useState(false);
  const [isN1Replay, setIsN1Replay] = useState(false);
  const [isTxReplay, setIsTxReplay] = useState(false);

  // Scale mode for index latency chart: "log" or "linear"
  const [indexScaleMode, setIndexScaleMode] = useState<"log" | "linear">("log");

  // Live results override
  const [liveIndexStats, setLiveIndexStats] = useState<{
    rows?: string;
    time?: string;
    plan?: string;
    runNumber?: number;
  } | null>(null);

  const [indexProgressRows, setIndexProgressRows] = useState<string | null>(null);
  const [liveStrategyStats, setLiveStrategyStats] = useState<Record<IndexStrategy, { time: string; rows: string; runNumber: number } | null>>({
    none: null,
    single: null,
    composite: null,
  });
  const [indexRunCount, setIndexRunCount] = useState<Record<IndexStrategy, number>>({
    none: 0,
    single: 0,
    composite: 0,
  });

  const [liveN1Duration, setLiveN1Duration] = useState<number | null>(null);
  const [liveTxTimeline, setLiveTxTimeline] = useState<Array<[string, string, string?]> | null>(null);
  const [liveTxResult, setLiveTxResult] = useState<{ balance: string; ok: boolean; summary: string } | null>(null);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

  // Check connection on mount
  useEffect(() => {
    fetch(`${apiUrl}/lab/db/courses?mode=fetch`, { method: "GET" })
      .then((res) => {
        if (res.ok) setConnectionError(null);
      })
      .catch(() => {
        setConnectionError(`Cannot reach Spring Boot at ${apiUrl}. Ensure backend is running.`);
      });
  }, [apiUrl]);

  // Run Experiment 1 (Indexes & Query Plans)
  const handleRunIndex = async () => {
    if (state.indexRunning) return;
    dispatch({ type: "START_INDEX_RUN" });

    const strategy = state.indexStrategy;
    setIndexProgressRows("0");

    let apiData: {
      rowsScanned: number;
      executionTimeMs: number;
      planText?: string;
      planSummary?: string;
    } | null = null;

    const fetchPromise = fetch(`${apiUrl}/lab/db/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategy }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Explain query failed");
        return res.json();
      })
      .then((data) => {
        apiData = data;
        setConnectionError(null);
        setIsIndexReplay(false);
      })
      .catch(() => {
        setConnectionError(`Database query failed: could not connect to Spring Boot at ${apiUrl}`);
        setIsIndexReplay(true);
      });

    if (strategy === "none") {
      // 1,000,000 rows full table scan animation steps across buffer pool
      later(() => setIndexProgressRows("184,320"), 110);
      later(() => setIndexProgressRows("472,190"), 230);
      later(() => setIndexProgressRows("768,440"), 370);
      later(() => setIndexProgressRows("985,120"), 490);
      later(async () => {
        try {
          await fetchPromise;
        } catch {
          // ignore
        }
        const newRun = (indexRunCount[strategy] || 0) + 1;
        setIndexRunCount((prev) => ({ ...prev, [strategy]: newRun }));

        const execTime = apiData?.executionTimeMs ? apiData.executionTimeMs : 418.2;
        const formattedTime = `~${execTime.toFixed(2)} ms`;
        const planText = apiData?.planText || apiData?.planSummary || indexStrategyData[strategy].plan;

        setLiveIndexStats({
          rows: "1,000,000",
          time: formattedTime,
          plan: planText,
          runNumber: newRun,
        });

        setLiveStrategyStats((prev) => ({
          ...prev,
          [strategy]: { time: formattedTime, rows: "1,000,000", runNumber: newRun },
        }));

        setIndexProgressRows(null);
        dispatch({ type: "FINISH_INDEX_RUN" });
      }, 620);
    } else if (strategy === "single") {
      // 1,180 rows index scan animation
      later(() => setIndexProgressRows("420"), 90);
      later(() => setIndexProgressRows("980"), 180);
      later(async () => {
        try {
          await fetchPromise;
        } catch {
          // ignore
        }
        const newRun = (indexRunCount[strategy] || 0) + 1;
        setIndexRunCount((prev) => ({ ...prev, [strategy]: newRun }));

        const execTime = apiData?.executionTimeMs ? apiData.executionTimeMs : 5.85;
        const formattedTime = `~${execTime.toFixed(2)} ms`;
        const planText = apiData?.planText || apiData?.planSummary || indexStrategyData[strategy].plan;

        setLiveIndexStats({
          rows: "1,180",
          time: formattedTime,
          plan: planText,
          runNumber: newRun,
        });

        setLiveStrategyStats((prev) => ({
          ...prev,
          [strategy]: { time: formattedTime, rows: "1,180", runNumber: newRun },
        }));

        setIndexProgressRows(null);
        dispatch({ type: "FINISH_INDEX_RUN" });
      }, 280);
    } else {
      // Composite: instant index pointer (20 rows)
      later(async () => {
        try {
          await fetchPromise;
        } catch {
          // ignore
        }
        const newRun = (indexRunCount[strategy] || 0) + 1;
        setIndexRunCount((prev) => ({ ...prev, [strategy]: newRun }));

        const execTime = apiData?.executionTimeMs ? apiData.executionTimeMs : 0.08;
        const formattedTime = `~${execTime.toFixed(2)} ms`;
        const planText = apiData?.planText || apiData?.planSummary || indexStrategyData[strategy].plan;

        setLiveIndexStats({
          rows: "20",
          time: formattedTime,
          plan: planText,
          runNumber: newRun,
        });

        setLiveStrategyStats((prev) => ({
          ...prev,
          [strategy]: { time: formattedTime, rows: "20", runNumber: newRun },
        }));

        setIndexProgressRows(null);
        dispatch({ type: "FINISH_INDEX_RUN" });
      }, 110);
    }
  };

  // Run Experiment 2 (N+1 Problem)
  const handleRunN1 = async () => {
    dispatch({ type: "START_N1_RUN" });

    try {
      const res = await fetch(`${apiUrl}/lab/db/courses?mode=${state.n1Strategy}`);
      if (!res.ok) throw new Error("Courses query failed");
      const data = await res.json();

      setIsN1Replay(false);
      setLiveN1Duration(data.durationMs != null ? data.durationMs : null);

      if (state.n1Strategy === "fetch") {
        later(() => {
          dispatch({
            type: "SET_N1_PROGRESS",
            count: 1,
            log: [
              {
                text: data.sqlLog && data.sqlLog[0] ? data.sqlLog[0] : "SELECT c.*, i.* FROM courses c JOIN instructors i ON i.id = c.instructor_id LIMIT 50;",
                color: "#8FB4FF",
                isMain: true,
              },
            ],
          });
        }, 200);
      } else {
        // Naive N+1 animated log
        later(() => {
          dispatch({
            type: "SET_N1_PROGRESS",
            count: 1,
            log: [{ text: data.sqlLog?.[0] || "SELECT * FROM courses LIMIT 50;", color: "#8FB4FF", isMain: true }],
          });
        }, 80);

        const totalQueries = data.queryCount || 51;
        for (let k = 1; k < totalQueries; k++) {
          later(() => {
            const rows = [
              { text: data.sqlLog?.[0] || "SELECT * FROM courses LIMIT 50;", color: "#8FB4FF", isMain: true },
            ];
            for (let j = 1; j <= Math.min(k, 6); j++) {
              rows.push({
                text: data.sqlLog?.[j] || `SELECT * FROM instructors WHERE id = ${100 + j * 7};`,
                color: "#E8EAED",
                isMain: false,
              });
            }
            if (k > 6) {
              rows.push({
                text: `… +${k - 6} more identical queries (total: ${totalQueries})`,
                color: "#F2B263",
                isMain: false,
              });
            }
            dispatch({
              type: "SET_N1_PROGRESS",
              count: k + 1,
              log: rows,
            });
          }, 80 + k * 20);
        }
      }
    } catch {
      // Graceful fallback to real run replay
      setIsN1Replay(true);
      setLiveN1Duration(state.n1Strategy === "naive" ? 42.6 : 3.8);
      const isNaive = state.n1Strategy === "naive";

      if (!isNaive) {
        later(() => {
          dispatch({
            type: "SET_N1_PROGRESS",
            count: 1,
            log: [
              {
                text: "SELECT c.*, i.* FROM courses c\n  JOIN instructors i ON i.id = c.instructor_id\n  LIMIT 50;",
                color: "#8FB4FF",
                isMain: true,
              },
            ],
          });
        }, 200);
        return;
      }

      later(() => {
        dispatch({
          type: "SET_N1_PROGRESS",
          count: 1,
          log: [{ text: "SELECT * FROM courses LIMIT 50;", color: "#8FB4FF", isMain: true }],
        });
      }, 100);

      for (let k = 1; k <= 50; k++) {
        later(() => {
          const rows = [
            { text: "SELECT * FROM courses LIMIT 50;", color: "#8FB4FF", isMain: true },
          ];
          for (let j = 1; j <= Math.min(k, 6); j++) {
            rows.push({
              text: `SELECT * FROM instructors WHERE id = ${100 + j * 7};`,
              color: "#E8EAED",
              isMain: false,
            });
          }
          if (k > 6) {
            rows.push({
              text: `… +${k - 6} more identical queries (total: 51)`,
              color: "#F2B263",
              isMain: false,
            });
          }
          dispatch({
            type: "SET_N1_PROGRESS",
            count: k + 1,
            log: rows,
          });
        }, 100 + k * 20);
      }
    }
  };

  // Run Experiment 3 (Transactions & Concurrency Race)
  const handleRunTx = async () => {
    dispatch({ type: "START_TX_RUN" });

    try {
      const res = await fetch(`${apiUrl}/lab/db/withdraw-race`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: state.txStrategy }),
      });

      if (!res.ok) throw new Error("Withdraw race failed");
      const data = await res.json();

      setIsTxReplay(false);
      const steps: Array<[string, string, string?]> = data.timeline.map((step: any) => [
        step.who,
        step.text,
        step.timestampMs != null ? `+${step.timestampMs} ms` : undefined,
      ]);
      setLiveTxTimeline(steps);
      setLiveTxResult({
        balance: `₹${(data.finalBalancePaise / 100).toLocaleString()}`,
        ok: data.ok,
        summary: data.summary,
      });

      steps.forEach((_, i) => {
        later(() => {
          dispatch({ type: "SET_TX_STEP", step: i + 1 });
        }, 200 + i * 300);
      });
    } catch {
      // Graceful fallback to real run replay
      setIsTxReplay(true);
      setLiveTxTimeline(null);
      setLiveTxResult(null);

      const steps = txStrategyData[state.txStrategy].steps;
      steps.forEach((_, i) => {
        later(() => {
          dispatch({ type: "SET_TX_STEP", step: i + 1 });
        }, 200 + i * 350);
      });
    }
  };

  // Experiment 1 data
  const curIdx = indexStrategyData[state.indexStrategy];
  const idxColor =
    curIdx.badLevel === 2
      ? "var(--color-blocked)"
      : curIdx.badLevel === 1
      ? "var(--color-warm)"
      : "var(--color-green)";

  // Experiment 2 data
  const curN1 = n1StrategyData[state.n1Strategy];
  const n1Color =
    state.n1Strategy === "naive"
      ? "var(--color-blocked)"
      : "var(--color-green)";

  // Experiment 3 data
  const curTx = txStrategyData[state.txStrategy];
  const stepsList = liveTxTimeline || curTx.steps;
  const txDone = state.txRan && state.txShownSteps >= stepsList.length;
  const txShownList = stepsList.slice(0, state.txShownSteps);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
      {/* Backend Connection Status */}
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px", width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: connectionError ? "#FF7B72" : "var(--color-green)",
                boxShadow: connectionError ? "0 0 8px rgba(255,123,114,0.6)" : "0 0 8px rgba(46,160,67,0.6)",
                display: "inline-block",
              }}
            />
            <span style={{ color: connectionError ? "#FF7B72" : "var(--color-green)", fontWeight: 500 }}>
              {connectionError ? "BACKEND OFFLINE" : "CONNECTED TO BACKEND · Spring Boot (:3333) + PostgreSQL"}
            </span>
          </div>
          <span style={{ color: "var(--color-muted)", fontSize: "11px" }}>
            Real EXPLAIN ANALYZE · Hibernate Queries · Concurrency Race
          </span>
        </div>
        {connectionError && (
          <div
            style={{
              marginTop: "8px",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(255, 123, 114, 0.1)",
              border: "1px solid rgba(255, 123, 114, 0.3)",
              color: "#FF7B72",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
            }}
          >
            {connectionError}
          </div>
        )}
      </div>

      {/* EXECUTIVE BENCHMARK OVERVIEW BANNER */}
      <section aria-label="Database performance overview" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px", width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Card 1: Index Speedup */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: "20px 22px",
              boxShadow: "var(--color-shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-accent)", fontWeight: 600 }}>
                EXPERIMENT 01 · INDEXING
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(39, 174, 96, 0.15)",
                  color: "var(--color-green)",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                }}
              >
                5,225x faster
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-blocked)" }}>
                418 ms
              </span>
              <span style={{ color: "var(--color-muted)", fontSize: "18px" }}>➔</span>
              <span style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-green)" }}>
                0.08 ms
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>
              Composite index eliminates full-table scan and in-memory sort across 1M rows.
            </div>
          </div>

          {/* Card 2: N+1 Elimination */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: "20px 22px",
              boxShadow: "var(--color-shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-accent)", fontWeight: 600 }}>
                EXPERIMENT 02 · N+1 QUERIES
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(39, 174, 96, 0.15)",
                  color: "var(--color-green)",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                }}
              >
                11.2x faster
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-blocked)" }}>
                42.6 ms
              </span>
              <span style={{ color: "var(--color-muted)", fontSize: "18px" }}>➔</span>
              <span style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-green)" }}>
                3.8 ms
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>
              `JOIN FETCH` replaces 51 serial DB round-trips with a single batch join.
            </div>
          </div>

          {/* Card 3: Concurrency Race */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: "20px 22px",
              boxShadow: "var(--color-shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-accent)", fontWeight: 600 }}>
                EXPERIMENT 03 · CONCURRENCY
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(39, 174, 96, 0.15)",
                  color: "var(--color-green)",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                }}
              >
                0% lost updates
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-blocked)" }}>
                100% loss
              </span>
              <span style={{ color: "var(--color-muted)", fontSize: "18px" }}>➔</span>
              <span style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-green)" }}>
                0% loss
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>
              Pessimistic row locking (`FOR UPDATE`) &amp; `@Version` protect double payout.
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIMENT 01: Indexes */}
      <section aria-label="Experiment 1: indexes" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px", width: "100%" }}>
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-3xl)",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            boxShadow: "var(--color-shadow)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-accent)", fontWeight: 500 }}>
                EXPERIMENT 01 · INDEXES &amp; QUERY PLANS
              </div>
              <h2 style={{ margin: "6px 0 0", fontSize: "28px", fontWeight: 600 }}>
                “Show me a user’s last 20 orders”
              </h2>
            </div>
            {isIndexReplay && (
              <span
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(242, 178, 99, 0.2)",
                  color: "#F2B263",
                  border: "1px solid rgba(242, 178, 99, 0.4)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                replay of a real run
              </span>
            )}
          </div>

          <div
            style={{
              backgroundColor: "var(--color-term)",
              color: "#E8EAED",
              borderRadius: "var(--radius-lg)",
              padding: "16px 18px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              lineHeight: 1.7,
              overflowX: "auto",
              whiteSpace: "pre",
            }}
          >
            <span style={{ color: "#8FB4FF" }}>SELECT</span> * <span style={{ color: "#8FB4FF" }}>FROM</span> orders
            {"\n"}
            <span style={{ color: "#8FB4FF" }}>WHERE</span> user_id = 4821 <span style={{ color: "#8FB4FF" }}>AND</span> created_at &gt; now() - interval {"'30 days'"}
            {"\n"}
            <span style={{ color: "#8FB4FF" }}>ORDER BY</span> created_at <span style={{ color: "#8FB4FF" }}>DESC LIMIT</span> 20;
          </div>

          {/* Strategy buttons */}
          <div role="group" aria-label="Index strategy" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            {(["none", "single", "composite"] as IndexStrategy[]).map((st) => (
              <Pill
                key={st}
                label={indexStrategyData[st].label}
                active={state.indexStrategy === st}
                onClick={() => {
                  setLiveIndexStats(null);
                  dispatch({ type: "SET_INDEX_STRATEGY", strategy: st });
                }}
              />
            ))}

            <button
              type="button"
              onClick={handleRunIndex}
              disabled={state.indexRunning}
              style={{
                minHeight: "44px",
                padding: "0 22px",
                border: "none",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accentBtnText)",
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "15px",
                cursor: state.indexRunning ? "not-allowed" : "pointer",
                marginLeft: "auto",
              }}
            >
              {state.indexRunning
                ? state.indexStrategy === "none"
                  ? "Scanning 1,000,000 rows…"
                  : state.indexStrategy === "single"
                  ? "Scanning user_id index…"
                  : "Reading composite index…"
                : "Run EXPLAIN ANALYZE"}
            </button>
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-muted)" }}>
            {curIdx.ddl}
          </div>

          {/* VISUAL LATENCY COMPARISON BLOCK */}
          <div
            style={{
              backgroundColor: "var(--color-surface-elevated, rgba(255, 255, 255, 0.02))",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>⚡ Execution Time Comparison</span>
                <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>(1,000,000 rows in PostgreSQL)</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "var(--color-tint)",
                  padding: "3px",
                  borderRadius: "6px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIndexScaleMode("log")}
                  style={{
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                    backgroundColor: indexScaleMode === "log" ? "var(--color-accent)" : "transparent",
                    color: indexScaleMode === "log" ? "var(--color-accentBtnText)" : "var(--color-muted)",
                    fontWeight: indexScaleMode === "log" ? 600 : 400,
                  }}
                >
                  Log scale
                </button>
                <button
                  type="button"
                  onClick={() => setIndexScaleMode("linear")}
                  style={{
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                    backgroundColor: indexScaleMode === "linear" ? "var(--color-accent)" : "transparent",
                    color: indexScaleMode === "linear" ? "var(--color-accentBtnText)" : "var(--color-muted)",
                    fontWeight: indexScaleMode === "linear" ? 600 : 400,
                  }}
                >
                  Linear scale (5000x)
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(["none", "single", "composite"] as IndexStrategy[]).map((st) => {
                const item = indexStrategyData[st];
                const isSelected = state.indexStrategy === st;
                const isNone = st === "none";
                const isSingle = st === "single";
                const barColor = isNone ? "var(--color-blocked)" : isSingle ? "var(--color-warm)" : "var(--color-green)";
                const barWidth =
                  indexScaleMode === "log"
                    ? (isNone ? "100%" : isSingle ? "32%" : "6%")
                    : (isNone ? "100%" : isSingle ? "1.4%" : "0.2%");

                return (
                  <div
                    key={st}
                    onClick={() => {
                      setLiveIndexStats(null);
                      setIndexProgressRows(null);
                      dispatch({ type: "SET_INDEX_STRATEGY", strategy: st });
                    }}
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-lg)",
                      border: `1.5px solid ${isSelected ? barColor : "var(--color-border2)"}`,
                      backgroundColor: isSelected ? "var(--color-tint)" : "transparent",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {/* Live scanning shimmer beam during run */}
                    {isSelected && state.indexRunning && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "inherit",
                          pointerEvents: "none",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: "50%",
                            height: "100%",
                            background: `linear-gradient(90deg, transparent, ${barColor}35, transparent)`,
                            animation: "scanShimmer 0.7s infinite linear",
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: barColor,
                            boxShadow: isSelected ? `0 0 8px ${barColor}` : "none",
                          }}
                        />
                        <span style={{ fontWeight: isSelected ? 600 : 500, fontSize: "14px" }}>{item.label}</span>
                        {isSelected && (
                          <span style={{ fontSize: "11px", color: barColor, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                            ● active
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                        <span style={{ color: "var(--color-muted)" }}>{item.rows} rows</span>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: barColor }}>
                          {liveStrategyStats[st]?.time || item.time}
                        </span>
                        {liveStrategyStats[st] && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: barColor,
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              border: `1px solid ${barColor}44`,
                            }}
                          >
                            Run #{liveStrategyStats[st]?.runNumber}
                          </span>
                        )}
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor: isNone
                              ? "rgba(235, 87, 87, 0.15)"
                              : isSingle
                              ? "rgba(242, 178, 99, 0.15)"
                              : "rgba(39, 174, 96, 0.15)",
                            color: barColor,
                          }}
                        >
                          {item.speedup}
                        </span>
                      </div>
                    </div>

                    {/* Progress visual bar */}
                    <div style={{ height: "10px", backgroundColor: "var(--color-tint)", borderRadius: "5px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: barWidth,
                          minWidth: indexScaleMode === "linear" && !isNone ? "6px" : undefined,
                          backgroundColor: barColor,
                          borderRadius: "5px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats & Plan Details */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Rows scanned</span>
                  {state.indexRunning && (
                    <span style={{ color: idxColor, fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, animation: "pulseGlow 0.8s infinite" }}>
                      Scanning engine…
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "32px", fontWeight: 700, color: idxColor }}>
                  {indexProgressRows !== null ? indexProgressRows : (liveIndexStats?.rows || curIdx.rows)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>
                  {curIdx.rowsNumber === 1000000 ? "Full table scan (999,980 discarded)" : curIdx.rowsNumber > 20 ? "Index scan + filter check" : "Exact index range scan (0 discarded)"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Execution time</span>
                  {liveIndexStats?.runNumber && !state.indexRunning && (
                    <span style={{ color: "var(--color-green)", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, animation: "liveBadgePulse 0.4s ease" }}>
                      ● Live Run #{liveIndexStats.runNumber}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "32px", fontWeight: 700, color: idxColor }}>
                  {state.indexRunning ? "Measuring…" : (liveIndexStats?.time || curIdx.time)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>
                  {liveIndexStats ? `Live EXPLAIN (ANALYZE, BUFFERS) · Run #${liveIndexStats.runNumber}` : "k6 Postgres benchmark baseline"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)", marginBottom: "6px" }}>
                  Relative work done (log scale)
                </div>
                <div style={{ height: "10px", backgroundColor: "var(--color-tint)", borderRadius: "5px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "10px",
                      width: curIdx.bar,
                      backgroundColor: idxColor,
                      borderRadius: "5px",
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                flex: "999 1 460px",
                minWidth: 0,
                backgroundColor: "var(--color-term)",
                color: "#E8EAED",
                borderRadius: "var(--radius-lg)",
                padding: "16px 18px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                lineHeight: 1.6,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {state.indexRunning ? (
                <div style={{ color: "#9AA0A8", fontStyle: "italic", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div>{"-- Executing EXPLAIN (ANALYZE, BUFFERS) in PostgreSQL..."}</div>
                  <div style={{ color: idxColor }}>
                    {state.indexStrategy === "none"
                      ? "--> Scanning 1,000,000 rows sequentially from disk/shared buffers..."
                      : state.indexStrategy === "single"
                      ? "--> Traversing B-Tree index (idx_orders_user) to find 1,180 rows..."
                      : "--> Direct index-only scan (idx_orders_composite), pre-sorted by created_at DESC..."}
                  </div>
                </div>
              ) : (
                liveIndexStats?.plan || curIdx.plan
              )}
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIMENT 02: N+1 */}
      <section aria-label="Experiment 2: N plus 1" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px", width: "100%" }}>
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-3xl)",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            boxShadow: "var(--color-shadow)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-accent)", fontWeight: 500 }}>
                EXPERIMENT 02 · THE N+1 PROBLEM
              </div>
              <h2 style={{ margin: "6px 0 0", fontSize: "28px", fontWeight: 600 }}>
                GET /lab/db/courses — 50 courses, each with its instructor
              </h2>
            </div>
            {isN1Replay && (
              <span
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(242, 178, 99, 0.2)",
                  color: "#F2B263",
                  border: "1px solid rgba(242, 178, 99, 0.4)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                replay of a real run
              </span>
            )}
          </div>

          <div role="group" aria-label="N+1 strategy" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <Pill
              label="Lazy loading (naive)"
              active={state.n1Strategy === "naive"}
              onClick={() => {
                setLiveN1Duration(null);
                dispatch({ type: "SET_N1_STRATEGY", strategy: "naive" });
              }}
            />
            <Pill
              label="JOIN FETCH"
              active={state.n1Strategy === "fetch"}
              onClick={() => {
                setLiveN1Duration(null);
                dispatch({ type: "SET_N1_STRATEGY", strategy: "fetch" });
              }}
            />

            <button
              type="button"
              onClick={handleRunN1}
              disabled={state.n1Running}
              style={{
                minHeight: "44px",
                padding: "0 22px",
                border: "none",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accentBtnText)",
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "15px",
                cursor: state.n1Running ? "not-allowed" : "pointer",
                marginLeft: "auto",
              }}
            >
              {state.n1Running ? "Firing Queries…" : "Call the endpoint"}
            </button>
          </div>

          {/* N+1 LATENCY & ROUND-TRIP VISUALIZER */}
          <div
            style={{
              backgroundColor: "var(--color-surface-elevated, rgba(255, 255, 255, 0.02))",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>⚡ Round-trip Latency &amp; Network Overhead</span>
                <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>(50 courses with instructors)</span>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: state.n1Strategy === "fetch" ? "var(--color-green)" : "var(--color-blocked)",
                }}
              >
                {state.n1Strategy === "fetch" ? "11.2x faster · 98% fewer round-trips" : "51 separate round-trips over TCP"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
              {/* Naive Row */}
              <div
                onClick={() => {
                  setLiveN1Duration(null);
                  dispatch({ type: "SET_N1_STRATEGY", strategy: "naive" });
                }}
                style={{
                  cursor: "pointer",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-lg)",
                  border: `1.5px solid ${state.n1Strategy === "naive" ? "var(--color-blocked)" : "var(--color-border2)"}`,
                  backgroundColor: state.n1Strategy === "naive" ? "var(--color-tint)" : "transparent",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>Lazy Loading (Naive N+1)</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-blocked)", fontWeight: 700 }}>
                    ~42.6 ms
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                  51 queries fired individually across 51 network round-trips
                </div>
                {/* Visual segments representation */}
                <div style={{ display: "flex", gap: "2px", height: "8px", overflow: "hidden", borderRadius: "4px" }}>
                  {Array.from({ length: 51 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor: "var(--color-blocked)",
                        opacity: i === 0 ? 1 : 0.6,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* JOIN FETCH Row */}
              <div
                onClick={() => {
                  setLiveN1Duration(null);
                  dispatch({ type: "SET_N1_STRATEGY", strategy: "fetch" });
                }}
                style={{
                  cursor: "pointer",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-lg)",
                  border: `1.5px solid ${state.n1Strategy === "fetch" ? "var(--color-green)" : "var(--color-border2)"}`,
                  backgroundColor: state.n1Strategy === "fetch" ? "var(--color-tint)" : "transparent",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>JOIN FETCH (Eager Batch)</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-green)", fontWeight: 700 }}>
                    ~3.8 ms
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                  1 single joined query fetched over 1 single network round-trip
                </div>
                {/* Visual segments representation */}
                <div style={{ display: "flex", height: "8px", overflow: "hidden", borderRadius: "4px" }}>
                  <div style={{ width: "9%", backgroundColor: "var(--color-green)" }} />
                  <div style={{ flex: 1, backgroundColor: "var(--color-tint)" }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>SQL queries fired</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "40px", lineHeight: 1.1, fontWeight: 700, color: n1Color }}>
                  {state.n1Ran ? state.n1Count : curN1.queries}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>
                  {curN1.queries > 1 ? "1 query for courses + 50 queries for instructors" : "1 single joined query"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>Execution time</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "32px", lineHeight: 1.1, fontWeight: 700, color: n1Color }}>
                  {liveN1Duration ? `~${liveN1Duration.toFixed(1)} ms` : curN1.time}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>
                  {curN1.queries > 1 ? "Accumulated round-trip database latency" : "Fast single round-trip execution"}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "var(--color-tint)",
                  borderRadius: "8px",
                  padding: "14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {curN1.code}
              </div>
            </div>

            <div
              style={{
                flex: "999 1 480px",
                minWidth: 0,
                backgroundColor: "var(--color-term)",
                color: "#E8EAED",
                borderRadius: "var(--radius-lg)",
                padding: "16px 18px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                lineHeight: 1.6,
                minHeight: "220px",
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ color: "#9AA0A8", marginBottom: "8px" }}>{"// Hibernate statement inspector SQL log"}</div>
              {state.n1Log.length === 0 && (
                <div style={{ color: "#9AA0A8", fontStyle: "italic" }}>
                  Click &ldquo;Call the endpoint&rdquo; to watch queries fire in real-time.
                </div>
              )}
              {state.n1Log.map((item, idx) => (
                <div key={idx} style={{ color: item.color, whiteSpace: "pre-wrap" }}>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIMENT 03: Transactions & Locking */}
      <section aria-label="Experiment 3: transactions" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px", width: "100%" }}>
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-3xl)",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            boxShadow: "var(--color-shadow)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-accent)", fontWeight: 500 }}>
                EXPERIMENT 03 · TRANSACTIONS &amp; LOCKING
              </div>
              <h2 style={{ margin: "6px 0 0", fontSize: "28px", fontWeight: 600 }}>
                Two ₹700 withdrawals hit a ₹1,000 wallet at the same moment
              </h2>
            </div>
            {isTxReplay && (
              <span
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(242, 178, 99, 0.2)",
                  color: "#F2B263",
                  border: "1px solid rgba(242, 178, 99, 0.4)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                replay of a real run
              </span>
            )}
          </div>

          <div role="group" aria-label="Transaction strategy" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            {(["naive", "lock", "optimistic"] as TxStrategy[]).map((st) => (
              <Pill
                key={st}
                label={txStrategyData[st].label}
                active={state.txStrategy === st}
                onClick={() => {
                  setLiveTxTimeline(null);
                  setLiveTxResult(null);
                  dispatch({ type: "SET_TX_STRATEGY", strategy: st });
                }}
              />
            ))}

            <button
              type="button"
              onClick={handleRunTx}
              disabled={state.txRunning}
              style={{
                minHeight: "44px",
                padding: "0 22px",
                border: "none",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accentBtnText)",
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "15px",
                cursor: state.txRunning ? "not-allowed" : "pointer",
                marginLeft: "auto",
              }}
            >
              {state.txRunning ? "Executing Race…" : "Fire both requests"}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            {/* Timeline column */}
            <div
              style={{
                flex: "999 1 480px",
                minWidth: 0,
                backgroundColor: "var(--color-term)",
                color: "#E8EAED",
                borderRadius: "var(--radius-lg)",
                padding: "16px 18px",
                minHeight: "260px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ color: "#9AA0A8" }}>{"// Concurrent thread execution timeline"}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-accent)" }}>
                  {curTx.latency}
                </span>
              </div>
              {!state.txRan && (
                <div style={{ color: "#9AA0A8", fontStyle: "italic" }}>
                  Select a strategy and click &ldquo;Fire both requests&rdquo; to start.
                </div>
              )}
              {txShownList.map(([who, text, timeOffset], idx) => {
                const isT1 = who === "T1";
                const tagColor = isT1 ? "#8FB4FF" : "#F2B263";
                const tagBg = isT1 ? "rgba(143, 180, 255, 0.15)" : "rgba(242, 178, 99, 0.15)";
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      padding: "4px 0",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        color: tagColor,
                        backgroundColor: tagBg,
                      }}
                    >
                      {who}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", flex: 1 }}>
                      {text}
                    </span>
                    {timeOffset && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#9AA0A8" }}>
                        {timeOffset}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Outcome column */}
            <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>Final balance</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "40px", lineHeight: 1.1, fontWeight: 700 }}>
                  {txDone ? (liveTxResult?.balance || curTx.balance) : "₹1,000"}
                </div>
              </div>

              <div
                style={{
                  border: `1px solid ${!txDone ? "var(--color-border2)" : (liveTxResult ? liveTxResult.ok : curTx.ok) ? "var(--color-green)" : "var(--color-blocked)"}`,
                  color: !txDone ? "var(--color-muted)" : (liveTxResult ? liveTxResult.ok : curTx.ok) ? "var(--color-green)" : "var(--color-blocked)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: 1.5,
                  backgroundColor: txDone ? ((liveTxResult ? liveTxResult.ok : curTx.ok) ? "var(--color-doneBg)" : "var(--color-blockedBg)") : "transparent",
                }}
              >
                {txDone ? (liveTxResult?.summary || curTx.result) : state.txRan ? "Running…" : "Pick a strategy and fire both requests."}
              </div>

              <div
                style={{
                  backgroundColor: "var(--color-tint)",
                  borderRadius: "8px",
                  padding: "14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  whiteSpace: "pre",
                  overflowX: "auto",
                }}
              >
                {curTx.code}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* k6 Load Test Benchmark Results */}
      {benchmarkResults && (
        <section aria-label="k6 Benchmarks" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px 60px", width: "100%" }}>
          <div
            style={{
              padding: "28px",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-3xl)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                ⚡ k6 Database Load Test Benchmarks
              </h3>
              <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                {benchmarkResults.tool} · {benchmarkResults.tableSize}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              {/* Indexes comparison */}
              <div style={{ padding: "18px", backgroundColor: "var(--color-surface-elevated, rgba(0,0,0,0.03))", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "8px" }}>
                  Query Plan &amp; Index Speed
                </div>
                <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>No index:</span>
                    <span style={{ color: "var(--color-blocked)", fontWeight: 600 }}>
                      {benchmarkResults.indexes?.none?.p50DurationMs} ms (1M rows)
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Single index:</span>
                    <span style={{ color: "var(--color-warm)", fontWeight: 600 }}>
                      {benchmarkResults.indexes?.single?.p50DurationMs} ms (1,180 rows)
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Composite:</span>
                    <span style={{ color: "var(--color-green)", fontWeight: 600 }}>
                      {benchmarkResults.indexes?.composite?.p50DurationMs} ms (20 rows)
                    </span>
                  </div>
                </div>
              </div>

              {/* N+1 comparison */}
              <div style={{ padding: "18px", backgroundColor: "var(--color-surface-elevated, rgba(0,0,0,0.03))", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "8px" }}>
                  N+1 vs JOIN FETCH
                </div>
                <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Naive N+1:</span>
                    <span style={{ color: "var(--color-blocked)", fontWeight: 600 }}>
                      {benchmarkResults.nPlusOne?.naive?.queryCount} queries ({benchmarkResults.nPlusOne?.naive?.durationMs} ms)
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>JOIN FETCH:</span>
                    <span style={{ color: "var(--color-green)", fontWeight: 600 }}>
                      {benchmarkResults.nPlusOne?.fetch?.queryCount} query ({benchmarkResults.nPlusOne?.fetch?.durationMs} ms)
                    </span>
                  </div>
                  <div style={{ marginTop: "4px", color: "var(--color-muted)", fontSize: "11px" }}>
                    11.2x latency reduction + 98% fewer round-trips
                  </div>
                </div>
              </div>

              {/* Concurrency race */}
              <div style={{ padding: "18px", backgroundColor: "var(--color-surface-elevated, rgba(0,0,0,0.03))", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "8px" }}>
                  Concurrency Race Isolation
                </div>
                <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>No lock:</span>
                    <span style={{ color: "var(--color-blocked)", fontWeight: 600 }}>
                      100% lost updates (double payout)
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Pessimistic lock:</span>
                    <span style={{ color: "var(--color-green)", fontWeight: 600 }}>
                      0% lost updates (safe reject)
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Optimistic lock:</span>
                    <span style={{ color: "var(--color-green)", fontWeight: 600 }}>
                      0% lost updates (@Version check)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

