"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, Badge, Button, Input, Label, FieldGroup } from "../../components/ui";

interface TenantAccount {
  id: string;
  name: string;
  uuid: string;
  readinessScore: number;
  tier: "Free" | "Growth" | "Business" | "Enterprise" | "Agency";
  monthlyBilling: string;
  status: "active" | "trial" | "delinquent";
}

interface RegulatorFiling {
  refNo: string;
  companyName: string;
  regulator: "CERT-In" | "DPB Initial" | "DPB Detailed";
  timestamp: string;
  status: "Dispatched" | "Receipt Acknowledged";
}

const INITIAL_TENANTS: TenantAccount[] = [
  { id: "1", name: "Acme D2C Pvt Ltd", uuid: "00000000-0000-0000-0000-000000000000", readinessScore: 78, tier: "Growth", monthlyBilling: "₹9,999", status: "active" },
  { id: "2", name: "Paytm E-Commerce Mock", uuid: "41a8c8b0-a01b-4f93-b092-c07a97268ca1", readinessScore: 92, tier: "Enterprise", monthlyBilling: "₹49,999", status: "active" },
  { id: "3", name: "Zomato Logistics Mock", uuid: "02b8d810-b0ac-4b92-9382-74ba97c02bca", readinessScore: 85, tier: "Enterprise", monthlyBilling: "₹49,999", status: "active" },
  { id: "4", name: "Groww NBFC Mock", uuid: "e02a9bbf-cfc8-4289-9a2f-124b89ad79cc", readinessScore: 48, tier: "Business", monthlyBilling: "₹19,999", status: "trial" },
  { id: "5", name: "InMobi AdTech Mock", uuid: "f3c8da0d-b0a1-409c-98d1-d2497a7a1c8d", readinessScore: 60, tier: "Agency", monthlyBilling: "₹19,999", status: "delinquent" }
];

const INITIAL_FILINGS: RegulatorFiling[] = [
  { refNo: "BR-2026-928374", companyName: "Acme D2C Pvt Ltd", regulator: "CERT-In", timestamp: "2026-05-25T08:50:00Z", status: "Receipt Acknowledged" },
  { refNo: "BR-2026-012938", companyName: "Paytm E-Commerce Mock", regulator: "DPB Initial", timestamp: "2026-05-24T12:30:00Z", status: "Dispatched" },
  { refNo: "BR-2026-449382", companyName: "Zomato Logistics Mock", regulator: "DPB Detailed", timestamp: "2026-05-22T10:15:00Z", status: "Receipt Acknowledged" }
];

const LEGAL_TEMPLATES: Record<string, string> = {
  privacy_notice: `# Privacy Notice Under Section 5
This Privacy Notice applies to {{companyName}} (the "Data Fiduciary") and describes how we collect, process, and protect your personal data in accordance with the Digital Personal Data Protection (DPDP) Act, 2023.

1. CATEGORIES OF PERSONAL DATA COLLECTED
We collect: {{categories}}.

2. PURPOSE OF PROCESSING
The personal data is collected solely for: {{purpose}}.

3. IDENTITY OF DPO
For inquiries regarding your rights under Sections 11–14, contact our DPO at {{dpoEmail}}.`,

  cookie_policy: `# Cookie & Tracking Notice
In accordance with Rule 6 of the DPDP Rules, {{companyName}} implements Google Consent Mode v2 and Global Privacy Control (GPC) signals.

1. CLASSIFICATIONS OF COOKIES USED
- strictly_necessary: Enabled by default
- analytics: {{analyticsConsent}}
- marketing: {{marketingConsent}}`
};

export default function MasterAdminPanel() {
  const [activeSubTab, setActiveSubTab] = useState<"tenants" | "filings" | "templates">("tenants");
  const [tenants, setTenants] = useState<TenantAccount[]>(INITIAL_TENANTS);
  const [filings, setFilings] = useState<RegulatorFiling[]>(INITIAL_FILINGS);

  // Template states
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("privacy_notice");
  const [templateText, setTemplateText] = useState<string>(LEGAL_TEMPLATES.privacy_notice || "");
  const [templateSaved, setTemplateSaved] = useState(false);

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("all");

  // Load custom values
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTenants = localStorage.getItem("cos:master:tenants");
      const savedFilings = localStorage.getItem("cos:master:filings");
      
      if (savedTenants) setTenants(JSON.parse(savedTenants));
      if (savedFilings) setFilings(JSON.parse(savedFilings));
    }
  }, []);

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    LEGAL_TEMPLATES[selectedTemplateKey] = templateText;
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 3000);
  };

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    setTemplateText(LEGAL_TEMPLATES[key] || "");
  };

  const toggleTenantStatus = (id: string) => {
    const updated = tenants.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === "active" ? "delinquent" : t.status === "delinquent" ? "trial" : "active";
        return { ...t, status: nextStatus as any };
      }
      return t;
    });
    setTenants(updated);
    localStorage.setItem("cos:master:tenants", JSON.stringify(updated));
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.uuid.includes(searchQuery);
    const matchesTier = filterTier === "all" || t.tier.toLowerCase() === filterTier.toLowerCase();
    return matchesSearch && matchesTier;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Operator Sidebar */}
      <aside style={{
        width: 260,
        background: "var(--color-bg-card)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "var(--spacing-md)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-xl)" }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.75rem",
            color: "white",
          }}>
            M
          </div>
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>Master Control</span>
          <span className="badge badge-danger" style={{ fontSize: "10px", padding: "1px 4px" }}>System</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)", flex: 1 }}>
          {[
            { id: "tenants", label: "Tenants Registry", icon: "🏢" },
            { id: "filings", label: "Global Filings Desk", icon: "🚨" },
            { id: "templates", label: "Global Legal Notice", icon: "📝" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
                padding: "var(--spacing-sm) var(--spacing-md)",
                borderRadius: "var(--radius-md)",
                background: activeSubTab === item.id ? "rgba(6, 182, 212, 0.12)" : "transparent",
                color: activeSubTab === item.id ? "var(--color-accent)" : "var(--color-text)",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: activeSubTab === item.id ? 600 : 500,
                fontSize: "0.875rem",
                transition: "all 0.15s ease",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--spacing-md)", display: "flex", flexDirection: "column", gap: 8 }}>
          <Link href="/app" style={{ color: "var(--color-primary-light)", fontSize: "0.8125rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            📊 Back to Dashboard
          </Link>
          <Link href="/" style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", textDecoration: "none" }}>
            ← Return to Landing Page
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: 60,
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 var(--spacing-xl)",
          background: "rgba(15, 23, 42, 0.3)",
          backdropFilter: "blur(8px)",
        }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>
            {activeSubTab === "tenants" && "Global Tenant Accounts"}
            {activeSubTab === "filings" && "Regulator Notifications Queue (CERT-In / DPB)"}
            {activeSubTab === "templates" && "Distributed Legal Notice Templates"}
          </h2>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            ComplianceOS Operator Desk
          </span>
        </header>

        {/* Workspace content */}
        <div style={{ flex: 1, padding: "var(--spacing-xl)", overflowY: "auto" }} className="animate-fade-in">
          
          {/* Quick stats banner */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ padding: 12 }}>
              <span className="badge badge-success" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--color-accent)" }}>Active Tenants</span>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>142</div>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <span className="badge badge-success">SaaS MRR</span>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>₹8,42,000</div>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <span className="badge badge-success">Consent Events</span>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>1.2M</div>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <span className="badge badge-danger">Unresolved SLA Breaches</span>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>0</div>
            </div>
          </div>

          {/* SUBTAB 1: TENANTS REGISTRY */}
          {activeSubTab === "tenants" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Search & Filter row */}
              <div className="card" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: 12 }}>
                <Input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by company name or tenant UUID..." style={{ flex: 1 }} />
                
                <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: 13,
                  outline: "none"
                }}>
                  <option value="all">All Tiers</option>
                  <option value="free">Free Tier</option>
                  <option value="growth">Growth Tier</option>
                  <option value="business">Business Tier</option>
                  <option value="enterprise">Enterprise Tier</option>
                  <option value="agency">Agency Tier</option>
                </select>
              </div>

              {/* Tenants list card */}
              <div className="card" style={{ padding: 0, overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", color: "var(--color-text)" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "rgba(255,255,255,0.01)" }}>
                      <th style={{ textAlign: "left", padding: "12px var(--spacing-md)" }}>Company Name</th>
                      <th style={{ textAlign: "left", padding: "12px var(--spacing-md)" }}>Tenant UUID</th>
                      <th style={{ textAlign: "center", padding: "12px var(--spacing-md)" }}>Readiness</th>
                      <th style={{ textAlign: "left", padding: "12px var(--spacing-md)" }}>Billing Tier</th>
                      <th style={{ textAlign: "right", padding: "12px var(--spacing-md)" }}>Billing (Mo)</th>
                      <th style={{ textAlign: "center", padding: "12px var(--spacing-md)" }}>Status</th>
                      <th style={{ textAlign: "right", padding: "12px var(--spacing-md)" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((t) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                        <td style={{ padding: "12px var(--spacing-md)", fontWeight: 700 }}>{t.name}</td>
                        <td style={{ padding: "12px var(--spacing-md)" }}>
                          <code style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{t.uuid}</code>
                        </td>
                        <td style={{ padding: "12px var(--spacing-md)", textAlign: "center", fontWeight: 800, color: t.readinessScore >= 80 ? "var(--color-success)" : t.readinessScore >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}>
                          {t.readinessScore}%
                        </td>
                        <td style={{ padding: "12px var(--spacing-md)" }}>
                          <span className="badge" style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--color-accent)" }}>{t.tier}</span>
                        </td>
                        <td style={{ padding: "12px var(--spacing-md)", textAlign: "right", fontWeight: 600 }}>{t.monthlyBilling}</td>
                        <td style={{ padding: "12px var(--spacing-md)", textAlign: "center" }}>
                          <span className={`badge ${t.status === "active" ? "badge-success" : t.status === "trial" ? "badge-warning" : "badge-danger"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px var(--spacing-md)", textAlign: "right" }}>
                          <button onClick={() => toggleTenantStatus(t.id)} style={{
                            background: "transparent",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text)",
                            borderRadius: 4,
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: 11
                          }}>Cycle Status</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBTAB 2: REGULATOR ESCALATIONS DESK */}
          {activeSubTab === "filings" && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h4 style={{ fontWeight: 700, margin: 0 }}>Filing Dispatch History</h4>
              
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", color: "var(--color-text)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                    <th style={{ textAlign: "left", padding: 8 }}>Incident Ref No</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Client Company</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Notification Target</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Filing Date & Time</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Transmission Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filings.map((f, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: 10 }}>
                        <code style={{ fontSize: 11, color: "var(--color-warning)" }}>{f.refNo}</code>
                      </td>
                      <td style={{ padding: 10, fontWeight: 600 }}>{f.companyName}</td>
                      <td style={{ padding: 10 }}>
                        <span className="badge" style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--color-accent)" }}>{f.regulator}</span>
                      </td>
                      <td style={{ padding: 10, color: "var(--color-text-secondary)" }}>
                        {new Date(f.timestamp).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: 10, textAlign: "right" }}>
                        <span className={`badge ${f.status === "Receipt Acknowledged" ? "badge-success" : "badge-warning"}`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SUBTAB 3: LEGAL NOTICE TEMPLATE EDITOR */}
          {activeSubTab === "templates" && (
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "var(--spacing-xl)", alignItems: "start" }}>
              {/* Template selector */}
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10 }}>
                <h4 style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", margin: "4px 0" }}>Legal Templates</h4>
                
                {[
                  { key: "privacy_notice", label: "DPDP Privacy Notice" },
                  { key: "cookie_policy", label: "Cookie & Tracking Policy" }
                ].map((item) => (
                  <button key={item.key} onClick={() => handleSelectTemplate(item.key)} style={{
                    padding: 8,
                    borderRadius: "var(--radius-sm)",
                    background: selectedTemplateKey === item.key ? "rgba(6, 182, 212, 0.12)" : "transparent",
                    color: selectedTemplateKey === item.key ? "var(--color-accent)" : "var(--color-text)",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontWeight: selectedTemplateKey === item.key ? 600 : 500,
                    fontSize: 12
                  }}>{item.label}</button>
                ))}
              </div>

              {/* Template Editor */}
              <form onSubmit={handleSaveTemplate} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontWeight: 700, margin: 0 }}>Template Editor: {selectedTemplateKey.replace("_", " ").toUpperCase()}</h4>
                  {templateSaved && <span style={{ color: "var(--color-success)", fontSize: 12 }}>✓ Saved globally!</span>}
                </div>

                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                  This template uses Handlebars placeholders (e.g. <code>{"{{companyName}}"}</code>). Changes are instantly pushed to all client Notice Portals platform-wide.
                </p>

                <textarea rows={12} value={templateText} onChange={(e) => setTemplateText(e.target.value)} style={{
                  padding: 10,
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  color: "#f8fafc",
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                  resize: "vertical"
                }} required />

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                  <Button type="submit" variant="primary">Publish Template Updates</Button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
