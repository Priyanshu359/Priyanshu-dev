import React from "react";
import type { Metadata } from "next";
import { getNav, getLab } from "@/content";
import { LabShell } from "@/components/LabShell";
import { CachingWidget } from "@/components/labs/CachingWidget";

export const metadata: Metadata = {
  title: "Caching · Redis Cache-Aside & TTL live demo — Priyanshu Sinha",
  description: "Interactive Redis cache-aside demonstration comparing cold database latency against sub-2ms cache hits.",
};

export default function CachingLabPage() {
  const navData = getNav();
  const { lab: labData, results } = getLab("caching");

  if (!labData) {
    return <div>Lab not found</div>;
  }

  return (
    <LabShell
      navData={navData}
      labData={labData}
      prevLink={{ label: "← 02 Databases", href: "/lab/databases" }}
      nextLink={{ label: "Next: 04 Flash sale →", href: "/lab/flash-sale" }}
    >
      <CachingWidget
        liveBadge={labData.liveBadge}
        liveNote={labData.experimentCopy?.liveNote}
        benchmarkResults={results}
      />
    </LabShell>
  );
}
