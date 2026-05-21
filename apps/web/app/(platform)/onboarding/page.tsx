"use client";

/**
 * Sprint 3 Task 3.11 — Onboarding wizard with 7 industry start-packs.
 *
 * Flow:
 *   1. Pick industry → preselects RoPA template, sectoral overlays, vendor list
 *   2. Pick plan → calls /api/v1/billing/plans, deep-links to /api/v1/billing/subscriptions
 *   3. Brand basics → writes to tenant_branding (Sprint 4 wiring; UI ready now)
 *   4. Buyer details → goes into the first GST invoice
 *   5. Launch → opens the Razorpay UPI Autopay short_url in a new tab
 *
 * State is local (zustand-free for this small flow). The wizard never blocks
 * on a server save — every step is resumable from URL hash + localStorage.
 */

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  Badge,
  Button,
  Input,
  Label,
  FieldGroup,
} from "../../../components/ui";
import { PLANS_SEED } from "@complianceos/db/plans";

const INDUSTRIES = [
  {
    code: "ecom",
    name: "E-commerce / D2C",
    description: "Cart, checkout, repeat purchase analytics. Heavy on cookies & vendor pixels.",
    icon: "🛒",
    sectoralOverlays: ["GST e-invoice", "Marketing consent"],
    sensitivities: ["payment", "address", "phone"],
  },
  {
    code: "fintech",
    name: "Fintech / Lending",
    description: "RBI 2h/6h breach window, KYC, credit decisioning. Highest blast radius.",
    icon: "💳",
    sectoralOverlays: ["RBI 2h breach", "KYC retention", "Cross-border"],
    sensitivities: ["pan", "aadhaar", "bank_account", "credit_score"],
  },
  {
    code: "edtech",
    name: "Edtech",
    description: "Children's data, parental consent, video-based engagement.",
    icon: "🎓",
    sectoralOverlays: ["Child consent", "Tracking restriction"],
    sensitivities: ["minor_data", "behavioural"],
  },
  {
    code: "healthtech",
    name: "Healthtech",
    description: "Medical records, Ayushman linkages, telemedicine consent.",
    icon: "🏥",
    sectoralOverlays: ["Health data", "Sensitive category"],
    sensitivities: ["medical_records", "lab_reports", "prescriptions"],
  },
  {
    code: "gaming",
    name: "Gaming / Real-money",
    description: "Age-gate, KYC, addictive-pattern guardrails, IRDAI overlap.",
    icon: "🎮",
    sectoralOverlays: ["Age verification", "Responsible gaming"],
    sensitivities: ["minor_data", "payment", "geolocation"],
  },
  {
    code: "saas",
    name: "SaaS / B2B",
    description: "Workspace data, sub-processor transparency, DPA-heavy.",
    icon: "💼",
    sectoralOverlays: ["Sub-processor register", "Cross-border"],
    sensitivities: ["customer_data", "logs"],
  },
  {
    code: "logistics",
    name: "Logistics / Mobility",
    description: "Live location, delivery contacts, partner onboarding.",
    icon: "🚚",
    sectoralOverlays: ["Geolocation", "Driver KYC"],
    sensitivities: ["geolocation", "phone", "vehicle"],
  },
];

const GST_STATES: { code: string; name: string }[] = [
  { code: "29", name: "Karnataka" },
  { code: "27", name: "Maharashtra" },
  { code: "07", name: "Delhi" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "06", name: "Haryana" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "32", name: "Kerala" },
  { code: "24", name: "Gujarat" },
  { code: "19", name: "West Bengal" },
];

interface WizardState {
  industry: string;
  planCode: string;
  billingCycle: "monthly" | "yearly";
  brand: { name: string; primaryColor: string };
  buyer: {
    legalName: string;
    gstin: string;
    pan: string;
    stateCode: string;
    address: string;
    email: string;
    contact: string;
  };
}

const STORAGE_KEY = "cos:onboarding:v1";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 48, color: "var(--color-text-secondary)" }}>
          Loading onboarding…
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}

function OnboardingWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const initialPlan = params.get("plan") ?? "growth";

  const [step, setStep] = React.useState(0);
  const [state, setState] = React.useState<WizardState>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as WizardState;
      } catch {
        // ignore
      }
    }
    return {
      industry: "saas",
      planCode: initialPlan,
      billingCycle: "monthly",
      brand: { name: "", primaryColor: "#3b82f6" },
      buyer: {
        legalName: "",
        gstin: "",
        pan: "",
        stateCode: "29",
        address: "",
        email: "",
        contact: "",
      },
    };
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const steps = ["Industry", "Plan", "Brand", "Buyer", "Launch"];

  async function handleLaunch() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/billing/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: state.planCode,
          billingCycle: state.billingCycle,
          tenantId: "onboarding-" + Date.now(),
          customerEmail: state.buyer.email,
          customerContact: state.buyer.contact,
          customerName: state.buyer.legalName,
        }),
      });
      const json = (await res.json()) as { authLinkUrl?: string; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to start subscription.");
        return;
      }
      if (json.authLinkUrl) {
        window.open(json.authLinkUrl, "_blank", "noopener,noreferrer");
        router.push("/app");
        return;
      }
      setError("Razorpay did not return a mandate URL.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  const plan = PLANS_SEED.find((p) => p.code === state.planCode);
  const selectedIndustry = INDUSTRIES.find((i) => i.code === state.industry);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <header style={{ marginBottom: 32 }}>
        <Badge tone="primary">Onboarding</Badge>
        <h1 style={{ margin: "12px 0 4px", fontSize: 28, fontWeight: 800 }}>
          Let&apos;s get you DPDP-ready in 5 steps
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Step {step + 1} of {steps.length}: {steps[step]}
        </p>
        <div
          style={{
            marginTop: 12,
            height: 4,
            borderRadius: 2,
            background: "var(--color-bg-elevated)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${((step + 1) / steps.length) * 100}%`,
              height: "100%",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </header>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pick your industry</CardTitle>
            <CardDescription>
              We preload RoPA templates, sectoral overlays and a starter vendor
              list based on your pick. You can change this later.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.code}
                  onClick={() => setState({ ...state, industry: ind.code })}
                  style={{
                    textAlign: "left",
                    padding: 16,
                    borderRadius: "var(--radius-md)",
                    background:
                      state.industry === ind.code
                        ? "rgba(59, 130, 246, 0.12)"
                        : "var(--color-bg)",
                    border:
                      state.industry === ind.code
                        ? "1px solid var(--color-primary-light)"
                        : "1px solid var(--color-border)",
                    cursor: "pointer",
                    color: "var(--color-text)",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }} aria-hidden>
                    {ind.icon}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{ind.name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {ind.description}
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
          <CardFooter style={{ justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
              Overlays: {selectedIndustry?.sectoralOverlays.join(", ")}
            </span>
            <Button onClick={() => setStep(1)}>Continue →</Button>
          </CardFooter>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Pick your plan</CardTitle>
            <CardDescription>
              You can upgrade or downgrade at the end of any billing cycle.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PLANS_SEED.filter((p) => p.code !== "free" && p.code !== "enterprise").map((p) => (
                <button
                  key={p.code}
                  onClick={() => setState({ ...state, planCode: p.code })}
                  style={{
                    textAlign: "left",
                    padding: 16,
                    borderRadius: "var(--radius-md)",
                    background:
                      state.planCode === p.code ? "rgba(59, 130, 246, 0.12)" : "var(--color-bg)",
                    border:
                      state.planCode === p.code
                        ? "1px solid var(--color-primary-light)"
                        : "1px solid var(--color-border)",
                    cursor: "pointer",
                    color: "var(--color-text)",
                    fontFamily: "inherit",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.displayName}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {p.description}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      ₹{(state.billingCycle === "yearly" ? p.yearlyPriceInr : p.monthlyPriceInr).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                      + 18% GST · {state.billingCycle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <Button
                variant={state.billingCycle === "monthly" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setState({ ...state, billingCycle: "monthly" })}
              >
                Monthly
              </Button>
              <Button
                variant={state.billingCycle === "yearly" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setState({ ...state, billingCycle: "yearly" })}
              >
                Yearly (2 months free)
              </Button>
            </div>
          </CardBody>
          <CardFooter style={{ justifyContent: "space-between" }}>
            <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
            <Button onClick={() => setStep(2)}>Continue →</Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Brand basics</CardTitle>
            <CardDescription>
              We stamp this on your DSR portal, banner SDK and printed notices.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <FieldGroup>
              <Label required>Business display name</Label>
              <Input
                value={state.brand.name}
                onChange={(e) => setState({ ...state, brand: { ...state.brand, name: e.target.value } })}
                placeholder="Acme D2C Private Limited"
              />
            </FieldGroup>
            <FieldGroup>
              <Label>Brand primary colour</Label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="color"
                  value={state.brand.primaryColor}
                  onChange={(e) =>
                    setState({ ...state, brand: { ...state.brand, primaryColor: e.target.value } })
                  }
                  style={{ width: 48, height: 36, border: "none", borderRadius: 6, background: "transparent" }}
                />
                <code style={{ color: "var(--color-text-secondary)" }}>{state.brand.primaryColor}</code>
              </div>
            </FieldGroup>
          </CardBody>
          <CardFooter style={{ justifyContent: "space-between" }}>
            <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={() => setStep(3)} disabled={!state.brand.name}>
              Continue →
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing details</CardTitle>
            <CardDescription>
              Required for GST-compliant invoices (Rule 46, CGST Rules 2017).
            </CardDescription>
          </CardHeader>
          <CardBody>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FieldGroup>
                <Label required>Legal entity name</Label>
                <Input
                  value={state.buyer.legalName}
                  onChange={(e) => setState({ ...state, buyer: { ...state.buyer, legalName: e.target.value } })}
                />
              </FieldGroup>
              <FieldGroup>
                <Label>GSTIN</Label>
                <Input
                  value={state.buyer.gstin}
                  placeholder="29ABCDE1234F1Z5"
                  onChange={(e) => setState({ ...state, buyer: { ...state.buyer, gstin: e.target.value.toUpperCase() } })}
                />
              </FieldGroup>
              <FieldGroup>
                <Label>PAN</Label>
                <Input
                  value={state.buyer.pan}
                  placeholder="ABCDE1234F"
                  onChange={(e) => setState({ ...state, buyer: { ...state.buyer, pan: e.target.value.toUpperCase() } })}
                />
              </FieldGroup>
              <FieldGroup>
                <Label required>State (place of supply)</Label>
                <select
                  value={state.buyer.stateCode}
                  onChange={(e) => setState({ ...state, buyer: { ...state.buyer, stateCode: e.target.value } })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontSize: 14,
                    fontFamily: "inherit",
                  }}
                >
                  {GST_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup style={{ gridColumn: "1 / -1" }}>
                <Label required>Registered address</Label>
                <Input
                  value={state.buyer.address}
                  onChange={(e) => setState({ ...state, buyer: { ...state.buyer, address: e.target.value } })}
                />
              </FieldGroup>
              <FieldGroup>
                <Label required>Billing email</Label>
                <Input
                  type="email"
                  value={state.buyer.email}
                  onChange={(e) => setState({ ...state, buyer: { ...state.buyer, email: e.target.value } })}
                />
              </FieldGroup>
              <FieldGroup>
                <Label required>Contact (for UPI mandate)</Label>
                <Input
                  type="tel"
                  value={state.buyer.contact}
                  placeholder="+91 98765 43210"
                  onChange={(e) => setState({ ...state, buyer: { ...state.buyer, contact: e.target.value } })}
                />
              </FieldGroup>
            </div>
          </CardBody>
          <CardFooter style={{ justifyContent: "space-between" }}>
            <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!state.buyer.legalName || !state.buyer.email || !state.buyer.contact || !state.buyer.address}
            >
              Review →
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review &amp; launch</CardTitle>
            <CardDescription>
              On confirm we&apos;ll open Razorpay so you can approve the UPI Autopay
              mandate. ComplianceOS will only debit on the agreed cycle.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <dl style={{ display: "grid", gridTemplateColumns: "150px 1fr", rowGap: 8, columnGap: 16, fontSize: 14 }}>
              <dt style={{ color: "var(--color-text-secondary)" }}>Industry</dt>
              <dd style={{ margin: 0 }}>{selectedIndustry?.name}</dd>
              <dt style={{ color: "var(--color-text-secondary)" }}>Plan</dt>
              <dd style={{ margin: 0 }}>
                {plan?.displayName} ({state.billingCycle}) — ₹
                {(state.billingCycle === "yearly" ? plan?.yearlyPriceInr : plan?.monthlyPriceInr)?.toLocaleString("en-IN")}
              </dd>
              <dt style={{ color: "var(--color-text-secondary)" }}>Business</dt>
              <dd style={{ margin: 0 }}>{state.buyer.legalName}</dd>
              <dt style={{ color: "var(--color-text-secondary)" }}>GSTIN</dt>
              <dd style={{ margin: 0 }}>{state.buyer.gstin || "—"}</dd>
              <dt style={{ color: "var(--color-text-secondary)" }}>State</dt>
              <dd style={{ margin: 0 }}>{state.buyer.stateCode}</dd>
              <dt style={{ color: "var(--color-text-secondary)" }}>Contact</dt>
              <dd style={{ margin: 0 }}>{state.buyer.contact}</dd>
            </dl>
            {error ? (
              <p style={{ marginTop: 16, color: "var(--color-danger)", fontSize: 13 }}>{error}</p>
            ) : null}
          </CardBody>
          <CardFooter style={{ justifyContent: "space-between" }}>
            <Button variant="ghost" onClick={() => setStep(3)} disabled={submitting}>
              ← Back
            </Button>
            <Button onClick={handleLaunch} loading={submitting}>
              Approve UPI mandate →
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
