import React from "react";
import type { Metadata } from "next";
import { getNav, getHome } from "@/content";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { StatusDashboard } from "@/components/status/StatusDashboard";

export const metadata: Metadata = {
  title: "Production System Status — Priyanshu Sinha",
  description:
    "Live health checks, telemetry metrics, and distributed infrastructure status for priyanshu.dev and api.priyanshu.dev.",
};

export default function StatusPage() {
  const navData = getNav();
  const homeData = getHome();

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav data={navData} />
      <StatusDashboard />
      <Footer data={homeData.footer} />
    </div>
  );
}
