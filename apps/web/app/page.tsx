import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
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
        <nav style={{ display: "flex", gap: "var(--spacing-lg)", alignItems: "center" }}>
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
        <span className="badge badge-success">🇮🇳 DPDP Act 2023 Ready</span>

        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 800,
          lineHeight: 1.15,
          maxWidth: 720,
          background: "linear-gradient(135deg, var(--color-text), var(--color-primary-light))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          The Operating System for
          <br />DPDP Compliance
        </h1>

        <p style={{
          fontSize: "1.125rem",
          color: "var(--color-text-secondary)",
          maxWidth: 560,
          lineHeight: 1.7,
        }}>
          Consent management, DSR portal, breach wizard, vendor risk, policy generator — 
          everything Indian businesses need to comply with the Digital Personal Data Protection Act.
        </p>

        <div style={{ display: "flex", gap: "var(--spacing-md)", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/app" className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
            Start Free Assessment
          </Link>
          <Link href="#modules" className="btn btn-outline" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
            Explore Modules
          </Link>
        </div>

        {/* Module Cards */}
        <div id="modules" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--spacing-lg)",
          width: "100%",
          maxWidth: 960,
          marginTop: "var(--spacing-2xl)",
        }}>
          {[
            { icon: "📋", title: "Readiness Assessment", desc: "60-question assessment with gap heatmap and 90-day plan" },
            { icon: "🍪", title: "Consent Manager", desc: "≤5KB banner SDK, IAB TCF 2.3, Google Consent Mode v2" },
            { icon: "📝", title: "Policy Generator", desc: "Rule-3 privacy notices in 22 Indian languages with AI drafting" },
            { icon: "🔔", title: "DSR Portal", desc: "Data principal rights portal with 90-day SLA tracking" },
            { icon: "🚨", title: "Breach Wizard", desc: "Dual-clock CERT-In 6h + DPB 72h reporting wizard" },
            { icon: "🏢", title: "Vendor Risk", desc: "DPA generator, risk scoring, SOC 2/ISO 27001 tracker" },
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
      }}>
        <p>© 2026 ComplianceOS · Data residency: AWS Mumbai (ap-south-1) · All personal data stays in India 🇮🇳</p>
      </footer>
    </div>
  );
}
