/**
 * ComplianceOS — Breach notifications (Sprint 5 Task 5.6)
 *
 * Three channels per affected data principal:
 *   - email (SES)
 *   - WhatsApp Business template
 *   - in-app banner (via tenant-scoped event)
 *
 * Until the BullMQ queues land (Sprint 9), payloads are logged structured
 * and counted on the breach record.
 */

import type { BreachRecord } from "./store";
import { buildPrincipalNoticeText } from "./reports";

export interface BreachNotifyPayload {
  template:
    | "breach_principal_notice"
    | "breach_regulator_alert"
    | "breach_team_alert";
  tenantId: string;
  breachId: string;
  refNo: string;
  audience: "principals" | "team" | "regulator";
  channels: { via: "email" | "whatsapp" | "sms" | "slack"; to: string }[];
  variables: Record<string, string>;
}

export async function notifyBreach(payload: BreachNotifyPayload): Promise<void> {
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.info("[breach-notify]", JSON.stringify(payload));
  }
}

export function buildPrincipalNotifyPayload(
  breach: BreachRecord,
  recipients: { email?: string; mobile?: string }[],
): BreachNotifyPayload {
  const channels = recipients.flatMap((r) => {
    const out: BreachNotifyPayload["channels"] = [];
    if (r.email) out.push({ via: "email", to: r.email });
    if (r.mobile) out.push({ via: "whatsapp", to: r.mobile });
    return out;
  });
  return {
    template: "breach_principal_notice",
    tenantId: breach.tenantId,
    breachId: breach.id,
    refNo: breach.refNo,
    audience: "principals",
    channels,
    variables: {
      noticeText: buildPrincipalNoticeText(breach),
      refNo: breach.refNo,
      severity: breach.severity,
      category: breach.category,
    },
  };
}

export function buildTeamAlert(breach: BreachRecord): BreachNotifyPayload {
  return {
    template: "breach_team_alert",
    tenantId: breach.tenantId,
    breachId: breach.id,
    refNo: breach.refNo,
    audience: "team",
    channels: [
      { via: "email", to: "dpo@" + (process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() ?? "complianceos") + ".in" },
      { via: "slack", to: "#incidents" },
    ],
    variables: {
      refNo: breach.refNo,
      severity: breach.severity,
      certInDueAt: breach.certInDueAt ?? "",
      dpbDueAt: breach.dpbDueAt ?? "",
    },
  };
}
