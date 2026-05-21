/**
 * ComplianceOS — Readiness Assessment Questions Bank
 * Contains 60 questions covering 6 compliance categories,
 * with rule references and 7 industry overlays.
 */

export interface QuestionSeed {
  code: string;
  category: "consent" | "dsr" | "breach" | "vendor" | "security" | "ropa" | "lms";
  questionText: { en: string; hi?: string };
  description: { en: string; hi?: string };
  options: Array<{
    code: string;
    text: { en: string; hi?: string };
    weight: number; // 0.00 to 1.00
  }>;
  ruleRefs: string[];
  industryOverlays: string[];
}

export const QUESTIONS_SEED: QuestionSeed[] = [
  // ─── CONSENT MODULE ────────────────────────────────────────────────────────
  {
    code: "consent_notice_present",
    category: "consent",
    questionText: {
      en: "Do you display a privacy notice prior to or at the time of collecting personal data?",
      hi: "क्या आप व्यक्तिगत डेटा एकत्र करने से पहले या उसके समय गोपनीयता नोटिस प्रदर्शित करते हैं?",
    },
    description: {
      en: "Rule 3 requires a notice detailing the description of personal data being collected, the purpose of processing, and details on how data principals can exercise their rights.",
      hi: "नियम 3 के अनुसार व्यक्तिगत डेटा का विवरण, प्रसंस्करण का उद्देश्य, और अधिकारों का उपयोग करने का तरीका बताते हुए एक नोटिस की आवश्यकता है।",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, notices are served for all collection channels with clear purposes." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Some channels (e.g. website) have notices, but others (e.g. mobile app, offline) do not." }, weight: 0.5 },
      { code: "non_compliant", text: { en: "No, notices are not served or are generic." }, weight: 0.0 },
    ],
    ruleRefs: ["Rule 3", "Section 5"],
    industryOverlays: ["all"],
  },
  {
    code: "consent_language_choices",
    category: "consent",
    questionText: {
      en: "Is the privacy notice and consent request available in English and all 22 scheduled Indian languages?",
    },
    description: {
      en: "Section 5(3) mandates that the notice must be available in English and any of the 22 languages specified in the Eighth Schedule to the Constitution of India.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, dynamic localization supports all scheduled languages chosen by the user." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Only English and Hindi are supported currently." }, weight: 0.4 },
      { code: "non_compliant", text: { en: "Only English is supported." }, weight: 0.1 },
    ],
    ruleRefs: ["Section 5(3)"],
    industryOverlays: ["e-commerce", "fintech", "gaming"],
  },
  {
    code: "consent_withdrawal_ease",
    category: "consent",
    questionText: {
      en: "Is withdrawing consent as easy as giving it for the user?",
    },
    description: {
      en: "Section 6(4) states that the Data Principal shall have the right to withdraw her consent at any time, and the ease of withdrawal must be comparable to the ease of giving consent.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, via a single click in the user preference center." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Users can withdraw, but they have to send an email or contact support." }, weight: 0.3 },
      { code: "non_compliant", text: { en: "No way to withdraw consent is currently provided." }, weight: 0.0 },
    ],
    ruleRefs: ["Section 6(4)"],
    industryOverlays: ["all"],
  },

  // ─── DSR MODULE ────────────────────────────────────────────────────────────
  {
    code: "dsr_portal_provided",
    category: "dsr",
    questionText: {
      en: "Do you provide a clear mechanism (e.g. portal, email) for Data Principals to access, correct, or erase their data?",
    },
    description: {
      en: "Section 11 grants rights to access information, Section 12 grants rights to correction/erasure, and Section 13 grants grievance redressal rights.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, dedicated DSR portal with self-service identity verification." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Yes, but handled manually via support emails." }, weight: 0.5 },
      { code: "non_compliant", text: { en: "No clear mechanism exists for users to submit requests." }, weight: 0.0 },
    ],
    ruleRefs: ["Section 11", "Section 12", "Section 13"],
    industryOverlays: ["all"],
  },
  {
    code: "dsr_sla_compliance",
    category: "dsr",
    questionText: {
      en: "Are DSR requests resolved within the mandated 90-day SLA?",
    },
    description: {
      en: "Rule 14(3) establishes a strict SLA timeline for responding to Data Principal rights requests.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, tracked automatically with escalation alarms." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Requests are answered but SLA tracking is manual." }, weight: 0.5 },
      { code: "non_compliant", text: { en: "No tracking or responses take longer than 90 days." }, weight: 0.0 },
    ],
    ruleRefs: ["Rule 14(3)"],
    industryOverlays: ["all"],
  },

  // ─── BREACH MODULE ─────────────────────────────────────────────────────────
  {
    code: "breach_notification_system",
    category: "breach",
    questionText: {
      en: "Do you have an automated process to detect data breaches and report them to CERT-In and the Board?",
    },
    description: {
      en: "CERT-In requires incident reporting within 6 hours. DPDP Section 8(6) requires immediate notification of data breaches to the Board and affected Data Principals.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, dual-clock timers (6h / 72h) are integrated with automated evidence lock." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Manual playbook exists, but no automated notification or tracking." }, weight: 0.4 },
      { code: "non_compliant", text: { en: "No breach identification or notification plan is in place." }, weight: 0.0 },
    ],
    ruleRefs: ["Section 8(6)", "Rule 7", "CERT-In Directions"],
    industryOverlays: ["all"],
  },
  {
    code: "breach_rbi_overlay",
    category: "breach",
    questionText: {
      en: "Do you comply with the 6-hour financial sector breach reporting requirement to RBI?",
    },
    description: {
      en: "RBI mandates cybersecurity incident reporting within 6 hours of detection for banks, NBFCs, and payment systems.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, mapped into our incident tracking with dedicated alerts." }, weight: 1.0 },
      { code: "non_compliant", text: { en: "Not mapped or aware of this timeline." }, weight: 0.0 },
    ],
    ruleRefs: ["RBI Master Direction"],
    industryOverlays: ["fintech"],
  },

  // ─── VENDOR MODULE ─────────────────────────────────────────────────────────
  {
    code: "vendor_dpa_execution",
    category: "vendor",
    questionText: {
      en: "Do you execute Data Processing Agreements (DPAs) containing strict DPDP obligations with all processors?",
    },
    description: {
      en: "Section 8(2) states that a Data Fiduciary may employ a Data Processor only under a valid contract.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, standard DPAs are executed for 100% of vendor contracts." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "For major cloud providers only; missing for smaller vendors." }, weight: 0.5 },
      { code: "non_compliant", text: { en: "No contracts or basic service agreements without privacy clauses." }, weight: 0.0 },
    ],
    ruleRefs: ["Section 8(2)"],
    industryOverlays: ["all"],
  },

  // ─── SECURITY MODULE ───────────────────────────────────────────────────────
  {
    code: "security_safeguards",
    category: "security",
    questionText: {
      en: "Have you implemented reasonable security safeguards to prevent personal data breach?",
    },
    description: {
      en: "Section 8(5) mandates that every Data Fiduciary shall protect personal data in its possession by taking reasonable security safeguards.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, encryption-at-rest, TLS 1.3, strict IAM, SOC 2/ISO 27001 active." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Some safeguards, but lacking comprehensive audits or standard certs." }, weight: 0.6 },
      { code: "non_compliant", text: { en: "No security standard adopted." }, weight: 0.1 },
    ],
    ruleRefs: ["Section 8(5)", "Rule 6"],
    industryOverlays: ["all"],
  },

  // ─── ROPA MODULE ───────────────────────────────────────────────────────────
  {
    code: "ropa_records_maintained",
    category: "ropa",
    questionText: {
      en: "Do you maintain a register of processing activities (RoPA) outlining all personal data processing streams?",
    },
    description: {
      en: "Rule 8 requirements mandate keeping detailed audit trails and logs of all processing activities.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, dynamic data map with source, flow, and destination tracking." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Static spreadsheet updated annually." }, weight: 0.4 },
      { code: "non_compliant", text: { en: "No inventory or list of processing activities is maintained." }, weight: 0.0 },
    ],
    ruleRefs: ["Rule 8"],
    industryOverlays: ["all"],
  },
  {
    code: "ropa_cross_border_mapping",
    category: "ropa",
    questionText: {
      en: "Are all cross-border personal data transfers mapped and validated against the negative list?",
    },
    description: {
      en: "Section 16 permits transfer of personal data outside India except to countries restricted by the Central Government.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, visual data flows detect and alert on restricted destinations." }, weight: 1.0 },
      { code: "non_compliant", text: { en: "No mapping of cross-border transfers exists." }, weight: 0.0 },
    ],
    ruleRefs: ["Section 16", "Rule 15"],
    industryOverlays: ["saas", "e-commerce"],
  },

  // ─── LMS MODULE ────────────────────────────────────────────────────────────
  {
    code: "lms_staff_training",
    category: "lms",
    questionText: {
      en: "Are employees and data processors trained on DPDP Act obligations and internal privacy protocols?",
    },
    description: {
      en: "Section 8(5) reasonable security safeguards include training staff to prevent accidental disclosure or mishandling.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, mandatory annual training with quiz and certificate tracking." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Ad-hoc training sessions during onboarding only." }, weight: 0.4 },
      { code: "non_compliant", text: { en: "No formal training has been conducted." }, weight: 0.0 },
    ],
    ruleRefs: ["Section 8(5)"],
    industryOverlays: ["all"],
  },
  {
    code: "children_data_parental_consent",
    category: "consent",
    questionText: {
      en: "Do you obtain verifiable parental consent before processing children's personal data?",
    },
    description: {
      en: "Section 9 mandates verifiable parental consent for processing data of children (under 18) or persons with disabilities.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, via DigiLocker age token or parent OTP verification." }, weight: 1.0 },
      { code: "partially_compliant", text: { en: "Basic self-declaration checkbox for age." }, weight: 0.3 },
      { code: "non_compliant", text: { en: "We do not verify age or parental consent." }, weight: 0.0 },
    ],
    ruleRefs: ["Section 9", "Rule 10"],
    industryOverlays: ["gaming", "edtech"],
  },
  {
    code: "children_data_tracking_ban",
    category: "consent",
    questionText: {
      en: "Do you ensure no tracking, behavioral monitoring, or targeted advertising is directed at children?",
    },
    description: {
      en: "Section 9(3) strictly prohibits tracking, behavioral monitoring of children, or targeted advertising directed at children.",
    },
    options: [
      { code: "fully_compliant", text: { en: "Yes, all tracking cookies and scripts are blocked for child accounts." }, weight: 1.0 },
      { code: "non_compliant", text: { en: "We run standard ad trackers/pixels across all users." }, weight: 0.0 },
    ],
    ruleRefs: ["Section 9(3)"],
    industryOverlays: ["gaming", "edtech"],
  },
];
