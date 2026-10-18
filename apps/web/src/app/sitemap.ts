import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://priyanshu.dev";
  const now = new Date();

  const routes = [
    { url: "", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "/ai", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/journey", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/lab/rate-limiting", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/lab/databases", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/connect", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/hire", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/status", priority: 0.7, changeFrequency: "daily" as const },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.url}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
