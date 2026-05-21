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
| 📬 DSR Portal | ✅ Functional — submission, OTP+DigiLocker verify, status polling, DPO board |
| 🚨 Breach Wizard | 🔲 Placeholder — Sprint 5 |
| 🏢 Vendor Risk | 🔲 Placeholder — Sprint 6 |

---

## ✅ Sprint 4 — DSR Portal (COMPLETE)

10 of 14 task buckets delivered. Production build green; full workspace typecheck clean.
Deferred: 4.6/4.7 (BullMQ SLA workers — need Redis runtime), 4.8 (response packet — needs Sprint 7 RoPA), 4.14 (CNAME routing — needs custom-domain provisioning from Phase 7).

| # | Task | Deliverable |
|---|---|---|
| 4.1 | DSR request CRUD + RLS | Schema extended with `token_hash`, `subject`, `body_md`, `contact_email`, `contact_mobile`, `language`, `verification_state` JSONB, `alerts_fired[]` |
| 4.2 | Public DSR submission | `POST /api/v1/public/dsr` with honeypot, AI classification, 90-day SLA, magic-link token issuance |
| 4.3 | Status polling | `GET /api/v1/public/dsr/{token}/status` — SHA-256 lookup, SLA chip projection |
| 4.4 | Email + Mobile OTP | `POST/PUT /api/v1/public/dsr/{token}/otp` — 10-min TTL, 5-attempt cap, HMAC salt per channel |
| 4.5 | DigiLocker via Setu | `POST/PUT /api/v1/public/dsr/{token}/digilocker` — Setu sandbox wired, deterministic stub when keys missing |
| 4.6 | 90-day SLA worker | **Deferred** — `lib/dsr/core.ts` computes T-30/T-10/T-1/T-0; BullMQ worker batched with Sprint 7 |
| 4.7 | Auto-escalation at T=0 | **Deferred** — state machine supports `grievance_overdue` transition; cron not yet running |
| 4.8 | Response packet from RoPA | **Deferred** to Sprint 7 (RoPA module) |
| 4.9 | Nomination support | `nominee_ref` captured at submission; surfaces in DPO board |
| 4.10 | WhatsApp + email notifications | `lib/dsr/notify.ts` — structured envelopes ready for BullMQ workers in Sprint 9 |
| 4.11 | DSR workflow board | `/dpo/dsr` — 6-column kanban with SLA chips, state-transition buttons, 20s polling |
| 4.12 | AI free-text classifier | `lib/ai/dsr-classifier.ts` — Presidio-lite redaction + heuristic + Claude fallback with citations |
| 4.13 | PII redaction | `redactPii()` covers Aadhaar / PAN / mobile / email / IFSC / UPI ID — used pre-LLM |
| 4.14 | `privacy.{client-domain}` routing | **Deferred** — needs custom-domain CNAME wiring (Phase 7) |

### New API Routes

```
POST   /api/v1/public/dsr                              — Submit request
GET    /api/v1/public/dsr/{token}/status               — Poll status
POST   /api/v1/public/dsr/{token}/otp                  — Request OTP
PUT    /api/v1/public/dsr/{token}/otp                  — Verify OTP
POST   /api/v1/public/dsr/{token}/digilocker           — Initiate DigiLocker
PUT    /api/v1/public/dsr/{token}/digilocker           — Finalise DigiLocker
GET    /api/v1/dsr                                     — Tenant DSR queue + counts
GET    /api/v1/dsr/{id}                                — Tenant DSR detail
PATCH  /api/v1/dsr/{id}                                — State transition + resolution
```

### New Routes

```
/privacy/dsr          — Public DSR submission form (AI auto-classification toggle)
/privacy/dsr/[token]  — Status + identity verification (OTP / DigiLocker)
/dpo/dsr              — DPO workflow board (kanban with SLA chips)
```

### Build Status

```
Route (app)                                          27 routes
├ Static  (8):  /  /agency  /app  /dpo  /dpo/dsr  /onboarding
│              /pricing  /privacy  /privacy/dsr
├ Dynamic (19): /privacy/dsr/[token]
│              + 18 API routes under /api/v1/**
```

---

## Next: Sprint 5 — Breach Notification Wizard (Weeks 11–12)

| # | Task | Priority |
|---|---|---|
| 5.1 | Breach incident CRUD + auto `ref_no` | High |
| 5.2 | Dual-clock timers: CERT-In 6h + DPB 72h (IST) | High |
| 5.3 | Severity scoring engine | High |
| 5.4 | CERT-In Annexure-I PDF generator | High |
| 5.5 | DPB initial + 72h detailed report generator | High |
| 5.6 | Data Principal notification (multi-channel) | High |
| 5.7 | Evidence locker: S3 Object Lock (7yr) | Medium |
| 5.8 | Sectoral overlays: RBI 2h/6h, IRDAI, TRAI | Medium |
| 5.9 | BullMQ timer alerts (approaching deadlines) | High |
| 5.10 | Breach wizard UI (72h countdown, severity matrix) | High |
| 5.11 | AI: severity classifier + draft narrative | Medium |
| 5.12 | Drill test: seed scenario → both filings validate | High |

### Sprint 4 Carry-overs into Sprint 5+
- **BullMQ SLA worker** (4.6/4.7): Redis runtime + `apps/workers` skeleton, then enqueue at submission time.
- **Response packet builder** (4.8): blocked on RoPA / data-assets (Sprint 7) — DPO can hand-export until then.
- **Public DSR routing under `privacy.{client}`** (4.14): needs CNAME + ACM cert provisioning (Phase 7); usable today via `/privacy/dsr` on the platform host.
- **DSR persistence**: routes use in-memory fallback when Postgres is unreachable — production deploy must run `pnpm db push` so `dsr_requests` carries the new Sprint-4 columns.

### Sprint 3 Carry-overs (unchanged)
- Razorpay plan caching: lazy-create still per first sub.
- Webhook → DB persistence pending tenant-scoped audit middleware.
- Cookie auto-scanner: batch with Sprint 7 auto-discovery.
