import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-11)",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          padding: "var(--space-13)",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-2xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            color: "var(--color-blocked)",
          }}
        >
          HTTP 404
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--text-6xl)",
            fontWeight: "var(--font-weight-semibold)",
          }}
        >
          Page not found
        </h1>
        <p style={{ margin: 0, color: "var(--color-muted)" }}>
          The requested page does not exist.
        </p>
        <Link
          href="/"
          style={{
            marginTop: "var(--space-4)",
            alignSelf: "center",
            padding: "var(--space-3) var(--space-6)",
            backgroundColor: "var(--color-btnBg)",
            color: "var(--color-btnText)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-regular)",
            fontWeight: "var(--font-weight-medium)",
          }}
        >
          Return home →
        </Link>
      </div>
    </main>
  );
}
