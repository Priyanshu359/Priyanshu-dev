"use client";

import React, { useState } from "react";
import type { ServicesFaq } from "@/content/schema";

interface ServicesFaqAccordionProps {
  data: ServicesFaq;
}

export function ServicesFaqAccordion({ data }: ServicesFaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(data.items[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {data.items.map((item) => {
        const isOpen = openId === item.id;
        const buttonId = `faq-btn-${item.id}`;
        const panelId = `faq-panel-${item.id}`;

        return (
          <div
            key={item.id}
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              overflow: "hidden",
              transition: "border-color 0.2s, background-color 0.2s",
            }}
          >
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              style={{
                width: "100%",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                textAlign: "left",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text)",
                font: "inherit",
                fontSize: "17px",
                fontWeight: 600,
              }}
            >
              <span>{item.question}</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "18px",
                  color: "var(--color-muted)",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  display: "inline-block",
                  lineHeight: 1,
                  userSelect: "none",
                }}
                aria-hidden="true"
              >
                +
              </span>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                style={{
                  padding: "0 24px 20px",
                  color: "var(--color-body)",
                  fontSize: "15px",
                  lineHeight: 1.65,
                }}
              >
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
                  {item.answer}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
