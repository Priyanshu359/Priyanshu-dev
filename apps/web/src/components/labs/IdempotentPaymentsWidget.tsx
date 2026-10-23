"use client";

import React, { useState, useTransition, useEffect } from "react";

interface PaymentTransaction {
  id: string;
  transactionId: string;
  idempotencyKey: string;
  amountFormatted: string;
  replayed: boolean;
  latencyMs: number;
  status: string;
  message: string;
  time: string;
  duplicateWarning?: boolean;
}

interface IdempotentPaymentsWidgetProps {
  liveBadge?: string;
  liveNote?: string;
  benchmarkResults?: Record<string, any>;
}

export function IdempotentPaymentsWidget({
  liveBadge = "LIVE · Replay Cache 5m · Idempotency Keys",
  liveNote = "On the live site, requests hit real Spring Boot endpoints evaluating Idempotency-Key headers backed by Redis with atomic expiration.",
  benchmarkResults: _benchmarkResults,
}: IdempotentPaymentsWidgetProps) {
  const [balanceCents, setBalanceCents] = useState(100_000); // $1000.00
  const [enableIdempotency, setEnableIdempotency] = useState(true);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [activeKey, setActiveKey] = useState("pay_intent_" + Math.random().toString(36).substring(2, 9));
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

  // Fetch initial balance and verify connection on mount
  useEffect(() => {
    fetch(`${apiUrl}/lab/payments/audit`)
      .then((res) => {
        if (!res.ok) throw new Error("Audit failed");
        return res.json();
      })
      .then((data) => {
        setConnectionError(null);
        if (data.balanceCents !== undefined) setBalanceCents(data.balanceCents);
      })
      .catch(() => {
        setConnectionError(`Cannot reach Spring Boot at ${apiUrl}. Ensure backend is running.`);
      });
  }, [apiUrl]);

  const chargeCard = async (keyToUse: string, isProtected: boolean): Promise<PaymentTransaction | null> => {
    const start = performance.now();
    try {
      const res = await fetch(`${apiUrl}/lab/payments/charge?enableIdempotency=${isProtected}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": keyToUse,
        },
        body: JSON.stringify({
          idempotencyKey: keyToUse,
          amountCents: 25_000,
          currency: "USD",
        }),
      });

      if (!res.ok) throw new Error("Payment failed: HTTP " + res.status);
      const data = await res.json();
      setConnectionError(null);
      setIsReplayMode(false);

      if (!data.replayed) {
        setBalanceCents((prev) => Math.max(0, prev - 25_000));
      }

      // Sync exact balance directly from Spring Boot backend
      try {
        const auditRes = await fetch(`${apiUrl}/lab/payments/audit`);
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (auditData.balanceCents !== undefined) {
            setBalanceCents(auditData.balanceCents);
          }
        }
      } catch {}

      return {
        id: Math.random().toString(36).substring(2, 9),
        transactionId: data.transactionId,
        idempotencyKey: data.idempotencyKey,
        amountFormatted: "$250.00",
        replayed: data.replayed,
        latencyMs: data.latencyMs || Math.round(performance.now() - start),
        status: data.replayed ? "REPLAYED (SAFE)" : "CHARGED",
        message: data.message,
        time: new Date().toLocaleTimeString(),
        duplicateWarning: !isProtected && transactions.some((t) => t.idempotencyKey === keyToUse),
      };
    } catch (err: any) {
      setConnectionError(`Payment charge failed: cannot connect to ${apiUrl}/lab/payments/charge`);
      return null;
    }
  };

  const handlePay = () => {
    startTransition(async () => {
      const tx = await chargeCard(activeKey, enableIdempotency);
      if (tx) {
        setTransactions((prev) => [tx, ...prev]);
        setActiveKey("pay_intent_" + Math.random().toString(36).substring(2, 9));
      }
    });
  };

  const handleDoubleClick = () => {
    startTransition(async () => {
      const lockedKey = activeKey;
      const tx1Promise = chargeCard(lockedKey, enableIdempotency);
      await new Promise((r) => setTimeout(r, 20));
      const tx2Promise = chargeCard(lockedKey, enableIdempotency);

      const [tx1, tx2] = await Promise.all([tx1Promise, tx2Promise]);
      const validTxs = [tx2, tx1].filter((t): t is PaymentTransaction => t !== null);
      if (validTxs.length > 0) {
        // If unprotected and both were charged (neither replayed), mark duplicate charge
        if (!enableIdempotency && validTxs.length >= 2 && !validTxs[0].replayed && !validTxs[1].replayed) {
          validTxs[0].duplicateWarning = true;
          validTxs[0].status = "DUPLICATE CHARGED!";
          validTxs[0].message = "CRITICAL: Double charge incurred! Card charged a second time for $250.00.";
        }
        setTransactions((prev) => [...validTxs, ...prev]);
        setActiveKey("pay_intent_" + Math.random().toString(36).substring(2, 9));
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl}/lab/payments/reset`, { method: "POST" });
        if (res.ok) setConnectionError(null);
      } catch {
        setConnectionError(`Reset failed: backend unreachable at ${apiUrl}`);
      }
      setBalanceCents(100_000);
      setTransactions([]);
      setActiveKey("pay_intent_" + Math.random().toString(36).substring(2, 9));
    });
  };

  const doubleChargesCount = transactions.filter((t) => t.duplicateWarning).length;

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
            Ledger Balance: <strong style={{ color: "var(--color-accent)" }}>${(balanceCents / 100).toFixed(2)}</strong>
          </span>
          {doubleChargesCount > 0 && (
            <span style={{ color: "#E06C75", fontWeight: 700 }}>
              ⚠ {doubleChargesCount} Duplicate Charges Detected!
            </span>
          )}
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
        {/* Left Column: Checkout Controls */}
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
          {/* Active Key and Toggle */}
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-muted)", textTransform: "uppercase" }}>
                Idempotency Gate
              </span>
              <button
                type="button"
                onClick={() => setEnableIdempotency(!enableIdempotency)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: enableIdempotency ? "1px solid rgba(46, 160, 67, 0.4)" : "1px solid rgba(224, 108, 117, 0.4)",
                  backgroundColor: enableIdempotency ? "rgba(46, 160, 67, 0.15)" : "rgba(224, 108, 117, 0.15)",
                  color: enableIdempotency ? "var(--color-green)" : "#E06C75",
                }}
              >
                {enableIdempotency ? "ENABLED (PROTECTED)" : "DISABLED (VULNERABLE)"}
              </button>
            </div>
            <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>
              Header: <code style={{ color: "var(--color-accent)" }}>Idempotency-Key: {activeKey}</code>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              disabled={isPending || balanceCents < 25000}
              onClick={handlePay}
              style={{
                padding: "14px 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-text)",
                color: "var(--color-bg)",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: isPending || balanceCents < 25000 ? "not-allowed" : "pointer",
                opacity: isPending || balanceCents < 25000 ? 0.6 : 1,
              }}
            >
              Pay $250.00 (Single Click)
            </button>

            <button
              type="button"
              disabled={isPending || balanceCents < 25000}
              onClick={handleDoubleClick}
              style={{
                padding: "14px 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: enableIdempotency ? "rgba(79, 128, 255, 0.1)" : "rgba(224, 108, 117, 0.15)",
                color: enableIdempotency ? "var(--color-accent)" : "#E06C75",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "14px",
                border: enableIdempotency ? "1px solid var(--color-accent)" : "1px solid #E06C75",
                cursor: isPending || balanceCents < 25000 ? "not-allowed" : "pointer",
              }}
            >
              Simulate Rapid Double-Click {enableIdempotency ? "(Protected)" : "(Watch $500 Charged!)"}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleReset}
              style={{
                padding: "10px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                color: "var(--color-muted)",
                fontFamily: "inherit",
                fontSize: "13px",
                border: "1px solid var(--color-border)",
                cursor: isPending ? "wait" : "pointer",
              }}
            >
              Reset Demo ($1,000 Balance)
            </button>
          </div>
        </div>

        {/* Right Column: Ledger Audit Trail */}
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
            <span style={{ color: "#9AA0A8" }}>{"// Bank Transaction Ledger"}</span>
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

          {transactions.length === 0 ? (
            <div style={{ color: "#9AA0A8", fontStyle: "italic", padding: "20px 0" }}>
              Click &quot;Pay $250.00&quot; or &quot;Simulate Rapid Double-Click&quot; to inspect ledger updates.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    backgroundColor: tx.duplicateWarning ? "rgba(224, 108, 117, 0.2)" : "rgba(255, 255, 255, 0.03)",
                    border: tx.duplicateWarning ? "1px solid rgba(224, 108, 117, 0.5)" : "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ color: "#8AB4F8", fontWeight: 600 }}>{tx.transactionId}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: tx.replayed
                          ? "rgba(79, 128, 255, 0.2)"
                          : tx.duplicateWarning
                          ? "rgba(224, 108, 117, 0.3)"
                          : "rgba(46, 160, 67, 0.2)",
                        color: tx.replayed
                          ? "var(--color-accent)"
                          : tx.duplicateWarning
                          ? "#FF6B6B"
                          : "var(--color-green)",
                      }}
                    >
                      {tx.status} ({tx.latencyMs}ms)
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#C4C7C5" }}>{tx.message}</div>
                  <div style={{ fontSize: "11px", color: "#9AA0A8", marginTop: "4px" }}>
                    Key: {tx.idempotencyKey} · {tx.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explanatory Live Note */}
      {liveNote && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {liveNote}
        </p>
      )}
    </div>
  );
}
