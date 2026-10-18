import React from "react";
import type { Metadata } from "next";
import { getNav, getLab } from "@/content";
import { LabShell } from "@/components/LabShell";
import { DatabaseWidget } from "@/components/labs/DatabaseWidget";

export const metadata: Metadata = {
  title: "Databases · Indexes, N+1 queries, transactions — Priyanshu Sinha",
  description: "Postgres index explorer, N+1 query loop counter, and concurrent transactions timeline.",
};

export default function DatabasesLabPage() {
  const navData = getNav();
  const { lab: labData, results } = getLab("databases");

  if (!labData) {
    return <div>Lab not found</div>;
  }

  return (
    <LabShell
      navData={navData}
      labData={labData}
      prevLink={{ label: "01 Rate limiting", href: "/lab/rate-limiting" }}
      nextLink={{ label: "Next: why backend is the hero of AI", href: "/ai" }}
    >
      <DatabaseWidget benchmarkResults={results} />
    </LabShell>
  );
}
