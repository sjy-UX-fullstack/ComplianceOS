import Link from "next/link";
import * as React from "react";

/**
 * Sprint 3 Task 3.6 — DPO route-group layout.
 *
 * Dedicated workspace for the Data Protection Officer (client_dpo role).
 * The "unified inbox" surfaces all open DSRs, breach incidents, retention
 * notices, regulator letters, and government-access requests in one
 * place — mandated under Rule 13(4) for SDFs and recommended for all.
 *
 * Wired in Phase 7B (Sprint 16); this layout reserves the routes so URLs
 * don't change once the inbox lands.
 */
export default function DpoLayout({ children }: { children: React.ReactNode }) {
  const nav = [
    { href: "/dpo", label: "Unified inbox", icon: "📥" },
    { href: "/dpo/dsr", label: "Rights queue", icon: "📬", sprint: 4 },
    { href: "/dpo/breach", label: "Breach incidents", icon: "🚨", sprint: 5 },
    { href: "/dpo/calendar", label: "Statutory calendar", icon: "📅", sprint: 16 },
    { href: "/dpo/government", label: "Government access", icon: "🏛️", sprint: 18 },
    { href: "/dpo/dpia", label: "DPIA register", icon: "🛡️", sprint: 15 },
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
          DPO workspace
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
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.sprint ? (
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
      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}
