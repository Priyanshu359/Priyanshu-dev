import React from "react";

export type StageStatus = "idle" | "active" | "done" | "skipped" | "blocked";

export interface StageCardProps {
  num: string;
  name: string;
  sub: string;
  status: StageStatus;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function StageCard({
  num,
  name,
  sub,
  status = "idle",
  label,
  className = "",
  style = {},
}: StageCardProps) {
  let border = "1px solid var(--color-border2)";
  let bg = "var(--color-surface)";
  let labelColor = "var(--color-muted)";
  let displayLabel = label || "waiting";

  if (status === "active") {
    border = "2px solid var(--color-accent)";
    bg = "var(--color-activeBg)";
    labelColor = "var(--color-accent)";
    displayLabel = label || "running…";
  } else if (status === "done") {
    border = "1px solid var(--color-green)";
    bg = "var(--color-doneBg)";
    labelColor = "var(--color-green)";
  } else if (status === "skipped") {
    border = "1px dashed var(--color-skipBorder)";
    bg = "var(--color-skipBg)";
    labelColor = "var(--color-muted)";
    displayLabel = label || "skipped · cached";
  } else if (status === "blocked") {
    border = "2px solid var(--color-blocked)";
    bg = "var(--color-blockedBg)";
    labelColor = "var(--color-blocked)";
    displayLabel = label || "429 · blocked";
  }

  return (
    <div
      className={className}
      style={{
        flex: "1 1 150px",
        border,
        backgroundColor: bg,
        borderRadius: "var(--radius-lg)",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        transition: "border 0.2s, background-color 0.2s",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--color-muted)",
        }}
      >
        {num}
      </div>
      <div style={{ fontWeight: 600, fontSize: "15px" }}>{name}</div>
      <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>{sub}</div>
      <div
        style={{
          marginTop: "6px",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          fontWeight: 500,
          color: labelColor,
        }}
      >
        {displayLabel}
      </div>
    </div>
  );
}
