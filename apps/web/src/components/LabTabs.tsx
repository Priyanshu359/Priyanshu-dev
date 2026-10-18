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
}

const defaultLabs: LabTabItem[] = [
  { id: "rate-limiting", number: "01", title: "Rate limiting", href: "/lab/rate-limiting", status: "live" },
  { id: "databases", number: "02", title: "Databases", href: "/lab/databases", status: "live" },
  { id: "caching", number: "03", title: "Caching", href: "/lab/caching", status: "soon" },
  { id: "flash-sale", number: "04", title: "Flash sale", href: "/lab/flash-sale", status: "soon" },
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
        transition: "background-color 0.25s, border-color 0.25s",
      }}
    >
      <div
        aria-label="Lab experiments"
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          gap: "12px 16px",
          flexWrap: "wrap",
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
        }}
      >
        {labs.map((lab) => {
          const isActive = pathname === lab.href || (lab.href !== "/lab" && pathname.startsWith(lab.href));

          if (lab.status === "soon") {
            return (
              <span
                key={lab.id}
                style={{
                  padding: "14px 4px",
                  color: "var(--color-muted)",
                  userSelect: "none",
                }}
              >
                {lab.number} {lab.title} · soon
              </span>
            );
          }

          return (
            <Link
              key={lab.id}
              href={lab.href}
              style={{
                textDecoration: "none",
                padding: "14px 4px",
                borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--color-text)" : "var(--color-muted)",
                transition: "color 0.2s, border-color 0.2s",
              }}
            >
              {lab.number} {lab.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
