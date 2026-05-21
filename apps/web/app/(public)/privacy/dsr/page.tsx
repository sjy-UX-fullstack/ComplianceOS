"use client";

/**
 * Sprint 4 Task 4.11 — Public DSR submission form.
 *
 *   /privacy/dsr  → submit a rights request
 *
 * Flow:
 *   1. Pick right type (cards) — or describe in free text and let the AI classify
 *   2. Subject + body + contact (email / mobile / both)
 *   3. Submit → redirect to /privacy/dsr/<token> for status + identity verification
 *
 * Brand chrome comes from the (public) layout. No marketing nav per
 * Master Plan §3.1.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DSR_REQUEST_TYPES,
  REQUEST_TYPE_LABELS,
  REQUEST_TYPE_DESCRIPTIONS,
  type DsrRequestType,
} from "../../../../lib/dsr/core";
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
  Textarea,
  Label,
  FieldGroup,
} from "../../../../components/ui";

const TENANT_ID =
  // In production, resolved from CNAME on the public surface. Stubbed for dev.
  "00000000-0000-0000-0000-000000000000";

export default function DsrSubmissionPage() {
  const router = useRouter();

  const [pickedType, setPickedType] = React.useState<DsrRequestType | "auto">("auto");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [language, setLanguage] = React.useState("en");
  const [nominee, setNominee] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!email && !mobile) {
      setError("We need at least one way to reach you — email or mobile.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/public/dsr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          requestType: pickedType === "auto" ? undefined : pickedType,
          subject,
          bodyMd: body,
          contactEmail: email || undefined,
          contactMobile: mobile || undefined,
          language,
          nominee: pickedType === "nomination" ? nominee : undefined,
        }),
      });
      const json = (await res.json()) as { statusToken?: string; error?: string };
      if (!res.ok || !json.statusToken) {
        setError(json.error ?? "Submission failed.");
        return;
      }
      router.push(`/privacy/dsr/${json.statusToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <Badge tone="primary">DPDP §11–14</Badge>
        <h1
          style={{
            margin: "12px 0 4px",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--color-text)",
          }}
        >
          Submit a data-rights request
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
          We&apos;ll respond within 90 days, as required by Rule 14(3). You can track
          progress with the link we send you.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>What would you like us to do?</CardTitle>
          <CardDescription>Pick one, or leave it on auto and we&apos;ll classify it.</CardDescription>
        </CardHeader>
        <CardBody>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setPickedType("auto")}
              style={typeButtonStyle(pickedType === "auto")}
            >
              <strong>Let AI decide</strong>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                We&apos;ll read your message and pick the closest right.
              </div>
            </button>
            {DSR_REQUEST_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPickedType(t)}
                style={typeButtonStyle(pickedType === t)}
              >
                <strong>{REQUEST_TYPE_LABELS[t]}</strong>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                  {REQUEST_TYPE_DESCRIPTIONS[t]}
                </div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tell us more</CardTitle>
          <CardDescription>
            Please do not include Aadhaar, PAN or bank details in this form — we
            redact them automatically but the safer path is not to share them
            here at all.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <FieldGroup>
            <Label required>Subject</Label>
            <Input
              value={subject}
              required
              maxLength={140}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Please delete my account"
            />
          </FieldGroup>
          <FieldGroup>
            <Label required>What would you like to share?</Label>
            <Textarea
              value={body}
              required
              minLength={20}
              rows={6}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your request in your own words. Mention the email, phone or account ID you used with us."
            />
          </FieldGroup>
          {pickedType === "nomination" && (
            <FieldGroup>
              <Label required>Nominee</Label>
              <Input
                value={nominee}
                onChange={(e) => setNominee(e.target.value)}
                placeholder="Full name + relationship (e.g. Priya — spouse)"
              />
            </FieldGroup>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How can we reach you?</CardTitle>
          <CardDescription>
            We&apos;ll send a one-time code to verify it&apos;s you. Provide email or
            mobile — both is better.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FieldGroup>
            <FieldGroup>
              <Label>Mobile</Label>
              <Input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </FieldGroup>
            <FieldGroup>
              <Label>Preferred language</Label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
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
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="bn">বাংলা</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
                <option value="mr">मराठी</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="gu">ગુજરાતી</option>
              </select>
            </FieldGroup>
          </div>
          {/* Honeypot — bots fill this, humans don't see it */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: -9999, width: 1, height: 1 }}
          />
        </CardBody>
        <CardFooter style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            By submitting you confirm the information is true. False requests
            may be rejected under Rule 14(5).
          </span>
          <Button type="submit" loading={submitting} disabled={!subject || !body}>
            Submit request
          </Button>
        </CardFooter>
        {error ? (
          <p style={{ marginTop: 12, color: "var(--color-danger)", fontSize: 13 }}>{error}</p>
        ) : null}
      </Card>
    </form>
  );
}

function typeButtonStyle(active: boolean): React.CSSProperties {
  return {
    textAlign: "left",
    padding: 12,
    borderRadius: "var(--radius-md)",
    background: active ? "rgba(59, 130, 246, 0.12)" : "var(--color-bg)",
    border: active ? "1px solid var(--color-primary-light)" : "1px solid var(--color-border)",
    color: "var(--color-text)",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}
