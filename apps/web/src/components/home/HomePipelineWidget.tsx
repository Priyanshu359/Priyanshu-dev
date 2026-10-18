"use client";

import React, { useReducer, useEffect, useRef } from "react";
import { Pill } from "@/components/Pill";
import { StageCard } from "@/components/StageCard";
import { HeaderInspector } from "@/components/HeaderInspector";
import {
  homeSimReducer,
  initialHomeSimState,
  runHomeSimulation,
} from "@/sim/home-sim";
import { useEventStream } from "@/hooks/useEventStream";
import type { AskPresets, HomeContent } from "@/content/schema";

interface HomePipelineWidgetProps {
  demoConfig: HomeContent["demoConfig"];
  presets: AskPresets["presets"];
  pipelineStages: AskPresets["pipelineStages"];
}

export function HomePipelineWidget({
  demoConfig,
  presets,
  pipelineStages,
}: HomePipelineWidgetProps) {
  const [state, dispatch] = useReducer(homeSimReducer, initialHomeSimState);
  const [measuredLatency, setMeasuredLatency] = React.useState<number | null>(null);
  const { streamAsk } = useEventStream();
  const cancelRef = useRef<(() => void) | null>(null);

  // Auto-refill token every 3 seconds up to capacity
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "REFILL_TOKEN" });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (cancelRef.current) cancelRef.current();
    };
  }, []);

  const handleRun = async () => {
    if (state.running) return;
    if (cancelRef.current) cancelRef.current();

    const selectedPreset = presets[state.selectedQuestionIndex];
    if (!selectedPreset) return;

    dispatch({ type: "SET_REPLAY", isReplay: false });
    dispatch({ type: "START_REQUEST" });

    const timers: NodeJS.Timeout[] = [];
    const cancelAll = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
    cancelRef.current = cancelAll;

    const speedMultiplier = state.realSpeed ? 0.04 : 1;
    const later = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms * speedMultiplier));
    };

    let accumulatedText = "";
    let isHit = false;
    let isBlocked = false;
    let receivedEvents = false;
    const events: any[] = [];
    const startTime = performance.now();

    const success = await streamAsk(
      { q: selectedPreset.question, isHomePreset: true },
      {
        onEvent: (event) => {
          receivedEvents = true;
          events.push(event);
          if (event.type === "stream.token" && event.tokenChunk) {
            accumulatedText += event.tokenChunk;
          }
        },
        onError: (err) => {
          console.warn("Live Home preset /ask stream error, falling back to simulator:", err);
        },
      }
    );

    const actualLatencyMs = Math.round(performance.now() - startTime);
    setMeasuredLatency(actualLatencyMs);

    if (!success || !receivedEvents || events.length === 0) {
      // Offline fallback: simulator labelled "replay of a real request"
      cancelRef.current = runHomeSimulation(
        state,
        dispatch,
        presets,
        demoConfig.rateLimitBlockedText
      );
      return;
    }

    // Inspect live events to determine blocked and hit status
    const gatewayDone = events.find((e) => e.type === "stage.done" && e.stageNumber === 1);
    const cacheDone = events.find((e) => e.type === "stage.done" && e.stageNumber === 2);
    isBlocked = !!gatewayDone?.data?.blocked;
    isHit = !isBlocked && !!cacheDone?.data?.cacheHit;

    // Stage 0: Gateway
    later(() => {
      dispatch({ type: "SET_STAGE", index: 0, status: "done" });
      dispatch({ type: "SET_STAGE", index: 1, status: "active" });
    }, 280);

    // Stage 1: Rate limiter
    if (isBlocked) {
      later(() => {
        dispatch({
          type: "BLOCKED",
          message: demoConfig.rateLimitBlockedText,
        });
      }, 550);
      return;
    }

    later(() => {
      dispatch({ type: "DECREMENT_TOKEN" });
      dispatch({ type: "SET_STAGE", index: 1, status: "done" });
      dispatch({ type: "SET_STAGE", index: 2, status: "active" });
    }, 550);

    // Stage 2: Cache
    if (isHit) {
      later(() => {
        dispatch({ type: "SET_STAGE", index: 2, status: "done" });
        dispatch({ type: "SET_STAGE", index: 3, status: "skipped" });
        dispatch({ type: "SET_STAGE", index: 4, status: "skipped" });
        dispatch({ type: "SET_STAGE", index: 5, status: "active" });
        dispatch({ type: "SET_STREAM_TEXT", text: accumulatedText || selectedPreset.answer });
      }, 850);

      later(() => {
        dispatch({
          type: "COMPLETE_HIT",
          answer: accumulatedText || selectedPreset.answer,
        });
      }, 1100);
      return;
    }

    // Cache Miss Path
    later(() => {
      dispatch({ type: "SET_STAGE", index: 2, status: "done" });
      dispatch({ type: "SET_STAGE", index: 3, status: "active" });
    }, 850);

    later(() => {
      dispatch({ type: "SET_STAGE", index: 3, status: "done" });
      dispatch({ type: "SET_STAGE", index: 4, status: "active" });
    }, 1250);

    later(() => {
      dispatch({ type: "SET_STAGE", index: 4, status: "done" });
      dispatch({ type: "SET_STAGE", index: 5, status: "active" });
    }, 1650);

    later(() => {
      dispatch({ type: "SET_STREAM_TEXT", text: accumulatedText || selectedPreset.answer });
      dispatch({
        type: "COMPLETE_MISS",
        questionIndex: state.selectedQuestionIndex,
      });
    }, 2050);
  };

  const dotLeft = `${(state.dotIndex / 5) * 100}%`;
  const dotColor = state.dotBlocked ? "var(--color-blocked)" : "var(--color-accent)";
  const dotSpeed = state.realSpeed ? "0.05s" : "0.3s";

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-3xl)",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        boxShadow: "var(--color-shadow)",
      }}
    >
      {/* Top telemetry status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: state.isReplay ? "var(--color-muted)" : "var(--color-green)",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: state.isReplay ? "var(--color-muted)" : "var(--color-green)",
              display: "inline-block",
            }}
          />
          {state.isReplay ? "replay of a real request" : demoConfig.liveBadge}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px 24px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--color-muted)",
          }}
        >
          <span>
            requests: <strong style={{ color: "var(--color-text)" }}>{state.totalRequests}</strong>
          </span>
          <span>
            cache hits: <strong style={{ color: "var(--color-green)" }}>{state.cacheHits}</strong>
          </span>
          <span>
            tokens left: <strong style={{ color: "var(--color-text)" }}>{state.tokensRemaining}/5</strong>
          </span>

          <button
            type="button"
            onClick={() => dispatch({ type: "TOGGLE_SPEED" })}
            aria-pressed={state.realSpeed}
            style={{
              minHeight: "36px",
              padding: "0 14px",
              borderRadius: "var(--radius-full)",
              border: `1px solid ${state.realSpeed ? "var(--color-green)" : "var(--color-border2)"}`,
              backgroundColor: state.realSpeed ? "rgba(127, 209, 165, 0.12)" : "transparent",
              color: state.realSpeed ? "var(--color-green)" : "var(--color-text)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {state.realSpeed ? "Playback: real speed ⚡" : "Playback: slow-mo ⏳"}
          </button>
        </div>
      </div>

      {/* Preset Questions and Send Action */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", flex: "1 1 auto" }}>
          {presets.map((preset, i) => (
            <Pill
              key={preset.id}
              label={preset.question}
              active={state.selectedQuestionIndex === i}
              disabled={state.running}
              onClick={() => dispatch({ type: "SELECT_QUESTION", index: i })}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={state.running}
          style={{
            minHeight: "44px",
            padding: "0 24px",
            border: "none",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accentBtnText)",
            fontFamily: "inherit",
            fontWeight: 500,
            fontSize: "15px",
            cursor: state.running ? "not-allowed" : "pointer",
            marginLeft: "auto",
            transition: "opacity 0.2s, transform 0.15s",
            opacity: state.running ? 0.7 : 1,
          }}
        >
          {state.running ? "Sending…" : "Send request →"}
        </button>
      </div>

      {/* 6 Pipeline Stage Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {pipelineStages.map((stage, i) => {
          const st = state.stageStatuses[i];
          let customLabel = stage.ms;
          if (st === "done" && i === 2) {
            customLabel = `${state.lastHit ? "HIT" : "MISS"} · 1 ms`;
          }

          return (
            <StageCard
              key={stage.id}
              num={stage.num}
              name={stage.name}
              sub={stage.sub}
              status={st}
              label={customLabel}
            />
          );
        })}
      </div>

      {/* Animated Travelling Dot */}
      <div
        aria-hidden="true"
        style={{
          position: "relative",
          height: "14px",
          margin: "-14px 6px 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "6px",
            height: "2px",
            backgroundColor: "var(--color-border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "1px",
            left: dotLeft,
            width: "12px",
            height: "12px",
            marginLeft: "-6px",
            borderRadius: "50%",
            backgroundColor: dotColor,
            boxShadow: state.running ? "0 0 0 4px var(--color-activeBg)" : "none",
            transition: `left ${dotSpeed} ease, background-color 0.2s`,
          }}
        />
      </div>

      {/* Speed Notification Banner for Users */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "10px 16px",
          borderRadius: "var(--radius-md)",
          backgroundColor: state.realSpeed ? "rgba(127, 209, 165, 0.08)" : "rgba(242, 178, 99, 0.08)",
          border: `1px solid ${state.realSpeed ? "rgba(127, 209, 165, 0.25)" : "rgba(242, 178, 99, 0.25)"}`,
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          lineHeight: 1.5,
          color: state.realSpeed ? "#7FD1A5" : "#F2B263",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{state.realSpeed ? "⚡" : "⏳"}</span>
          <span>
            {state.realSpeed ? (
              <>
                <strong>Real Speed active:</strong> executing with zero artificial delays directly against Spring Boot & Redis (~15ms).
              </>
            ) : (
              <>
                <strong>Slow-mo is enabled by default</strong> so you can watch each hop. Want real speed?
              </>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_SPEED" })}
          style={{
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            border: `1px solid ${state.realSpeed ? "#7FD1A5" : "#F2B263"}`,
            backgroundColor: "transparent",
            color: state.realSpeed ? "#7FD1A5" : "#F2B263",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "11px",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          {state.realSpeed ? "Switch to Slow-Mo ⏳" : "Switch to Real Speed ⚡"}
        </button>
      </div>

      {/* Network Response Inspector */}
      <HeaderInspector
        status={state.statusText}
        cacheHeader={state.cacheHeader}
        remaining={state.tokensRemaining}
        responseTime={state.realSpeed && measuredLatency ? `${measuredLatency} ms` : state.responseTime}
        headers={[
          {
            key: "X-Playback-Mode",
            value: state.realSpeed
              ? `REAL TIME · Live backend response: ${measuredLatency ? `${measuredLatency} ms` : "sub-20ms"}`
              : "SLOW-MO · Educational pacing active (click button to benchmark real speed)",
            color: state.realSpeed ? "#7FD1A5" : "#F2B263",
          },
        ]}
        body={state.answerText}
      />

      <p style={{ margin: 0, fontSize: "14px", color: "var(--color-muted)", lineHeight: 1.5 }}>
        {demoConfig.note}
      </p>
    </div>
  );
}
