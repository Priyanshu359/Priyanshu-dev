"use client";

import React from "react";

export interface PillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
}

export function Pill({
  label,
  active = false,
  onClick,
  disabled = false,
  ariaLabel,
  size = "md",
  className = "",
  style = {},
}: PillProps) {
  const isSm = size === "sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={ariaLabel || label}
      className={className}
      style={{
        minHeight: isSm ? "32px" : "44px",
        padding: isSm ? "0 12px" : "0 16px",
        borderRadius: "var(--radius-full)",
        fontFamily: "inherit",
        fontSize: isSm ? "12px" : "15px",
        fontWeight: active ? 500 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        border: active ? "1px solid var(--color-text)" : "1px solid var(--color-border2)",
        backgroundColor: active ? "var(--color-text)" : "var(--color-surface)",
        color: active ? "var(--color-bg)" : "var(--color-text)",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {label}
    </button>
  );
}
