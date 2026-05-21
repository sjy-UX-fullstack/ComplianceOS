import Link from "next/link";
import * as React from "react";

/**
 * Sprint 3 Task 3.6 — Marketing route-group layout.
 * Public-facing pages (pricing, features, blog) share this chrome.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-card)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <nav
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              color: "var(--color-text)",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
              }}
              aria-hidden
            />
            ComplianceOS
          </Link>
          <ul
            style={{
              display: "flex",
              gap: 24,
              listStyle: "none",
              margin: 0,
              padding: 0,
              alignItems: "center",
            }}
          >
            <li>
              <Link
                href="/pricing"
                style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: 14 }}
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="/app"
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  background:
                    "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Open dashboard
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "32px 24px",
          color: "var(--color-text-secondary)",
          fontSize: 13,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span>© {new Date().getFullYear()} ComplianceOS Technologies Pvt Ltd</span>
          <span>India DPDP Act 2023 · Made in Bengaluru</span>
        </div>
      </footer>
    </div>
  );
}
