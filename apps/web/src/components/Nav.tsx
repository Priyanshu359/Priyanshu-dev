"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import type { Nav as NavData } from "@/content/schema";

interface NavProps {
  data?: NavData;
  nav?: NavData;
}

export function Nav({ data: customData, nav: customNav }: NavProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const data = customData || customNav;
  if (!data) {
    return null;
  }
  const isDark = theme === "dark";
  const toggleLabel = isDark ? data.themeToggle.darkLabel : data.themeToggle.lightLabel;

  return (
    <header
      style={{
        borderBottom: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        transition: "background-color 0.25s, border-color 0.25s",
      }}
    >
      <nav
        aria-label="Main"
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "0 24px",
          minHeight: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: "15px",
              textDecoration: "none",
              color: "var(--color-text)",
            }}
          >
            {data.brand}
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={toggleLabel}
            title={toggleLabel}
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              borderRadius: "50%",
              cursor: "pointer",
              background: "transparent",
              color: "var(--color-text)",
              border: "1px solid var(--color-border2)",
              transition: "border-color 0.2s, transform 0.15s",
            }}
          >
            {isDark ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation links & CTA exactly matching design/Main.dc.html */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
            fontSize: "15px",
          }}
        >
          {data.items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                style={{
                  textDecoration: "none",
                  color: "var(--color-text)",
                  fontWeight: isActive ? 600 : 400,
                  opacity: isActive ? 1 : 0.85,
                  transition: "opacity 0.2s",
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href={data.cta.href}
            style={{
              textDecoration: "none",
              backgroundColor: "var(--color-btnBg)",
              color: "var(--color-btnText)",
              padding: "10px 16px",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "15px",
              transition: "opacity 0.2s, transform 0.15s",
              display: "inline-block",
            }}
          >
            {data.cta.label}
          </Link>
        </div>
      </nav>
    </header>
  );
}
