/**
 * ComplianceOS — Drill scenario seed (Sprint 5 Task 5.12)
 *
 * One canonical scenario the wizard uses to:
 *   1. Pre-fill the new-incident form for a "Run a drill" button
 *   2. Validate that both CERT-In and DPB filings render end-to-end
 *
 * The scenario mirrors a high-severity ransomware case affecting an
 * e-commerce tenant — covers sensitive categories, sectoral overlays,
 * and triggers the children's-data factor.
 */

import type { BreachScoreInputs } from "@complianceos/rules-engine";
import type { BreachCategory } from "./core";

export interface DrillScenario {
  code: string;
  title: string;
  narrative: string;
  category: BreachCategory;
  scoreInputs: BreachScoreInputs;
  containmentSteps: { step: string; doneAt?: string }[];
  affectedCategories: string[];
  sectoralOverlays: string[];
  rootCause: string;
}

export const DRILL_SCENARIOS: DrillScenario[] = [
  {
    code: "ransomware-d2c",
    title: "Ransomware on order-management service",
    narrative:
      "Our SIEM flagged anomalous encryption activity on the order-management database at 03:42 IST. The cluster servicing checkout traffic showed 87% of files re-extensioned to .akira and a ransom note was found on the bastion. We isolated the cluster within 12 minutes and rotated all admin credentials. Initial estimate is 38,000 customers affected, including PAN and bank fragments captured for invoicing.",
    category: "ransomware",
    scoreInputs: {
      affectedCount: 38_000,
      affectedCategories: ["pan", "bank_account", "address"],
      crossBorder: false,
      publicExposure: false,
      authBypass: true,
      childrenData: false,
    },
    containmentSteps: [
      { step: "Isolated the affected cluster from the network", doneAt: undefined },
      { step: "Rotated bastion + IAM admin credentials" },
      { step: "Initiated forensic image of the impacted hosts (chain-of-custody preserved)" },
      { step: "Notified CISO, CEO, and external IR retainer" },
    ],
    affectedCategories: ["pan", "bank_account", "address"],
    sectoralOverlays: [],
    rootCause:
      "Suspected initial access via spear-phishing of a developer; Akira variant deployed laterally.",
  },
  {
    code: "misconfig-s3",
    title: "Public S3 bucket exposing customer KYC images",
    narrative:
      "A Trust & Safety analyst discovered that the `kyc-docs-prod` S3 bucket was set to public-read for ~9 hours after an IaC drift. We confirmed the misconfiguration was introduced by a Terraform apply that bypassed the OPA policy gate. 12,400 customer KYC images were potentially listable.",
    category: "misconfiguration",
    scoreInputs: {
      affectedCount: 12_400,
      affectedCategories: ["aadhaar", "pan", "biometric"],
      crossBorder: false,
      publicExposure: true,
      authBypass: false,
      childrenData: false,
    },
    containmentSteps: [
      { step: "Restricted the bucket to private + revoked all object ACLs" },
      { step: "Enabled S3 Block Public Access at the account level" },
      { step: "Captured CloudTrail data-events for the exposure window" },
    ],
    affectedCategories: ["aadhaar", "pan", "biometric"],
    sectoralOverlays: ["rbi_cyber_incident"],
    rootCause:
      "Terraform plan applied with `--auto-approve` skipping the OPA policy gate; root cause confirmed by audit trail.",
  },
  {
    code: "phish-edtech-minor",
    title: "Credential phishing affecting parent accounts of minors",
    narrative:
      "A credential-phishing campaign cloned our learner portal and harvested ~1,200 parent logins over 36 hours. Affected accounts include child progress reports and lesson recordings.",
    category: "phishing_credential",
    scoreInputs: {
      affectedCount: 1_200,
      affectedCategories: ["minor_data", "email", "behavioural"],
      crossBorder: false,
      publicExposure: false,
      authBypass: false,
      childrenData: true,
    },
    containmentSteps: [
      { step: "Force-reset of all affected parent accounts" },
      { step: "Takedown filed with the phishing-domain registrar" },
      { step: "DMARC reject and MTA-STS hardened" },
    ],
    affectedCategories: ["minor_data", "email", "behavioural"],
    sectoralOverlays: [],
    rootCause:
      "Phishing kit using look-alike domain; users did not have MFA enforced.",
  },
];

export function getDrillScenario(code: string): DrillScenario | undefined {
  return DRILL_SCENARIOS.find((s) => s.code === code);
}
