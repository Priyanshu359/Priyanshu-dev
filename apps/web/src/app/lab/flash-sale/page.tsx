import React from "react";
import type { Metadata } from "next";
import { getNav, getLab } from "@/content";
import { LabShell } from "@/components/LabShell";
import { FlashSaleWidget } from "@/components/labs/FlashSaleWidget";

export const metadata: Metadata = {
  title: "Flash Sale Without Overselling · Concurrency Live Demo — Priyanshu Sinha",
  description: "Simulating 100 concurrent buyers competing for 10 items. Compare naive race conditions against atomic Redis locks.",
};

export default function FlashSaleLabPage() {
  const navData = getNav();
  const { lab: labData, results } = getLab("flash-sale");

  if (!labData) {
    return <div>Lab not found</div>;
  }

  return (
    <LabShell
      navData={navData}
      labData={labData}
      prevLink={{ label: "← 03 Caching", href: "/lab/caching" }}
      nextLink={{ label: "Next: 05 Idempotent payments →", href: "/lab/idempotent-payments" }}
    >
      <FlashSaleWidget
        liveBadge={labData.liveBadge}
        liveNote={labData.experimentCopy?.liveNote}
        benchmarkResults={results}
      />
    </LabShell>
  );
}
