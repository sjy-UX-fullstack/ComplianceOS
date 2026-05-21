/**
 * ComplianceOS — AI Gateway: Breach classifier (Sprint 5 Task 5.11)
 *
 * Given a free-text breach narrative the DPO drafts, the classifier
 * returns:
 *   - severity (low/medium/high/critical) — computed from heuristic +
 *     optional Claude review
 *   - category (ransomware/BEC/misconfig/...)
 *   - draftNarrative — a polished version suitable for the filings
 *   - rootCauseHypothesis
 *
 * Same defence-in-depth as the DSR classifier: Presidio-lite redaction
 * before any LLM call, deterministic citations on response.
 */

import {
  scoreBreach,
  type BreachScoreInputs,
  type BreachSeverity,
} from "@complianceos/rules-engine";
import { redactPii } from "./dsr-classifier";
import type { BreachCategory } from "../breach/core";

export interface BreachClassification {
  severity: BreachSeverity;
  category: BreachCategory;
  score: number;
  draftNarrative: string;
  rootCauseHypothesis: string;
  citations: string[];
  modelUsed: "heuristic" | "claude";
  breakdown: { factor: string; weight: number }[];
}

const CATEGORY_KEYWORDS: Record<BreachCategory, string[]> = {
  ransomware: ["ransom", "encrypted", "lockbit", "conti", "akira", "decryption key"],
  phishing_credential: ["phish", "credential", "stolen password", "leaked password"],
  business_email_compromise: ["bec", "fake invoice", "wire fraud", "spoofed email"],
  misconfiguration: ["s3 bucket", "public bucket", "open port", "default password", "no auth"],
  insider_misuse: ["insider", "ex-employee", "former employee", "disgruntled"],
  lost_device: ["lost laptop", "stolen laptop", "missing phone", "lost device"],
  third_party_vendor: ["vendor", "supplier", "sub-processor", "third-party"],
  denial_of_service: ["ddos", "dos", "flood", "outage caused by"],
  unauthorised_access: ["unauthorised access", "brute force", "credential stuffing"],
  data_leak_disclosure: ["mass email", "wrong recipient", "accidentally shared", "leak"],
  other: [],
};

function heuristicCategory(text: string): BreachCategory {
  const lower = text.toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [BreachCategory, string[]][]) {
    if (words.some((w) => lower.includes(w))) return cat;
  }
  return "other";
}

function citationsFor(category: BreachCategory): string[] {
  const base = [
    "DPDP Rule 7(2)",
    "CERT-In Direction 20(3)/2022 (Annexure-I)",
  ];
  if (category === "ransomware") base.push("MeitY ransomware advisory 2023");
  if (category === "business_email_compromise") base.push("RBI cyber-fraud advisory");
  if (category === "third_party_vendor") base.push("DPDP §8(8) — Data Processor obligations");
  return base;
}

export async function classifyBreach(input: {
  freeText: string;
  scoreInputs: BreachScoreInputs;
}): Promise<BreachClassification> {
  const redacted = redactPii(input.freeText).slice(0, 1200);
  const category = heuristicCategory(input.freeText);
  const score = scoreBreach(input.scoreInputs);

  // Default heuristic narrative — best-effort templating
  const heuristicNarrative = buildHeuristicNarrative(category, input.scoreInputs);

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      severity: score.severity,
      category,
      score: score.score,
      draftNarrative: heuristicNarrative,
      rootCauseHypothesis: deriveRootCauseHypothesis(category, input.freeText),
      citations: citationsFor(category),
      modelUsed: "heuristic",
      breakdown: score.breakdown,
    };
  }

  try {
    const claude = await callClaude(redacted, category, score);
    if (claude) {
      return {
        severity: claude.severity ?? score.severity,
        category: claude.category ?? category,
        score: score.score,
        draftNarrative: claude.draftNarrative ?? heuristicNarrative,
        rootCauseHypothesis: claude.rootCauseHypothesis ?? deriveRootCauseHypothesis(category, input.freeText),
        citations: citationsFor(claude.category ?? category),
        modelUsed: "claude",
        breakdown: score.breakdown,
      };
    }
  } catch {
    // fall through
  }

  return {
    severity: score.severity,
    category,
    score: score.score,
    draftNarrative: heuristicNarrative,
    rootCauseHypothesis: deriveRootCauseHypothesis(category, input.freeText),
    citations: citationsFor(category),
    modelUsed: "heuristic",
    breakdown: score.breakdown,
  };
}

function buildHeuristicNarrative(
  category: BreachCategory,
  inputs: BreachScoreInputs,
): string {
  const count = inputs.affectedCount ? `${inputs.affectedCount.toLocaleString("en-IN")} data principals` : "an as-yet-undetermined number of data principals";
  const cats = inputs.affectedCategories?.join(", ") ?? "personal data";
  return [
    `On the date of detection, ComplianceOS identified a security incident classified as ${category.replace(/_/g, " ")}.`,
    `Initial scoping indicates ${count} may be affected, with exposure of the following categories: ${cats}.`,
    `Containment is in progress; this filing meets the statutory window pending the detailed report under Rule 7(2).`,
  ].join("\n\n");
}

function deriveRootCauseHypothesis(category: BreachCategory, text: string): string {
  const lower = text.toLowerCase();
  if (category === "ransomware") {
    return lower.includes("phish")
      ? "Initial access via spear-phishing email leading to encryption payload deployment."
      : "Exploitation of an unpatched edge service followed by lateral movement and encryption.";
  }
  if (category === "phishing_credential") {
    return "Credential phishing via lookalike domain; subsequent reuse on SaaS accounts.";
  }
  if (category === "misconfiguration") {
    return "Resource left publicly accessible due to missing access-control policy.";
  }
  if (category === "third_party_vendor") {
    return "Compromise of a sub-processor with delegated access to tenant data.";
  }
  return "Root cause under investigation — to be confirmed in the detailed report.";
}

async function callClaude(
  redacted: string,
  defaultCategory: BreachCategory,
  score: { severity: BreachSeverity },
): Promise<{
  severity?: BreachSeverity;
  category?: BreachCategory;
  draftNarrative?: string;
  rootCauseHypothesis?: string;
} | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const model = process.env.AI_PRIMARY_MODEL ?? "claude-3-5-haiku-latest";

  const system =
    "You assist Indian DPOs filing CERT-In + DPB breach notifications under DPDP Act 2023. " +
    "Respond ONLY with compact JSON: " +
    "{\"severity\":\"low|medium|high|critical\",\"category\":\"ransomware|phishing_credential|business_email_compromise|misconfiguration|insider_misuse|lost_device|third_party_vendor|denial_of_service|unauthorised_access|data_leak_disclosure|other\",\"draftNarrative\":\"<2-3 paragraphs, India English>\",\"rootCauseHypothesis\":\"<one short sentence>\"}. " +
    `Heuristic suggested severity=${score.severity} category=${defaultCategory}. Override only with high confidence.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: redacted }],
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = json.content?.find((c) => c.type === "text")?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
