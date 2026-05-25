import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Hero Header */}
      <header className="glass" style={{
        padding: "var(--spacing-lg) var(--spacing-xl)",
        margin: "var(--spacing-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.875rem",
            color: "white",
          }}>
            C
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>ComplianceOS</span>
        </div>
        <nav style={{ display: "flex", gap: "var(--spacing-md)", alignItems: "center" }}>
          <Link href="/admin" className="btn btn-outline" style={{ border: "1px solid var(--color-border)", color: "var(--color-text)" }}>Admin Portal</Link>
          <Link href="/master-admin" className="btn btn-outline" style={{ border: "1px solid var(--color-border)", color: "var(--color-accent)", borderColor: "var(--color-accent)" }}>Master System</Link>
          <Link href="/app" className="btn btn-primary">Dashboard →</Link>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="container animate-fade-in" style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "var(--spacing-xl)",
        padding: "var(--spacing-2xl) 0",
      }}>
        <span className="badge badge-success">🇮🇳 India DPDP Act 2023 Compliant</span>

        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 800,
          lineHeight: 1.15,
          maxWidth: 720,
          background: "linear-gradient(135deg, var(--color-text), var(--color-primary-light))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          The Compliance Infrastructure for
          <br />Indian Digital Fiduciaries
        </h1>

        <p style={{
          fontSize: "1.125rem",
          color: "var(--color-text-secondary)",
          maxWidth: 560,
          lineHeight: 1.7,
        }}>
          Consent records, DSR triage, dual-clock breach wizard, processor risk contracts — 
          everything you need to show compliance and build data trust with real users.
        </p>

        {/* Workspace Quick-Links Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--spacing-md)",
          width: "100%",
          maxWidth: 880,
          marginTop: "var(--spacing-md)",
        }}>
          <Link href="/app" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "var(--spacing-md)", textAlign: "center", height: "100%" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: 6 }}>📊</div>
              <h4 style={{ fontWeight: 700, marginBottom: 4, color: "var(--color-text)" }}>Platform Dashboard</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Readiness, Consent customizer, and Policy builder.</p>
            </div>
          </Link>
          <Link href="/dpo" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "var(--spacing-md)", textAlign: "center", height: "100%" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: 6 }}>📬</div>
              <h4 style={{ fontWeight: 700, marginBottom: 4, color: "var(--color-text)" }}>DPO Unified Inbox</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Monitor critical alerts, DSRs, and breach reports.</p>
            </div>
          </Link>
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "var(--spacing-md)", textAlign: "center", height: "100%" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: 6 }}>🛡️</div>
              <h4 style={{ fontWeight: 700, marginBottom: 4, color: "var(--color-text)" }}>Tenant Admin Panel</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Configure SAML/SSO, invite users, and audit ledger.</p>
            </div>
          </Link>
          <Link href="/master-admin" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "var(--spacing-md)", textAlign: "center", height: "100%" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: 6 }}>👑</div>
              <h4 style={{ fontWeight: 700, marginBottom: 4, color: "var(--color-text)" }}>SaaS Master Admin</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Manage billing tiers, clients registry, and global templates.</p>
            </div>
          </Link>
        </div>

        {/* Public Facing Interfaces links */}
        <div style={{
          display: "flex",
          gap: "var(--spacing-md)",
          alignItems: "center",
          marginTop: "var(--spacing-md)",
          padding: "var(--spacing-sm) var(--spacing-lg)",
          background: "rgba(255,255,255,0.01)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)"
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>Public Interfaces:</span>
          <Link href="/privacy" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary-light)", textDecoration: "none" }}>Privacy Preference Center</Link>
          <span style={{ color: "var(--color-border)" }}>|</span>
          <Link href="/privacy/dsr" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary-light)", textDecoration: "none" }}>DSR Intake Form</Link>
        </div>

        {/* Module Cards */}
        <div id="modules" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--spacing-lg)",
          width: "100%",
          maxWidth: 960,
          marginTop: "var(--spacing-lg)",
        }}>
          {[
            { icon: "📋", title: "Readiness Assessment", desc: "Interactive DPDP assessment with gap heatmaps and 90-day plans." },
            { icon: "🍪", title: "Consent Manager", desc: "≤5KB banner SDK, IAB TCF 2.3, Google Consent Mode v2, and GPC." },
            { icon: "📝", title: "Policy notice Gen", desc: "Rule 3 notices in English/Hindi generated programmatically." },
            { icon: "🔔", title: "DSR Portal", desc: "Rights portal with OTP and DigiLocker identity verification." },
            { icon: "🚨", title: "Breach Wizard", desc: "Dual-clock incident response under CERT-In (6h) and DPB (72h)." },
            { icon: "🏢", title: "Vendor Risk", desc: "DPDP §8(8) contract compliance and automated DPA generation." },
          ].map((m) => (
            <div key={m.title} className="card" style={{ textAlign: "left" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "var(--spacing-sm)" }}>{m.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: "var(--spacing-xs)" }}>{m.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: "var(--spacing-lg)",
        textAlign: "center",
        color: "var(--color-text-secondary)",
        fontSize: "0.8125rem",
        borderTop: "1px solid var(--color-border)",
        background: "rgba(15, 23, 42, 0.5)",
      }}>
        <p>© 2026 ComplianceOS · Data residency: AWS Mumbai (ap-south-1) · Cryptographic Audit logs secured via HMAC-SHA256 🇮🇳</p>
      </footer>
    </div>
  );
}
