import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Badge,
} from "../../../components/ui";

export const metadata = {
  title: "Agency overview — ComplianceOS",
};

export default function AgencyOverview() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <Badge tone="primary">Sprint 3 scaffold</Badge>
        <h1 style={{ margin: "12px 0 4px", fontSize: 28, fontWeight: 800 }}>
          Agency workspace
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Aggregated compliance posture across every client tenant under your
          partnership. Client list, branding, and per-tenant billing land here.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        <Card accent="primary">
          <CardHeader>
            <CardTitle>0 active clients</CardTitle>
            <CardDescription>Invite clients to start aggregating their posture.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>White-label</CardTitle>
            <CardDescription>
              CNAME + ACM cert provisioning is wired in Sprint 7 (custom domain).
              Theme builder is live now.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>
              Agency tier: ₹19,999/mo + ₹999/mo per active client tenant. Razorpay
              UPI Autopay is live.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardBody>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 13 }}>
            Aggregation views (compliance score across ≥10 client tenants) ship
            with Sprint 8 (Dashboard module). DSR queue triage across clients
            lands with Sprint 4. Mobile companion app: Phase 7A (Sprint 13).
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
