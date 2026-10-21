"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface LabTabItem {
  id: string;
  number: string;
  title: string;
  href: string;
  status: "live" | "soon";
  shortTitle?: string;
}

const SHORT_TITLES: Record<string, string> = {
  "rate-limiting": "Rate limiting",
  "databases": "Databases",
  "caching": "Caching",
  "flash-sale": "Flash sale",
  "idempotent-payments": "Idempotency",
  "circuit-breaker": "Circuit breaker",
  "queues": "Queues & DLQ",
};

const defaultLabs: LabTabItem[] = [
  { id: "rate-limiting", number: "01", title: "Rate limiting", href: "/lab/rate-limiting", status: "live" },
  { id: "databases", number: "02", title: "Databases", href: "/lab/databases", status: "live" },
  { id: "caching", number: "03", title: "Caching", href: "/lab/caching", status: "live" },
  { id: "flash-sale", number: "04", title: "Flash sale", href: "/lab/flash-sale", status: "live" },
  { id: "idempotent-payments", number: "05", title: "Idempotent payments", href: "/lab/idempotent-payments", status: "live" },
  { id: "circuit-breaker", number: "06", title: "Circuit breaker", href: "/lab/circuit-breaker", status: "live" },
  { id: "queues", number: "07", title: "Queues & DLQ", href: "/lab/queues", status: "live" },
];

interface LabTabsProps {
  labs?: LabTabItem[];
  className?: string;
}

export function LabTabs({ labs = defaultLabs, className = "" }: LabTabsProps) {
  const pathname = usePathname();

  return (
    <div
      className={className}
      style={{
        borderBottom: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg)",
        position: "sticky",
        top: "72px",
        zIndex: 40,
        backdropFilter: "blur(12px)",
        transition: "background-color 0.25s, border-color 0.25s",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div
          aria-label="Lab experiments"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            overflowX: "auto",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            padding: "2px 0",
            flexWrap: "nowrap",
            width: "100%",
          }}
        >
          {labs.map((lab) => {
            const isActive = pathname === lab.href || (lab.href !== "/lab" && pathname.startsWith(lab.href));
            const displayTitle = lab.shortTitle || SHORT_TITLES[lab.id] || lab.title;

            if (lab.status === "soon") {
              return (
                <span
                  key={lab.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    color: "var(--color-muted)",
                    opacity: 0.6,
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ opacity: 0.5 }}>{lab.number}</span>
                  <span>{displayTitle}</span>
                  <span style={{ fontSize: "11px", opacity: 0.5 }}>soon</span>
                </span>
              );
            }

            return (
              <Link
                key={lab.id}
                href={lab.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "7px 13px",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.18s ease",
                  backgroundColor: isActive ? "var(--color-surface)" : "transparent",
                  color: isActive ? "var(--color-text)" : "var(--color-muted)",
                  border: isActive ? "1px solid var(--color-border2)" : "1px solid transparent",
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span
                  style={{
                    color: isActive ? "var(--color-accent)" : "inherit",
                    fontWeight: isActive ? 600 : 400,
                    opacity: isActive ? 1 : 0.65,
                  }}
                >
                  {lab.number}
                </span>
                <span>{displayTitle}</span>
                {isActive && (
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-green)",
                      boxShadow: "0 0 6px var(--color-green)",
                      display: "inline-block",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
