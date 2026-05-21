import Link from "next/link";
import {
  PLANS_SEED,
  AGENCY_PER_CLIENT_INR,
  type PlanSeed,
} from "@complianceos/db/plans";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  Badge,
  Button,
} from "../../../components/ui";

export const metadata = {
  title: "Pricing — ComplianceOS",
  description: "Transparent INR pricing for India's DPDP compliance OS.",
};

function formatInr(rupees: number): string {
  if (rupees === 0) return "Free";
  return `₹${rupees.toLocaleString("en-IN")}`;
}

function featureList(plan: PlanSeed): { label: string; included: boolean }[] {
  const f = plan.features;
  return [
    { label: "Readiness Assessment (60 questions)", included: f.assessment },
    { label: "Consent Management Platform (banner SDK)", included: f.cmpBanner },
    { label: "Policy & Notice generator", included: f.policyGen },
    { label: "DSR Portal (90-day SLA)", included: f.dsrPortal },
    { label: "Breach Wizard (CERT-In 6h / DPB 72h)", included: f.breachWizard },
    { label: "Vendor Risk Manager + DPA generator", included: f.vendorManager },
    { label: "RoPA with auto-discovery", included: f.ropa },
    { label: "Compliance Training LMS", included: f.lms },
    { label: "White-label + custom domain", included: f.whiteLabel || f.customDomain },
    { label: "SSO (SAML/OIDC)", included: f.ssoSaml },
    { label: "WhatsApp Business + DigiLocker", included: f.whatsappBusiness },
    {
      label:
        f.maxDsrPerMonth === null
          ? "Unlimited DSRs / month"
          : `${f.maxDsrPerMonth.toLocaleString("en-IN")} DSRs / month`,
      included: true,
    },
  ];
}

export default function PricingPage() {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px" }}>
      <header style={{ textAlign: "center", marginBottom: 48 }}>
        <Badge tone="primary">DPDP Act 2023 ready</Badge>
        <h1
          style={{
            margin: "16px 0 8px",
            fontSize: 40,
            fontWeight: 800,
            background:
              "linear-gradient(135deg, var(--color-primary-light), var(--color-accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Honest INR pricing
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 16, maxWidth: 640, margin: "0 auto" }}>
          UPI Autopay, GST-compliant invoices, no per-seat trickery. Cancel at the end of any billing cycle.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {PLANS_SEED.map((plan) => {
          const features = featureList(plan);
          return (
            <Card
              key={plan.code}
              elevated={plan.popular}
              accent={plan.popular ? "primary" : null}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <CardHeader>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CardTitle>{plan.displayName}</CardTitle>
                  {plan.badge ? <Badge tone={plan.popular ? "primary" : "neutral"}>{plan.badge}</Badge> : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardBody style={{ flex: 1 }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "var(--color-text)" }}>
                    {formatInr(plan.monthlyPriceInr)}
                  </span>
                  {plan.monthlyPriceInr > 0 ? (
                    <span style={{ color: "var(--color-text-secondary)", fontSize: 14, marginLeft: 6 }}>
                      / month + 18% GST
                    </span>
                  ) : null}
                  {plan.yearlyPriceInr > 0 && plan.yearlyPriceInr < plan.monthlyPriceInr * 12 ? (
                    <div style={{ fontSize: 12, color: "var(--color-success)", marginTop: 4 }}>
                      Save {formatInr(plan.monthlyPriceInr * 12 - plan.yearlyPriceInr)} annually
                    </div>
                  ) : null}
                  {plan.code === "agency" ? (
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                      + ₹{AGENCY_PER_CLIENT_INR.toLocaleString("en-IN")}/mo per client tenant
                    </div>
                  ) : null}
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {features.map((feat) => (
                    <li
                      key={feat.label}
                      style={{
                        display: "flex",
                        gap: 8,
                        fontSize: 13,
                        color: feat.included ? "var(--color-text)" : "var(--color-text-secondary)",
                        opacity: feat.included ? 1 : 0.5,
                      }}
                    >
                      <span aria-hidden style={{ color: feat.included ? "var(--color-success)" : "var(--color-text-secondary)" }}>
                        {feat.included ? "✓" : "—"}
                      </span>
                      {feat.label}
                    </li>
                  ))}
                </ul>
              </CardBody>

              <CardFooter style={{ borderTop: "none", marginTop: 16, paddingTop: 0 }}>
                {plan.code === "enterprise" ? (
                  <a
                    href="mailto:sales@complianceos.in?subject=Enterprise%20quote"
                    style={{ width: "100%", textDecoration: "none" }}
                  >
                    <Button variant="secondary" size="md" style={{ width: "100%" }}>
                      Contact sales
                    </Button>
                  </a>
                ) : plan.code === "free" ? (
                  <Link href="/app" style={{ width: "100%", textDecoration: "none" }}>
                    <Button variant="secondary" size="md" style={{ width: "100%" }}>
                      Start free
                    </Button>
                  </Link>
                ) : (
                  <Link
                    href={`/onboarding?plan=${plan.code}`}
                    style={{ width: "100%", textDecoration: "none" }}
                  >
                    <Button variant={plan.popular ? "primary" : "secondary"} size="md" style={{ width: "100%" }}>
                      Start {plan.displayName}
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card style={{ textAlign: "center" }}>
        <CardBody>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 13 }}>
            All plans are billed in INR via Razorpay Subscriptions with UPI Autopay or Net Banking mandate.
            18% GST is added on every invoice. SAC 998314.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
