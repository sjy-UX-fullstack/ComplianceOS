"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { QUESTIONS_SEED, QuestionSeed } from "@complianceos/db/questions";
import { calculateReadinessScore, ScoreReport, PlanTask } from "@complianceos/rules-engine";

// Default seed data for vendors
const INITIAL_VENDORS = [
  { id: "aws", name: "Amazon Web Services", category: "Hosting & Infrastructure", residency: "India (AWS Mumbai ap-south-1) 🇮🇳", soc2: "active", iso27001: "active", dpaStatus: "active", riskScore: 90, dataStored: "Production databases, backup storage, and user credentials" },
  { id: "razorpay", name: "Razorpay Payments", category: "Payment Gateway", residency: "India (Local Data Centers) 🇮🇳", soc2: "active", iso27001: "active", dpaStatus: "active", riskScore: 85, dataStored: "Billing addresses, transaction logs, and payment tokens" },
  { id: "hubspot", name: "Hubspot CRM", category: "Marketing & CRM", residency: "US (East AWS Cluster) 🇺🇸", soc2: "active", iso27001: "missing", dpaStatus: "missing", riskScore: 50, dataStored: "Customer lead names, email addresses, and phone numbers" },
  { id: "clevertap", name: "CleverTap", category: "User Engagement", residency: "India (AWS Mumbai) 🇮🇳", soc2: "active", iso27001: "active", dpaStatus: "active", riskScore: 95, dataStored: "Mobile push tokens, notification payloads, and session histories" },
  { id: "salesforce", name: "Salesforce CRM", category: "Enterprise Sales", residency: "US (West) 🇺🇸", soc2: "active", iso27001: "active", dpaStatus: "missing", riskScore: 70, dataStored: "Corporate customer agreements, ticket details, and sales leads" }
];

export default function PlatformDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "assessment" | "consent" | "policy" | "dsr" | "breach" | "vendor">("overview");
  
  // Assessment State
  const [selectedOverlay, setSelectedOverlay] = useState<string>("all");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scoreReport, setScoreReport] = useState<ScoreReport | null>(null);
  
  // Consent Preview Configuration
  const [bannerTheme, setBannerTheme] = useState({
    primaryColor: "#3b82f6",
    textColor: "#f1f5f9",
    backgroundColor: "#1e293b",
  });

  // DSR State
  const [dsrRequests, setDsrRequests] = useState<any[]>([]);
  const [dsrCounts, setDsrCounts] = useState<any>({ total: 0, open: 0, overdue: 0, breached: 0, dueSoon: 0 });
  const [dsrLoading, setDsrLoading] = useState(false);
  const [dsrBusyId, setDsrBusyId] = useState<string | null>(null);

  // Breach State
  const [breaches, setBreaches] = useState<any[]>([]);
  const [breachCounts, setBreachCounts] = useState<any>({ total: 0, open: 0, criticalOpen: 0, certInOverdue: 0, dpbOverdue: 0 });
  const [breachLoading, setBreachLoading] = useState(false);
  const [showNewBreach, setShowNewBreach] = useState(false);
  const [breachForm, setBreachForm] = useState({
    drillCode: "",
    title: "",
    narrative: "",
    category: "",
    affectedCount: "",
    affectedCategories: "",
    overlays: ""
  });

  // Vendor State
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [vendorAnswers, setVendorAnswers] = useState<Record<string, string>>({});
  const [showDpaGen, setShowDpaGen] = useState(false);
  const [dpaForm, setDpaForm] = useState({
    fiduciaryName: "Acme D2C Pvt Ltd",
    processorName: "",
    categories: "Customer Name, Email Address, Phone Number, Billing Details",
    purpose: "Transactional notifications and marketing campaign delivery",
    security: "AES-256 encryption at rest, TLS 1.3 in transit, automated access logs"
  });
  const [generatedDpa, setGeneratedDpa] = useState<string | null>(null);
  
  // Load questions based on active overlay
  const activeQuestions = QUESTIONS_SEED.filter(
    (q) => q.industryOverlays.includes("all") || q.industryOverlays.includes(selectedOverlay)
  );

  // Auto-run scoring calculation when answers or overlay changes
  useEffect(() => {
    const responseInputs = activeQuestions.map((q) => {
      const selectedCode = answers[q.code] || "non_compliant";
      const option = q.options.find((opt) => opt.code === selectedCode) || q.options[0] || { weight: 0 };
      return {
        questionCode: q.code,
        category: q.category,
        selectedOptionCode: selectedCode,
        weight: option.weight,
        ruleRefs: q.ruleRefs,
      };
    });

    const report = calculateReadinessScore(responseInputs);
    setScoreReport(report);
  }, [answers, selectedOverlay]);

  // Initial mount configurations
  useEffect(() => {
    let handleHashChange: () => void;
    if (typeof window !== "undefined") {
      localStorage.setItem("cos:dpo:tenant", "00000000-0000-0000-0000-000000000000");
      const savedVendors = localStorage.getItem("cos:vendors:v1");
      if (savedVendors) {
        setVendors(JSON.parse(savedVendors));
      } else {
        setVendors(INITIAL_VENDORS);
        localStorage.setItem("cos:vendors:v1", JSON.stringify(INITIAL_VENDORS));
      }

      handleHashChange = () => {
        const hash = window.location.hash.replace("#", "");
        if (["overview", "assessment", "consent", "policy", "dsr", "breach", "vendor"].includes(hash)) {
          setActiveTab(hash as any);
        }
      };

      handleHashChange();
      window.addEventListener("hashchange", handleHashChange);
    }
    loadDsr();
    loadBreaches();
    return () => {
      if (typeof window !== "undefined" && handleHashChange) {
        window.removeEventListener("hashchange", handleHashChange);
      }
    };
  }, []);

  // Fetch when activeTab changes
  useEffect(() => {
    if (activeTab === "dsr") loadDsr();
    if (activeTab === "breach") loadBreaches();
  }, [activeTab]);

  // DSR API Handlers
  const loadDsr = async () => {
    setDsrLoading(true);
    try {
      const res = await fetch("/api/v1/dsr?tenantId=00000000-0000-0000-0000-000000000000", {
        headers: { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
      });
      if (res.ok) {
        const json = await res.json();
        setDsrRequests(json.requests || []);
        setDsrCounts(json.counts || { total: 0, open: 0, overdue: 0, breached: 0, dueSoon: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDsrLoading(false);
    }
  };

  const transitionDsr = async (id: string, status: string) => {
    setDsrBusyId(id);
    try {
      await fetch(`/api/v1/dsr/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "00000000-0000-0000-0000-000000000000"
        },
        body: JSON.stringify({ status })
      });
      await loadDsr();
    } catch (err) {
      console.error(err);
    } finally {
      setDsrBusyId(null);
    }
  };

  const prepopulateDsr = async () => {
    setDsrLoading(true);
    const demos = [
      {
        subject: "Request for access to search logs & profile details",
        bodyMd: "I want to receive a copy of all search logs and my profile details under Section 11 of the DPDP Act. Please email them to me at aditi.sharma@gmail.com",
        contactEmail: "aditi.sharma@gmail.com",
        requestType: "access",
        language: "en"
      },
      {
        subject: "Erase marketing account & tracking pixels",
        bodyMd: "Please delete my account and all associated marketing tracking data. I am withdrawing my consent under Section 6(4). Email: rahul.verma@outlook.com",
        contactEmail: "rahul.verma@outlook.com",
        requestType: "erasure",
        language: "en"
      },
      {
        subject: "Register nominee: Priya Verma (spouse)",
        bodyMd: "I want to nominate Priya Verma (spouse, priya@verma.com) to exercise my data rights in case of death or incapacity under Section 14 of the DPDP Act. Mobile: +91 9876543210",
        contactMobile: "+91 9876543210",
        requestType: "nomination",
        nominee: "Priya Verma — Spouse",
        language: "en"
      }
    ];

    try {
      for (const demo of demos) {
        await fetch("/api/v1/public/dsr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "00000000-0000-0000-0000-000000000000",
            ...demo
          })
        });
      }
      await loadDsr();
    } catch (err) {
      console.error(err);
    } finally {
      setDsrLoading(false);
    }
  };

  // Breach API Handlers
  const loadBreaches = async () => {
    setBreachLoading(true);
    try {
      const res = await fetch("/api/v1/breaches", {
        headers: { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
      });
      if (res.ok) {
        const json = await res.json();
        setBreaches(json.breaches || []);
        setBreachCounts(json.counts || { total: 0, open: 0, criticalOpen: 0, certInOverdue: 0, dpbOverdue: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBreachLoading(false);
    }
  };

  const createBreach = async (e: React.FormEvent) => {
    e.preventDefault();
    setBreachLoading(true);
    try {
      const res = await fetch("/api/v1/breaches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "00000000-0000-0000-0000-000000000000"
        },
        body: JSON.stringify({
          drillCode: breachForm.drillCode || undefined,
          title: breachForm.title,
          narrative: breachForm.narrative,
          category: breachForm.category || undefined,
          affectedCount: breachForm.affectedCount ? Number(breachForm.affectedCount) : undefined,
          affectedCategories: breachForm.affectedCategories ? breachForm.affectedCategories.split(",").map(c => c.trim()).filter(Boolean) : undefined,
          sectoralOverlays: breachForm.overlays ? breachForm.overlays.split(",").map(c => c.trim()).filter(Boolean) : undefined
        })
      });
      if (res.ok) {
        setShowNewBreach(false);
        setBreachForm({
          drillCode: "",
          title: "",
          narrative: "",
          category: "",
          affectedCount: "",
          affectedCategories: "",
          overlays: ""
        });
        await loadBreaches();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBreachLoading(false);
    }
  };

  const applyDrill = (code: string) => {
    const drills: Record<string, any> = {
      "ransomware-d2c": {
        title: "Acme D2C Ransomware Lockdown",
        narrative: "An administrator credential was phished. Ransomware executed on our active transaction logs database, encrypting all tables. Customer email and phone number registries are fully compromised.",
        category: "ransomware",
        affectedCount: 24500,
        affectedCategories: "email, mobile, address, payment_token",
        overlays: "rbi_cyber_incident"
      },
      "misconfig-s3": {
        title: "AWS S3 Public Bucket Exposure",
        narrative: "A DevOps engineer accidentally set the 'invoice-exports' bucket policy to public. Internal invoice PDFs containing customer names, GST numbers, PANs, and bank transfer information were publicly indexed.",
        category: "misconfiguration",
        affectedCount: 8200,
        affectedCategories: "name, bank_account, pan, gst_no",
        overlays: ""
      }
    };

    const s = drills[code];
    if (s) {
      setBreachForm({
        drillCode: code,
        title: s.title,
        narrative: s.narrative,
        category: s.category,
        affectedCount: String(s.affectedCount),
        affectedCategories: s.affectedCategories,
        overlays: s.overlays
      });
    }
  };

  // Vendor Risk Handlers
  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setVendorAnswers({});
    setShowDpaGen(false);
    setGeneratedDpa(null);
    
    // Autofill DPA processor name
    const v = vendors.find(x => x.id === vendorId);
    if (v) {
      setDpaForm(f => ({ ...f, processorName: v.name }));
    }
  };

  const saveVendorAssessment = () => {
    if (!selectedVendorId) return;
    
    // Compute risk score based on 5 questions (each worth 20%)
    let yesCount = 0;
    for (let i = 1; i <= 5; i++) {
      if (vendorAnswers[`q${i}`] === "yes") yesCount++;
    }
    const newScore = yesCount * 20;

    const updated = vendors.map(v => {
      if (v.id === selectedVendorId) {
        return {
          ...v,
          riskScore: newScore,
          dpaStatus: vendorAnswers.q4 === "yes" ? "active" : v.dpaStatus
        };
      }
      return v;
    });

    setVendors(updated);
    localStorage.setItem("cos:vendors:v1", JSON.stringify(updated));
    setSelectedVendorId(null);
  };

  const generateDpa = () => {
    const doc = `DATA PROCESSING AGREEMENT (DPA)
Under Section 8(8) of the Digital Personal Data Protection (DPDP) Act, 2023

BETWEEN:
${dpaForm.fiduciaryName} ("Data Fiduciary")
AND:
${dpaForm.processorName} ("Data Processor")

1. PURPOSE OF PROCESSING
The Data Processor shall process the following categories of personal data:
${dpaForm.categories}
strictly on behalf of the Data Fiduciary and for the purpose of:
${dpaForm.purpose}.

2. MANDATORY OBLIGATIONS UNDER SECTION 8
2.1 The Data Processor shall only process personal data upon documented instructions of the Data Fiduciary.
2.2 The Data Processor shall implement robust technical and organizational security controls to protect all personal data from unauthorized access or leakage, specifically:
${dpaForm.security}.
2.3 The Data Processor shall report any personal data breach to the Data Fiduciary without delay, and in no event later than 24 hours of detection.
2.4 Upon request or termination of services, the Data Processor shall erase all personal data processed on behalf of the Fiduciary and provide written certification of erasure, unless retention is mandated by law.

3. INDEMNITY & GOVERNING LAW
Any violations under this agreement shall be escalated to the Data Protection Board of India (DPBI) and governed in accordance with the laws of the Republic of India.

IN WITNESS WHEREOF, the parties hereto have executed this Data Processing Agreement.

For Data Fiduciary:
Name: DPO Office
Title: Data Protection Officer

For Data Processor:
Name: Operations Desk
Title: Authorized Signatory`;

    setGeneratedDpa(doc);
    
    // Update vendor DPA status to Active
    const updated = vendors.map(v => {
      if (v.name.toLowerCase() === dpaForm.processorName.toLowerCase()) {
        return { ...v, dpaStatus: "active" };
      }
      return v;
    });
    setVendors(updated);
    localStorage.setItem("cos:vendors:v1", JSON.stringify(updated));
  };

  // Set default full compliance answers for demo
  const handlePrepopulateAllCompliant = () => {
    const allYes: Record<string, string> = {};
    activeQuestions.forEach((q) => {
      if (q.options[0]) {
        allYes[q.code] = q.options[0].code;
      }
    });
    setAnswers(allYes);
  };

  const handlePrepopulateAllGaps = () => {
    const allNo: Record<string, string> = {};
    activeQuestions.forEach((q) => {
      const lastOpt = q.options[q.options.length - 1];
      if (lastOpt) {
        allNo[q.code] = lastOpt.code;
      }
    });
    setAnswers(allNo);
  };

  // Launch live SDK banner in window
  const handlePreviewBanner = () => {
    const scriptId = "complianceos-sdk-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "/banner-sdk.js";
      script.onload = () => {
        (window as any).ComplianceOS?.init({
          tenantId: "acme-d2c",
          theme: bannerTheme,
        });
      };
      document.body.appendChild(script);
    } else {
      (window as any).ComplianceOS?.open();
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Side Navigation */}
      <aside style={{
        width: 260,
        background: "var(--color-bg-card)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "var(--spacing-md)",
      }}>
        {/* Logo */}
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
            C
          </div>
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>ComplianceOS</span>
          <span className="badge badge-success" style={{ fontSize: "10px", padding: "1px 4px" }}>Active</span>
        </div>

        {/* Workspace selector mock */}
        <div style={{
          background: "var(--color-bg)",
          padding: "var(--spacing-sm)",
          borderRadius: "var(--radius-md)",
          fontSize: "0.8125rem",
          marginBottom: "var(--spacing-lg)",
          border: "1px solid var(--color-border)",
        }}>
          <div style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}>Active Fiduciary</div>
          <div style={{ fontWeight: 600 }}>Acme D2C Pvt Ltd</div>
        </div>

        {/* Nav Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)", flex: 1 }}>
          {[
            { id: "overview", label: "Dashboard", icon: "📊" },
            { id: "assessment", label: "Readiness Assessment", icon: "📋" },
            { id: "consent", label: "Consent Manager", icon: "🍪" },
            { id: "policy", label: "Policy Notice Gen", icon: "📝" },
            { id: "dsr", label: "DSR Portal", icon: "📬" },
            { id: "breach", label: "Breach Wizard", icon: "🚨" },
            { id: "vendor", label: "Vendor Risk", icon: "🏢" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
                padding: "var(--spacing-sm) var(--spacing-md)",
                borderRadius: "var(--radius-md)",
                background: activeTab === item.id ? "rgba(59, 130, 246, 0.12)" : "transparent",
                color: activeTab === item.id ? "var(--color-primary-light)" : "var(--color-text)",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: activeTab === item.id ? 600 : 500,
                fontSize: "0.875rem",
                transition: "all 0.15s ease",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Back Link */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--spacing-md)", display: "flex", flexDirection: "column", gap: 8 }}>
          <Link href="/admin" style={{ color: "var(--color-text)", fontSize: "0.8125rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            🛡️ Tenant Admin Panel
          </Link>
          <Link href="/master-admin" style={{ color: "var(--color-accent)", fontSize: "0.8125rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            👑 Master Admin Panel
          </Link>
          <Link href="/" style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", textDecoration: "none", marginTop: 4 }}>
            ← Return to Landing Page
          </Link>
        </div>
      </aside>

      {/* Main Workspace */}
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
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Workspace
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
              DPO User: <strong>dpo@acme.in</strong>
            </span>
          </div>
        </header>

        {/* Workspace Content Panel */}
        <div style={{ flex: 1, padding: "var(--spacing-xl)", overflowY: "auto" }} className="animate-fade-in">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
              {/* Quick stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--spacing-md)" }}>
                <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>Readiness Score</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary-light)" }}>
                      {scoreReport?.overallScore || 0}%
                    </div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>🛡️</div>
                </div>

                <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>Active DSRs</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-warning)" }}>
                      {dsrCounts.open}
                    </div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>📬</div>
                </div>

                <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>Breach Watch</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: breachCounts.open > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                      {breachCounts.open > 0 ? `${breachCounts.open} Alert` : "Healthy"}
                    </div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>🚨</div>
                </div>

                <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>Processors Monitored</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800 }}>
                      {vendors.length}
                    </div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>🏢</div>
                </div>
              </div>

              {/* Heatmap summary card */}
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: "var(--spacing-md)" }}>DPDP Compliance Category Heatmap</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "var(--spacing-md)" }}>
                  {scoreReport && Object.entries(scoreReport.categories).map(([cat, detail]) => (
                    <div key={cat} style={{
                      background: "rgba(255,255,255,0.02)",
                      padding: "var(--spacing-md)",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                      border: `1px solid ${
                        detail.status === "compliant"
                          ? "rgba(16, 185, 129, 0.3)"
                          : detail.status === "warning"
                          ? "rgba(245, 158, 11, 0.3)"
                          : "rgba(239, 68, 68, 0.3)"
                      }`,
                    }}>
                      <div style={{ textTransform: "uppercase", fontSize: "10px", color: "var(--color-text-secondary)", letterSpacing: "0.5px" }}>{cat}</div>
                      <div style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        margin: "var(--spacing-xs) 0",
                        color:
                          detail.status === "compliant"
                            ? "var(--color-success)"
                            : detail.status === "warning"
                            ? "var(--color-warning)"
                            : "var(--color-danger)",
                      }}>
                        {detail.score}%
                      </div>
                      <span className={`badge ${
                        detail.status === "compliant"
                          ? "badge-success"
                          : detail.status === "warning"
                          ? "badge-warning"
                          : "badge-danger"
                      }`} style={{ scale: "0.85" }}>
                        {detail.status === "compliant" ? "Compliant" : detail.status === "warning" ? "Warning" : "Gap"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action items */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "var(--spacing-xl)" }}>
                <div className="card">
                  <h3 style={{ fontWeight: 700, marginBottom: "var(--spacing-md)" }}>Top Compliance Gaps</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                    {scoreReport && scoreReport.gaps.slice(0, 3).map((gap) => (
                      <div key={gap.questionCode} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--spacing-sm)",
                        background: "rgba(255,255,255,0.01)",
                        borderRadius: "var(--radius-sm)",
                        borderLeft: `3px solid ${gap.severity === "high" ? "var(--color-danger)" : "var(--color-warning)"}`,
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                            {gap.questionCode.replace(/_/g, " ")}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                            {gap.ruleRefs.join(", ")}
                          </div>
                        </div>
                        <span className={`badge ${gap.severity === "high" ? "badge-danger" : "badge-warning"}`}>
                          {gap.severity.toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {(!scoreReport || scoreReport.gaps.length === 0) && (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>No gaps identified! Excellent.</p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ fontWeight: 700, marginBottom: "var(--spacing-md)" }}>90-Day Implementation Plan</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                    {scoreReport && scoreReport.plan.slice(0, 3).map((task) => (
                      <div key={task.id} style={{ display: "flex", gap: "var(--spacing-md)", fontSize: "0.875rem" }}>
                        <div style={{
                          background: "var(--color-border)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          height: "fit-content",
                        }}>
                          {task.timeframe}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{task.title}</div>
                          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{task.actionRequired}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSESSMENT */}
          {activeTab === "assessment" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
              
              {/* Controls */}
              <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--spacing-md)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Industry Overlay:</label>
                  <select
                    value={selectedOverlay}
                    onChange={(e) => setSelectedOverlay(e.target.value)}
                    style={{
                      background: "var(--color-bg)",
                      color: "var(--color-text)",
                      border: "1px solid var(--color-border)",
                      padding: "var(--spacing-xs) var(--spacing-sm)",
                      borderRadius: "var(--radius-sm)",
                      outline: "none",
                    }}
                  >
                    <option value="all">General / Baseline</option>
                    <option value="fintech">Fintech (NBFC/Payments)</option>
                    <option value="e-commerce">E-Commerce & Retail</option>
                    <option value="edtech">Edtech (Minor focus)</option>
                    <option value="healthtech">Healthtech (Sensitive)</option>
                    <option value="gaming">Real-Money Gaming</option>
                    <option value="saas">B2B SaaS / Data Processor</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                  <button onClick={handlePrepopulateAllCompliant} className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }}>
                    Mock Compliant
                  </button>
                  <button onClick={handlePrepopulateAllGaps} className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "12px", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}>
                    Mock Non-Compliant
                  </button>
                </div>
              </div>

              {/* Split layout: Questions on left, Score/Report on right */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--spacing-xl)", alignItems: "start" }}>
                
                {/* Questions List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
                  {activeQuestions.map((q, idx) => (
                    <div key={q.code} className="card">
                      <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between", marginBottom: "var(--spacing-sm)" }}>
                        <span className="badge badge-success" style={{ textTransform: "uppercase", fontSize: "10px" }}>{q.category}</span>
                        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                          Refs: {q.ruleRefs.join(", ")}
                        </div>
                      </div>
                      <h4 style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "var(--spacing-xs)" }}>
                        {idx + 1}. {q.questionText.en}
                      </h4>
                      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
                        {q.description.en}
                      </p>

                      {/* Options */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
                        {q.options.map((opt) => {
                          const isSelected = (answers[q.code] || "non_compliant") === opt.code;
                          return (
                            <label
                              key={opt.code}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--spacing-sm)",
                                padding: "var(--spacing-sm) var(--spacing-md)",
                                borderRadius: "var(--radius-sm)",
                                background: isSelected ? "rgba(59, 130, 246, 0.08)" : "rgba(255,255,255,0.01)",
                                border: `1px solid ${isSelected ? "var(--color-primary-light)" : "var(--color-border)"}`,
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <input
                                type="radio"
                                name={`q_${q.code}`}
                                checked={isSelected}
                                onChange={() => setAnswers({ ...answers, [q.code]: opt.code })}
                                style={{ accentColor: "var(--color-primary-light)" }}
                              />
                              <span>{opt.text.en}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score Report / plan details on right */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)", position: "sticky", top: 80 }}>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Current Readiness Score</div>
                    <div style={{ fontSize: "4rem", fontWeight: 800, color: "var(--color-primary-light)" }}>
                      {scoreReport?.overallScore || 0}%
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "var(--spacing-sm)" }}>
                      {scoreReport && scoreReport.overallScore >= 80
                        ? "Great job! Keep monitoring and performing quarterly audits."
                        : "Remediation required. Focus on early tasks inside the 90-day plan."}
                    </p>
                    <div style={{ display: "flex", gap: "var(--spacing-sm)", justifyContent: "center", marginTop: "var(--spacing-md)" }}>
                      <a
                        href="/api/v1/assessments/current/export?format=pdf"
                        target="_blank"
                        className="btn btn-primary"
                        style={{ padding: "6px 14px", fontSize: "12px" }}
                      >
                        📄 Export PDF
                      </a>
                      <a
                        href="/api/v1/assessments/current/export?format=json"
                        target="_blank"
                        className="btn btn-outline"
                        style={{ padding: "6px 14px", fontSize: "12px" }}
                      >
                        📄 Export JSON
                      </a>
                    </div>
                  </div>

                  {/* Heatmap Card */}
                  <div className="card">
                    <h4 style={{ fontWeight: 700, marginBottom: "var(--spacing-sm)" }}>Gap Heatmap</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
                      {scoreReport && Object.entries(scoreReport.categories).map(([cat, detail]) => (
                        <div key={cat} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.875rem",
                        }}>
                          <span style={{ textTransform: "capitalize" }}>{cat}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
                            <div style={{
                              width: 100,
                              height: 6,
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: 3,
                              overflow: "hidden",
                            }}>
                              <div style={{
                                width: `${detail.score}%`,
                                height: "100%",
                                background: detail.status === "compliant"
                                  ? "var(--color-success)"
                                  : detail.status === "warning"
                                  ? "var(--color-warning)"
                                  : "var(--color-danger)",
                              }} />
                            </div>
                            <span style={{
                              fontWeight: 700,
                              color: detail.status === "compliant"
                                ? "var(--color-success)"
                                : detail.status === "warning"
                                ? "var(--color-warning)"
                                : "var(--color-danger)"
                            }}>
                              {detail.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 90 Day plan listing */}
                  <div className="card">
                    <h4 style={{ fontWeight: 700, marginBottom: "var(--spacing-sm)" }}>90-Day Plan ({scoreReport?.plan.length || 0} tasks)</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", maxHeight: 300, overflowY: "auto" }}>
                      {scoreReport && scoreReport.plan.map((task) => (
                        <div key={task.id} style={{
                          padding: "var(--spacing-xs) var(--spacing-sm)",
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.8125rem",
                        }}>
                          <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between" }}>
                            <strong style={{ color: "var(--color-primary-light)" }}>{task.title}</strong>
                            <span style={{ opacity: 0.7, fontSize: "10px" }}>{task.timeframe}</span>
                          </div>
                          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>{task.actionRequired}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: CONSENT MANAGER */}
          {activeTab === "consent" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: "var(--spacing-xs)" }}>ComplianceOS Consent SDK</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                  Inject our lightweight, high-performance cookie & consent management banner into your applications to meet Rule 3 and Rule 6 compliance.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--spacing-xl)", alignItems: "start" }}>
                
                {/* Configuration / Live Trigger */}
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
                  <h4 style={{ fontWeight: 700 }}>Banner Customization</h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Primary Brand Color</label>
                    <input
                      type="color"
                      value={bannerTheme.primaryColor}
                      onChange={(e) => setBannerTheme({ ...bannerTheme, primaryColor: e.target.value })}
                      style={{ width: "100%", height: 38, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "transparent" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Banner Text Color</label>
                    <input
                      type="color"
                      value={bannerTheme.textColor}
                      onChange={(e) => setBannerTheme({ ...bannerTheme, textColor: e.target.value })}
                      style={{ width: "100%", height: 38, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "transparent" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Banner Background Color</label>
                    <input
                      type="color"
                      value={bannerTheme.backgroundColor}
                      onChange={(e) => setBannerTheme({ ...bannerTheme, backgroundColor: e.target.value })}
                      style={{ width: "100%", height: 38, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "transparent" }}
                    />
                  </div>

                  <button onClick={handlePreviewBanner} className="btn btn-primary" style={{ marginTop: "var(--spacing-sm)" }}>
                    Preview & Test Consent Banner
                  </button>
                </div>

                {/* Integration code block */}
                <div className="card">
                  <h4 style={{ fontWeight: 700, marginBottom: "var(--spacing-sm)" }}>Integration Snippet</h4>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
                    Insert this tag into the <code>&lt;head&gt;</code> of your website before any tracking scripts:
                  </p>

                  <pre style={{
                    background: "rgba(0,0,0,0.3)",
                    padding: "var(--spacing-md)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    overflowX: "auto",
                    color: "var(--color-accent)",
                    border: "1px solid var(--color-border)",
                  }}>
{`<!-- ComplianceOS Consent Manager -->
<script src="${typeof window !== "undefined" ? window.location.origin : "https://app.complianceos.in"}/banner-sdk.js"></script>
<script>
  window.ComplianceOS.init({
    tenantId: "acme-d2c",
    theme: {
      primaryColor: "${bannerTheme.primaryColor}",
      textColor: "${bannerTheme.textColor}",
      backgroundColor: "${bannerTheme.backgroundColor}"
    }
  });
</script>`}
                  </pre>

                </div>

              </div>
            </div>
          )}

          {/* TAB 4: POLICY NOTICE GENERATOR */}
          {activeTab === "policy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: "var(--spacing-xs)" }}>📝 DPDP Policy Notice Generator</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                  Generate Rule 3-compliant privacy notices and cookie policies. Fill in your company details and we'll render a legally sound document ready for publication.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-xl)", alignItems: "start" }}>
                {/* Live Preview Links */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
                  <div className="card">
                    <h4 style={{ fontWeight: 700, marginBottom: "var(--spacing-md)" }}>Available Templates</h4>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                      {/* Privacy Notice */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--spacing-md)",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Rule 3 — Privacy Notice</div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                            Covers Section 5, 6, 8, 11-14 · EN + HI
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "var(--spacing-xs)" }}>
                          <a
                            href="/api/v1/public/notice/privacy-notice/en"
                            target="_blank"
                            className="btn btn-primary"
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                          >
                            EN
                          </a>
                          <a
                            href="/api/v1/public/notice/privacy-notice/hi"
                            target="_blank"
                            className="btn btn-outline"
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                          >
                            HI
                          </a>
                        </div>
                      </div>

                      {/* Cookie Policy */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--spacing-md)",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Cookie & Tracking Policy</div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                            Covers Rule 3, Rule 6 · GCM v2 + GPC
                          </div>
                        </div>
                        <div>
                          <a
                            href="/api/v1/public/notice/cookie-policy/en"
                            target="_blank"
                            className="btn btn-primary"
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                          >
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template API */}
                  <div className="card">
                    <h4 style={{ fontWeight: 700, marginBottom: "var(--spacing-sm)" }}>Template API</h4>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
                      Use the Policy API to programmatically generate documents:
                    </p>
                    <pre style={{
                      background: "rgba(0,0,0,0.3)",
                      padding: "var(--spacing-md)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      overflowX: "auto",
                      color: "var(--color-accent)",
                      border: "1px solid var(--color-border)",
                    }}>
{`# List available templates
GET /api/v1/policies?lang=en

# Generate a privacy notice
POST /api/v1/policies/generate
{
  "type": "privacy_notice",
  "language": "en",
  "format": "html",
  "variables": {
    "companyName": "Acme D2C Pvt Ltd",
    "dpoEmail": "dpo@acme.in",
    "effectiveDate": "1 Jan 2026",
    ...
  }
}`}
                    </pre>
                  </div>
                </div>

                {/* Status / Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "var(--spacing-xs)" }}>📋</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Templates Available</div>
                    <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--color-primary-light)" }}>3</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Privacy Notice (EN + HI) · Cookie Policy</div>
                  </div>

                  <div className="card">
                    <h4 style={{ fontWeight: 700, marginBottom: "var(--spacing-sm)" }}>Compliance Coverage</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
                      {[
                        { rule: "Rule 3", desc: "Privacy Notice Requirements", status: "covered" },
                        { rule: "Section 5", desc: "Notice at Time of Collection", status: "covered" },
                        { rule: "Section 6(4)", desc: "Consent Withdrawal Ease", status: "covered" },
                        { rule: "Rule 6", desc: "Cookie & Tracking Disclosure", status: "covered" },
                        { rule: "Section 8(6)", desc: "Breach Notification Info", status: "covered" },
                        { rule: "Section 9", desc: "Children's Data Policy", status: "covered" },
                        { rule: "Section 16", desc: "Cross-Border Transfer Info", status: "covered" },
                      ].map((item) => (
                        <div key={item.rule} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "var(--spacing-xs) var(--spacing-sm)",
                          fontSize: "0.8125rem",
                        }}>
                          <div>
                            <strong style={{ color: "var(--color-primary-light)" }}>{item.rule}</strong>{" "}
                            <span style={{ color: "var(--color-text-secondary)" }}>— {item.desc}</span>
                          </div>
                          <span className="badge badge-success" style={{ fontSize: "10px" }}>✓</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <h4 style={{ fontWeight: 700, marginBottom: "var(--spacing-sm)" }}>Next-Gen Features</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                      <div>🤖 AI Policy Generator (Claude RAG over DPDP Act)</div>
                      <div>🔒 Presidio PII Redaction (Aadhaar/PAN/UPI)</div>
                      <div>📊 Version Control + Diff View</div>
                      <div>🌐 Bhashini API — 22 Language Translation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DSR WORKSPACE */}
          {activeTab === "dsr" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
              <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>DSR Triage Board</h3>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", margin: 0 }}>
                    Manage rights requests under DPDP §11–14. Countdowns display SLA (90-day limit from submission).
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={prepopulateDsr} className="btn btn-outline" disabled={dsrLoading}>
                    ⚡ Seed Demo Requests
                  </button>
                  <button onClick={loadDsr} className="btn btn-primary" disabled={dsrLoading}>
                    {dsrLoading ? "Reloading..." : "Refresh Queue"}
                  </button>
                </div>
              </div>

              {/* Counts tiles */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="card" style={{ padding: 12 }}>
                  <span className="badge badge-success">Total Requests</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>{dsrCounts.total}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <span className="badge badge-success" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>Open</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>{dsrCounts.open}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <span className="badge badge-warning">Due Soon</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>{dsrCounts.dueSoon}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <span className="badge badge-danger">Overdue</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>{dsrCounts.overdue}</div>
                </div>
              </div>

              {/* Kanban board */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, alignItems: "start" }}>
                {[
                  { status: "received", label: "Received", desc: "Awaiting review" },
                  { status: "verifying", label: "Verifying", desc: "Identity OTP check" },
                  { status: "verified", label: "Identity Verified", desc: "Ready to process" },
                  { status: "in_progress", label: "In Progress", desc: "Triage active" },
                  { status: "completed", label: "Completed / Rejected", desc: "Archived requests" }
                ].map((col) => {
                  const filtered = dsrRequests.filter(r => 
                    col.status === "completed" 
                      ? ["completed", "rejected"].includes(r.status)
                      : r.status === col.status
                  );

                  return (
                    <div key={col.status} className="card" style={{ background: "rgba(30, 41, 59, 0.3)", display: "flex", flexDirection: "column", gap: 8, minHeight: 400 }}>
                      <h4 style={{ fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                        {col.label} <span style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>({filtered.length})</span>
                      </h4>
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem", margin: "0 0 8px 0" }}>{col.desc}</p>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                        {filtered.map((r) => {
                          const daysLeft = r.sla?.daysRemaining ?? 90;
                          const tone = daysLeft < 10 ? "danger" : daysLeft < 30 ? "warning" : "success";
                          
                          return (
                            <div key={r.id} style={{
                              background: "var(--color-bg-card)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-md)",
                              padding: 10,
                              fontSize: "0.8125rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                                <strong style={{ color: "var(--color-text)", fontWeight: 600 }}>{r.subject}</strong>
                                <span className={`badge badge-${tone}`} style={{ fontSize: "10px", whiteSpace: "nowrap" }}>
                                  T-{daysLeft}d
                                </span>
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                                {r.requestTypeLabel} · {r.identityVerified ? "✓ Verified" : "Identity pending"}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.contactEmail || r.contactMobile}
                              </div>

                              {/* Transitions */}
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                                {r.status === "received" && (
                                  <>
                                    <button onClick={() => transitionDsr(r.id, "verifying")} disabled={dsrBusyId === r.id} style={actionBtnStyle}>
                                      Verifying
                                    </button>
                                    <button onClick={() => transitionDsr(r.id, "verified")} disabled={dsrBusyId === r.id} style={actionBtnStyle}>
                                      Verify
                                    </button>
                                  </>
                                )}
                                {r.status === "verifying" && (
                                  <button onClick={() => transitionDsr(r.id, "verified")} disabled={dsrBusyId === r.id} style={actionBtnStyle}>
                                    Mark Verified
                                  </button>
                                )}
                                {r.status === "verified" && (
                                  <button onClick={() => transitionDsr(r.id, "in_progress")} disabled={dsrBusyId === r.id} style={actionBtnStyle}>
                                    Process
                                  </button>
                                )}
                                {r.status === "in_progress" && (
                                  <>
                                    <button onClick={() => transitionDsr(r.id, "completed")} disabled={dsrBusyId === r.id} style={{ ...actionBtnStyle, color: "var(--color-success)" }}>
                                      Complete
                                    </button>
                                    <button onClick={() => transitionDsr(r.id, "rejected")} disabled={dsrBusyId === r.id} style={{ ...actionBtnStyle, color: "var(--color-danger)" }}>
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {filtered.length === 0 && (
                          <div style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem", textAlign: "center", padding: "20px 0", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                            No requests
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: BREACH INCIDENTS */}
          {activeTab === "breach" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
              <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Dual-Clock Incident Wizard</h3>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", margin: 0 }}>
                    Report breaches and run tabletop exercises under CERT-In (6-hour) and DPB (72-hour) strict regulatory timelines.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowNewBreach(!showNewBreach)} className="btn btn-primary" disabled={breachLoading}>
                    {showNewBreach ? "Close Form" : "+ New Incident"}
                  </button>
                  <button onClick={loadBreaches} className="btn btn-outline" disabled={breachLoading}>
                    Refresh Clocks
                  </button>
                </div>
              </div>

              {showNewBreach && (
                <form onSubmit={createBreach} className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 12, border: "1px solid var(--color-primary-light)" }}>
                  <h4 style={{ fontWeight: 700, margin: 0 }}>File Incident Report</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Run Tabletop Scenario (Optional)</label>
                      <select onChange={(e) => applyDrill(e.target.value)} style={selectStyle}>
                        <option value="">— Choose a Drill —</option>
                        <option value="ransomware-d2c">Ransomware attack on transactions DB (nb/NBFC)</option>
                        <option value="misconfig-s3">S3 bucket exposed publicly (PAN/invoices leak)</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Incident Category</label>
                      <select value={breachForm.category} onChange={(e) => setBreachForm({...breachForm, category: e.target.value})} style={selectStyle} required>
                        <option value="">— Select Category —</option>
                        <option value="ransomware">Ransomware</option>
                        <option value="misconfiguration">S3 Bucket / Config Leak</option>
                        <option value="phishing_credential">Phishing / Credential Leak</option>
                        <option value="data_leak_disclosure">Unauthorized Disclosure</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Incident Title</label>
                    <input type="text" value={breachForm.title} onChange={(e) => setBreachForm({...breachForm, title: e.target.value})} style={inputStyle} placeholder="e.g. SQL Injection attack on lead DB" required />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Narrative / Context</label>
                    <textarea rows={4} value={breachForm.narrative} onChange={(e) => setBreachForm({...breachForm, narrative: e.target.value})} style={textareaStyle} placeholder="Describe the breach, systems affected, and containment steps..." required />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Estimated Data Principals Affected</label>
                      <input type="number" value={breachForm.affectedCount} onChange={(e) => setBreachForm({...breachForm, affectedCount: e.target.value})} style={inputStyle} placeholder="e.g. 5000" />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Sensitive Data Fields (Comma-separated)</label>
                      <input type="text" value={breachForm.affectedCategories} onChange={(e) => setBreachForm({...breachForm, affectedCategories: e.target.value})} style={inputStyle} placeholder="email, bank_account, pan" />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Sectoral Overlays (Comma-separated)</label>
                    <input type="text" value={breachForm.overlays} onChange={(e) => setBreachForm({...breachForm, overlays: e.target.value})} style={inputStyle} placeholder="rbi_cyber_incident, sebi_cyber_incident" />
                  </div>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                    <button type="button" onClick={() => setShowNewBreach(false)} className="btn btn-outline" style={{ padding: "6px 16px" }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: "6px 16px" }}>Submit & Trigger Clocks</button>
                  </div>
                </form>
              )}

              {/* Breach count statistics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="card" style={{ padding: 12 }}>
                  <span className="badge badge-success">Total Breaches</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>{breachCounts.total}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <span className="badge badge-danger">Active Incidents</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>{breachCounts.open}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <span className="badge badge-danger">CERT-In Overdue</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>{breachCounts.certInOverdue}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <span className="badge badge-warning">DPB Overdue</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 4 }}>{breachCounts.dpbOverdue}</div>
                </div>
              </div>

              {/* Breach entries */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {breaches.map((b) => (
                  <div key={b.id} className="card" style={{ borderLeft: b.severity === "critical" ? "4px solid var(--color-danger)" : "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: "1.0625rem", margin: 0 }}>
                          {b.title}
                        </h4>
                        <code style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{b.refNo}</code> · <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{b.categoryLabel}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span className={`badge ${b.severity === "critical" || b.severity === "high" ? "badge-danger" : "badge-warning"}`}>
                          {b.severity.toUpperCase()}
                        </span>
                        <span className="badge badge-success" style={{ textTransform: "uppercase" }}>{b.status}</span>
                      </div>
                    </div>

                    {/* Clock widgets */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, margin: "12px 0" }}>
                      <div style={clockBoxStyle(b.certInClock?.severity)}>
                        <div style={clockLabelStyle}>CERT-In Deadline (6h)</div>
                        <div style={clockValueStyle(b.certInClock?.severity)}>
                          {b.certInFiledAt ? "✓ Filed" : b.certInClock?.isOverdue ? "OVERDUE" : `${b.certInClock?.hoursRemaining?.toFixed(1) ?? 6}h remaining`}
                        </div>
                      </div>
                      <div style={clockBoxStyle(b.dpbClock?.severity)}>
                        <div style={clockLabelStyle}>DPB Initial Notification (72h)</div>
                        <div style={clockValueStyle(b.dpbClock?.severity)}>
                          {b.dpbInitialFiledAt ? "✓ Filed" : b.dpbClock?.isOverdue ? "OVERDUE" : `${b.dpbClock?.hoursRemaining?.toFixed(1) ?? 72}h remaining`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: 10, marginTop: 10 }}>
                      <Link href={`/dpo/breach/${b.id}`} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 12 }}>
                        Open Response Wizard →
                      </Link>
                      <a href={`/api/v1/breaches/${b.id}/file-certin?format=html`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 12, borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                        Draft CERT-In Report
                      </a>
                      <a href={`/api/v1/breaches/${b.id}/file-dpb?kind=initial&format=html`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 12, borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                        Draft DPB Initial Form
                      </a>
                    </div>
                  </div>
                ))}

                {breaches.length === 0 && (
                  <div className="card" style={{ textAlign: "center", padding: "40px 0" }}>
                    <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                      No active breaches. Click <strong>+ New Incident</strong> to simulate a tabletop exercise.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: VENDOR RISK MANAGEMENT */}
          {activeTab === "vendor" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Sub-Processor & Vendor Registry</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                  DPDP Act §8(8): Data Fiduciaries must execute binding contracts (DPAs) with processors and monitor compliance.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "var(--spacing-xl)", alignItems: "start" }}>
                
                {/* Vendor grid */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {vendors.map((v) => {
                    const isSelected = selectedVendorId === v.id;
                    const scoreColor = v.riskScore >= 80 ? "var(--color-success)" : v.riskScore >= 60 ? "var(--color-warning)" : "var(--color-danger)";
                    const scoreText = v.riskScore >= 80 ? "Low Risk" : v.riskScore >= 60 ? "Medium Risk" : "High Risk";
                    
                    return (
                      <div key={v.id} className="card" style={{
                        borderColor: isSelected ? "var(--color-primary-light)" : "var(--color-border)",
                        background: isSelected ? "rgba(59, 130, 246, 0.04)" : "var(--color-bg-card)",
                        cursor: "pointer"
                      }} onClick={() => handleSelectVendor(v.id)}>
                        <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <h4 style={{ fontWeight: 700, fontSize: "1rem", margin: 0 }}>{v.name}</h4>
                            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{v.category}</span>
                          </div>
                          <span className="badge" style={{ background: scoreColor + "20", color: scoreColor }}>
                            {v.riskScore}% — {scoreText}
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.8125rem", margin: "10px 0" }}>
                          <div>
                            <span style={{ color: "var(--color-text-secondary)" }}>Data Residency:</span><br />
                            <strong>{v.residency}</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--color-text-secondary)" }}>Data Processed:</span><br />
                            <strong>{v.dataStored}</strong>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                          <span className={`badge ${v.soc2 === "active" ? "badge-success" : "badge-danger"}`}>
                            SOC 2: {v.soc2.toUpperCase()}
                          </span>
                          <span className={`badge ${v.iso27001 === "active" ? "badge-success" : "badge-danger"}`}>
                            ISO 27001: {v.iso27001.toUpperCase()}
                          </span>
                          <span className={`badge ${v.dpaStatus === "active" ? "badge-success" : "badge-danger"}`}>
                            DPDP §8(8) Contract: {v.dpaStatus === "active" ? "ACTIVE" : "MISSING"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Vendor operations card */}
                <div style={{ position: "sticky", top: 80 }}>
                  {selectedVendorId ? (
                    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <h4 style={{ fontWeight: 700, margin: 0 }}>
                        Manage {vendors.find(x => x.id === selectedVendorId)?.name}
                      </h4>
                      
                      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", paddingBottom: 8 }}>
                        <button onClick={() => setShowDpaGen(false)} style={subTabStyle(!showDpaGen)}>
                          Security Audit
                        </button>
                        <button onClick={() => setShowDpaGen(true)} style={subTabStyle(showDpaGen)}>
                          DPA Generator
                        </button>
                      </div>

                      {!showDpaGen ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                            Assess the processor's active compliance configuration.
                          </p>

                          {[
                            { key: "q1", label: "Does vendor encrypt data at rest (AES-256) and transit (TLS 1.3)?" },
                            { key: "q2", label: "Are admin sessions secured via MFA with access audits logged?" },
                            { key: "q3", label: "Is there a contractual 24h SLA for breach notifications?" },
                            { key: "q4", label: "Is personal data stored entirely inside India's borders?" },
                            { key: "q5", label: "Are SOC 2 / ISO 27001 certificates updated and verified annually?" }
                          ].map((item) => (
                            <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem", padding: "4px 0" }}>
                              <span style={{ flex: 1, paddingRight: 8 }}>{item.label}</span>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button type="button" onClick={() => setVendorAnswers({...vendorAnswers, [item.key]: "yes"})} style={choiceBtnStyle(vendorAnswers[item.key] === "yes")}>Yes</button>
                                <button type="button" onClick={() => setVendorAnswers({...vendorAnswers, [item.key]: "no"})} style={choiceBtnStyle(vendorAnswers[item.key] === "no")}>No</button>
                              </div>
                            </div>
                          ))}

                          <button onClick={saveVendorAssessment} className="btn btn-primary" style={{ marginTop: 8 }}>
                            Save Security Audit
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                            Draft a legally-sound Data Processing Agreement matching §8 of India's DPDP Act.
                          </p>

                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 600 }}>Data Fiduciary (You)</label>
                            <input type="text" value={dpaForm.fiduciaryName} onChange={(e) => setDpaForm({...dpaForm, fiduciaryName: e.target.value})} style={inputStyle} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 600 }}>Data Processor (Vendor)</label>
                            <input type="text" value={dpaForm.processorName} readOnly style={{ ...inputStyle, background: "rgba(255,255,255,0.02)" }} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 600 }}>Processing Categories</label>
                            <input type="text" value={dpaForm.categories} onChange={(e) => setDpaForm({...dpaForm, categories: e.target.value})} style={inputStyle} />
                          </div>

                          <button onClick={generateDpa} className="btn btn-primary" style={{ marginTop: 8 }}>
                            Draft Contract Preview
                          </button>

                          {generatedDpa && (
                            <div style={{ marginTop: 12 }}>
                              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Contract Draft</label>
                              <pre style={{
                                background: "rgba(0,0,0,0.3)",
                                padding: 10,
                                borderRadius: 4,
                                fontSize: 10,
                                whiteSpace: "pre-wrap",
                                border: "1px solid var(--color-border)",
                                maxHeight: 200,
                                overflowY: "auto",
                                color: "#e2e8f0"
                              }}>{generatedDpa}</pre>
                              <button onClick={() => {
                                navigator.clipboard.writeText(generatedDpa);
                                alert("DPA Contract copied to clipboard!");
                              }} className="btn btn-outline" style={{ width: "100%", marginTop: 6, padding: "4px 8px", fontSize: 11 }}>
                                Copy DPA Text
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="card" style={{ textAlign: "center", padding: "40px 0" }}>
                      <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                        Select a vendor from the registry list to verify compliance details, audit security questions, or compile a binding Data Processing Agreement.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Sub-component styled objects
const actionBtnStyle: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  cursor: "pointer",
  fontSize: 10,
  fontFamily: "inherit",
};

const subTabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "6px 0",
  background: "transparent",
  border: "none",
  borderBottom: active ? "2px solid var(--color-primary-light)" : "none",
  color: active ? "var(--color-text)" : "var(--color-text-secondary)",
  fontWeight: active ? 600 : 500,
  cursor: "pointer",
  fontSize: "0.8125rem",
  textAlign: "center"
});

const choiceBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: "2px 8px",
  borderRadius: 4,
  border: "1px solid " + (active ? "var(--color-primary-light)" : "var(--color-border)"),
  background: active ? "var(--color-primary)" : "transparent",
  color: active ? "white" : "var(--color-text-secondary)",
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "inherit"
});

const selectStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none"
};

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none"
};

const textareaStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  resize: "vertical"
};

const clockBoxStyle = (severity?: string): React.CSSProperties => {
  const bg = severity === "danger" || severity === "overdue" ? "rgba(239,68,68,0.12)" : severity === "warn" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.02)";
  const border = "1px solid " + (severity === "danger" || severity === "overdue" ? "var(--color-danger)" : severity === "warn" ? "var(--color-warning)" : "var(--color-border)");
  return {
    padding: 10,
    borderRadius: "var(--radius-md)",
    background: bg,
    border: border
  };
};

const clockLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--color-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const clockValueStyle = (severity?: string): React.CSSProperties => {
  const color = severity === "danger" || severity === "overdue" ? "var(--color-danger)" : severity === "warn" ? "var(--color-warning)" : "var(--color-text)";
  return {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 2,
    color: color
  };
};
