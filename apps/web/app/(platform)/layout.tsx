import Link from "next/link";
import * as React from "react";

/**
 * Sprint 3 Task 3.6 + 3.8 — Platform route-group layout.
 *
 * Provides the sidebar shell used by all authenticated tenant surfaces
 * routed inside `(platform)`. The legacy /app dashboard remains at
 * `app/app/page.tsx` for now; new tenant pages live here.
 *
 * Sidebar items mirror the module roadmap (Master Plan §"Module Delivery").
 */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: "/app#overview", label: "Dashboard", icon: "📊", available: true },
    { href: "/onboarding", label: "Onboarding", icon: "✨", available: true },
    { href: "/app#assessment", label: "Assessment", icon: "📋", available: true, sprint: 1 },
    { href: "/app#consent", label: "Consent Manager", icon: "🍪", available: true, sprint: 1 },
    { href: "/app#policy", label: "Policy & Notices", icon: "📝", available: true, sprint: 2 },
    { href: "/app#dsr", label: "DSR Portal", icon: "📬", available: true, sprint: 4 },
    { href: "/app#breach", label: "Breach Wizard", icon: "🚨", available: true, sprint: 5 },
    { href: "/app#vendor", label: "Vendor Risk", icon: "🏢", available: true, sprint: 6 },
    { href: "/app#ropa", label: "RoPA", icon: "🗂️", available: false, sprint: 7 },
    { href: "/app#lms", label: "Training", icon: "🎓", available: false, sprint: 8 },
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
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            marginBottom: 16,
            textDecoration: "none",
            color: "var(--color-text)",
            fontWeight: 700,
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
          ComplianceOS
        </Link>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              color: item.available ? "var(--color-text)" : "var(--color-text-secondary)",
              textDecoration: "none",
              fontSize: 14,
              opacity: item.available ? 1 : 0.6,
            }}
          >
            <span aria-hidden style={{ fontSize: 16 }}>
              {item.icon}
            </span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {!item.available && item.sprint ? (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "var(--color-bg-elevated)",
                  color: "var(--color-text-secondary)",
                }}
              >
                S{item.sprint}
              </span>
            ) : null}
          </Link>
        ))}
      </aside>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
