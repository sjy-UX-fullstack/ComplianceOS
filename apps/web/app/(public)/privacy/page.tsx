"use client";

/**
 * Sprint 3 Task 3.9 — Preference Centre at /privacy
 *
 * Per Master Plan §2.2:
 *   - Purpose toggles (one per consent purpose)
 *   - One-click withdrawal that updates `consents` and writes
 *     a fresh hash-chained entry to `consent_logs`
 *   - Same brand chrome as DSR portal (no marketing nav)
 *
 * Currently the Banner SDK stores consents in localStorage with key
 * `cos:consent:v1`. This page reads/writes the same key + POSTs
 * withdrawals to /api/v1/public/consent so the server-side hash chain
 * stays in sync.
 *
 * rule_ref: DPDP Act 2023 §6(4) — withdrawal must be as easy as giving consent.
 */

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Badge,
  Button,
} from "../../../components/ui";

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  updatedAt: string;
}

const DEFAULT_STATE: ConsentState = {
  necessary: true, // always-on
  analytics: false,
  marketing: false,
  personalization: false,
  updatedAt: new Date(0).toISOString(),
};

const STORAGE_KEY = "cos:consent:v1";

const PURPOSES: {
  key: keyof Omit<ConsentState, "updatedAt">;
  label: string;
  description: string;
  required?: boolean;
}[] = [
  {
    key: "necessary",
    label: "Strictly necessary",
    description:
      "Session, security, fraud-prevention, and load-balancing cookies. Cannot be disabled.",
    required: true,
  },
  {
    key: "analytics",
    label: "Analytics",
    description:
      "Helps us understand which pages and features are used. Aggregate only — no individual tracking.",
  },
  {
    key: "marketing",
    label: "Marketing",
    description:
      "Used to show relevant ads on partner sites and measure campaign performance.",
  },
  {
    key: "personalization",
    label: "Personalization",
    description:
      "Remembers your preferences and tailors content to your interests.",
  },
];

export default function PreferenceCentre() {
  const [state, setState] = React.useState<ConsentState>(DEFAULT_STATE);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as ConsentState) });
    } catch {
      // localStorage unavailable — keep defaults
    }
  }, []);

  function toggle(key: keyof Omit<ConsentState, "updatedAt">) {
    if (key === "necessary") return;
    setState((s) => ({ ...s, [key]: !s[key] }));
  }

  async function save(purposes: Partial<ConsentState>) {
    setSaving(true);
    const next: ConsentState = {
      ...state,
      ...purposes,
      necessary: true,
      updatedAt: new Date().toISOString(),
    };
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    try {
      await fetch("/api/v1/public/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "preference_centre",
          purposes: next,
          version: 1,
        }),
      });
    } catch {
      // best-effort; UI still updates from local state
    }
    setSavedAt(new Date());
    setSaving(false);
  }

  async function withdrawAll() {
    await save({ analytics: false, marketing: false, personalization: false });
  }

  async function acceptAll() {
    await save({ analytics: true, marketing: true, personalization: true });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <Badge tone="primary">DPDP §6(4)</Badge>
        <h1
          style={{
            margin: "12px 0 4px",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--color-text)",
          }}
        >
          Your privacy preferences
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
          You can change these any time. Withdrawal is logged with the same audit
          chain as your original consent.
        </p>
      </header>

      <Card>
        <CardBody style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="primary" onClick={acceptAll} disabled={saving}>
            Accept all
          </Button>
          <Button variant="secondary" onClick={withdrawAll} disabled={saving}>
            Withdraw all
          </Button>
          {savedAt ? (
            <span style={{ alignSelf: "center", color: "var(--color-success)", fontSize: 13 }}>
              Saved at {savedAt.toLocaleTimeString("en-IN")}
            </span>
          ) : null}
        </CardBody>
      </Card>

      {PURPOSES.map((p) => (
        <Card key={p.key}>
          <CardHeader style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <CardTitle>
                {p.label}
                {p.required ? <Badge tone="neutral" style={{ marginLeft: 8 }}>Required</Badge> : null}
              </CardTitle>
              <CardDescription>{p.description}</CardDescription>
            </div>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: p.required ? "not-allowed" : "pointer",
                opacity: p.required ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={state[p.key]}
                disabled={p.required || saving}
                onChange={() => {
                  toggle(p.key);
                  save({ [p.key]: !state[p.key] });
                }}
                style={{ width: 18, height: 18, accentColor: "var(--color-primary-light)" }}
              />
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                {state[p.key] ? "Allowed" : "Blocked"}
              </span>
            </label>
          </CardHeader>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Exercise your data rights</CardTitle>
          <CardDescription>
            Under DPDP §11–14 you may access, correct, erase, or nominate. Requests
            are answered within 90 days (Rule 14(3)).
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Link href="/privacy/dsr" style={{ textDecoration: "none" }}>
            <Button variant="secondary">Submit a data-rights request →</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
