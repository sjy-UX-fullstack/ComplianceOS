"use client";

/**
 * Sprint 4 Task 4.11 — DPO workflow board.
 *
 *   /dpo/dsr
 *
 * Kanban-ish view of every open DSR for the current tenant. Columns mirror
 * the state machine. SLA chips highlight T-30/T-10/T-1/overdue requests.
 *
 * Tenant resolution: until the auth middleware lands, we honour an explicit
 * `?tenantId=` query (with localStorage memory) and send it as X-Tenant-Id.
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Badge,
  Button,
} from "../../../../components/ui";

interface DsrSummary {
  id: string;
  requestType: string;
  requestTypeLabel: string;
  status: string;
  statusLabel: string;
  identityVerified: boolean;
  createdAt: string;
  slaDueAt: string;
  sla: {
    daysRemaining: number;
    severity: "ok" | "warn" | "danger" | "overdue";
    bucket: string;
    isOverdue: boolean;
  };
  subject: string | null;
  contactEmail: string | null;
  contactMobile: string | null;
  language: string;
  channel: string;
}

interface ApiResponse {
  requests: DsrSummary[];
  counts: { total: number; open: number; overdue: number; breached: number; dueSoon: number };
}

const COLUMNS: { status: string; label: string }[] = [
  { status: "received", label: "Received" },
  { status: "verifying", label: "Verifying" },
  { status: "verified", label: "Verified" },
  { status: "in_progress", label: "In progress" },
  { status: "info_needed", label: "Info needed" },
  { status: "grievance_overdue", label: "Overdue" },
];

const NEXT_STATUS: Record<string, string[]> = {
  received: ["verifying", "verified", "rejected"],
  verifying: ["verified", "rejected"],
  verified: ["in_progress", "info_needed", "rejected"],
  in_progress: ["info_needed", "completed", "rejected"],
  info_needed: ["in_progress", "rejected"],
  grievance_overdue: ["in_progress", "completed", "rejected"],
};

export default function DpoDsrBoardPage() {
  return (
    <Suspense fallback={<Card><CardBody>Loading…</CardBody></Card>}>
      <DpoDsrBoard />
    </Suspense>
  );
}

function DpoDsrBoard() {
  const sp = useSearchParams();
  const initialTenant = sp.get("tenantId") ?? "";
  const [tenantId, setTenantId] = React.useState(initialTenant);
  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && !initialTenant) {
      const saved = localStorage.getItem("cos:dpo:tenant");
      if (saved) setTenantId(saved);
    }
  }, [initialTenant]);

  const load = React.useCallback(async () => {
    if (!tenantId) {
      setData(null);
      return;
    }
    try {
      const res = await fetch("/api/v1/dsr", { headers: { "x-tenant-id": tenantId } });
      const json = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not load DSR queue.");
        setData(null);
        return;
      }
      setData(json);
      setError(null);
      try {
        localStorage.setItem("cos:dpo:tenant", tenantId);
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    }
  }, [tenantId]);

  React.useEffect(() => {
    void load();
    const id = window.setInterval(load, 20_000);
    return () => window.clearInterval(id);
  }, [load]);

  async function transition(id: string, status: string) {
    setBusyId(id);
    try {
      await fetch(`/api/v1/dsr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const byStatus: Record<string, DsrSummary[]> = Object.fromEntries(
    COLUMNS.map((c) => [c.status, [] as DsrSummary[]]),
  );
  for (const r of data?.requests ?? []) {
    if (byStatus[r.status]) byStatus[r.status]!.push(r);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Badge tone="primary">Sprint 4</Badge>
          <h1 style={{ margin: "12px 0 4px", fontSize: 28, fontWeight: 800 }}>DSR queue</h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            Rights requests grouped by state. SLA chip = days remaining (90-day clock from Rule 14(3)).
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Tenant UUID"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              width: 320,
            }}
          />
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
        </div>
      </header>

      {error ? (
        <Card accent="danger">
          <CardBody>{error}</CardBody>
        </Card>
      ) : null}

      {data ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <CountTile label="Total" value={data.counts.total} tone="neutral" />
          <CountTile label="Open" value={data.counts.open} tone="primary" />
          <CountTile label="Due soon" value={data.counts.dueSoon} tone="warning" />
          <CountTile label="Overdue" value={data.counts.overdue} tone="danger" />
          <CountTile label="Breached" value={data.counts.breached} tone="danger" />
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {COLUMNS.map((col) => (
          <Card key={col.status} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <CardHeader>
              <CardTitle style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {col.label}
              </CardTitle>
              <CardDescription>{byStatus[col.status]?.length ?? 0} requests</CardDescription>
            </CardHeader>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(byStatus[col.status] ?? []).map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 12,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <strong style={{ fontSize: 14, lineHeight: 1.3 }}>
                      {r.subject ?? r.requestTypeLabel}
                    </strong>
                    <Badge tone={slaTone(r.sla.severity)}>
                      {r.sla.isOverdue ? "OVERDUE" : r.sla.bucket}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {r.requestTypeLabel} · {r.identityVerified ? "✓ Verified" : "Identity pending"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                    {r.contactEmail ?? r.contactMobile ?? "anonymous"} · {r.channel} · {r.language}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                    {(NEXT_STATUS[r.status] ?? []).map((next) => (
                      <button
                        key={next}
                        onClick={() => transition(r.id, next)}
                        disabled={busyId === r.id}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--color-bg-elevated)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text)",
                          cursor: busyId === r.id ? "wait" : "pointer",
                          fontSize: 11,
                          fontFamily: "inherit",
                        }}
                      >
                        → {next.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {(byStatus[col.status]?.length ?? 0) === 0 ? (
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", padding: 8 }}>
                  No requests in this state.
                </div>
              ) : null}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function slaTone(sev: DsrSummary["sla"]["severity"]): "success" | "warning" | "danger" | "neutral" {
  switch (sev) {
    case "ok":
      return "success";
    case "warn":
      return "warning";
    case "danger":
    case "overdue":
      return "danger";
    default:
      return "neutral";
  }
}

function CountTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "primary" | "success" | "warning" | "danger";
}) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Badge tone={tone}>{label}</Badge>
      <div style={{ fontSize: 32, fontWeight: 800, color: "var(--color-text)" }}>{value}</div>
    </Card>
  );
}
