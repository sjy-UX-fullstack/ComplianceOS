# ComplianceOS — Sprint Task Breakdown

> Companion to the [Master Plan](file:///Users/sanjayt/.gemini/antigravity/brain/2bed716a-1a1c-47bc-bf34-9ed3b8467aae/complianceos_master_plan.md). Each sprint = 2 weeks.

---

## Sprint 0 — Foundation (Weeks 1–2)

### Engineering Tasks

| # | Task | Owner | Tables/APIs | Done |
|---|---|---|---|---|
| 0.1 | Init Turborepo monorepo (`apps/web`, `apps/banner-sdk`, `packages/db`, `packages/config`, `packages/rules-engine`, `packages/workers`) | Lead | — | ☐ |
| 0.2 | Docker Compose: PG 16, Redis 7, MinIO | Lead | — | ☐ |
| 0.3 | Drizzle ORM setup + migration pipeline | Backend | `platform_admins`, `agencies`, `tenants` | ☐ |
| 0.4 | Users + RBAC schema + seed data | Backend | `users`, `roles`, `permissions`, `role_permissions`, `memberships` | ☐ |
| 0.5 | RLS policies on all tenant tables + `app_role` (non-superuser) | Backend | All tenant-scoped | ☐ |
| 0.6 | Tenant resolver middleware (subdomain → X-Tenant-Id → JWT) | Backend | — | ☐ |
| 0.7 | Clerk integration (signup/login/MFA) | Backend | — | ☐ |
| 0.8 | WorkOS stub (SAML/OIDC — config only, test later) | Backend | — | ☐ |
| 0.9 | `audit_logs` + HMAC-SHA256 hash chain | Backend | `audit_logs`, `audit_anchors` | ☐ |
| 0.10 | Merkle root BullMQ worker (daily) | Backend | `audit_anchors` | ☐ |
| 0.11 | Audit chain verifier CLI | Backend | — | ☐ |
| 0.12 | Casbin RBAC policy (8 roles + ABAC attrs) | Backend | — | ☐ |
| 0.13 | GitHub Actions CI pipeline | DevOps | — | ☐ |
| 0.14 | Terraform modules (RDS, ElastiCache, S3, ECS, KMS) | DevOps | — | ☐ |
| 0.15 | **Integration test**: cross-tenant isolation (must return 0 rows) | QA | — | ☐ |
| 0.16 | **Integration test**: forged tenant header → 0 rows + severity=high log | QA | — | ☐ |

### Definition of Done
- [ ] `pnpm test` green with cross-tenant isolation tests passing
- [ ] Audit hash chain verifies via CLI on 1000+ entries
- [ ] CI deploys to staging ECS cluster

---

## Sprint 1 — Assessment + CMP Banner (Weeks 3–4)

| # | Task | Tables/APIs | Done |
|---|---|---|---|
| 1.1 | Assessment question bank schema (JSONB, versioned) | `assessment_questions`, `assessment_responses` | ☐ |
| 1.2 | 60-question pack: 7 industry overlays | Seed data | ☐ |
| 1.3 | Rule-weighted scoring engine | `packages/rules-engine` | ☐ |
| 1.4 | Gap heatmap UI + 90-day plan generator | Frontend | ☐ |
| 1.5 | PDF + JSON export | API: `GET /v1/assessments/{id}/export` | ☐ |
| 1.6 | Banner SDK: `init`, `open`, `withdraw`, `status` | `apps/banner-sdk` | ☐ |
| 1.7 | Banner: IAB TCF v2.3 + Google CM v2 + GPC | SDK | ☐ |
| 1.8 | Banner: MutationObserver tracker suppression | SDK | ☐ |
| 1.9 | Consent record storage + hash chain | `consents`, `consent_records`, `consent_logs` | ☐ |
| 1.10 | `consent_purposes` CRUD + RLS | API: `GET/POST /v1/consents` | ☐ |
| 1.11 | Public consent endpoint | API: `POST /v1/public/consent` | ☐ |
| 1.12 | Banner size validation (<5KB gz) | CI check | ☐ |

---

## Sprint 2 — Policy Gen + White-Label (Weeks 5–6)

| # | Task | Tables/APIs | Done |
|---|---|---|---|
| 2.1 | Rule-3 Privacy Notice template (EN + HI) | `document_templates`, `policies`, `policy_versions` | ☐ |
| 2.2 | Cookie Policy template | `document_templates` | ☐ |
| 2.3 | AI Policy Generator (Claude → RAG over DPDP Act text) | `services/ai-gateway` | ☐ |
| 2.4 | Presidio PII redaction layer (Aadhaar/PAN/UPI/IFSC/mobile) | AI Gateway | ☐ |
| 2.5 | Version control + diff view for policies | Frontend | ☐ |
| 2.6 | Theme builder: CSS vars, logo, palette, favicon | `tenant_branding` | ☐ |
| 2.7 | Custom domain CNAME + ACM cert provisioning | `agency_domains` | ☐ |
| 2.8 | Agency → Client hierarchy | Middleware | ☐ |
| 2.9 | Client invite flow (email) | API + SES | ☐ |
| 2.10 | Public notice endpoint | API: `GET /v1/public/notice/{slug}/{lang}` | ☐ |
| 2.11 | Bhashini API integration for translation | `lib/i18n` | ☐ |

---

## Sprint 3 — Billing + Frontend Shell (Weeks 7–8)

| # | Task | Tables/APIs | Done |
|---|---|---|---|
| 3.1 | Plan tiers seed data (Free → Enterprise) | `plans` | ☐ |
| 3.2 | Razorpay Subscriptions integration | `subscriptions` | ☐ |
| 3.3 | UPI Autopay mandate (₹1 auth + pre-debit) | `subscriptions` | ☐ |
| 3.4 | GST invoice generation (18%) | `invoices` | ☐ |
| 3.5 | Payment webhook handlers | API | ☐ |
| 3.6 | App Router layouts: marketing/platform/agency/dpo/public | Frontend | ☐ |
| 3.7 | shadcn/ui component library + design tokens | Frontend | ☐ |
| 3.8 | Dashboard shell with sidebar nav | Frontend | ☐ |
| 3.9 | Preference Centre at `/privacy` | Frontend | ☐ |
| 3.10 | Cookie auto-scanner (nightly Puppeteer job) | BullMQ worker | ☐ |
| 3.11 | Onboarding wizard (industry start-packs) | Frontend | ☐ |
| 3.12 | **E2E test**: signup → plan → banner → notice → UPI debit | QA | ☐ |

---

## Sprint 4 — DSR Portal (Weeks 9–10)

| # | Task | Tables/APIs | Done |
|---|---|---|---|
| 4.1 | DSR request CRUD + RLS | `dsr_requests` | ☐ |
| 4.2 | Public DSR submission | API: `POST /v1/public/dsr` | ☐ |
| 4.3 | Status polling endpoint | API: `GET /v1/public/dsr/{token}/status` | ☐ |
| 4.4 | Identity verification: email OTP, mobile OTP | API | ☐ |
| 4.5 | DigiLocker XML verification (Setu integration) | API | ☐ |
| 4.6 | 90-day SLA timer + BullMQ alert jobs (T-30/T-10/T-1) | Workers | ☐ |
| 4.7 | Auto-escalation at T=0 → `grievance_overdue` | Workers | ☐ |
| 4.8 | Response packet auto-assembly from RoPA | API | ☐ |
| 4.9 | Nomination support (Sec 14) | `dsr_requests.nominee_ref` | ☐ |
| 4.10 | WhatsApp + email status notifications | Workers | ☐ |
| 4.11 | DSR workflow board UI | Frontend | ☐ |
| 4.12 | AI: classify free-text → right type | AI Gateway | ☐ |
| 4.13 | AI: redact third-party PII in access exports | AI Gateway | ☐ |
| 4.14 | `privacy.{client-domain}` routing (no marketing chrome) | Frontend | ☐ |

---

## Sprint 5 — Breach Wizard (Weeks 11–12)

| # | Task | Tables/APIs | Done |
|---|---|---|---|
| 5.1 | Breach incident CRUD + auto ref_no | `breach_incidents` | ☐ |
| 5.2 | Dual-clock timers: CERT-In 6h + DPB 72h (IST) | `cert_in_due_at`, `dpb_due_at` | ☐ |
| 5.3 | Severity scoring engine | `packages/rules-engine` | ☐ |
| 5.4 | CERT-In Annexure-I PDF generator | API: `POST /v1/breaches/{id}/file-certin` | ☐ |
| 5.5 | DPB initial + 72h detailed report generator | API: `POST /v1/breaches/{id}/file-dpb` | ☐ |
| 5.6 | Data Principal notification (multi-channel) | Workers | ☐ |
| 5.7 | Evidence locker: S3 Object Lock (7yr compliance) | S3 | ☐ |
| 5.8 | Sectoral overlay configs (RBI 2h/6h, IRDAI, TRAI) | Config | ☐ |
| 5.9 | BullMQ timer alerts (approaching deadlines) | Workers | ☐ |
| 5.10 | Breach wizard UI (72h countdown, severity matrix) | Frontend | ☐ |
| 5.11 | AI: severity classifier + draft narrative | AI Gateway | ☐ |
| 5.12 | **Drill test**: seed scenario → both filings validate against JSON schemas | QA | ☐ |

---

## Sprint 6 — Vendor Manager (Weeks 13–14)

| # | Task | Tables/APIs | Done |
|---|---|---|---|
| 6.1 | Vendor register CRUD | `vendors`, API: `GET/POST /v1/vendors` | ☐ |
| 6.2 | DPA generator (DPDP-aligned template engine) | `dpas` | ☐ |
| 6.3 | Assessment questionnaire + scoring | `vendor_assessments` | ☐ |
| 6.4 | SBOM upload + parsing | S3 + API | ☐ |
| 6.5 | SOC 2/ISO 27001 cert tracker + expiry alerts | `vendors.certs` | ☐ |
| 6.6 | Rule 15 negative-list watcher (config-driven) | `packages/rules-engine` | ☐ |
| 6.7 | AI: parse SOC 2 → control gaps | AI Gateway | ☐ |
| 6.8 | AI: summarize vendor privacy policy | AI Gateway | ☐ |
| 6.9 | Vendor risk dashboard widget | Frontend | ☐ |
| 6.10 | Webhook: `vendor.risk_changed` | API | ☐ |

---

## Sprint 7 — RoPA + Auto-Discovery (Weeks 15–16)

| # | Task | Tables/APIs | Done |
|---|---|---|---|
| 7.1 | Processing activities CRUD + RLS | `processing_activities`, API: `GET/POST /v1/ropa/activities` | ☐ |
| 7.2 | Data assets + data flows CRUD | `data_assets`, `data_flows` | ☐ |
| 7.3 | CSV/Excel bulk import | API | ☐ |
| 7.4 | Auto-discovery: Postgres/MySQL/MongoDB sniffer | Worker | ☐ |
| 7.5 | Auto-discovery: S3 bucket scanner | Worker | ☐ |
| 7.6 | Tally API integration | Worker | ☐ |
| 7.7 | Zoho Books connector | Worker | ☐ |
| 7.8 | React Flow data-flow visualizer | Frontend | ☐ |
| 7.9 | Rule 8 retention engine + 48h pre-delete notices | BullMQ cron | ☐ |
| 7.10 | Cross-border flow checker (Rule 15) | Rules engine | ☐ |
| 7.11 | AI: free-text → RoPA rows | AI Gateway | ☐ |

---

## Sprint 8 — LMS + Dashboard (Weeks 17–18)

| # | Task | Tables/APIs | Done |
|---|---|---|---|
| 8.1 | Courses + modules CRUD | `courses`, `course_modules` | ☐ |
| 8.2 | SCORM-compatible content player | Frontend | ☐ |
| 8.3 | Quiz engine with scoring | Frontend + API | ☐ |
| 8.4 | Certificate PDF + verification URL | `course_completions` | ☐ |
| 8.5 | Bhashini TTS for 22-language scripts | Workers | ☐ |
| 8.6 | 12-month auto-refresher BullMQ cron | Workers | ☐ |
| 8.7 | Dashboard widgets (score, DSRs, breaches, consents, vendors, training) | Frontend | ☐ |
| 8.8 | Agency aggregation view (≥10 tenants) | API: `GET /v1/dashboard/overview` | ☐ |
| 8.9 | Weekly/monthly auto-email reports | BullMQ | ☐ |
| 8.10 | CSV/PDF export | API | ☐ |

---

## Sprints 9–10 — Integrations + Hardening + Launch (Weeks 19–22)

See [Master Plan](file:///Users/sanjayt/.gemini/antigravity/brain/2bed716a-1a1c-47bc-bf34-9ed3b8467aae/complianceos_master_plan.md) Phases 5–6 for full details.

**Sprint 9**: WordPress/Shopify/WooCommerce plugins, Slack/Teams, calendar integrations, sandbox environment.

**Sprint 10**: Pen test, DR drill, SOC 2 evidence, performance benchmarks, launch assets.

---

## Sprints 11–14 — Post-Launch Phase 2 (Weeks 23–30)

| Sprint | Focus |
|---|---|
| 11 | CM registration pack + CM-mode relay toggle |
| 12 | OneTrust/Consentin migration scripts; legal-template marketplace |
| 13 | Expo mobile app (case board, breach pager, biometric); browser extension |
| 14 | Children's consent (DigiLocker age-token + parent OTP); referral program |

---

## Sprints 15–20 — SDF & Full Compliance (Weeks 31–42)

| Sprint | Focus |
|---|---|
| 15 | DPIA workflow: risk register, mitigation register, sign-off |
| 16 | SDF: algorithmic-due-diligence register; DPO unified inbox |
| 17 | Retention automation: per-purpose crons, 48h notices, 3yr rule |
| 18 | Government access register (Rule 23); AI regulatory change monitor |
| 19 | Cross-border register; cyber-insurance partnership; AI risk detector |
| 20 | Final hardening; Rule 13(4) traffic-data proofs; regulator dashboards |

---

## Key Technical Patterns

### Tenant Isolation (every request)
```
1. Resolve tenant_id from subdomain/header/JWT
2. SET app.current_tenant = '<tenant_uuid>'
3. All queries automatically filtered by RLS
4. NEVER use superuser role in app code
```

### Audit Log Entry (every state change)
```
1. Compute payload_canonical = JSON.stringify(sort_keys(payload))
2. row_hash = HMAC-SHA256(secret, prev_hash + payload_canonical + metadata)
3. INSERT INTO audit_logs (prev_hash, row_hash, ...)
4. Daily: compute Merkle root over new entries → audit_anchors
```

### AI Gateway (every AI call)
```
1. Extract PII via Presidio (Aadhaar/PAN/UPI/IFSC/mobile patterns)
2. Replace PII with tokens
3. Route to Claude Sonnet 4.5 (primary) or GPT-4.1 (fallback)
4. Re-inject PII tokens in response
5. Append citation: Rule + Schedule + Section
6. Check per-tenant monthly cap
```
