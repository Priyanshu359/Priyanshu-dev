import React from "react";

interface SectionProps {
  id?: string;
  ariaLabel?: string;
  bg?: "default" | "surface" | "tint" | "warm" | "dark";
  borderTop?: boolean;
  borderBottom?: boolean;
  maxWidth?: string;
  padding?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Section({
  id,
  ariaLabel,
  bg = "default",
  borderTop = false,
  borderBottom = false,
  maxWidth = "1120px",
  padding = "88px 24px",
  className = "",
  style = {},
  children,
}: SectionProps) {
  const bgMap = {
    default: "var(--color-bg)",
    surface: "var(--color-surface)",
    tint: "var(--color-tint)",
    warm: "var(--color-warmBg)",
    dark: "var(--color-term)",
  };

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={className}
      style={{
        backgroundColor: bgMap[bg],
        borderTop: borderTop ? "1px solid var(--color-border)" : undefined,
        borderBottom: borderBottom ? "1px solid var(--color-border)" : undefined,
        transition: "background-color 0.25s, border-color 0.25s",
        ...style,
      }}
    >
      <div
        style={{
          maxWidth,
          margin: "0 auto",
          padding,
        }}
      >
        {children}
      </div>
    </section>
  );
}
