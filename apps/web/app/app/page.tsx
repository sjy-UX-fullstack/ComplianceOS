"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { QUESTIONS_SEED, QuestionSeed } from "@complianceos/db/questions";

import { calculateReadinessScore, ScoreReport, PlanTask } from "@complianceos/rules-engine";


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
    // Dynamically load SDK script and init
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
          <span className="badge badge-success" style={{ fontSize: "10px", padding: "1px 4px" }}>Dev</span>
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
            { id: "dsr", label: "DSR Portal", icon: "🔔" },
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
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--spacing-md)" }}>
          <Link href="/" style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", textDecoration: "none" }}>
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
                    <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>Pending DSRs</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-warning)" }}>1</div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>🔔</div>
                </div>

                <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>Breach Watch</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-success)" }}>Healthy</div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>🚨</div>
                </div>

                <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>Processors Monitored</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800 }}>8</div>
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
                        {} Export JSON
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
                                : "var(--color-danger)",
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
                    <h4 style={{ fontWeight: 700, marginBottom: "var(--spacing-sm)" }}>Coming Soon — Sprint 2+</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                      <div>🤖 AI Policy Generator (Claude RAG over DPDP Act)</div>
                      <div>🔒 Presidio PII Redaction (Aadhaar/PAN/UPI)</div>
                      <div>📊 Version Control + Diff View</div>
                      <div>🌐 Bhashini API — 22 Language Translation</div>
                      <div>🎨 Theme Builder (CSS vars, logo, palette)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for remaining modules placeholder */}
          {["dsr", "breach", "vendor"].includes(activeTab) && (
            <div className="card" style={{ textAlign: "center", padding: "var(--spacing-2xl) 0" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "var(--spacing-sm)" }}>🛠️</div>
              <h3 style={{ fontWeight: 700, marginBottom: "var(--spacing-xs)" }}>Module under development</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                This module is scheduled for development in a future sprint. Refer to the <Link href="/" style={{ color: "var(--color-primary-light)" }}>Master Plan</Link>.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
