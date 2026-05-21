import Link from "next/link";
import * as React from "react";

/**
 * Sprint 3 Task 3.6 — Agency route-group layout.
 *
 * Used for the consultant/agency tier where one owner manages ≥10 client
 * tenants under a single workspace. Surfaces aggregation views and
 * per-client switching. Phase-2 mobile companion app reuses this nav.
 *
 * Pages live at /agency/* and require role=agency_owner|agency_admin.
 * Role enforcement is handled by tenancy middleware (Sprint 4).
 */
export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const nav = [
    { href: "/agency", label: "Overview", icon: "🏢" },
    { href: "/agency/clients", label: "Client tenants", icon: "👥" },
    { href: "/agency/branding", label: "White-label", icon: "🎨" },
    { href: "/agency/billing", label: "Billing", icon: "💳" },
    { href: "/agency/team", label: "Team & roles", icon: "🛡️" },
  ];
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>
      <aside
        style={{
          width: 240,
          background: "var(--color-bg-card)",
          borderRight: "1px solid var(--color-border)",
          padding: "20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            marginBottom: 16,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-text-secondary)",
          }}
        >
          Agency workspace
        </div>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text)",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            <span aria-hidden style={{ fontSize: 16 }}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </aside>
      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}
