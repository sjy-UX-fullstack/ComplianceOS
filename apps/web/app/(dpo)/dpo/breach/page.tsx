"use client";

/**
 * Sprint 5 Task 5.10 — Breach incident board (list + new-incident button).
 *
 *   /dpo/breach
 *
 * Surfaces every active and recent breach for the current tenant with the
 * dual-clock chips (CERT-In 6h, DPB 72h). A "Run drill" button preloads
 * the new-incident wizard with a canonical scenario for tabletop exercises.
 */

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Badge,
  Button,
  Textarea,
  Input,
  Label,
  FieldGroup,
} from "../../../../components/ui";
import { DRILL_SCENARIOS } from "../../../../lib/breach/drill";
import { BREACH_CATEGORIES, CATEGORY_LABELS } from "../../../../lib/breach/core";

interface BreachSummary {
  id: string;
  refNo: string;
  title: string | null;
  category: string;
  categoryLabel: string;
  severity: string;
  status: string;
  statusLabel: string;
  detectedAt: string;
  certInDueAt: string | null;
  dpbDueAt: string | null;
  certInClock: ClockSummary | null;
  dpbClock: ClockSummary | null;
  certInFiledAt: string | null;
  dpbInitialFiledAt: string | null;
  dpbDetailedFiledAt: string | null;
  affectedCount: number | null;
  sectoralOverlays: string[];
  notificationsSent: number;
}

interface ClockSummary {
  hoursRemaining: number;
  severity: "ok" | "warn" | "danger" | "overdue";
  isOverdue: boolean;
}

interface ApiResponse {
  breaches: BreachSummary[];
  counts: {
    total: number;
    open: number;
    certInOverdue: number;
    dpbOverdue: number;
    criticalOpen: number;
  };
}

export default function BreachBoardPage() {
  return (
    <Suspense fallback={<Card><CardBody>Loading…</CardBody></Card>}>
      <BreachBoard />
    </Suspense>
  );
}

function BreachBoard() {
  const sp = useSearchParams();
  const initialTenant = sp.get("tenantId") ?? "";
  const [tenantId, setTenantId] = React.useState(initialTenant);
  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [showNew, setShowNew] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && !initialTenant) {
      const saved = localStorage.getItem("cos:dpo:tenant");
      if (saved) setTenantId(saved);
    }
  }, [initialTenant]);

  const load = React.useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch("/api/v1/breaches", { headers: { "x-tenant-id": tenantId } });
      if (!res.ok) {
        setError("Could not load breach queue.");
        return;
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
      setError(null);
      try { localStorage.setItem("cos:dpo:tenant", tenantId); } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    }
  }, [tenantId]);

  React.useEffect(() => {
    void load();
    const id = window.setInterval(load, 15_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Badge tone="primary">Sprint 5</Badge>
          <h1 style={{ margin: "12px 0 4px", fontSize: 28, fontWeight: 800 }}>Breach incidents</h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            CERT-In 6h + DPB 72h dual-clock. Sectoral overlays (RBI 2h/6h, SEBI, IRDAI, TRAI) computed
            from your industry pack.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Tenant UUID"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            style={tenantInputStyle}
          />
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
          <Button size="sm" onClick={() => setShowNew(true)} disabled={!tenantId}>
            + New incident
          </Button>
        </div>
      </header>

      {showNew && tenantId ? (
        <NewIncidentForm
          tenantId={tenantId}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            void load();
          }}
        />
      ) : null}

      {error ? (
        <Card accent="danger">
          <CardBody>{error}</CardBody>
        </Card>
      ) : null}

      {data ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <CountTile label="Total" value={data.counts.total} tone="neutral" />
          <CountTile label="Open" value={data.counts.open} tone="primary" />
          <CountTile label="Critical open" value={data.counts.criticalOpen} tone="danger" />
          <CountTile label="CERT-In overdue" value={data.counts.certInOverdue} tone="danger" />
          <CountTile label="DPB overdue" value={data.counts.dpbOverdue} tone="danger" />
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {(data?.breaches ?? []).map((b) => (
          <BreachRow key={b.id} breach={b} />
        ))}
        {data && data.breaches.length === 0 ? (
          <Card>
            <CardBody>
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                No breaches recorded yet. Click <strong>+ New incident</strong> to file one — or run a tabletop
                drill from the form.
              </p>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function BreachRow({ breach }: { breach: BreachSummary }) {
  return (
    <Card accent={breach.severity === "critical" ? "danger" : breach.severity === "high" ? "warning" : null}>
      <CardHeader style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <CardTitle style={{ fontSize: 16 }}>
            {breach.title ?? breach.refNo}
          </CardTitle>
          <CardDescription>
            <code style={{ fontSize: 11 }}>{breach.refNo}</code> · {breach.categoryLabel}
            {breach.affectedCount ? ` · ${breach.affectedCount.toLocaleString("en-IN")} affected` : ""}
          </CardDescription>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Badge tone={severityTone(breach.severity)}>{breach.severity.toUpperCase()}</Badge>
          <Badge tone="neutral">{breach.statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 8 }}>
          <ClockTile
            label="CERT-In (6h)"
            clock={breach.certInClock}
            filedAt={breach.certInFiledAt}
          />
          <ClockTile
            label="DPB initial (72h)"
            clock={breach.dpbClock}
            filedAt={breach.dpbInitialFiledAt}
          />
          <ClockTile
            label="DPB detailed"
            clock={breach.dpbClock}
            filedAt={breach.dpbDetailedFiledAt}
            mutedWhenUnfiled
          />
        </div>
        {breach.sectoralOverlays.length ? (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            Sectoral: {breach.sectoralOverlays.join(", ")}
          </div>
        ) : null}
      </CardBody>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          padding: "12px 24px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <Link href={`/dpo/breach/${breach.id}`} style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="sm">Open incident →</Button>
        </Link>
        <a href={`/api/v1/breaches/${breach.id}/file-certin?format=html`} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm">Preview CERT-In</Button>
        </a>
        <a href={`/api/v1/breaches/${breach.id}/file-dpb?kind=initial&format=html`} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm">Preview DPB initial</Button>
        </a>
        <a href={`/api/v1/breaches/${breach.id}/file-dpb?kind=detailed&format=html`} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm">Preview DPB detailed</Button>
        </a>
      </div>
    </Card>
  );
}

function ClockTile({
  label,
  clock,
  filedAt,
  mutedWhenUnfiled,
}: {
  label: string;
  clock: ClockSummary | null;
  filedAt: string | null;
  mutedWhenUnfiled?: boolean;
}) {
  if (filedAt) {
    return (
      <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.12)" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>{label}</div>
        <div style={{ fontSize: 14, marginTop: 4, color: "var(--color-success)" }}>
          ✓ Filed {new Date(filedAt).toLocaleString("en-IN")}
        </div>
      </div>
    );
  }
  if (!clock) {
    return (
      <div
        style={{
          padding: 12,
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-elevated)",
          opacity: mutedWhenUnfiled ? 0.5 : 1,
        }}
      >
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>{label}</div>
        <div style={{ fontSize: 13, marginTop: 4, color: "var(--color-text-secondary)" }}>—</div>
      </div>
    );
  }
  const bg =
    clock.severity === "overdue" ? "rgba(239, 68, 68, 0.16)"
    : clock.severity === "danger" ? "rgba(239, 68, 68, 0.10)"
    : clock.severity === "warn" ? "rgba(245, 158, 11, 0.10)"
    : "var(--color-bg-elevated)";
  const fg =
    clock.severity === "overdue" || clock.severity === "danger" ? "var(--color-danger)"
    : clock.severity === "warn" ? "var(--color-warning)"
    : "var(--color-text)";
  return (
    <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: bg }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>{label}</div>
      <div style={{ fontSize: 18, marginTop: 4, color: fg, fontWeight: 700 }}>
        {clock.isOverdue ? `OVERDUE` : `${clock.hoursRemaining.toFixed(1)}h left`}
      </div>
    </div>
  );
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

function severityTone(s: string): "success" | "warning" | "danger" | "neutral" {
  switch (s) {
    case "low": return "success";
    case "medium": return "warning";
    case "high": case "critical": return "danger";
    default: return "neutral";
  }
}

const tenantInputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "var(--radius-md)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  fontSize: 13,
  fontFamily: "var(--font-mono)",
  width: 320,
};

// ─── New incident form ─────────────────────────────────────────────────────

function NewIncidentForm({
  tenantId,
  onClose,
  onCreated,
}: {
  tenantId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [drillCode, setDrillCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [narrative, setNarrative] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [affectedCount, setAffectedCount] = React.useState("");
  const [affectedCategories, setAffectedCategories] = React.useState("");
  const [overlays, setOverlays] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function applyDrill(code: string) {
    setDrillCode(code);
    const s = DRILL_SCENARIOS.find((x) => x.code === code);
    if (s) {
      setTitle(s.title);
      setNarrative(s.narrative);
      setCategory(s.category);
      setAffectedCount(String(s.scoreInputs.affectedCount ?? ""));
      setAffectedCategories(s.affectedCategories.join(", "));
      setOverlays(s.sectoralOverlays.join(", "));
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/breaches", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          drillCode: drillCode || undefined,
          title,
          narrative,
          category: category || undefined,
          affectedCount: affectedCount ? Number(affectedCount) : undefined,
          affectedCategories: affectedCategories
            ? affectedCategories.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
          sectoralOverlays: overlays
            ? overlays.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not create incident.");
        return;
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card accent="primary">
      <CardHeader>
        <CardTitle>New incident</CardTitle>
        <CardDescription>
          Filling this starts the dual-clock immediately. To run a tabletop, pick a drill scenario below.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <FieldGroup>
          <Label>Run a drill (optional)</Label>
          <select
            value={drillCode}
            onChange={(e) => applyDrill(e.target.value)}
            style={selectStyle}
          >
            <option value="">— Start from scratch —</option>
            {DRILL_SCENARIOS.map((d) => (
              <option key={d.code} value={d.code}>{d.title}</option>
            ))}
          </select>
        </FieldGroup>
        <FieldGroup>
          <Label required>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label required>Narrative (free-text)</Label>
          <Textarea rows={6} value={narrative} onChange={(e) => setNarrative(e.target.value)} />
        </FieldGroup>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldGroup>
            <Label>Category (leave blank to auto-classify)</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
              <option value="">— Auto —</option>
              {BREACH_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup>
            <Label>Affected count</Label>
            <Input
              type="number"
              min={0}
              value={affectedCount}
              onChange={(e) => setAffectedCount(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup style={{ gridColumn: "1 / -1" }}>
            <Label>Affected data categories (comma-separated)</Label>
            <Input
              value={affectedCategories}
              onChange={(e) => setAffectedCategories(e.target.value)}
              placeholder="aadhaar, pan, bank_account"
            />
          </FieldGroup>
          <FieldGroup style={{ gridColumn: "1 / -1" }}>
            <Label>Sectoral overlays (codes)</Label>
            <Input
              value={overlays}
              onChange={(e) => setOverlays(e.target.value)}
              placeholder="rbi_cyber_incident, sebi_cyber_incident"
            />
          </FieldGroup>
        </div>
        {error ? <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p> : null}
      </CardBody>
      <div style={{ display: "flex", gap: 8, padding: "12px 24px", borderTop: "1px solid var(--color-border)", justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={submit} loading={submitting} disabled={!title || !narrative}>
          Start clocks
        </Button>
      </div>
    </Card>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "var(--radius-md)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  fontSize: 14,
  fontFamily: "inherit",
};
