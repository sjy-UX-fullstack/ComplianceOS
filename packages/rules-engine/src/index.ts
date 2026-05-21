/**
 * ComplianceOS — DPDP Rules Engine
 * Encodes DPDP Act 2023 rules as executable logic.
 * Used by Assessment, Breach Wizard, Retention, and Compliance Score modules.
 */

import { DPDP_RULES, BREACH_TIMERS, DSR_SLA } from "@complianceos/config";

export { DPDP_RULES, BREACH_TIMERS, DSR_SLA };

/**
 * Calculate breach report deadlines from detection time.
 */
export function calculateBreachDeadlines(detectedAt: Date) {
  const certInDue = new Date(detectedAt.getTime() + BREACH_TIMERS.CERT_IN_HOURS * 60 * 60 * 1000);
  const dpbDue = new Date(detectedAt.getTime() + BREACH_TIMERS.DPB_HOURS * 60 * 60 * 1000);

  return {
    certInDue,
    dpbDue,
    certInRemainingMs: Math.max(0, certInDue.getTime() - Date.now()),
    dpbRemainingMs: Math.max(0, dpbDue.getTime() - Date.now()),
  };
}

/**
 * Calculate DSR SLA deadline from request creation.
 */
export function calculateDsrSla(createdAt: Date) {
  const dueAt = new Date(createdAt.getTime() + DSR_SLA.DAYS * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((dueAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return {
    dueAt,
    daysRemaining,
    isOverdue: daysRemaining < 0,
    alertLevel: daysRemaining <= 1 ? "critical" : daysRemaining <= 10 ? "warning" : daysRemaining <= 30 ? "info" : "none",
  };
}

// ─── SPRINT 1: READINESS ASSESSMENT SCORING & PLAN GENERATION ──────────────

export interface AssessmentResponseInput {
  questionCode: string;
  category: string;
  selectedOptionCode: string;
  weight: number; // weight of the selected option, from 0.0 to 1.0
  ruleRefs: string[];
}

export interface CategoryScore {
  score: number; // 0 to 100
  totalQuestions: number;
  completedQuestions: number;
  status: "compliant" | "warning" | "non_compliant";
}

export interface GapRecord {
  questionCode: string;
  category: string;
  selectedOptionCode: string;
  weight: number;
  ruleRefs: string[];
  severity: "high" | "medium" | "low";
  remediation: string;
}

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  timeframe: "Days 1-30" | "Days 31-60" | "Days 61-90";
  category: string;
  ruleRefs: string[];
  actionRequired: string;
}

export interface ScoreReport {
  overallScore: number; // 0 to 100
  categories: Record<string, CategoryScore>;
  gaps: GapRecord[];
  plan: PlanTask[];
}

// Remediation and task actions database
const REMEDIATION_MAP: Record<string, { remediation: string; title: string; action: string }> = {
  consent_notice_present: {
    title: "Implement Rule 3 Privacy Notice",
    remediation: "Serves notices detailing data elements, processing purposes, and exercise of rights prior to or at time of collection.",
    action: "Deploy DPDP-compliant privacy notice modals across all web/mobile registration forms using our Policy Generator template.",
  },
  consent_language_choices: {
    title: "Translate notices to Scheduled Languages",
    remediation: "Translate notices and consent banners into local scheduled languages (up to 22 per Section 5(3)).",
    action: "Integrate Bhashini Translation API and present multilingual toggle in consent manager overlay.",
  },
  consent_withdrawal_ease: {
    title: "Deploy One-Click Consent Withdrawal",
    remediation: "Ensure the withdrawal mechanism is as easy as giving consent (Section 6(4)).",
    action: "Embed a direct 'Withdraw Consent' widget in the user preference center dashboard.",
  },
  dsr_portal_provided: {
    title: "Deploy Data Principal Rights Portal",
    remediation: "Provide digital portal for access, correction, erasure, and grievance redressal.",
    action: "Deploy the ComplianceOS DSR public portal and link it in the privacy policy footer.",
  },
  dsr_sla_compliance: {
    title: "Automate DSR SLA Queue Tracking",
    remediation: "Enforce the statutory timeline (90-day SLA per Rule 14(3)).",
    action: "Configure BullMQ SLA alarms for incoming DSR queue at T-30, T-10, and T-1 days.",
  },
  breach_notification_system: {
    title: "Implement Breach Response Playbook",
    remediation: "Deploy dual-clock incident alerting (6h CERT-In / 72h DPB reporting).",
    action: "Configure the breach wizard and establish an automated evidence lock bucket in S3.",
  },
  breach_rbi_overlay: {
    title: "Enable RBI 6h Breach Escalation",
    remediation: "RBI mandates cybersecurity incident reporting within 6 hours of detection.",
    action: "Establish automated webhooks to alert DPO immediately if a financial data asset is compromised.",
  },
  vendor_dpa_execution: {
    title: "Execute standard DPDP DPAs",
    remediation: "Employ data processors only under a valid, legally-binding contract (Section 8(2)).",
    action: "Generate and sign DPDP-compliant DPAs with all third-party vendors and cloud services.",
  },
  security_safeguards: {
    title: "Apply Security Encryption and MFA",
    remediation: "Deploy reasonable security safeguards to prevent data breach (Section 8(5)).",
    action: "Enforce TLS 1.3, DB encryption-at-rest, and active MFA for all internal administration systems.",
  },
  ropa_records_maintained: {
    title: "Scaffold Processing Registry (RoPA)",
    remediation: "Maintain registers of processing activities outlining data elements, sources, and flows.",
    action: "Complete initial data inventory mapping in the RoPA module to trace all data lifecycles.",
  },
  ropa_cross_border_mapping: {
    title: "Map Cross-border Data Restrictions",
    remediation: "Check international data flows against DPDP prohibited negative lists.",
    action: "Document all server/cloud storage regions and flag transfers terminating in blocked countries.",
  },
  lms_staff_training: {
    title: "Launch Employee DPDP LMS training",
    remediation: "Train employees and contractors handling user data on privacy compliance obligations.",
    action: "Enforce complete completion of the ComplianceOS baseline DPDP awareness training for all staff.",
  },
  children_data_parental_consent: {
    title: "Integrate Verifiable Parental Consent",
    remediation: "Section 9 mandates parental consent for processing minor's data.",
    action: "Implement age verification checkpoint using DigiLocker age-token or parent email/mobile OTP.",
  },
  children_data_tracking_ban: {
    title: "Deactivate tracking pixels on Minors",
    remediation: "Disable behavioral profiling, tracking, or targeted advertising to children under 18.",
    action: "Enforce runtime switch to suppress meta/google/amplitude tracker scripts for users under 18.",
  },
};

export function calculateReadinessScore(responses: AssessmentResponseInput[]): ScoreReport {
  const categories: Record<string, { totalWeight: number; maxWeight: number; count: number }> = {};
  const gaps: GapRecord[] = [];
  const plan: PlanTask[] = [];

  // Group and count responses by category
  for (const resp of responses) {
    if (!categories[resp.category]) {
      categories[resp.category] = { totalWeight: 0, maxWeight: 0, count: 0 };
    }
    const cat = categories[resp.category]!;
    cat.totalWeight += resp.weight;
    cat.maxWeight += 1.0;
    cat.count += 1;


    // Identify gaps (anything with weight < 1.0)
    if (resp.weight < 1.0) {
      const severity = resp.weight <= 0.3 ? "high" : resp.weight <= 0.6 ? "medium" : "low";
      const remInfo = REMEDIATION_MAP[resp.questionCode] || {
        title: `Remediate ${resp.questionCode}`,
        remediation: `Review and resolve compliance gaps for ${resp.questionCode}.`,
        action: `Audit current practices for ${resp.questionCode} against ${resp.ruleRefs.join(", ")}.`,
      };

      gaps.push({
        questionCode: resp.questionCode,
        category: resp.category,
        selectedOptionCode: resp.selectedOptionCode,
        weight: resp.weight,
        ruleRefs: resp.ruleRefs,
        severity,
        remediation: remInfo.remediation,
      });

      // Map to 90-day plan task based on severity/urgency
      let timeframe: "Days 1-30" | "Days 31-60" | "Days 61-90" = "Days 61-90";
      if (severity === "high" || resp.category === "breach" || resp.category === "consent") {
        timeframe = "Days 1-30"; // Priority items
      } else if (severity === "medium" || resp.category === "dsr" || resp.category === "vendor") {
        timeframe = "Days 31-60"; // Mid-tier items
      }

      plan.push({
        id: `task_${resp.questionCode}`,
        title: remInfo.title,
        description: remInfo.remediation,
        timeframe,
        category: resp.category,
        ruleRefs: resp.ruleRefs,
        actionRequired: remInfo.action,
      });
    }
  }

  // Calculate final category metrics
  const categoryScores: Record<string, CategoryScore> = {};
  let globalTotalWeight = 0;
  let globalMaxWeight = 0;

  for (const [catName, data] of Object.entries(categories)) {
    const scoreVal = data.maxWeight > 0 ? Math.round((data.totalWeight / data.maxWeight) * 100) : 0;
    
    let status: "compliant" | "warning" | "non_compliant" = "compliant";
    if (scoreVal < 50) {
      status = "non_compliant";
    } else if (scoreVal < 80) {
      status = "warning";
    }

    categoryScores[catName] = {
      score: scoreVal,
      totalQuestions: data.count,
      completedQuestions: data.count, // for simple calculations
      status,
    };

    globalTotalWeight += data.totalWeight;
    globalMaxWeight += data.maxWeight;
  }

  const overallScore = globalMaxWeight > 0 ? Math.round((globalTotalWeight / globalMaxWeight) * 100) : 0;

  // Sort tasks so priority tasks appear first
  plan.sort((a, b) => {
    const timeVal = { "Days 1-30": 1, "Days 31-60": 2, "Days 61-90": 3 };
    return timeVal[a.timeframe] - timeVal[b.timeframe];
  });

  return {
    overallScore,
    categories: categoryScores,
    gaps,
    plan,
  };
}

