import React from "react";

interface MetricProps {
  value: string | number;
  label: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

export function Metric({
  value,
  label,
  color,
  size = "md",
  className = "",
  style = {},
}: MetricProps) {
  const fontSizes = {
    sm: "24px",
    md: "32px",
    lg: "44px",
  };

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: fontSizes[size],
          lineHeight: 1.1,
          fontWeight: 600,
          color: color || "var(--color-accent)",
          transition: "color 0.2s",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "var(--color-muted)",
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
    </div>
  );
}
