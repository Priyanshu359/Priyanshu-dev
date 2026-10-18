import React from "react";
import type { Metadata } from "next";
import { getNav, getLab } from "@/content";
import { LabShell } from "@/components/LabShell";
import { RateLimitingWidget } from "@/components/labs/RateLimitingWidget";

export const metadata: Metadata = {
  title: "Rate limiting · Token bucket live demo — Priyanshu Sinha",
  description: "Token bucket interactive rate limiting demo with live response log and headers.",
};

export default function RateLimitingLabPage() {
  const navData = getNav();
  const { lab: labData, results } = getLab("rate-limiting");

  if (!labData) {
    return <div>Lab not found</div>;
  }

  return (
    <LabShell
      navData={navData}
      labData={labData}
      prevLink={{ label: "All demos", href: "/" }}
      nextLink={{ label: "Next: 02 Databases", href: "/lab/databases" }}
    >
      <RateLimitingWidget
        liveBadge={labData.liveBadge}
        liveNote={labData.experimentCopy?.liveNote}
        benchmarkResults={results}
      />
    </LabShell>
  );
}
