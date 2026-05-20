/**
 * ComplianceOS — Shared Configuration
 * Central config for DPDP rules, pricing, and feature flags.
 */

// ─── DPDP ACT 2023 RULE REFERENCES ──────────────────────────────────────────

export const DPDP_RULES = {
  RULE_3: { id: "Rule 3", title: "Privacy Notice", section: "Section 5" },
  RULE_6: { id: "Rule 6", title: "Reasonable Security Safeguards", section: "Section 8" },
  RULE_7: { id: "Rule 7", title: "Breach Notification", section: "Section 8(6)" },
  RULE_8: { id: "Rule 8", title: "Retention & Erasure", section: "Section 8(7)" },
  RULE_10: { id: "Rule 10", title: "Children's Data", section: "Section 9" },
  RULE_13: { id: "Rule 13", title: "SDF Obligations", section: "Section 10" },
  RULE_14: { id: "Rule 14", title: "Data Principal Rights", section: "Sections 11-14" },
  RULE_15: { id: "Rule 15", title: "Cross-Border Transfer", section: "Section 16" },
  RULE_23: { id: "Rule 23", title: "Government Access", section: "Section 36" },
} as const;

// ─── BREACH TIMERS ──────────────────────────────────────────────────────────

export const BREACH_TIMERS = {
  CERT_IN_HOURS: 6,
  DPB_HOURS: 72,
  RBI_HOURS: 6,    // RBI also mandates 6h
  IRDAI_HOURS: 72,
} as const;

// ─── DSR SLA ────────────────────────────────────────────────────────────────

export const DSR_SLA = {
  DAYS: 90,             // Rule 14(3)
  ALERT_T_MINUS_30: 30, // days before due
  ALERT_T_MINUS_10: 10,
  ALERT_T_MINUS_1: 1,
} as const;

// ─── SUPPORTED ENTITY TYPES ────────────────────────────────────────────────

export const ENTITY_TYPES = [
  "PvtLtd", "OPC", "LLP", "Partnership", "Proprietor",
  "Society", "Trust", "PublicLtd", "Other",
] as const;

// ─── INDUSTRIES ─────────────────────────────────────────────────────────────

export const INDUSTRIES = [
  "e-commerce", "fintech", "edtech", "healthtech", "gaming",
  "saas", "logistics", "manufacturing", "media", "telecom",
  "real-estate", "legal", "consulting", "other",
] as const;

// ─── AI CONFIG ──────────────────────────────────────────────────────────────

export const AI_CONFIG = {
  PRIMARY_MODEL: "claude-haiku",     // dev: haiku, prod: claude-sonnet-4.5
  FALLBACK_MODEL: "gpt-4.1-mini",   // dev: mini, prod: gpt-4.1
  MONTHLY_CAPS_INR: {
    free: 0,
    starter: 500,
    growth: 2000,
    business: 10000,
    enterprise: -1,  // unlimited
    agency: 10000,
  },
} as const;

// ─── DATA RESIDENCY ─────────────────────────────────────────────────────────

export const DATA_RESIDENCY = {
  PRIMARY_REGION: "ap-south-1",   // AWS Mumbai
  DR_REGION: "ap-south-2",       // AWS Hyderabad
  RTO_HOURS: 4,
  RPO_MINUTES: 15,
} as const;
