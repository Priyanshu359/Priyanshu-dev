"use client";

import React from "react";
import type { AIDiagram } from "@/content/schema";

interface PipelineDiagramProps {
  data: AIDiagram;
  activeNodes?: string[];
  className?: string;
  style?: React.CSSProperties;
}

export function PipelineDiagram({
  data,
  activeNodes = [],
  className = "",
  style = {},
}: PipelineDiagramProps) {
  const isNodeActive = (id: string) => activeNodes.includes(id);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        ...style,
      }}
    >
      {data.lanes.map((lane) => (
        <div key={lane.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px dashed var(--color-border2)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.06em",
              color: "var(--color-muted)",
              fontWeight: 500,
            }}
          >
            {lane.label}
          </div>

          {lane.rows.map((row) => (
            <div key={row.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {row.nodes.map((node) => {
                  const active = isNodeActive(node.id);
                  const isModel = node.isModel;

                  let border = "1px solid var(--color-border2)";
                  let bg = "var(--color-surface)";
                  let opacity = activeNodes.length > 0 ? (active ? 1 : 0.45) : 1;
                  let tagColor = "var(--color-muted)";

                  if (active) {
                    border = isModel ? "2px solid #F0B070" : "2px solid var(--color-accent)";
                    bg = isModel ? "var(--color-warmBg)" : "var(--color-activeBg)";
                    tagColor = isModel ? "var(--color-warm)" : "var(--color-accent)";
                    opacity = 1;
                  }

                  return (
                    <div
                      key={node.id}
                      style={{
                        flex: "1 1 0",
                        minWidth: 0,
                        border,
                        backgroundColor: bg,
                        opacity,
                        borderRadius: "var(--radius-lg)",
                        padding: "8px 10px",
                        transition: "opacity 0.3s, background-color 0.3s, border-color 0.3s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "6px",
                          alignItems: "baseline",
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>
                          {node.label}
                        </span>
                        {isModel && (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              color: tagColor,
                              fontWeight: 600,
                            }}
                          >
                            AI
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                        {node.sub}
                      </div>
                    </div>
                  );
                })}
              </div>

              {row.arrow && (
                <div
                  aria-hidden="true"
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    lineHeight: 1,
                    color: "var(--color-muted)",
                  }}
                >
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
