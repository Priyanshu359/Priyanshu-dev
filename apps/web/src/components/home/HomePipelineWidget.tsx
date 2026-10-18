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

    let accumulatedText = "";
    let isHit = false;
    let isBlocked = false;
    let receivedEvents = false;

    const success = await streamAsk(
      { q: selectedPreset.question, isHomePreset: true },
      {
        onEvent: (event) => {
          receivedEvents = true;
          if (event.type === "stage.started") {
            const stNum = event.stageNumber ?? 1;
            if (stNum <= 6) {
              dispatch({ type: "SET_STAGE", index: stNum - 1, status: "active" });
            }
          } else if (event.type === "stage.done") {
            const stNum = event.stageNumber ?? 1;
            if (stNum === 1) {
              if (event.data?.blocked) {
                isBlocked = true;
                dispatch({
                  type: "BLOCKED",
                  message: demoConfig.rateLimitBlockedText,
                });
              } else {
                dispatch({ type: "DECREMENT_TOKEN" });
                dispatch({ type: "SET_STAGE", index: 0, status: "done" });
                dispatch({ type: "SET_STAGE", index: 1, status: "done" });
              }
            } else if (stNum === 2) {
              isHit = !!event.data?.cacheHit;
              dispatch({ type: "SET_STAGE", index: 2, status: "done" });
            } else if (stNum <= 6) {
              dispatch({ type: "SET_STAGE", index: stNum - 1, status: "done" });
            }
          } else if (event.type === "stream.token") {
            if (event.tokenChunk) {
              accumulatedText += event.tokenChunk;
              dispatch({ type: "SET_STREAM_TEXT", text: accumulatedText });
            }
          } else if (event.type === "pipeline.done") {
            if (!isBlocked) {
              if (isHit) {
                dispatch({
                  type: "COMPLETE_HIT",
                  answer: accumulatedText || selectedPreset.answer,
                });
              } else {
                dispatch({
                  type: "COMPLETE_MISS",
                  questionIndex: state.selectedQuestionIndex,
                });
              }
            }
          }
        },
        onError: (err) => {
          console.warn("Live Home preset /ask stream error, falling back to simulator:", err);
        },
      }
    );

    if (!success || !receivedEvents) {
      // Offline fallback: simulator labelled "replay of a real request"
      cancelRef.current = runHomeSimulation(
        state,
        dispatch,
        presets,
        demoConfig.rateLimitBlockedText
      );
    }
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
              border: "1px solid var(--color-border2)",
              backgroundColor: state.realSpeed ? "var(--color-activeBg)" : "transparent",
              color: state.realSpeed ? "var(--color-accent)" : "var(--color-text)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {state.realSpeed ? "Playback: real speed" : "Playback: slow-mo"}
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

      {/* Network Response Inspector */}
      <HeaderInspector
        status={state.statusText}
        cacheHeader={state.cacheHeader}
        remaining={state.tokensRemaining}
        responseTime={state.responseTime}
        body={state.answerText}
      />

      <p style={{ margin: 0, fontSize: "14px", color: "var(--color-muted)", lineHeight: 1.5 }}>
        {demoConfig.note}
      </p>
    </div>
  );
}
