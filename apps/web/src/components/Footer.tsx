"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { HomeContent } from "@/content/schema";

interface FooterProps {
  data: HomeContent["footer"];
  telemetryOverride?: {
    served?: number | string;
    hits?: number | string;
    limits?: number | string;
  };
}

export function Footer({ data, telemetryOverride }: FooterProps) {
  const [stats, setStats] = useState(telemetryOverride);

  useEffect(() => {
    if (telemetryOverride) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${apiUrl}/stats`)
      .then((res) => (res.ok ? res.json() : null))
      .then((remoteData) => {
        if (remoteData && typeof remoteData.served !== "undefined") {
          setStats({
            served: remoteData.served,
            hits: remoteData.hits,
            limits: remoteData.limits,
          });
        }
      })
      .catch(() => {});
  }, [telemetryOverride]);

  const telemetry = data.telemetryFormat
    .replace("[live count]", String(stats?.served ?? telemetryOverride?.served ?? "[live count]"))
    .replace("[live count]", String(stats?.hits ?? telemetryOverride?.hits ?? "[live count]"))
    .replace("[live count]", String(stats?.limits ?? telemetryOverride?.limits ?? "[live count]"));

  return (
    <footer
      style={{
        backgroundColor: "var(--color-foot)",
        color: "var(--color-footText)",
        transition: "background-color 0.25s, color 0.25s",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "88px 24px 56px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "40px",
            lineHeight: 1.15,
            fontWeight: 600,
            letterSpacing: "var(--tracking-tight)",
            maxWidth: "720px",
            color: "var(--color-footText)",
          }}
        >
          {data.heading}
        </h2>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href={data.primaryCta.href}
            style={{
              backgroundColor: "var(--color-footBtnBg)",
              color: "var(--color-footBtnText)",
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: "var(--radius-md)",
              fontWeight: 500,
              fontSize: "15px",
              display: "inline-block",
              transition: "opacity 0.2s, transform 0.15s",
            }}
          >
            {data.primaryCta.label}
          </Link>

          {data.secondaryLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{
                color: "var(--color-footText)",
                textDecoration: "none",
                padding: "14px 22px",
                borderRadius: "var(--radius-md)",
                fontWeight: 500,
                fontSize: "15px",
                border: "1px solid var(--color-footBorder)",
                display: "inline-block",
                transition: "opacity 0.2s, border-color 0.2s",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <p
          style={{
            margin: "24px 0 0",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--color-footMuted)",
          }}
        >
          {telemetry}
        </p>
      </div>
    </footer>
  );
}
