"use client";

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api-config";

interface TopMetric {
  label: string;
  count: number;
  percentage: number;
}

interface TimeSeriesPoint {
  timestamp: string;
  pageViews: number;
  uniqueVisitors: number;
}

interface RecentEvent {
  eventType: string;
  eventName: string;
  path: string;
  device: string;
  referrer: string;
  timeAgo: string;
  timestamp: string;
}

interface AnalyticsOverview {
  totalPageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  totalInteractions: number;
  topPages: TopMetric[];
  topReferrers: TopMetric[];
  topEvents: TopMetric[];
  deviceBreakdown: TopMetric[];
  browserBreakdown: TopMetric[];
  osBreakdown: TopMetric[];
  timeline: TimeSeriesPoint[];
  recentEvents: RecentEvent[];
}

export default function AdminDataDashboard() {
  const [adminKey, setAdminKey] = useState<string>("");
  const [inputKey, setInputKey] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [period, setPeriod] = useState<string>("7d");
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchAnalytics = useCallback(async (keyToUse: string, activePeriod: string) => {
    setIsLoading(true);
    setAuthError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/overview?period=${activePeriod}`, {
        method: "GET",
        headers: {
          "X-Admin-Key": keyToUse,
        },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setAuthError("Invalid access key. Authentication failed.");
        sessionStorage.removeItem("ps_admin_token");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json: AnalyticsOverview = await res.json();
      setData(json);
      setIsAuthenticated(true);
      setAdminKey(keyToUse);
      sessionStorage.setItem("ps_admin_token", keyToUse);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load telemetry";
      setAuthError(`Connection error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check saved session on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem("ps_admin_token");
    if (savedToken) {
      fetchAnalytics(savedToken, period);
    }
  }, [fetchAnalytics, period]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setAuthError("Please enter your secret access key.");
      return;
    }
    fetchAnalytics(inputKey.trim(), period);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ps_admin_token");
    setIsAuthenticated(false);
    setAdminKey("");
    setData(null);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (adminKey) {
      fetchAnalytics(adminKey, newPeriod);
    }
  };

  // -------------------------------------------------------------
  // 1. GATE / UNLOCK SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#090B0E",
        color: "#ECEEF2",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        padding: "20px"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "420px",
          background: "#11141A",
          border: "1px solid #232834",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          textAlign: "center"
        }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(31,79,209,0.2) 0%, rgba(15,107,82,0.2) 100%)",
            border: "1px solid rgba(31,79,209,0.4)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4C82FB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
            Telemetry Access Control
          </h1>
          <p style={{ fontSize: "13px", color: "#8B949E", margin: "0 0 24px 0", lineHeight: "1.5" }}>
            Restricted analytics dashboard for priyanshusinha.dev. Enter the security key to view telemetry data.
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="password"
              placeholder="Enter ADMIN_SECRET_KEY..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#181D26",
                border: "1px solid #2C3342",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "14px",
                color: "#FFFFFF",
                outline: "none",
                textAlign: "center",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.08em"
              }}
            />

            {authError && (
              <div style={{
                fontSize: "12px",
                color: "#F87171",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "8px",
                padding: "8px 12px"
              }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: "linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isLoading ? "wait" : "pointer",
                transition: "opacity 0.2s ease",
                opacity: isLoading ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
              }}
            >
              {isLoading ? "Verifying..." : "Unlock Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATED DASHBOARD
  // -------------------------------------------------------------
  const maxTimelineViews = Math.max(...(data?.timeline.map(t => t.pageViews) || [1]), 1);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#090B0E",
      color: "#ECEEF2",
      fontFamily: "var(--font-sans, system-ui, sans-serif)",
      padding: "24px 32px 64px 32px"
    }}>
      {/* Top Header */}
      <div style={{
        maxWidth: "1240px",
        margin: "0 auto 32px auto",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        borderBottom: "1px solid #1C212C",
        paddingBottom: "20px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 10px #10B981"
            }} />
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em", color: "#F3F4F6" }}>
              Analytics & Telemetry
            </h1>
            <span style={{
              fontSize: "11px",
              background: "#1A2230",
              color: "#60A5FA",
              border: "1px solid #2B374E",
              padding: "2px 8px",
              borderRadius: "20px",
              fontWeight: 500
            }}>
              Private Dashboard
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
            Live traffic, pageviews, visitor telemetry, and interactions · Refreshed {lastRefreshed || "just now"}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Period selector */}
          <div style={{
            background: "#131720",
            border: "1px solid #222938",
            borderRadius: "10px",
            padding: "3px",
            display: "flex",
            gap: "2px"
          }}>
            {[
              { id: "24h", label: "24h" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                style={{
                  background: period === p.id ? "#2563EB" : "transparent",
                  color: period === p.id ? "#FFFFFF" : "#9CA3AF",
                  border: "none",
                  borderRadius: "7px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchAnalytics(adminKey, period)}
            disabled={isLoading}
            style={{
              background: "#131720",
              color: "#E5E7EB",
              border: "1px solid #222938",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isLoading ? "rotate(180deg)" : "none", transition: "transform 0.4s ease" }}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Refresh
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              color: "#9CA3AF",
              border: "1px solid #222938",
              borderRadius: "10px",
              padding: "8px 12px",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            Lock
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* KPI Summary Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px"
        }}>
          {[
            {
              label: "Total Page Views",
              value: data?.totalPageViews ?? 0,
              badge: "Views",
              color: "#3B82F6",
              icon: "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            },
            {
              label: "Unique Visitors",
              value: data?.uniqueVisitors ?? 0,
              badge: "Visitors",
              color: "#10B981",
              icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"
            },
            {
              label: "Active Sessions",
              value: data?.totalSessions ?? 0,
              badge: "Sessions",
              color: "#8B5CF6",
              icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            },
            {
              label: "Interactions & Clicks",
              value: data?.totalInteractions ?? 0,
              badge: "Events",
              color: "#F59E0B",
              icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            }
          ].map((kpi, idx) => (
            <div key={idx} style={{
              background: "#11141B",
              border: "1px solid #1E2430",
              borderRadius: "14px",
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: 500 }}>{kpi.label}</span>
                <span style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: `${kpi.color}15`,
                  color: kpi.color,
                  border: `1px solid ${kpi.color}33`,
                  fontWeight: 600
                }}>
                  {kpi.badge}
                </span>
              </div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#F9FAFB", letterSpacing: "-0.03em" }}>
                {kpi.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Chart */}
        <div style={{
          background: "#11141B",
          border: "1px solid #1E2430",
          borderRadius: "14px",
          padding: "22px 24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 4px 0", color: "#F3F4F6" }}>
                Traffic Volume Progression
              </h2>
              <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>
                Hourly and daily distribution of incoming visitors and pageviews
              </p>
            </div>
            <div style={{ display: "flex", gap: "14px", fontSize: "12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9CA3AF" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#3B82F6" }} /> Page Views
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9CA3AF" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#10B981" }} /> Unique Visitors
              </span>
            </div>
          </div>

          {(!data?.timeline || data.timeline.length === 0) ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#6B7280", fontSize: "13px" }}>
              No timeline data yet for this time window. Traffic will appear automatically as visitors arrive.
            </div>
          ) : (
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              height: "180px",
              paddingTop: "20px",
              overflowX: "auto"
            }}>
              {data.timeline.map((point, i) => {
                const heightPct = Math.max(10, Math.round((point.pageViews / maxTimelineViews) * 100));
                const label = period === "24h"
                  ? point.timestamp.substring(11, 16)
                  : point.timestamp.substring(5, 10);

                return (
                  <div key={i} style={{ flex: 1, minWidth: "28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                    <div style={{
                      width: "100%",
                      maxWidth: "24px",
                      height: `${heightPct}%`,
                      background: "linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)",
                      borderRadius: "4px 4px 0 0",
                      position: "relative",
                      transition: "height 0.3s ease"
                    }} title={`${label}: ${point.pageViews} views, ${point.uniqueVisitors} visitors`} />
                    <span style={{ fontSize: "10px", color: "#6B7280", fontFamily: "var(--font-mono, monospace)" }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2-Column Grid: Pages & Referrers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
          {/* Top Pages */}
          <div style={{
            background: "#11141B",
            border: "1px solid #1E2430",
            borderRadius: "14px",
            padding: "22px 24px"
          }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px 0", color: "#F3F4F6" }}>
              Top Visited Pages
            </h2>
            {(!data?.topPages || data.topPages.length === 0) ? (
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>No page views recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.topPages.map((page, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ fontFamily: "var(--font-mono, monospace)", color: "#93C5FD", fontWeight: 500 }}>
                        {page.label}
                      </span>
                      <span style={{ color: "#E5E7EB", fontWeight: 600 }}>
                        {page.count} <span style={{ color: "#6B7280", fontWeight: 400, fontSize: "11px" }}>({page.percentage}%)</span>
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "5px", background: "#1A2230", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${page.percentage}%`, height: "100%", background: "#3B82F6", borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Traffic Sources */}
          <div style={{
            background: "#11141B",
            border: "1px solid #1E2430",
            borderRadius: "14px",
            padding: "22px 24px"
          }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px 0", color: "#F3F4F6" }}>
              Traffic Acquisition & Referrers
            </h2>
            {(!data?.topReferrers || data.topReferrers.length === 0) ? (
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>No referrer data recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.topReferrers.map((ref, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#F3F4F6", fontWeight: 500 }}>
                        {ref.label}
                      </span>
                      <span style={{ color: "#E5E7EB", fontWeight: 600 }}>
                        {ref.count} <span style={{ color: "#6B7280", fontWeight: 400, fontSize: "11px" }}>({ref.percentage}%)</span>
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "5px", background: "#1A2230", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${ref.percentage}%`, height: "100%", background: "#10B981", borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3-Column Grid: Devices, OS & Interactive Events */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {/* Device Types */}
          <div style={{
            background: "#11141B",
            border: "1px solid #1E2430",
            borderRadius: "14px",
            padding: "20px 22px"
          }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 14px 0", color: "#F3F4F6" }}>
              Devices & Form Factors
            </h2>
            {(!data?.deviceBreakdown || data.deviceBreakdown.length === 0) ? (
              <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>No device telemetry yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.deviceBreakdown.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0", borderBottom: "1px solid #1A212D" }}>
                    <span style={{ textTransform: "capitalize", color: "#9CA3AF" }}>{d.label}</span>
                    <span style={{ fontWeight: 600, color: "#F3F4F6" }}>{d.count} ({d.percentage}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operating Systems */}
          <div style={{
            background: "#11141B",
            border: "1px solid #1E2430",
            borderRadius: "14px",
            padding: "20px 22px"
          }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 14px 0", color: "#F3F4F6" }}>
              Operating Systems & Browsers
            </h2>
            {(!data?.osBreakdown || data.osBreakdown.length === 0) ? (
              <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>No OS telemetry yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.osBreakdown.map((os, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0", borderBottom: "1px solid #1A212D" }}>
                    <span style={{ color: "#9CA3AF" }}>{os.label}</span>
                    <span style={{ fontWeight: 600, color: "#F3F4F6" }}>{os.count} ({os.percentage}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Interactions */}
          <div style={{
            background: "#11141B",
            border: "1px solid #1E2430",
            borderRadius: "14px",
            padding: "20px 22px"
          }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 14px 0", color: "#F3F4F6" }}>
              Interactive Actions
            </h2>
            {(!data?.topEvents || data.topEvents.length === 0) ? (
              <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>No interaction events yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.topEvents.map((ev, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0", borderBottom: "1px solid #1A212D" }}>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", color: "#FBBF24" }}>{ev.label}</span>
                    <span style={{ fontWeight: 600, color: "#F3F4F6" }}>{ev.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Live Activity Feed */}
        <div style={{
          background: "#11141B",
          border: "1px solid #1E2430",
          borderRadius: "14px",
          padding: "22px 24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "#F3F4F6" }}>
              Live Event Feed (Latest 40 Actions)
            </h2>
            <span style={{ fontSize: "12px", color: "#6B7280" }}>
              Ordered newest to oldest
            </span>
          </div>

          {(!data?.recentEvents || data.recentEvents.length === 0) ? (
            <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>No events captured yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ color: "#6B7280", borderBottom: "1px solid #1E2430" }}>
                    <th style={{ padding: "10px 8px", fontWeight: 500 }}>Type</th>
                    <th style={{ padding: "10px 8px", fontWeight: 500 }}>Event Name</th>
                    <th style={{ padding: "10px 8px", fontWeight: 500 }}>Path</th>
                    <th style={{ padding: "10px 8px", fontWeight: 500 }}>Device</th>
                    <th style={{ padding: "10px 8px", fontWeight: 500 }}>Referrer</th>
                    <th style={{ padding: "10px 8px", fontWeight: 500, textAlign: "right" }}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEvents.map((event, idx) => {
                    const badgeBg = event.eventType === "page_view"
                      ? "rgba(59, 130, 246, 0.15)"
                      : event.eventType === "click"
                      ? "rgba(245, 158, 11, 0.15)"
                      : "rgba(16, 185, 129, 0.15)";
                    const badgeColor = event.eventType === "page_view"
                      ? "#60A5FA"
                      : event.eventType === "click"
                      ? "#FBBF24"
                      : "#34D399";

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #181E29", color: "#D1D5DB" }}>
                        <td style={{ padding: "10px 8px" }}>
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 600,
                            background: badgeBg,
                            color: badgeColor,
                            textTransform: "uppercase"
                          }}>
                            {event.eventType}
                          </span>
                        </td>
                        <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono, monospace)", color: "#F3F4F6" }}>
                          {event.eventName}
                        </td>
                        <td style={{ padding: "10px 8px", color: "#93C5FD", fontFamily: "var(--font-mono, monospace)" }}>
                          {event.path}
                        </td>
                        <td style={{ padding: "10px 8px", textTransform: "capitalize", color: "#9CA3AF" }}>
                          {event.device}
                        </td>
                        <td style={{ padding: "10px 8px", color: "#9CA3AF" }}>
                          {event.referrer || "Direct"}
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "right", color: "#6B7280", fontFamily: "var(--font-mono, monospace)" }}>
                          {event.timeAgo}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
