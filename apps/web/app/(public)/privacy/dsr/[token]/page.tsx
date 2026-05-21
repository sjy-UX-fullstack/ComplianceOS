"use client";

/**
 * Sprint 4 Task 4.3 + 4.4 — Public DSR status + identity verification.
 *
 *   /privacy/dsr/[token]
 *
 * Single page that:
 *   - Polls status every 15s
 *   - Lets the requester verify via email OTP, mobile OTP, or DigiLocker
 *   - Surfaces the SLA chip (T-30/T-10/T-1/Overdue)
 *
 * The token is the only credential — anyone with the link can see the
 * status. Identity-verified state is required before we release access
 * exports / nominee bindings (enforced server-side on PATCH).
 */

import * as React from "react";
import { useParams } from "next/navigation";
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
} from "../../../../../components/ui";

interface StatusResponse {
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
  language: string;
  closedAt: string | null;
  verification: {
    emailPending: boolean;
    mobilePending: boolean;
    digilockerPending: boolean;
  };
}

export default function DsrStatusPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [data, setData] = React.useState<StatusResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [otpChannel, setOtpChannel] = React.useState<"email" | "mobile" | null>(null);
  const [otpValue, setOtpValue] = React.useState("");
  const [otpSentAt, setOtpSentAt] = React.useState<Date | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [info, setInfo] = React.useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/public/dsr/${token}/status`);
      if (!res.ok) {
        setError("This link is no longer valid or has expired.");
        return;
      }
      const json = (await res.json()) as StatusResponse;
      setData(json);
      setError(null);
    } catch {
      setError("Couldn't reach the server. Try again in a moment.");
    }
  }, [token]);

  React.useEffect(() => {
    void fetchStatus();
    const id = window.setInterval(fetchStatus, 15_000);
    return () => window.clearInterval(id);
  }, [fetchStatus]);

  async function requestOtp(channel: "email" | "mobile") {
    if (!token) return;
    setBusy(true);
    setInfo(null);
    setError(null);
    try {
      const res = await fetch(`/api/v1/public/dsr/${token}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const json = (await res.json()) as { error?: string; expiresAt?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not send OTP.");
        return;
      }
      setOtpChannel(channel);
      setOtpSentAt(new Date());
      setInfo(
        channel === "email"
          ? "OTP sent to your email. It expires in 10 minutes."
          : "OTP sent to your mobile via WhatsApp. It expires in 10 minutes.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!token || !otpChannel) return;
    setBusy(true);
    setInfo(null);
    setError(null);
    try {
      const res = await fetch(`/api/v1/public/dsr/${token}/otp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: otpChannel, otp: otpValue }),
      });
      const json = (await res.json()) as { error?: string; verified?: boolean };
      if (!res.ok) {
        setError(json.error ?? "Verification failed.");
        return;
      }
      setInfo("Identity verified. We'll start processing your request.");
      setOtpChannel(null);
      setOtpValue("");
      await fetchStatus();
    } finally {
      setBusy(false);
    }
  }

  async function startDigiLocker() {
    if (!token) return;
    setBusy(true);
    setInfo(null);
    setError(null);
    try {
      const res = await fetch(`/api/v1/public/dsr/${token}/digilocker`, {
        method: "POST",
      });
      const json = (await res.json()) as { redirectUrl?: string; error?: string; stub?: boolean };
      if (!res.ok || !json.redirectUrl) {
        setError(json.error ?? "Could not start DigiLocker flow.");
        return;
      }
      if (json.stub) {
        // Dev stub: auto-finalise
        const fin = await fetch(`/api/v1/public/dsr/${token}/digilocker`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stub: true }),
        });
        const finJson = (await fin.json()) as { aadhaarLast4?: string; error?: string };
        if (!fin.ok) {
          setError(finJson.error ?? "DigiLocker verification failed.");
          return;
        }
        setInfo(
          `Identity verified via DigiLocker (Aadhaar ending ${finJson.aadhaarLast4 ?? "—"}).`,
        );
        await fetchStatus();
      } else {
        window.location.href = json.redirectUrl;
      }
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <Card accent="danger">
        <CardBody>
          <p>{error}</p>
        </CardBody>
      </Card>
    );
  }
  if (!data) {
    return (
      <Card>
        <CardBody>Loading your request…</CardBody>
      </Card>
    );
  }

  const slaTone =
    data.sla.severity === "overdue" ? "danger"
    : data.sla.severity === "danger" ? "danger"
    : data.sla.severity === "warn" ? "warning"
    : "success";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <Badge tone={slaTone}>{data.sla.isOverdue ? "OVERDUE" : `${data.sla.daysRemaining} days remaining`}</Badge>
        <h1 style={{ margin: "12px 0 4px", fontSize: 24, fontWeight: 800, color: "var(--color-text)" }}>
          {data.subject ?? data.requestTypeLabel}
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
          <strong>{data.statusLabel}</strong> · {data.requestTypeLabel} · submitted{" "}
          {new Date(data.createdAt).toLocaleString("en-IN")}
        </p>
      </header>

      {!data.identityVerified && (
        <Card accent="warning">
          <CardHeader>
            <CardTitle>Verify it&apos;s you</CardTitle>
            <CardDescription>
              Before we share account data or delete it, we need to confirm
              you&apos;re the right person. Pick any method below.
            </CardDescription>
          </CardHeader>
          <CardBody>
            {info ? <p style={{ color: "var(--color-success)", fontSize: 13 }}>{info}</p> : null}
            {error ? <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p> : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.verification.emailPending && (
                <Button
                  variant={otpChannel === "email" ? "primary" : "secondary"}
                  onClick={() => requestOtp("email")}
                  disabled={busy}
                >
                  Send email OTP
                </Button>
              )}
              {data.verification.mobilePending && (
                <Button
                  variant={otpChannel === "mobile" ? "primary" : "secondary"}
                  onClick={() => requestOtp("mobile")}
                  disabled={busy}
                >
                  Send WhatsApp OTP
                </Button>
              )}
              {data.verification.digilockerPending && (
                <Button variant="secondary" onClick={startDigiLocker} disabled={busy}>
                  Verify with DigiLocker
                </Button>
              )}
            </div>

            {otpChannel ? (
              <FieldGroup style={{ marginTop: 16 }}>
                <Label required>Enter 6-digit code from your {otpChannel === "email" ? "email" : "WhatsApp"}</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                  />
                  <Button onClick={verifyOtp} disabled={busy || otpValue.length !== 6}>
                    Verify
                  </Button>
                </div>
                {otpSentAt ? (
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                    Sent {otpSentAt.toLocaleTimeString("en-IN")}
                  </span>
                ) : null}
              </FieldGroup>
            ) : null}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>SLA: 90 days from submission (Rule 14(3))</CardDescription>
        </CardHeader>
        <CardBody>
          <dl style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 8, columnGap: 16, fontSize: 14 }}>
            <dt style={{ color: "var(--color-text-secondary)" }}>Submitted</dt>
            <dd style={{ margin: 0 }}>{new Date(data.createdAt).toLocaleString("en-IN")}</dd>
            <dt style={{ color: "var(--color-text-secondary)" }}>Identity</dt>
            <dd style={{ margin: 0 }}>
              {data.identityVerified ? (
                <Badge tone="success">Verified</Badge>
              ) : (
                <Badge tone="warning">Pending</Badge>
              )}
            </dd>
            <dt style={{ color: "var(--color-text-secondary)" }}>Status</dt>
            <dd style={{ margin: 0 }}>{data.statusLabel}</dd>
            <dt style={{ color: "var(--color-text-secondary)" }}>SLA due</dt>
            <dd style={{ margin: 0 }}>{new Date(data.slaDueAt).toLocaleString("en-IN")}</dd>
            {data.closedAt ? (
              <>
                <dt style={{ color: "var(--color-text-secondary)" }}>Closed</dt>
                <dd style={{ margin: 0 }}>{new Date(data.closedAt).toLocaleString("en-IN")}</dd>
              </>
            ) : null}
          </dl>
        </CardBody>
        <CardFooter>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
            Bookmark this page or save the link from your email to come back later.
            Status refreshes every 15 seconds.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
