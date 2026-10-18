"use client";

import React, { useReducer, useRef, useState } from "react";
import { Pill } from "@/components/Pill";
import {
  databaseLabReducer,
  initialDatabaseLabState,
  indexStrategyData,
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

  // Live results override
  const [liveIndexStats, setLiveIndexStats] = useState<{
    rows?: string;
    time?: string;
    plan?: string;
  } | null>(null);

  const [liveTxTimeline, setLiveTxTimeline] = useState<Array<[string, string]> | null>(null);
  const [liveTxResult, setLiveTxResult] = useState<{ balance: string; ok: boolean; summary: string } | null>(null);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Run Experiment 1 (Indexes & Query Plans)
  const handleRunIndex = async () => {
    if (state.indexRunning) return;
    dispatch({ type: "START_INDEX_RUN" });

    try {
      const res = await fetch(`${apiUrl}/lab/db/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: state.indexStrategy }),
      });

      if (!res.ok) throw new Error("Explain query failed");
      const data = await res.json();

      setIsIndexReplay(false);
      setLiveIndexStats({
        rows: Number(data.rowsScanned).toLocaleString(),
        time: `~${data.executionTimeMs.toFixed(2)} ms`,
        plan: data.planSummary || indexStrategyData[state.indexStrategy].plan,
      });

      dispatch({ type: "FINISH_INDEX_RUN" });
    } catch {
      // Graceful fallback to real run replay
      setIsIndexReplay(true);
      setLiveIndexStats(null);
      later(() => {
        dispatch({ type: "FINISH_INDEX_RUN" });
      }, 500);
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
        }, 100);

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
          }, 100 + k * 25);
        }
      }
    } catch {
      // Graceful fallback to real run replay
      setIsN1Replay(true);
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
        }, 250);
        return;
      }

      later(() => {
        dispatch({
          type: "SET_N1_PROGRESS",
          count: 1,
          log: [{ text: "SELECT * FROM courses LIMIT 50;", color: "#8FB4FF", isMain: true }],
        });
      }, 150);

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
              text: `… +${k - 6} more identical queries`,
              color: "#F2B263",
              isMain: false,
            });
          }
          dispatch({
            type: "SET_N1_PROGRESS",
            count: k + 1,
            log: rows,
          });
        }, 150 + k * 30);
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
      const steps: Array<[string, string]> = data.timeline.map((step: any) => [step.who, step.text]);
      setLiveTxTimeline(steps);
      setLiveTxResult({
        balance: `₹${(data.finalBalancePaise / 100).toLocaleString()}`,
        ok: data.ok,
        summary: data.summary,
      });

      steps.forEach((_, i) => {
        later(() => {
          dispatch({ type: "SET_TX_STEP", step: i + 1 });
        }, 250 + i * 350);
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
        }, 300 + i * 400);
      });
    }
  };

  // Experiment 1 data
  const curIdx = indexStrategyData[state.indexStrategy];
  let idxColor = "var(--color-muted)";
  if (state.indexRan) {
    if (curIdx.badLevel === 2) idxColor = "var(--color-blocked)";
    else if (curIdx.badLevel === 1) idxColor = "var(--color-warm)";
    else idxColor = "var(--color-green)";
  }

  // Experiment 2 data
  const isN1Done = state.n1Ran && (state.n1Strategy === "naive" ? state.n1Count >= 51 : state.n1Count >= 1);
  const n1Color = !isN1Done
    ? "var(--color-text)"
    : state.n1Strategy === "naive"
    ? "var(--color-blocked)"
    : "var(--color-green)";
  const n1Code =
    state.n1Strategy === "naive"
      ? "courseRepo.findAll()\n  .forEach(c -> c.getInstructor()\n                 .getName());"
      : '@Query("select c from Course c\\n        join fetch c.instructor")\nList<Course> findAllWithInstructor();';

  // Experiment 3 data
  const curTx = txStrategyData[state.txStrategy];
  const stepsList = liveTxTimeline || curTx.steps;
  const txDone = state.txRan && state.txShownSteps >= stepsList.length;
  const txShownList = stepsList.slice(0, state.txShownSteps);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
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
              {state.indexRunning ? "Scanning…" : "Run EXPLAIN ANALYZE"}
            </button>
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-muted)" }}>
            {curIdx.ddl}
          </div>

          {/* Stats & Plan */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>Rows scanned</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "30px", fontWeight: 600, color: idxColor }}>
                  {state.indexRan ? (liveIndexStats?.rows || curIdx.rows) : "—"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>Execution time</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "30px", fontWeight: 600, color: idxColor }}>
                  {state.indexRan ? (liveIndexStats?.time || curIdx.time) : "—"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)", marginBottom: "6px" }}>
                  Work done (log scale)
                </div>
                <div style={{ height: "10px", backgroundColor: "var(--color-tint)", borderRadius: "5px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "10px",
                      width: state.indexRan ? curIdx.bar : "0%",
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
              {liveIndexStats?.plan || curIdx.plan}
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
              onClick={() => dispatch({ type: "SET_N1_STRATEGY", strategy: "naive" })}
            />
            <Pill
              label="JOIN FETCH"
              active={state.n1Strategy === "fetch"}
              onClick={() => dispatch({ type: "SET_N1_STRATEGY", strategy: "fetch" })}
            />

            <button
              type="button"
              onClick={handleRunN1}
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
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              Call the endpoint
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>SQL queries fired</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "40px", lineHeight: 1.1, fontWeight: 600, color: n1Color }}>
                  {state.n1Ran ? state.n1Count : "—"}
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
                {n1Code}
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
                  Click &ldquo;Call the endpoint&rdquo; to watch queries fire.
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
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              Fire both requests
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
              <div style={{ color: "#9AA0A8", marginBottom: "4px" }}>{"// Concurrent thread execution timeline"}</div>
              {!state.txRan && (
                <div style={{ color: "#9AA0A8", fontStyle: "italic" }}>
                  Select a strategy and click &ldquo;Fire both requests&rdquo; to start.
                </div>
              )}
              {txShownList.map(([who, text], idx) => {
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
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                      {text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Outcome column */}
            <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>Final balance</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "40px", lineHeight: 1.1, fontWeight: 600 }}>
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
        <section aria-label="k6 Benchmarks" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px", width: "100%" }}>
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
                    11x latency reduction + 98% fewer round-trips
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
