import * as React from "react";

/**
 * Sprint 3 Task 3.6 — Public route-group layout.
 *
 * Used for surfaces that face data principals directly:
 *   - /privacy        (Preference Centre — Task 3.9)
 *   - /privacy/dsr    (DSR submission — Sprint 4)
 *   - /privacy/policy (rendered policy notice — Sprint 2)
 *
 * Per the Master Plan, the public DSR portal must NOT have marketing chrome.
 * Tenants can override the brand via `tenant_branding` (server component
 * will read the CNAME-mapped tenant; not yet wired — defaults below).
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "20px 24px",
          background: "var(--color-bg-card)",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontWeight: 700,
            fontSize: 16,
            color: "var(--color-text)",
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
            }}
            aria-hidden
          />
          Privacy Centre
        </div>
      </header>
      <main style={{ flex: 1, padding: "32px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>{children}</div>
      </main>
      <footer
        style={{
          padding: "24px",
          borderTop: "1px solid var(--color-border)",
          fontSize: 12,
          color: "var(--color-text-secondary)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          Powered by ComplianceOS · DPDP Act 2023 §5–14 compliant
        </div>
      </footer>
    </div>
  );
}
