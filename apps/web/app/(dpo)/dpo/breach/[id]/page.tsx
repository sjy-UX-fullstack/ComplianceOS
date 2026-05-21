"use client";

/**
 * Sprint 5 Task 5.10 — Breach incident detail.
 *
 *   /dpo/breach/[id]
 *
 * The single-incident view. Surfaces:
 *   - Dual-clock countdown + sectoral overlay due-ats
 *   - AI classification (severity + draft narrative + root-cause hypothesis)
 *   - Containment-step editor
 *   - File-CERT-In / file-DPB action buttons (with HTML previews)
 *   - Evidence-locker entries
 *   - Data-principal notification stub
 */

import * as React from "react";
import { useParams } from "next/navigation";
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
} from "../../../../../components/ui";

interface BreachDetail {
  id: string;
  refNo: string;
  title: string | null;
  narrative: string | null;
  severity: string;
  category: string;
  categoryLabel: string;
  status: string;
  statusLabel: string;
  detectedAt: string;
  certInDueAt: string | null;
  dpbDueAt: string | null;
  certInClock: { hoursRemaining: number; severity: string; isOverdue: boolean } | null;
  dpbClock: { hoursRemaining: number; severity: string; isOverdue: boolean } | null;
  certInFiledAt: string | null;
  dpbInitialFiledAt: string | null;
  dpbDetailedFiledAt: string | null;
  affectedCount: number | null;
  affectedCategories: string[];
  rootCause: string | null;
  containmentSteps: { step: string; doneAt?: string }[];
  sectoralOverlays: string[];
  customDueAts: Record<string, string>;
  evidence: { filename: string; sha256: string; sizeBytes: number; uploadedAt: string }[];
  aiClassification: {
    severity: string;
    score: number;
    draftNarrative?: string;
    rootCauseHypothesis?: string;
    citations?: string[];
    modelUsed?: string;
    breakdown?: { factor: string; weight: number }[];
  } | null;
  notificationsSent: number;
}

export default function BreachDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [tenantId, setTenantId] = React.useState("");
  const [data, setData] = React.useState<BreachDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cos:dpo:tenant") ?? "";
      setTenantId(saved);
    }
  }, []);

  const load = React.useCallback(async () => {
    if (!id || !tenantId) return;
    try {
      const res = await fetch(`/api/v1/breaches/${id}`, { headers: { "x-tenant-id": tenantId } });
      if (!res.ok) {
        setError("Could not load incident.");
        return;
      }
      const json = (await res.json()) as BreachDetail;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    }
  }, [id, tenantId]);

  React.useEffect(() => {
    void load();
    const t = window.setInterval(load, 15_000);
    return () => window.clearInterval(t);
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    if (!id || !tenantId) return;
    setBusy(true);
    try {
      await fetch(`/api/v1/breaches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify(body),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function fileCertIn() {
    if (!id || !tenantId) return;
    setBusy(true);
    try {
      await fetch(`/api/v1/breaches/${id}/file-certin`, {
        method: "POST",
        headers: { "x-tenant-id": tenantId },
      });
      window.open(`/api/v1/breaches/${id}/file-certin?format=html`, "_blank");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function fileDpb(kind: "initial" | "detailed") {
    if (!id || !tenantId) return;
    setBusy(true);
    try {
      await fetch(`/api/v1/breaches/${id}/file-dpb?kind=${kind}`, {
        method: "POST",
        headers: { "x-tenant-id": tenantId },
      });
      window.open(`/api/v1/breaches/${id}/file-dpb?kind=${kind}&format=html`, "_blank");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!tenantId) {
    return (
      <Card accent="warning">
        <CardBody>
          Open the queue at <code>/dpo/breach</code> first to set a tenant context.
        </CardBody>
      </Card>
    );
  }
  if (error && !data) return <Card accent="danger"><CardBody>{error}</CardBody></Card>;
  if (!data) return <Card><CardBody>Loading…</CardBody></Card>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Badge tone={severityTone(data.severity)}>{data.severity.toUpperCase()}</Badge>
          <h1 style={{ margin: "12px 0 4px", fontSize: 26, fontWeight: 800 }}>
            {data.title ?? data.refNo}
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            <code>{data.refNo}</code> · {data.categoryLabel} · {data.statusLabel} · detected{" "}
            {new Date(data.detectedAt).toLocaleString("en-IN")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {!data.certInFiledAt ? (
            <Button size="sm" onClick={fileCertIn} disabled={busy}>File CERT-In (6h)</Button>
          ) : null}
          {!data.dpbInitialFiledAt ? (
            <Button size="sm" onClick={() => fileDpb("initial")} disabled={busy}>File DPB initial</Button>
          ) : null}
          {data.dpbInitialFiledAt && !data.dpbDetailedFiledAt ? (
            <Button size="sm" variant="secondary" onClick={() => fileDpb("detailed")} disabled={busy}>
              File DPB detailed
            </Button>
          ) : null}
          {data.status !== "closed" ? (
            <Button size="sm" variant="ghost" onClick={() => patch({ status: "closed" })} disabled={busy}>
              Close incident
            </Button>
          ) : null}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <ClockTile label="CERT-In (6h)" clock={data.certInClock} filedAt={data.certInFiledAt} />
        <ClockTile label="DPB initial (72h)" clock={data.dpbClock} filedAt={data.dpbInitialFiledAt} />
        <ClockTile label="DPB detailed" clock={data.dpbClock} filedAt={data.dpbDetailedFiledAt} mutedWhenUnfiled />
        {Object.entries(data.customDueAts).map(([k, iso]) => (
          <SectoralTile key={k} label={k.replace("::", " · ")} dueAt={iso} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Narrative</CardTitle>
          <CardDescription>This is what we&apos;ll embed in every filing.</CardDescription>
        </CardHeader>
        <CardBody>
          <Textarea
            rows={8}
            defaultValue={data.narrative ?? ""}
            onBlur={(e) => patch({ narrative: e.target.value })}
          />
        </CardBody>
      </Card>

      {data.aiClassification ? (
        <Card accent="primary">
          <CardHeader>
            <CardTitle>AI assist</CardTitle>
            <CardDescription>
              {data.aiClassification.modelUsed === "claude"
                ? "Reviewed by Claude — verify against your investigation before submitting."
                : "Heuristic only — ANTHROPIC_API_KEY is not set."}
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
              <div>
                <strong>Severity:</strong> {data.aiClassification.severity.toUpperCase()} (score {data.aiClassification.score})
              </div>
              <div>
                <strong>Citations:</strong> {(data.aiClassification.citations ?? []).join(" · ")}
              </div>
            </div>
            {data.aiClassification.breakdown ? (
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--color-text-secondary)" }}>
                {data.aiClassification.breakdown.map((b, i) => (
                  <li key={i}>{b.factor} (+{b.weight})</li>
                ))}
              </ul>
            ) : null}
            {data.aiClassification.draftNarrative ? (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer" }}>Draft narrative</summary>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", marginTop: 8 }}>
                  {data.aiClassification.draftNarrative}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ marginTop: 8 }}
                  onClick={() => patch({ narrative: data.aiClassification?.draftNarrative })}
                >
                  Use this narrative
                </Button>
              </details>
            ) : null}
            {data.aiClassification.rootCauseHypothesis ? (
              <p style={{ marginTop: 12, fontSize: 13 }}>
                <strong>Root-cause hypothesis:</strong> {data.aiClassification.rootCauseHypothesis}
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Containment steps</CardTitle>
          <CardDescription>Each step you record here is embedded into the CERT-In + DPB filings.</CardDescription>
        </CardHeader>
        <CardBody>
          <ContainmentEditor
            initial={data.containmentSteps}
            onSave={(steps) => patch({ containmentSteps: steps })}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Root cause</CardTitle>
        </CardHeader>
        <CardBody>
          <FieldGroup>
            <Textarea
              rows={3}
              defaultValue={data.rootCause ?? ""}
              onBlur={(e) => patch({ rootCause: e.target.value })}
            />
          </FieldGroup>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evidence ({data.evidence.length})</CardTitle>
          <CardDescription>S3 Object Lock (7y Compliance Mode). Use the pre-signed-URL endpoint to upload — metadata is logged here.</CardDescription>
        </CardHeader>
        <CardBody>
          {data.evidence.length ? (
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: 6 }}>File</th>
                  <th style={{ textAlign: "left", padding: 6 }}>SHA-256</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Size</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {data.evidence.map((e) => (
                  <tr key={e.sha256}>
                    <td style={{ padding: 6 }}>{e.filename}</td>
                    <td style={{ padding: 6, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>{e.sha256.slice(0, 12)}…</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{formatBytes(e.sizeBytes)}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{new Date(e.uploadedAt).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>No evidence attached yet.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data-principal notification</CardTitle>
          <CardDescription>
            {data.notificationsSent
              ? `${data.notificationsSent} notices dispatched so far.`
              : "No notices sent yet. Use the API or upload a recipient CSV via Sprint 9 UI."}
          </CardDescription>
        </CardHeader>
        <CardBody>
          <pre style={{ background: "var(--color-bg-elevated)", padding: 12, borderRadius: 6, fontSize: 12, whiteSpace: "pre-wrap" }}>
{`curl -X POST /api/v1/breaches/${data.id}/notify \\
  -H 'x-tenant-id: ${tenantId}' \\
  -H 'content-type: application/json' \\
  -d '{ "recipients": [{ "email": "customer@example.com" }] }'`}
          </pre>
        </CardBody>
      </Card>
    </div>
  );
}

function ContainmentEditor({
  initial,
  onSave,
}: {
  initial: { step: string; doneAt?: string }[];
  onSave: (steps: { step: string; doneAt?: string }[]) => void;
}) {
  const [steps, setSteps] = React.useState(initial);
  const [draft, setDraft] = React.useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={!!s.doneAt}
            onChange={() => {
              const next = [...steps];
              next[i] = next[i]!.doneAt
                ? { step: next[i]!.step }
                : { step: next[i]!.step, doneAt: new Date().toISOString() };
              setSteps(next);
              onSave(next);
            }}
          />
          <span style={{ flex: 1, textDecoration: s.doneAt ? "line-through" : "none", color: s.doneAt ? "var(--color-text-secondary)" : "var(--color-text)" }}>
            {s.step}
          </span>
          <button
            onClick={() => {
              const next = steps.filter((_, j) => j !== i);
              setSteps(next);
              onSave(next);
            }}
            style={{
              padding: "2px 8px",
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            remove
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Rotated all IAM access keys"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (!draft.trim()) return;
            const next = [...steps, { step: draft.trim() }];
            setSteps(next);
            setDraft("");
            onSave(next);
          }}
        >
          + Add step
        </Button>
      </div>
    </div>
  );
}

function ClockTile({
  label,
  clock,
  filedAt,
  mutedWhenUnfiled,
}: {
  label: string;
  clock: BreachDetail["certInClock"];
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
      <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--color-bg-elevated)", opacity: mutedWhenUnfiled ? 0.5 : 1 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>{label}</div>
        <div style={{ fontSize: 13, marginTop: 4, color: "var(--color-text-secondary)" }}>—</div>
      </div>
    );
  }
  const bg =
    clock.severity === "overdue" || clock.severity === "danger" ? "rgba(239, 68, 68, 0.16)"
    : clock.severity === "warn" ? "rgba(245, 158, 11, 0.12)"
    : "var(--color-bg-elevated)";
  const fg =
    clock.severity === "overdue" || clock.severity === "danger" ? "var(--color-danger)"
    : clock.severity === "warn" ? "var(--color-warning)"
    : "var(--color-text)";
  return (
    <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: bg }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>{label}</div>
      <div style={{ fontSize: 20, marginTop: 4, color: fg, fontWeight: 700 }}>
        {clock.isOverdue ? "OVERDUE" : `${clock.hoursRemaining.toFixed(1)}h left`}
      </div>
    </div>
  );
}

function SectoralTile({ label, dueAt }: { label: string; dueAt: string }) {
  const ms = new Date(dueAt).getTime() - Date.now();
  const hours = ms / (60 * 60 * 1000);
  const overdue = hours < 0;
  return (
    <div
      style={{
        padding: 12,
        borderRadius: "var(--radius-md)",
        background: overdue ? "rgba(239, 68, 68, 0.10)" : "var(--color-bg-elevated)",
      }}
    >
      <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 4, color: overdue ? "var(--color-danger)" : "var(--color-text)" }}>
        {overdue ? "OVERDUE" : `${Math.max(0, hours).toFixed(1)}h`}
      </div>
    </div>
  );
}

function severityTone(s: string): "success" | "warning" | "danger" | "neutral" {
  switch (s) {
    case "low": return "success";
    case "medium": return "warning";
    case "high":
    case "critical": return "danger";
    default: return "neutral";
  }
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
