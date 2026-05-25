"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Badge,
  Button
} from "../../../components/ui";

export default function DpoInbox() {
  const [dsrList, setDsrList] = useState<any[]>([]);
  const [breachList, setBreachList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const tenantId = "00000000-0000-0000-0000-000000000000";
      
      // Fetch DSRs
      const dsrRes = await fetch(`/api/v1/dsr?tenantId=${tenantId}`, {
        headers: { "x-tenant-id": tenantId }
      });
      const dsrJson = dsrRes.ok ? await dsrRes.json() : { requests: [] };

      // Fetch Breaches
      const breachRes = await fetch("/api/v1/breaches", {
        headers: { "x-tenant-id": tenantId }
      });
      const breachJson = breachRes.ok ? await breachRes.json() : { breaches: [] };

      setDsrList(dsrJson.requests || []);
      setBreachList(breachJson.breaches || []);
    } catch (err) {
      console.error("DPO Inbox load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("cos:dpo:tenant", "00000000-0000-0000-0000-000000000000");
    void loadAll();
    const id = setInterval(loadAll, 15_000);
    return () => clearInterval(id);
  }, []);

  const openDsr = dsrList.filter(r => !["completed", "rejected"].includes(r.status));
  const openBreaches = breachList.filter(b => b.status !== "closed");
  
  // Calculate critical alerts
  const alerts: { title: string; desc: string; type: "dsr" | "breach" | "vendor"; status: "danger" | "warning" | "info"; link: string }[] = [];

  openBreaches.forEach(b => {
    if (!b.certInFiledAt) {
      alerts.push({
        title: `CERT-In Filing Pending: ${b.title}`,
        desc: `Regulatory 6-hour response deadline is active. reference: ${b.refNo}`,
        type: "breach",
        status: b.certInClock?.isOverdue ? "danger" : "warning",
        link: `/dpo/breach/${b.id}`
      });
    }
    if (!b.dpbInitialFiledAt) {
      alerts.push({
        title: `DPB Initial Notification Pending: ${b.title}`,
        desc: `DPDP Act Section 8(6) notice to Board must be submitted within 72 hours.`,
        type: "breach",
        status: b.dpbClock?.isOverdue ? "danger" : "warning",
        link: `/dpo/breach/${b.id}`
      });
    }
  });

  openDsr.forEach(r => {
    if (!r.identityVerified) {
      alerts.push({
        title: `DSR Identity Verification Required: ${r.subject}`,
        desc: `Requester needs email/OTP/DigiLocker verification before data release. SLA: T-${r.sla?.daysRemaining ?? 90}d`,
        type: "dsr",
        status: "info",
        link: "/app#dsr"
      });
    } else if (r.status === "in_progress") {
      alerts.push({
        title: `DSR Request Processing: ${r.subject}`,
        desc: `Identity verified. Awaiting DPO file compilation or erasure confirmation.`,
        type: "dsr",
        status: "warning",
        link: "/app#dsr"
      });
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Badge tone="primary">DPO Portal</Badge>
          <h1 style={{ margin: "12px 0 4px", fontSize: 28, fontWeight: 800 }}>
            DPO Unified Inbox
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            Aggregated queue for digital privacy rights requests, cybersecurity breaches, and vendor contract alerts.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadAll} disabled={loading}>
          {loading ? "Reloading..." : "Refresh Inbox"}
        </Button>
      </header>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <Card style={{ padding: 12 }}>
          <Badge tone="neutral">Critical Alerts</Badge>
          <div style={{ fontSize: 32, fontWeight: 800, color: alerts.length > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
            {alerts.length}
          </div>
        </Card>
        <Card style={{ padding: 12 }}>
          <Badge tone="primary">Open DSR Requests</Badge>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--color-text)" }}>
            {openDsr.length}
          </div>
        </Card>
        <Card style={{ padding: 12 }}>
          <Badge tone="danger">Active Breaches</Badge>
          <div style={{ fontSize: 32, fontWeight: 800, color: openBreaches.length > 0 ? "var(--color-danger)" : "var(--color-text)" }}>
            {openBreaches.length}
          </div>
        </Card>
      </div>

      {/* Alert Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Active Compliance Alerts ({alerts.length})</CardTitle>
          <CardDescription>
            Address outstanding tasks to maintain strict regulatory compliance under India's DPDP Act 2023 and CERT-In directions.
          </CardDescription>
        </CardHeader>
        <CardBody style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alerts.map((alert, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 12,
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderLeft: `4px solid ${alert.status === "danger" ? "var(--color-danger)" : alert.status === "warning" ? "var(--color-warning)" : "var(--color-primary-light)"}`,
              borderRadius: "var(--radius-md)",
              fontSize: 13
            }}>
              <div>
                <strong style={{ color: "var(--color-text)", display: "block", marginBottom: 2 }}>{alert.title}</strong>
                <span style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{alert.desc}</span>
              </div>
              <Link href={alert.link} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 11, whiteSpace: "nowrap" }}>
                Take Action
              </Link>
            </div>
          ))}

          {alerts.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--color-text-secondary)" }}>
              No critical compliance issues flagged. DPO inbox is clear!
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick Navigation Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardHeader>
            <CardTitle>DSR Kanban Board</CardTitle>
            <CardDescription>Triage data access, correction, erasure, and withdrawal requests.</CardDescription>
          </CardHeader>
          <CardBody>
            <Link href="/app#dsr" style={{ textDecoration: "none" }}>
              <Button variant="secondary">Go to DSR Workspace →</Button>
            </Link>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Breach Incidents Register</CardTitle>
            <CardDescription>Manage active investigations, attach evidence, and draft CERT-In/DPB filings.</CardDescription>
          </CardHeader>
          <CardBody>
            <Link href="/app#breach" style={{ textDecoration: "none" }}>
              <Button variant="secondary">Go to Breach Workspace →</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
