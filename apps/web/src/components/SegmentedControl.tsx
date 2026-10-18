"use client";

import React from "react";

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel = "Options",
  className = "",
  style = {},
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        padding: "4px",
        backgroundColor: "var(--color-tint)",
        borderRadius: "var(--radius-lg)",
        ...style,
      }}
    >
      {options.map((option) => {
        const isSelected = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.id)}
            style={{
              flex: "1 1 140px",
              minHeight: "44px",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontFamily: "inherit",
              fontWeight: 500,
              fontSize: "15px",
              cursor: "pointer",
              backgroundColor: isSelected ? "var(--color-segOn)" : "transparent",
              color: isSelected ? "var(--color-text)" : "var(--color-muted)",
              boxShadow: isSelected ? "var(--color-shadow)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
