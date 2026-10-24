"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";

const SESSION_KEY = "ps_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = window.sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = "s_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
    try {
      window.sessionStorage.setItem(SESSION_KEY, sid);
    } catch {}
  }
  return sid;
}

export function trackEvent(
  eventName: string,
  eventType: string = "interaction",
  metadata: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return;

  const sessionId = getSessionId();
  const path = window.location.pathname;
  const payload = {
    sessionId,
    eventType,
    eventName,
    path,
    referrer: document.referrer || "direct",
    metadata: {
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      ...metadata,
    },
  };

  const endpoint = `${API_BASE_URL}/api/v1/analytics/events`;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageEnterTime = useRef<number>(Date.now());

  // 1. Automatic Page View Tracking
  useEffect(() => {
    // Skip tracking for the admin dashboard itself to keep stats pure
    if (pathname && pathname.startsWith("/admin")) {
      return;
    }

    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    pageEnterTime.current = Date.now();

    trackEvent(`view_${pathname || "/"}`, "page_view", {
      fullPath: currentPath,
      title: typeof document !== "undefined" ? document.title : "",
    });
  }, [pathname, searchParams]);

  // 2. Track time spent on page & click interactions
  useEffect(() => {
    // Register global helper on window
    if (typeof window !== "undefined") {
      (window as unknown as { trackPortfolioEvent?: typeof trackEvent }).trackPortfolioEvent = trackEvent;
    }

    // Time spent beacon on unmount or page hide
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const durationSec = Math.round((Date.now() - pageEnterTime.current) / 1000);
        if (durationSec > 2 && pathname && !pathname.startsWith("/admin")) {
          trackEvent(`time_spent_${pathname}`, "time_spent", {
            durationSeconds: durationSec,
          });
        }
      }
    };

    // Global Click Tracker for interactive elements
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const trackEl = target.closest<HTMLElement>("[data-track], a, button");
      if (!trackEl) return;

      const trackName = trackEl.getAttribute("data-track");
      if (trackName) {
        trackEvent(trackName, "click", {
          text: (trackEl.innerText || "").slice(0, 50).trim(),
        });
        return;
      }

      // Track external links or special anchors
      if (trackEl.tagName === "A") {
        const anchor = trackEl as HTMLAnchorElement;
        const href = anchor.getAttribute("href") || "";

        if (href.startsWith("http") && !href.includes(window.location.hostname)) {
          let label = "external_link";
          if (href.includes("github.com")) label = "click_github";
          else if (href.includes("linkedin.com")) label = "click_linkedin";
          else if (href.includes("twitter.com") || href.includes("x.com")) label = "click_twitter";
          else if (href.includes("resume") || href.endsWith(".pdf")) label = "click_resume";

          trackEvent(label, "outbound_click", { destination: href });
        } else if (href.startsWith("mailto:")) {
          trackEvent("click_email_link", "contact_click", { destination: href });
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("click", handleClick, { passive: true });

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("click", handleClick);
    };
  }, [pathname]);

  return null;
}
