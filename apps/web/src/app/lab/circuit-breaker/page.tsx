import React from "react";
import type { Metadata } from "next";
import { getNav, getLab } from "@/content";
import { LabShell } from "@/components/LabShell";
import { CircuitBreakerWidget } from "@/components/labs/CircuitBreakerWidget";

export const metadata: Metadata = {
  title: "Circuit Breaker · Cascading Failure Prevention Live Demo — Priyanshu Sinha",
  description: "Isolating slow downstream services using Resilience4j state machines, sub-millisecond fast-fail, and half-open probe recovery.",
};

export default function CircuitBreakerLabPage() {
  const navData = getNav();
  const { lab: labData, results } = getLab("circuit-breaker");

  if (!labData) {
    return <div>Lab not found</div>;
  }

  return (
    <LabShell
      navData={navData}
      labData={labData}
      prevLink={{ label: "← 05 Idempotent payments", href: "/lab/idempotent-payments" }}
      nextLink={{ label: "Next: 07 Queues & retries →", href: "/lab/queues" }}
    >
      <CircuitBreakerWidget
        liveBadge={labData.liveBadge}
        liveNote={labData.experimentCopy?.liveNote}
        benchmarkResults={results}
      />
    </LabShell>
  );
}
