"use client";

import React, { useState } from "react";

interface TerminalPanelProps {
  command?: string;
  title?: string;
  children?: React.ReactNode;
  minHeight?: string;
  maxHeight?: string;
  copyText?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function TerminalPanel({
  command,
  title,
  children,
  minHeight = "auto",
  maxHeight,
  copyText,
  style = {},
  className = "",
}: TerminalPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = copyText || command;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: "var(--color-term)",
        color: "#E8EAED",
        borderRadius: "var(--radius-xl)",
        padding: "20px 24px",
        fontFamily: "var(--font-mono)",
        fontSize: "14px",
        lineHeight: 1.7,
        overflowX: "auto",
        minHeight,
        maxHeight,
        border: "1px solid rgba(255, 255, 255, 0.08)",
        position: "relative",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        ...style,
      }}
    >
      {(title || command) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
            paddingBottom: command && children ? "12px" : 0,
            borderBottom: command && children ? "1px solid #2A2F36" : undefined,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", gap: "6px" }} aria-hidden="true">
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF5F56", display: "inline-block" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FFBD2E", display: "inline-block" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27C93F", display: "inline-block" }} />
            </div>
            {title && (
              <span style={{ color: "#9AA0A8", fontSize: "12px" }}>{title}</span>
            )}
            {command && (
              <div>
                <span style={{ color: "#9AA0A8", marginRight: "8px" }}>$</span>
                <span style={{ color: "#E8EAED", fontWeight: 500 }}>{command}</span>
              </div>
            )}
          </div>

          {(command || copyText) && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy to clipboard"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: copied ? "#7FD1A5" : "#A3A9B3",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                transition: "all 0.2s",
              }}
            >
              {copied ? "copied ✓" : "copy"}
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
