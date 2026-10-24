import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import "@/styles/tokens.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConsoleGreeting } from "@/components/ConsoleGreeting";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://priyanshusinha.dev"),
  title: {
    default: "Priyanshu Sinha — Backend Engineer",
    template: "%s · Priyanshu Sinha",
  },
  description:
    "I build the distributed backends that keep products fast — and the AI systems that run on top of them.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  keywords: [
    "Backend Engineer",
    "Java",
    "Spring Boot",
    "PostgreSQL",
    "Redis",
    "Kafka",
    "pgvector",
    "System Design",
    "Distributed Systems",
  ],
  authors: [{ name: "Priyanshu Sinha", url: "https://priyanshusinha.dev" }],
  creator: "Priyanshu Sinha",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://priyanshusinha.dev",
    siteName: "Priyanshu Sinha — Backend Engineer",
    title: "Priyanshu Sinha — Backend Engineer",
    description:
      "I build the backends that keep products fast — and the AI that runs on top of them.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Priyanshu Sinha — Backend Engineer",
    description:
      "I build the backends that keep products fast — and the AI that runs on top of them.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = saved || (prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ConsoleGreeting />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
