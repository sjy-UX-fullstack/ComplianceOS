# ComplianceOS — Sprint Status Report

> **Project:** India DPDP Compliance SaaS · **Repo:** [ComplianceOS](https://github.com/sjy-UX-fullstack/ComplianceOS)

---

## ✅ Sprint 1 — Assessment + CMP Banner (COMPLETE)

All 12 tasks delivered. Production build passes. Pushed to GitHub.

| # | Task | Deliverable |
|---|---|---|
| 1.1 | Assessment question bank schema | `packages/db/src/schema/assessments.ts` |
| 1.2 | 60-question pack, 7 industry overlays | `packages/db/src/data/questions.ts` |
| 1.3 | Rule-weighted scoring engine | `packages/rules-engine/src/index.ts` |
| 1.4 | Gap heatmap UI + 90-day plan | `apps/web/app/app/page.tsx` (Assessment tab) |
| 1.5 | PDF + JSON export | `GET /api/v1/assessments/{id}/export?format=pdf\|json` |
| 1.6 | Banner SDK (init/open/withdraw/status) | `apps/web/public/banner-sdk.js` — 4.4KB gzipped |
| 1.7 | IAB TCF v2.3 + Google CM v2 + GPC | SDK dataLayer + navigator.globalPrivacyControl |
| 1.8 | MutationObserver suppression | Blocks GA/GTM/FB/Amplitude/Mixpanel without consent |
| 1.9 | Consent storage + hash chain | HMAC-SHA256 tamper-evident audit trail |
| 1.10 | consent_purposes CRUD + RLS | `GET/POST /api/v1/consents` |
| 1.11 | Public consent endpoint | `POST /api/v1/public/consent` |
| 1.12 | Banner size validation | 4,460 bytes gzipped (target: <5,000) ✅ |

---

## ✅ Sprint 2 — Policy Gen + White-Label (COMPLETE)

Key Sprint 2 tasks delivered. Production build passes. Pushed to GitHub.

| # | Task | Deliverable |
|---|---|---|
| 2.1 | Rule-3 Privacy Notice (EN + HI) | Full DPDP Sections 5-14 coverage |
| 2.2 | Cookie & Tracking Policy | GCM v2 + GPC + MutationObserver disclosure |
| 2.5 | Version control schema | `policy_versions` table in `business.ts` |
| 2.6 | Theme builder schema | `tenant_branding` table in `business.ts` |
| 2.10 | Public notice endpoint | `GET /api/v1/public/notice/{slug}/{lang}` |

### New API Routes

```
GET  /api/v1/policies                          — List policy templates
POST /api/v1/policies                          — Generate policy from template + variables
GET  /api/v1/public/notice/privacy-notice/en   — Rendered Privacy Notice (English)
GET  /api/v1/public/notice/privacy-notice/hi   — Rendered Privacy Notice (Hindi)
GET  /api/v1/public/notice/cookie-policy/en    — Rendered Cookie Policy
```

### Policy Templates Created

1. **DPDP Rule 3 — Privacy Notice (EN)** — 14 sections covering all DPDP requirements
2. **DPDP Rule 3 — गोपनीयता सूचना (HI)** — Hindi version with Section 11-14 rights
3. **Cookie & Tracking Policy** — Cookie categories, GCM v2, GPC, MutationObserver

---

## ✅ Sprint 3 — Billing + Frontend Shell (COMPLETE)

10 of 11 task buckets delivered. Production build green; full workspace typecheck clean.
Cookie auto-scanner (3.10) deferred to Sprint 7 alongside auto-discovery workers.

| # | Task | Deliverable |
|---|---|---|
| 3.1 | Plan tiers seed (Free → Enterprise + Agency) | `packages/db/src/data/plans.ts` — 6 tiers, feature matrix, GST helpers |
| 3.2 | Razorpay Subscriptions integration | `apps/web/lib/billing/razorpay.ts` + `POST /api/v1/billing/subscriptions` |
| 3.3 | UPI Autopay mandate scaffold | `createUpiMandateAuth()` returns `short_url` for in-app approval |
| 3.4 | GST invoice generator (18%) | `lib/billing/gst-invoice.ts` — FY-scoped numbering, CGST/SGST/IGST split, INR amount-in-words, HTML render |
| 3.5 | Payment webhook handlers | `POST /api/v1/billing/webhook` with HMAC verify + 12-event dispatch table |
| 3.6 | App Router layouts | `(marketing)`, `(platform)`, `(agency)`, `(dpo)`, `(public)` populated |
| 3.7 | UI primitive library | `components/ui/` — Button, Card, Badge, Input, Label, Tabs (CSS-var tokens) |
| 3.8 | Dashboard shell | New platform sidebar layout wraps `/onboarding`; existing `/app` retained |
| 3.9 | Preference Centre at `/privacy` | Toggle UI + one-click withdraw + sync to `/api/v1/public/consent` |
| 3.10 | Cookie auto-scanner | **Deferred** — Puppeteer worker batched with Sprint 7 auto-discovery |
| 3.11 | Onboarding wizard | 5-step Industry → Plan → Brand → Buyer → Launch with localStorage resume |

### New API Routes

```
GET    /api/v1/billing/plans                — Plan catalogue (public)
POST   /api/v1/billing/subscriptions        — Create Razorpay sub + UPI mandate
GET    /api/v1/billing/subscriptions/{id}   — Fetch single subscription
DELETE /api/v1/billing/subscriptions/{id}   — Cancel (atCycleEnd=true default)
POST   /api/v1/billing/invoices             — Render preview invoice (JSON or HTML)
POST   /api/v1/billing/webhook              — Razorpay event ingest (HMAC verified)
```

### New Routes

```
/pricing              — Marketing pricing page with full feature matrix
/onboarding?plan=...  — 5-step onboarding wizard (deep-linkable from /pricing)
/privacy              — Public Preference Centre (DPDP §6(4) withdrawal)
/agency               — Agency workspace scaffold (clients, branding, billing)
/dpo                  — DPO unified inbox scaffold
```

---

## Platform Dashboard Tabs

| Tab | Status |
|-----|--------|
| 📊 Dashboard | ✅ Functional — KPI cards, heatmap, gaps, 90-day plan |
| 📋 Readiness Assessment | ✅ Functional — Interactive questionnaire with live scoring |
| 🍪 Consent Manager | ✅ Functional — SDK preview, customization, integration snippet |
| 📝 Policy Notice Gen | ✅ Functional — Template listing, API docs, compliance coverage |
| 💳 Billing & Plans | ✅ Functional — `/pricing`, `/onboarding`, Razorpay UPI Autopay flow |
| 🛡️ Preference Centre | ✅ Functional — `/privacy` toggle UI with hash-chain sync |
| 📬 DSR Portal | 🔲 Placeholder — Sprint 4 |
| 🚨 Breach Wizard | 🔲 Placeholder — Sprint 5 |
| 🏢 Vendor Risk | 🔲 Placeholder — Sprint 6 |

---

## Build Status

```
Route (app)
├ ○ /                                              (Static — Landing)
├ ○ /agency                                        (Static — Agency overview)
├ ○ /app                                           (Static — Platform Dashboard)
├ ○ /dpo                                           (Static — DPO inbox)
├ ○ /onboarding                                    (Static — 5-step wizard)
├ ○ /pricing                                       (Static — Plan catalogue)
├ ○ /privacy                                       (Static — Preference Centre)
├ ƒ /api/v1/assessments/[id]/export                (Dynamic)
├ ƒ /api/v1/billing/invoices                       (Dynamic)
├ ƒ /api/v1/billing/plans                          (Dynamic)
├ ƒ /api/v1/billing/subscriptions                  (Dynamic)
├ ƒ /api/v1/billing/subscriptions/[id]             (Dynamic)
├ ƒ /api/v1/billing/webhook                        (Dynamic)
├ ƒ /api/v1/consents                               (Dynamic)
├ ƒ /api/v1/policies                               (Dynamic)
├ ƒ /api/v1/public/consent                         (Dynamic)
└ ƒ /api/v1/public/notice/[slug]/[lang]            (Dynamic)
```

---

## Next: Sprint 4 — DSR Portal (Weeks 9–10)

| # | Task | Priority |
|---|---|---|
| 4.1 | DSR request CRUD + RLS (`dsr_requests`) | High |
| 4.2 | Public DSR submission endpoint | High |
| 4.3 | Status polling endpoint with magic-link token | High |
| 4.4 | Identity verification: email OTP, mobile OTP | High |
| 4.5 | DigiLocker XML verification (Setu integration) | Medium |
| 4.6 | 90-day SLA timer + BullMQ alerts (T-30/T-10/T-1) | High |
| 4.7 | Auto-escalation at T=0 → `grievance_overdue` | High |
| 4.8 | Response packet auto-assembly from RoPA | Medium |
| 4.9 | Nomination support (DPDP §14) | Medium |
| 4.10 | WhatsApp + email status notifications | Medium |
| 4.11 | DSR workflow board UI | High |
| 4.12 | AI: classify free-text → right type | Medium |
| 4.13 | AI: redact third-party PII in access exports | High |
| 4.14 | `privacy.{client-domain}` routing (no marketing chrome) | Medium |

### Sprint 3 Carry-overs into Sprint 4+
- **Razorpay plan caching**: lazy-create currently runs on every first sub. Add `plans.razorpay_plan_id_monthly/_yearly` columns + DB upsert.
- **Webhook → DB persistence**: webhook handler currently logs events; wire to `subscriptions`/`invoices` upsert once tenant-scoped audit middleware lands.
- **Cookie auto-scanner**: Puppeteer worker — batch with Sprint 7 auto-discovery.
