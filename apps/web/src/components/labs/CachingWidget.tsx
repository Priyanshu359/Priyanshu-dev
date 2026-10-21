"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";

interface CacheRow {
  id: string;
  time: string;
  key: string;
  status: "HIT" | "MISS" | "PURGED";
  latencyMs: number;
  ttlSeconds: number;
  source: string;
}

interface CachingWidgetProps {
  liveBadge?: string;
  liveNote?: string;
  benchmarkResults?: Record<string, any>;
}

const PRESET_KEYS = [
  { id: "user:42:profile", label: "User Profile (user:42)" },
  { id: "product:101:pricing", label: "Product SKU (product:101)" },
  { id: "analytics:overview", label: "Dashboard Aggregates" },
];

export function CachingWidget({
  liveBadge = "LIVE · TTL 30s · Redis Cache-Aside",
  liveNote = "On the live site, these requests hit real Spring Boot endpoints querying Redis with automatic fallback to PostgreSQL.",
  benchmarkResults,
}: CachingWidgetProps) {
  const [selectedKey, setSelectedKey] = useState("user:42:profile");
  const [log, setLog] = useState<CacheRow[]>([]);
  const [currentData, setCurrentData] = useState<Record<string, any> | null>(null);
  const [lastStatus, setLastStatus] = useState<"HIT" | "MISS" | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [ttlLeft, setTtlLeft] = useState<number>(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Local simulated in-memory store for fallback mode
  const [localStore] = useState<Map<string, { data: any; expiresAt: number }>>(
    () => new Map()
  );

  // Countdown TTL timer for the active key
  useEffect(() => {
    if (ttlLeft <= 0) return;
    const interval = setInterval(() => {
      setTtlLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [ttlLeft]);

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

  // Fetch initial stats and verify backend connection on mount
  useEffect(() => {
    fetch(`${apiUrl}/lab/cache/stats`)
      .then((res) => {
        if (!res.ok) throw new Error("Stats failed");
        return res.json();
      })
      .then((stats) => {
        setConnectionError(null);
        if (stats.hits !== undefined) setHits(stats.hits);
        if (stats.misses !== undefined) setMisses(stats.misses);
      })
      .catch(() => {
        setConnectionError(`Cannot reach Spring Boot at ${apiUrl}. Ensure backend is running.`);
      });
  }, [apiUrl]);

  const fetchItemReal = useCallback(async (key: string): Promise<boolean> => {
    const startTime = performance.now();
    try {
      const res = await fetch(`${apiUrl}/lab/cache/item?key=${encodeURIComponent(key)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("Backend returned HTTP " + res.status);

      const data = await res.json();
      const xCache = res.headers.get("X-Cache") || (data.cacheHit ? "HIT" : "MISS");
      const isHit = xCache === "HIT" || data.cacheHit === true;
      const latency = data.latencyMs !== undefined ? data.latencyMs : Math.round(performance.now() - startTime);
      const ttl = data.ttlSeconds ?? 30;

      setConnectionError(null);
      setIsReplayMode(false);
      setCurrentData(data.data || data);
      setLastStatus(isHit ? "HIT" : "MISS");
      setLastLatency(latency);
      setTtlLeft(ttl);

      if (isHit) {
        setHits((h) => h + 1);
      } else {
        setMisses((m) => m + 1);
      }

      const row: CacheRow = {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString(),
        key,
        status: isHit ? "HIT" : "MISS",
        latencyMs: latency,
        ttlSeconds: ttl,
        source: data.source || (isHit ? "Redis (Memory)" : "PostgreSQL (Database)"),
      };

      setLog((prev) => [row, ...prev.slice(0, 49)]);
      return isHit;
    } catch (err: any) {
      setConnectionError(`Fetch failed: Cannot reach backend at ${apiUrl}/lab/cache/item`);
      return false;
    }
  }, [apiUrl]);

  const handleFetch = () => {
    startTransition(async () => {
      await fetchItemReal(selectedKey);
    });
  };

  const handleBurst = () => {
    startTransition(async () => {
      for (let i = 0; i < 5; i++) {
        await fetchItemReal(selectedKey);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
  };

  const handleEvict = () => {
    startTransition(async () => {
      try {
        await fetch(`${apiUrl}/lab/cache/evict?key=${encodeURIComponent(selectedKey)}`, {
          method: "POST",
        });
      } catch {
        localStore.delete(selectedKey);
      }
      localStore.delete(selectedKey);
      setTtlLeft(0);
      setLastStatus(null);
      const row: CacheRow = {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString(),
        key: selectedKey,
        status: "PURGED",
        latencyMs: 1,
        ttlSeconds: 0,
        source: "Redis DEL command",
      };
      setLog((prev) => [row, ...prev.slice(0, 49)]);
    });
  };

  const handleWarm = () => {
    startTransition(async () => {
      try {
        await fetch(`${apiUrl}/lab/cache/warm?key=${encodeURIComponent(selectedKey)}`, {
          method: "POST",
        });
      } catch {
        // Fallback
      }
      await fetchItemReal(selectedKey);
    });
  };

  const totalRequests = hits + misses;
  const hitRatio = totalRequests > 0 ? Math.round((hits / totalRequests) * 100) : 0;

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px 80px", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Top Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "16px 20px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: connectionError ? "#FF7B72" : "var(--color-green)",
              boxShadow: connectionError ? "0 0 10px rgba(255,123,114,0.6)" : "0 0 10px var(--color-green)",
            }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: connectionError ? "#FF7B72" : "inherit" }}>
            {connectionError ? "BACKEND OFFLINE · Spring Boot :3333" : liveBadge}
          </span>
        </div>
        <div style={{ display: "flex", gap: "16px", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
          <span>
            Hits: <strong style={{ color: "var(--color-green)" }}>{hits}</strong>
          </span>
          <span>
            Misses: <strong style={{ color: "#E06C75" }}>{misses}</strong>
          </span>
          <span>
            Hit Rate: <strong style={{ color: "var(--color-accent)" }}>{hitRatio}%</strong>
          </span>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Left Column: Controls & Active Cache State */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "24px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Key Selector */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Select Cache Key
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {PRESET_KEYS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => {
                    setSelectedKey(k.id);
                    setTtlLeft(0);
                    setLastStatus(null);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                    border: selectedKey === k.id ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                    backgroundColor: selectedKey === k.id ? "rgba(79, 128, 255, 0.1)" : "transparent",
                    color: selectedKey === k.id ? "var(--color-accent)" : "var(--color-text)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Display Card */}
          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--color-muted)" }}>Active Key Status:</span>
              {lastStatus ? (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "100px",
                    backgroundColor: lastStatus === "HIT" ? "rgba(46, 160, 67, 0.15)" : "rgba(224, 108, 117, 0.15)",
                    color: lastStatus === "HIT" ? "var(--color-green)" : "#E06C75",
                    border: `1px solid ${lastStatus === "HIT" ? "rgba(46, 160, 67, 0.3)" : "rgba(224, 108, 117, 0.3)"}`,
                  }}
                >
                  X-Cache: {lastStatus}
                </span>
              ) : (
                <span style={{ fontSize: "13px", color: "var(--color-muted)", fontStyle: "italic" }}>
                  Not fetched yet
                </span>
              )}
            </div>

            {/* Latency Comparison Bar */}
            {lastLatency !== null && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--color-muted)" }}>Measured Latency:</span>
                  <strong
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: lastStatus === "HIT" ? "var(--color-green)" : "#E06C75",
                    }}
                  >
                    {lastLatency} ms
                  </strong>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "var(--color-border)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, Math.max(3, (lastLatency / 100) * 100))}%`,
                      backgroundColor: lastStatus === "HIT" ? "var(--color-green)" : "#E06C75",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {/* TTL Countdown */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-muted)" }}>Redis TTL Remaining:</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{ttlLeft}s / 30s</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  backgroundColor: "var(--color-border)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(ttlLeft / 30) * 100}%`,
                    backgroundColor: "var(--color-accent)",
                    transition: "width 1s linear",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={isPending}
              onClick={handleFetch}
              style={{
                flex: "1 1 140px",
                padding: "12px 18px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-text)",
                color: "var(--color-bg)",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
            >
              Fetch item
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleBurst}
              style={{
                flex: "1 1 140px",
                padding: "12px 18px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "14px",
                border: "1px solid var(--color-border)",
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.7 : 1,
                transition: "all 0.15s",
              }}
            >
              Burst 5 requests
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleEvict}
              style={{
                flex: "1 1 120px",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                color: "#E06C75",
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "13px",
                border: "1px solid rgba(224, 108, 117, 0.4)",
                cursor: isPending ? "wait" : "pointer",
              }}
            >
              Purge key (Evict)
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleWarm}
              style={{
                flex: "1 1 120px",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                color: "var(--color-muted)",
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "13px",
                border: "1px solid var(--color-border)",
                cursor: isPending ? "wait" : "pointer",
              }}
            >
              Pre-warm cache
            </button>
          </div>
        </div>

        {/* Right Column: Network Inspector & Response Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "var(--color-term)",
            color: "#E8EAED",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            maxHeight: "560px",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9AA0A8" }}>// Network log & response headers</span>
            {isReplayMode && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(242, 178, 99, 0.2)",
                  color: "#F2B263",
                  border: "1px solid rgba(242, 178, 99, 0.4)",
                }}
              >
                client replay mode
              </span>
            )}
          </div>

          {log.length === 0 ? (
            <div style={{ color: "#9AA0A8", fontStyle: "italic", padding: "20px 0" }}>
              Click &quot;Fetch item&quot; or &quot;Burst 5 requests&quot; to inspect real-time network traffic and X-Cache headers.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {log.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 80px 1fr 70px 60px",
                    gap: "8px",
                    alignItems: "center",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <span style={{ color: "#8AB4F8" }}>GET</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        entry.status === "HIT"
                          ? "var(--color-green)"
                          : entry.status === "MISS"
                          ? "#E06C75"
                          : "#F2B263",
                    }}
                  >
                    {entry.status}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#C4C7C5" }}>
                    {entry.key}
                  </span>
                  <span style={{ color: "#E8EAED", textAlign: "right" }}>
                    {entry.latencyMs}ms
                  </span>
                  <span style={{ color: "#9AA0A8", textAlign: "right", fontSize: "11px" }}>
                    {entry.ttlSeconds}s
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* JSON Payload Inspection */}
          {currentData && (
            <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "12px" }}>
              <span style={{ color: "#9AA0A8", fontSize: "11px", display: "block", marginBottom: "6px" }}>
                // Response Payload ({lastStatus === "HIT" ? "Served from Redis Memory" : "Queried from PostgreSQL"}):
              </span>
              <pre
                style={{
                  margin: 0,
                  fontSize: "12px",
                  lineHeight: "1.4",
                  color: "#A8DAB5",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  padding: "10px",
                  borderRadius: "6px",
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(currentData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Benchmark Summary Table */}
      {benchmarkResults?.summary && (
        <div
          style={{
            padding: "24px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            k6 Benchmark: Direct PostgreSQL vs Redis Cache-Aside
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--color-bg)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>PostgreSQL p99 Latency</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#E06C75", marginTop: "4px" }}>
                {benchmarkResults.summary.uncachedP99Ms} ms
              </div>
            </div>
            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--color-bg)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>Redis Cache p99 Latency</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-green)", marginTop: "4px" }}>
                {benchmarkResults.summary.cachedP99Ms} ms
              </div>
            </div>
            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--color-bg)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>Latency Reduction</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-accent)", marginTop: "4px" }}>
                {benchmarkResults.summary.latencyImprovement}
              </div>
            </div>
            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--color-bg)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>Database Load Reduction</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-green)", marginTop: "4px" }}>
                {benchmarkResults.summary.databaseQueryReduction}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explanatory Live Note */}
      {liveNote && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {liveNote}
        </p>
      )}
    </div>
  );
}
