import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Badge,
} from "../../../components/ui";

export const metadata = {
  title: "DPO workspace — ComplianceOS",
};

export default function DpoInbox() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <Badge tone="primary">Sprint 3 scaffold</Badge>
        <h1 style={{ margin: "12px 0 4px", fontSize: 28, fontWeight: 800 }}>
          DPO unified inbox
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          One queue for rights requests, breach incidents, retention notices,
          regulator correspondence and government-access flags.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Inbox is empty</CardTitle>
          <CardDescription>
            The unified inbox aggregates events from every active module. It
            populates automatically once DSR (Sprint 4), Breach (Sprint 5) and
            Vendor (Sprint 6) modules land.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--color-text-secondary)", fontSize: 13, lineHeight: 1.8 }}>
            <li>Rule 14(3): 90-day SLA timers on rights requests</li>
            <li>CERT-In 6h + DPB 72h dual-clock breach alerts</li>
            <li>Rule 8 retention pre-deletion notices</li>
            <li>Rule 23 government access register</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
