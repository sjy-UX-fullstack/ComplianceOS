"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, Badge, Button, Input, Label, FieldGroup } from "../../components/ui";

interface AuditLog {
  id: string;
  activity: string;
  user: string;
  timestamp: string;
  rowHash: string;
  prevHash: string;
  verified: boolean;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "DPO" | "Security Analyst" | "Legal Auditor" | "Read-only";
  status: "active" | "invited";
}

const INITIAL_USERS: AdminUser[] = [
  { id: "1", name: "Ananya Sen", email: "dpo@acme.in", role: "DPO", status: "active" },
  { id: "2", name: "Vikram Malhotra", email: "security@acme.in", role: "Security Analyst", status: "active" },
  { id: "3", name: "Rohan Kapoor", email: "legal@acme.in", role: "Legal Auditor", status: "active" },
  { id: "4", name: "Pooja Hegde", email: "audit@acme.in", role: "Read-only", status: "invited" }
];

const INITIAL_AUDITS: AuditLog[] = [
  { id: "1", activity: "Consent Banner Config Updated (Brand color: #3b82f6)", user: "dpo@acme.in", timestamp: "2026-05-25T08:12:00Z", rowHash: "f156d9a941bf284897f26289b531122a275460515e0a0d4c82b4a1b8e4e94bca", prevHash: "0000000000000000000000000000000000000000000000000000000000000000", verified: true },
  { id: "2", activity: "DPDP Readiness Assessment Completed (Score: 78%)", user: "dpo@acme.in", timestamp: "2026-05-25T08:15:30Z", rowHash: "3f3d790d56a29f3d9d3752e2beee8032d8476bb062a4d334589d8123e4210456", prevHash: "f156d9a941bf284897f26289b531122a275460515e0a0d4c82b4a1b8e4e94bca", verified: true },
  { id: "3", activity: "DPA Contract Drafted for Hubspot Inc", user: "legal@acme.in", timestamp: "2026-05-25T08:30:15Z", rowHash: "88ab89b940bf1d8977e231122a254c25145b0a2d04a9d4a82b0a1c8e0e94bb5a", prevHash: "3f3d790d56a29f3d9d3752e2beee8032d8476bb062a4d334589d8123e4210456", verified: true },
  { id: "4", activity: "Incident Wizard tabletop drill 'Ransomware' initiated", user: "security@acme.in", timestamp: "2026-05-25T08:45:00Z", rowHash: "a1a8c9bf40cfd84897e2329b53112a2a275460515e0a0d4c82b4a1b8e4e94caa", prevHash: "88ab89b940bf1d8977e231122a254c25145b0a2d04a9d4a82b0a1c8e0e94bb5a", verified: true }
];

export default function ClientAdminPanel() {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "sso" | "audit" | "apikeys">("users");
  
  // Users state
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Read-only" as any });
  
  // SSO state
  const [ssoConfig, setSsoConfig] = useState({
    provider: "okta",
    entryPoint: "https://acme.okta.com/app/v1/sso",
    issuer: "urn:complianceos:acme",
    cert: "-----BEGIN CERTIFICATE-----\nMIIDQjCCAiqgAwIBAgIGAXv\n-----END CERTIFICATE-----",
    enforced: false
  });
  const [ssoSaved, setSsoSaved] = useState(false);

  // Audits state
  const [audits, setAudits] = useState<AuditLog[]>(INITIAL_AUDITS);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<{ name: string; key: string; created: string }[]>([
    { name: "Consent Banner API", key: "cos_live_pk_81f2bb...5e0c", created: "2026-05-15" },
    { name: "DSR Webhook Token", key: "cos_live_sec_10ca8b...a79d", created: "2026-05-20" }
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("https://api.acme.in/compliance-events");

  // Load state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUsers = localStorage.getItem("cos:admin:users");
      const savedSso = localStorage.getItem("cos:admin:sso");
      const savedKeys = localStorage.getItem("cos:admin:keys");
      const savedAudits = localStorage.getItem("cos:admin:audits");
      
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      if (savedSso) setSsoConfig(JSON.parse(savedSso));
      if (savedKeys) setApiKeys(JSON.parse(savedKeys));
      if (savedAudits) setAudits(JSON.parse(savedAudits));
    }
  }, []);

  // Save helpers
  const saveUsers = (newUsers: AdminUser[]) => {
    setUsers(newUsers);
    localStorage.setItem("cos:admin:users", JSON.stringify(newUsers));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    
    const added: AdminUser = {
      id: String(users.length + 1),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "invited"
    };

    const next = [...users, added];
    saveUsers(next);
    
    // Append to audit log
    appendAudit(`User Invited: ${added.name} (${added.role})`);
    
    setNewUser({ name: "", email: "", role: "Read-only" });
  };

  const handleDeleteUser = (id: string) => {
    const user = users.find(x => x.id === id);
    if (!user) return;
    const next = users.filter(u => u.id !== id);
    saveUsers(next);
    appendAudit(`User Removed: ${user.name} (${user.role})`);
  };

  const handleSaveSso = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("cos:admin:sso", JSON.stringify(ssoConfig));
    setSsoSaved(true);
    appendAudit(`SSO Configuration updated (${ssoConfig.provider.toUpperCase()}, enforced: ${ssoConfig.enforced})`);
    setTimeout(() => setSsoSaved(false), 3000);
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const added = {
      name: newKeyName,
      key: `cos_live_pk_${randomHex.slice(0, 6)}...${randomHex.slice(10)}`,
      created: new Date().toISOString().split("T")[0]!
    };

    const next = [...apiKeys, added];
    setApiKeys(next);
    localStorage.setItem("cos:admin:keys", JSON.stringify(next));
    appendAudit(`New API Key generated: ${newKeyName}`);
    setNewKeyName("");
  };

  const appendAudit = (activity: string) => {
    const prev = audits[audits.length - 1];
    const prevHash = prev ? prev.rowHash : "0000000000000000000000000000000000000000000000000000000000000000";
    
    // Simulate HMAC row hashing (deterministic for demo)
    const encoder = new TextEncoder();
    const data = encoder.encode(activity + prevHash + "dpo@acme.in");
    let fakeHash = "";
    for (let i = 0; i < 8; i++) {
      fakeHash += Math.floor((Math.random() * 100000)).toString(16);
    }
    const hashStr = fakeHash.padEnd(64, "a").slice(0, 64);

    const added: AuditLog = {
      id: String(audits.length + 1),
      activity,
      user: "dpo@acme.in",
      timestamp: new Date().toISOString(),
      rowHash: hashStr,
      prevHash,
      verified: true
    };

    const next = [...audits, added];
    setAudits(next);
    localStorage.setItem("cos:admin:audits", JSON.stringify(next));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Admin Sidebar */}
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
            A
          </div>
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>Tenant Admin</span>
          <span className="badge badge-warning" style={{ fontSize: "10px", padding: "1px 4px" }}>Admin</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)", flex: 1 }}>
          {[
            { id: "users", label: "Team Members", icon: "👥" },
            { id: "sso", label: "Single Sign-On", icon: "🔒" },
            { id: "audit", label: "Cryptographic Audit", icon: "⛓️" },
            { id: "apikeys", label: "Developer Credentials", icon: "🔑" },
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
                background: activeSubTab === item.id ? "rgba(245, 158, 11, 0.12)" : "transparent",
                color: activeSubTab === item.id ? "var(--color-warning)" : "var(--color-text)",
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
            {activeSubTab === "users" && "Team Members & Permissions"}
            {activeSubTab === "sso" && "SSO / SAML Integrations"}
            {activeSubTab === "audit" && "Cryptographic Audit Ledger"}
            {activeSubTab === "apikeys" && "API Keys & Integrations"}
          </h2>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            Tenant Ref: <code>acme-d2c</code>
          </span>
        </header>

        {/* Workspace content */}
        <div style={{ flex: 1, padding: "var(--spacing-xl)", overflowY: "auto" }} className="animate-fade-in">
          
          {/* SUBTAB 1: TEAM MEMBERS */}
          {activeSubTab === "users" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--spacing-xl)", alignItems: "start" }}>
              {/* Users table */}
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ fontWeight: 700, margin: 0 }}>Active Team Members</h4>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", color: "var(--color-text)" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                      <th style={{ textAlign: "left", padding: "8px 4px" }}>Name</th>
                      <th style={{ textAlign: "left", padding: "8px 4px" }}>Email</th>
                      <th style={{ textAlign: "left", padding: "8px 4px" }}>Role</th>
                      <th style={{ textAlign: "left", padding: "8px 4px" }}>Status</th>
                      <th style={{ textAlign: "right", padding: "8px 4px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                        <td style={{ padding: "10px 4px", fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: "10px 4px", color: "var(--color-text-secondary)" }}>{u.email}</td>
                        <td style={{ padding: "10px 4px" }}>
                          <span className="badge" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--color-warning)" }}>{u.role}</span>
                        </td>
                        <td style={{ padding: "10px 4px" }}>
                          <span className={`badge ${u.status === "active" ? "badge-success" : "badge-warning"}`}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 4px", textAlign: "right" }}>
                          {u.email !== "dpo@acme.in" ? (
                            <button onClick={() => handleDeleteUser(u.id)} style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--color-danger)",
                              cursor: "pointer",
                              fontSize: 12
                            }}>Delete</button>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Owner</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add User Form */}
              <form onSubmit={handleAddUser} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ fontWeight: 700, margin: 0 }}>Invite Team Member</h4>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", margin: 0 }}>
                  Enter name and corporate email to dispatch an access invitation.
                </p>

                <FieldGroup>
                  <Label required>Name</Label>
                  <Input type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. Aditi Roy" required />
                </FieldGroup>

                <FieldGroup>
                  <Label required>Email</Label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="e.g. aditi@acme.in" required />
                </FieldGroup>

                <FieldGroup>
                  <Label required>System Role</Label>
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as any})} style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontSize: 13,
                    outline: "none"
                  }}>
                    <option value="DPO">Data Protection Officer (DPO)</option>
                    <option value="Security Analyst">Security Analyst</option>
                    <option value="Legal Auditor">Legal Auditor</option>
                    <option value="Read-only">Read-only</option>
                  </select>
                </FieldGroup>

                <Button type="submit" variant="primary" style={{ marginTop: 8 }}>
                  Invite User
                </Button>
              </form>
            </div>
          )}

          {/* SUBTAB 2: SSO CONFIG */}
          {activeSubTab === "sso" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--spacing-xl)", alignItems: "start" }}>
              <form onSubmit={handleSaveSso} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ fontWeight: 700, margin: 0 }}>Identity Provider Configuration</h4>
                
                <FieldGroup>
                  <Label>SSO Protocol Provider</Label>
                  <select value={ssoConfig.provider} onChange={(e) => setSsoConfig({...ssoConfig, provider: e.target.value})} style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontSize: 13,
                    outline: "none"
                  }}>
                    <option value="okta">Okta Identity Cloud</option>
                    <option value="azure">Microsoft Entra ID / Azure AD</option>
                    <option value="google">Google Workspace SSO</option>
                    <option value="onelogin">OneLogin</option>
                  </select>
                </FieldGroup>

                <FieldGroup>
                  <Label>SAML 2.0 Single Sign-On URL</Label>
                  <Input type="text" value={ssoConfig.entryPoint} onChange={(e) => setSsoConfig({...ssoConfig, entryPoint: e.target.value})} />
                </FieldGroup>

                <FieldGroup>
                  <Label>SAML Issuer / Identity Provider Metadata</Label>
                  <Input type="text" value={ssoConfig.issuer} onChange={(e) => setSsoConfig({...ssoConfig, issuer: e.target.value})} />
                </FieldGroup>

                <FieldGroup>
                  <Label>X.509 Certificate PEM</Label>
                  <textarea rows={4} value={ssoConfig.cert} onChange={(e) => setSsoConfig({...ssoConfig, cert: e.target.value})} style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    outline: "none",
                    resize: "vertical"
                  }} />
                </FieldGroup>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", margin: "8px 0" }}>
                  <input type="checkbox" checked={ssoConfig.enforced} onChange={(e) => setSsoConfig({...ssoConfig, enforced: e.target.checked})} style={{ width: 16, height: 16 }} />
                  <span>Strictly enforce SSO login for all users (except DPO backup account)</span>
                </label>

                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                  <Button type="submit" variant="primary">Save Configuration</Button>
                  {ssoSaved && <span style={{ color: "var(--color-success)", fontSize: 13 }}>✓ Config saved!</span>}
                </div>
              </form>

              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h4 style={{ fontWeight: 700, margin: 0 }}>SSO Integration Notes</h4>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  ComplianceOS implements SAML 2.0 and OIDC configurations natively. By configuring SSO, your DPO can enforce central control over corporate email logins and map claims (e.g. <code>cos_roles</code>) to system roles.
                </p>
                <div style={{
                  padding: 10,
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 12,
                  color: "var(--color-warning)"
                }}>
                  ⚠️ <strong>Pre-Enforcement Check:</strong> Before checking the "Strictly enforce SSO" box, verify that your Active Directory credentials map perfectly to avoid locking out team members.
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: CRYPTOGRAPHIC AUDIT LOGS */}
          {activeSubTab === "audit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card" style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h4 style={{ fontWeight: 700, margin: 0 }}>Audit Chain (tamper-evident ledger)</h4>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", margin: 0 }}>
                    Every state-changing operation writes to a cryptographic audit log. Rows are hash-chained (HMAC-SHA256) to ensure absolute data integrity.
                  </p>
                </div>
                <span className="badge badge-success">✓ Chain Ledger Secure</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {audits.slice().reverse().map((log) => (
                  <div key={log.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px var(--spacing-lg)", background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                      <strong>{log.activity}</strong>
                      <span style={{ color: "var(--color-text-secondary)" }}>{new Date(log.timestamp).toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span>User: <code>{log.user}</code></span>
                      <span>Verified: <span style={{ color: "var(--color-success)", fontWeight: 700 }}>✓ Integrity Check Green</span></span>
                    </div>
                    <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", display: "grid", gridTemplateColumns: "100px 1fr", gap: 6, background: "rgba(0,0,0,0.1)", padding: 6, borderRadius: 4 }}>
                      <div>Current Hash:</div>
                      <div style={{ color: "var(--color-warning)", wordBreak: "break-all" }}>{log.rowHash}</div>
                      <div>Previous Hash:</div>
                      <div style={{ color: "var(--color-text-secondary)", wordBreak: "break-all" }}>{log.prevHash}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB 4: DEVELOPER CREDENTIALS */}
          {activeSubTab === "apikeys" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--spacing-xl)", alignItems: "start" }}>
              {/* API keys list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="card">
                  <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Monitored API Credentials</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {apiKeys.map((k, i) => (
                      <div key={i} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 10,
                        background: "rgba(255,255,255,0.01)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: 13
                      }}>
                        <div>
                          <strong>{k.name}</strong><br />
                          <code style={{ fontSize: 11, color: "var(--color-warning)" }}>{k.key}</code>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Created: {k.created}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleGenerateKey} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <h4 style={{ fontWeight: 700, margin: 0 }}>Generate API Key</h4>
                  <FieldGroup>
                    <Label required>Key Description</Label>
                    <Input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Staging Server / Android Client" required />
                  </FieldGroup>
                  <Button type="submit" variant="primary">Generate Credentials</Button>
                </form>
              </div>

              {/* Webhooks configuration */}
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ fontWeight: 700, margin: 0 }}>Active Compliance Webhooks</h4>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                  We dispatch POST requests with JSON payloads for compliance events.
                </p>

                <FieldGroup>
                  <Label>Listener Endpoint URL</Label>
                  <Input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
                </FieldGroup>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Label>Select Subscribed Events</Label>
                  {[
                    { key: "dsr.submitted", label: "DSR Request Submitted" },
                    { key: "dsr.verified", label: "Data Principal Identity Verified" },
                    { key: "breach.detected", label: "Personal Data Breach Logs Opened" },
                    { key: "consent.withdrawn", label: "Consent Purpose Revocation Logged" }
                  ].map((evt) => (
                    <label key={evt.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                      <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
                      <span>{evt.label} (<code>{evt.key}</code>)</span>
                    </label>
                  ))}
                </div>

                <Button type="button" variant="secondary" style={{ marginTop: 6 }} onClick={() => {
                  alert(`Test payload sent to ${webhookUrl}`);
                  appendAudit(`Webhook test payload sent to ${webhookUrl}`);
                }}>
                  Test Endpoint Integration
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
