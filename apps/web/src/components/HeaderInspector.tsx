import React from "react";

interface HeaderInspectorProps {
  status: string;
  cacheHeader?: string;
  remaining?: number | string;
  responseTime?: string;
  body?: string;
  retryAfter?: number | string;
  headers?: Array<{ key: string; value: string; color?: string }>;
  emptyStateText?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function HeaderInspector({
  status,
  cacheHeader = "—",
  remaining = "5",
  responseTime = "—",
  body,
  retryAfter,
  headers = [],
  emptyStateText,
  className = "",
  style = {},
}: HeaderInspectorProps) {
  const getStatusColor = (s: string) => {
    if (s.startsWith("200")) return "#7FD1A5";
    if (s.startsWith("429")) return "#FF9A7A";
    if (s === "…" || s.includes("sending")) return "#8FB4FF";
    return "#B8BDC4";
  };

  const statusColor = getStatusColor(status);

  return (
    <div
      className={className}
      style={{
        backgroundColor: "var(--color-term)",
        color: "#E8EAED",
        borderRadius: "var(--radius-xl)",
        padding: "20px 22px",
        fontFamily: "var(--font-mono)",
        fontSize: "14px",
        minHeight: "200px",
        overflowX: "auto",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        lineHeight: 1.6,
        ...style,
      }}
    >
      <div>
        HTTP/1.1 <span style={{ color: statusColor, fontWeight: 500 }}>{status}</span>
      </div>

      <div style={{ color: "#B8BDC4" }}>
        X-Cache:{" "}
        <span
          style={{
            color: cacheHeader === "HIT" ? "#7FD1A5" : cacheHeader === "MISS" ? "#8FB4FF" : "#B8BDC4",
            fontWeight: 500,
          }}
        >
          {cacheHeader}
        </span>
      </div>

      <div style={{ color: "#B8BDC4" }}>
        X-RateLimit-Remaining:{" "}
        <span style={{ color: "#F2B263", fontWeight: 500 }}>{remaining}</span>
      </div>

      <div style={{ color: "#B8BDC4" }}>
        X-Response-Time: <span>{responseTime}</span>
      </div>

      {retryAfter !== undefined && (
        <div style={{ color: "#FF9A7A" }}>
          Retry-After: <span>{retryAfter}s</span>
        </div>
      )}

      {headers.map((h) => (
        <div key={h.key} style={{ color: "#B8BDC4" }}>
          {h.key}: <span style={{ color: h.color || "#E8EAED" }}>{h.value}</span>
        </div>
      ))}

      <div style={{ height: "1px", backgroundColor: "#2A2F36", margin: "14px 0" }} />

      {body ? (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "16px",
            lineHeight: 1.6,
            color: "#F3F4F6",
            whiteSpace: "pre-wrap",
          }}
        >
          {body}
        </div>
      ) : emptyStateText ? (
        <div style={{ color: "#9AA0A8", fontStyle: "italic" }}>{emptyStateText}</div>
      ) : null}
    </div>
  );
}
