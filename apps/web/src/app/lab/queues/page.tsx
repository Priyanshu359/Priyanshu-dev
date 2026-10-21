import React from "react";
import type { Metadata } from "next";
import { getNav, getLab } from "@/content";
import { LabShell } from "@/components/LabShell";
import { QueuesWidget } from "@/components/labs/QueuesWidget";

export const metadata: Metadata = {
  title: "Queues, Retries & Dead Letter Queues · Event-Driven Resiliency — Priyanshu Sinha",
  description: "Isolating poison pills and preventing head-of-line blocking using exponential backoff and Dead Letter Queues.",
};

export default function QueuesLabPage() {
  const navData = getNav();
  const { lab: labData, results } = getLab("queues");

  if (!labData) {
    return <div>Lab not found</div>;
  }

  return (
    <LabShell
      navData={navData}
      labData={labData}
      prevLink={{ label: "← 06 Circuit breaker", href: "/lab/circuit-breaker" }}
      nextLink={{ label: "Next: why backend is the hero of AI →", href: "/ai" }}
    >
      <QueuesWidget
        liveBadge={labData.liveBadge}
        liveNote={labData.experimentCopy?.liveNote}
        benchmarkResults={results}
      />
    </LabShell>
  );
}
