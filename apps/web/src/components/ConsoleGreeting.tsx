"use client";

import { useEffect } from "react";

export function ConsoleGreeting() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const titleStyle =
      "color: #27C93F; font-size: 16px; font-weight: 700; font-family: monospace; padding: 4px 0;";
    const bodyStyle =
      "color: #94A3B8; font-size: 12px; font-family: monospace; line-height: 1.6;";
    const linkStyle =
      "color: #60A5FA; font-size: 12px; font-family: monospace; font-weight: 600;";

    console.log(
      "%c🚀 Welcome to Priyanshu Sinha's Systems Portfolio",
      titleStyle
    );
    console.log(
      "%cBackend: Spring Boot 3.4 (Hexagonal) · Redis 7 · Supabase PostgreSQL 16 (pgvector)\n" +
        "Frontend: Next.js 15 (React 19) · Vanilla CSS Design System · Typed State Machines\n\n" +
        "⚡ Try curling the API directly from your terminal:\n" +
        "  curl https://api.priyanshu.dev/me\n" +
        "  curl https://api.priyanshu.dev/stats\n" +
        "  curl -X POST https://api.priyanshu.dev/ask -H 'Content-Type: application/json' -d '{\"q\":\"How does he use Redis?\"}'\n\n" +
        "Architecture Walkthrough: %chttps://priyanshu.dev/ai\n" +
        "%cSystem Status: %chttps://priyanshu.dev/status",
      bodyStyle,
      linkStyle,
      bodyStyle,
      linkStyle
    );
  }, []);

  return null;
}
