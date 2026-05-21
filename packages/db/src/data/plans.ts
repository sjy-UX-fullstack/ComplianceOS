/**
 * ComplianceOS — Subscription Plan Tiers
 * Sprint 3 Task 3.1: Plan tiers seed data (Free → Enterprise + Agency)
 *
 * Pricing per the Master Plan §2.5. All amounts in paise (INR × 100) for
 * Razorpay compatibility. GST (18%) applied at invoice time.
 *
 * rule_ref: DPDP Act 2023 — pricing is internal; surfaces must show
 * inclusive-of-GST values for B2C transparency.
 */

export interface PlanFeatures {
  // Quotas
  maxClientTenants: number | null; // null = unlimited
  maxDsrPerMonth: number | null;
  maxConsentEvents: number | null;
  maxAiTokensPerMonth: number | null;

  // Module access (Sprint roadmap order)
  assessment: boolean;
  cmpBanner: boolean;
  policyGen: boolean;
  dsrPortal: boolean;
  breachWizard: boolean;
  vendorManager: boolean;
  ropa: boolean;
  lms: boolean;
  dashboardAggregation: boolean;
  whiteLabel: boolean;
  customDomain: boolean;

  // Channels & integrations
  whatsappBusiness: boolean;
  digilockerAuth: boolean;
  ssoSaml: boolean;
  apiAccess: boolean;
  webhooks: boolean;

  // Support
  supportSla: "community" | "email_48h" | "email_24h" | "email_4h" | "dedicated";
}

export interface PlanSeed {
  code: string;
  displayName: string;
  monthlyPriceInr: number; // rupees (display); paise conversion at Razorpay layer
  yearlyPriceInr: number;
  description: string;
  badge?: string;
  popular?: boolean;
  features: PlanFeatures;
}

const baseLocked: PlanFeatures = {
  maxClientTenants: 1,
  maxDsrPerMonth: 0,
  maxConsentEvents: 0,
  maxAiTokensPerMonth: 0,
  assessment: false,
  cmpBanner: false,
  policyGen: false,
  dsrPortal: false,
  breachWizard: false,
  vendorManager: false,
  ropa: false,
  lms: false,
  dashboardAggregation: false,
  whiteLabel: false,
  customDomain: false,
  whatsappBusiness: false,
  digilockerAuth: false,
  ssoSaml: false,
  apiAccess: false,
  webhooks: false,
  supportSla: "community",
};

export const PLANS_SEED: PlanSeed[] = [
  {
    code: "free",
    displayName: "Free",
    monthlyPriceInr: 0,
    yearlyPriceInr: 0,
    description:
      "Run the Readiness Assessment, see your score, and get a 90-day remediation plan. For pre-revenue founders and curious DPOs.",
    features: {
      ...baseLocked,
      maxDsrPerMonth: 5,
      maxConsentEvents: 1000,
      maxAiTokensPerMonth: 20_000,
      assessment: true,
      policyGen: true, // notice + cookie only; flagged at runtime
      supportSla: "community",
    },
  },
  {
    code: "starter",
    displayName: "Starter",
    monthlyPriceInr: 4_999,
    yearlyPriceInr: 49_990, // 2 months free
    description:
      "For SMEs publishing their first DPDP-compliant notice and banner. Consent up to 50K events/mo.",
    features: {
      ...baseLocked,
      maxDsrPerMonth: 25,
      maxConsentEvents: 50_000,
      maxAiTokensPerMonth: 100_000,
      assessment: true,
      cmpBanner: true,
      policyGen: true,
      supportSla: "email_48h",
    },
  },
  {
    code: "growth",
    displayName: "Growth",
    monthlyPriceInr: 14_999,
    yearlyPriceInr: 1_49_990,
    description:
      "DSR portal + Breach wizard for growth-stage companies handling rights requests at scale.",
    popular: true,
    badge: "Most popular",
    features: {
      ...baseLocked,
      maxDsrPerMonth: 250,
      maxConsentEvents: 500_000,
      maxAiTokensPerMonth: 500_000,
      assessment: true,
      cmpBanner: true,
      policyGen: true,
      dsrPortal: true,
      breachWizard: true,
      ropa: true,
      whatsappBusiness: true,
      digilockerAuth: true,
      webhooks: true,
      supportSla: "email_24h",
    },
  },
  {
    code: "business",
    displayName: "Business",
    monthlyPriceInr: 49_999,
    yearlyPriceInr: 4_99_990,
    description:
      "Everything in Growth + Vendor Risk, LMS, full RoPA with auto-discovery, and SSO.",
    features: {
      ...baseLocked,
      maxClientTenants: 1,
      maxDsrPerMonth: 2_000,
      maxConsentEvents: 5_000_000,
      maxAiTokensPerMonth: 2_500_000,
      assessment: true,
      cmpBanner: true,
      policyGen: true,
      dsrPortal: true,
      breachWizard: true,
      vendorManager: true,
      ropa: true,
      lms: true,
      ssoSaml: true,
      apiAccess: true,
      webhooks: true,
      whatsappBusiness: true,
      digilockerAuth: true,
      supportSla: "email_4h",
    },
  },
  {
    code: "enterprise",
    displayName: "Enterprise",
    monthlyPriceInr: 2_00_000,
    yearlyPriceInr: 20_00_000,
    description:
      "Custom contracting, dedicated DPO support, SDF readiness, on-prem AI gateway. Quote-driven.",
    features: {
      ...baseLocked,
      maxClientTenants: null,
      maxDsrPerMonth: null,
      maxConsentEvents: null,
      maxAiTokensPerMonth: null,
      assessment: true,
      cmpBanner: true,
      policyGen: true,
      dsrPortal: true,
      breachWizard: true,
      vendorManager: true,
      ropa: true,
      lms: true,
      whiteLabel: true,
      customDomain: true,
      ssoSaml: true,
      apiAccess: true,
      webhooks: true,
      whatsappBusiness: true,
      digilockerAuth: true,
      supportSla: "dedicated",
    },
  },
  {
    code: "agency",
    displayName: "Agency",
    monthlyPriceInr: 19_999,
    yearlyPriceInr: 1_99_990,
    badge: "Per-client billing: ₹999/mo",
    description:
      "Manage compliance for multiple clients under one workspace. White-label included. ₹999/mo per active client tenant.",
    features: {
      ...baseLocked,
      maxClientTenants: null,
      maxDsrPerMonth: null,
      maxConsentEvents: null,
      maxAiTokensPerMonth: 5_000_000,
      assessment: true,
      cmpBanner: true,
      policyGen: true,
      dsrPortal: true,
      breachWizard: true,
      vendorManager: true,
      ropa: true,
      lms: true,
      dashboardAggregation: true,
      whiteLabel: true,
      customDomain: true,
      ssoSaml: true,
      apiAccess: true,
      webhooks: true,
      whatsappBusiness: true,
      digilockerAuth: true,
      supportSla: "email_4h",
    },
  },
];

export const AGENCY_PER_CLIENT_INR = 999;
export const GST_RATE = 0.18;

export function getPlanByCode(code: string): PlanSeed | undefined {
  return PLANS_SEED.find((p) => p.code === code);
}
