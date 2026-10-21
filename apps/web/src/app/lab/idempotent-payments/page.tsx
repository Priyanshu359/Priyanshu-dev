import React from "react";
import type { Metadata } from "next";
import { getNav, getLab } from "@/content";
import { LabShell } from "@/components/LabShell";
import { IdempotentPaymentsWidget } from "@/components/labs/IdempotentPaymentsWidget";

export const metadata: Metadata = {
  title: "Idempotent Payments · Replay Protection Live Demo — Priyanshu Sinha",
  description: "Preventing duplicate billing when customers retry or double-click payment buttons using idempotency keys.",
};

export default function IdempotentPaymentsLabPage() {
  const navData = getNav();
  const { lab: labData, results } = getLab("idempotent-payments");

  if (!labData) {
    return <div>Lab not found</div>;
  }

  return (
    <LabShell
      navData={navData}
      labData={labData}
      prevLink={{ label: "← 04 Flash sale", href: "/lab/flash-sale" }}
      nextLink={{ label: "Next: 06 Circuit breaker →", href: "/lab/circuit-breaker" }}
    >
      <IdempotentPaymentsWidget
        liveBadge={labData.liveBadge}
        liveNote={labData.experimentCopy?.liveNote}
        benchmarkResults={results}
      />
    </LabShell>
  );
}
