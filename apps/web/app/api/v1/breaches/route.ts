/**
 * Sprint 5 Task 5.1 + 5.2 — Breach incident list / create.
 *
 *   GET  /api/v1/breaches            (X-Tenant-Id) → list + counts + clock states
 *   POST /api/v1/breaches            (X-Tenant-Id) → create + run AI classifier + start dual-clock
 *     body: { detectedAt?, title, narrative, category?, affectedCount?, affectedCategories?,
 *             sectoralOverlays?, scoreInputs?, drillCode? }
 *
 * If `drillCode` is set, the body is hydrated from the matching drill
 * scenario (Sprint 5 Task 5.12).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildRefNo,
  CATEGORY_LABELS,
  computeClockState,
  computeDeadlines,
  STATUS_LABELS,
  type BreachCategory,
} from "../../../../lib/breach/core";
import {
  insertBreach,
  listBreachesByTenant,
  type BreachContainmentStep,
} from "../../../../lib/breach/store";
import { classifyBreach } from "../../../../lib/ai/breach-classifier";
import { computeCustomDueAts, type BreachScoreInputs } from "@complianceos/rules-engine";
import { getDrillScenario } from "../../../../lib/breach/drill";
import { buildTeamAlert, notifyBreach } from "../../../../lib/breach/notify";

export const runtime = "nodejs";

function requireTenant(req: NextRequest): string | NextResponse {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing X-Tenant-Id header" },
      { status: 400 },
    );
  }
  return tenantId;
}

let SEQ_COUNTER = 0;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const tenant = requireTenant(req);
  if (tenant instanceof NextResponse) return tenant;

  const records = await listBreachesByTenant(tenant);
  const now = new Date();

  const enriched = records.map((r) => {
    const certIn = r.certInDueAt ? computeClockState(new Date(r.certInDueAt), now) : null;
    const dpb = r.dpbDueAt ? computeClockState(new Date(r.dpbDueAt), now) : null;
    return {
      id: r.id,
      refNo: r.refNo,
      title: r.title,
      category: r.category,
      categoryLabel: CATEGORY_LABELS[r.category as BreachCategory] ?? r.category,
      severity: r.severity,
      status: r.status,
      statusLabel: STATUS_LABELS[r.status],
      detectedAt: r.detectedAt,
      certInDueAt: r.certInDueAt,
      dpbDueAt: r.dpbDueAt,
      certInClock: certIn,
      dpbClock: dpb,
      certInFiledAt: r.certInFiledAt,
      dpbInitialFiledAt: r.dpbInitialFiledAt,
      dpbDetailedFiledAt: r.dpbDetailedFiledAt,
      affectedCount: r.affectedCount,
      sectoralOverlays: r.sectoralOverlays,
      notificationsSent: r.notificationsSent,
    };
  });

  const counts = {
    total: enriched.length,
    open: enriched.filter((b) => b.status !== "closed").length,
    certInOverdue: enriched.filter((b) => b.certInClock?.isOverdue && !b.certInFiledAt).length,
    dpbOverdue: enriched.filter((b) => b.dpbClock?.isOverdue && !b.dpbInitialFiledAt).length,
    criticalOpen: enriched.filter((b) => b.severity === "critical" && b.status !== "closed").length,
  };

  return NextResponse.json({ breaches: enriched, counts });
}

interface CreateBody {
  drillCode?: string;
  detectedAt?: string;
  title?: string;
  narrative?: string;
  category?: BreachCategory;
  affectedCount?: number;
  affectedCategories?: string[];
  sectoralOverlays?: string[];
  scoreInputs?: BreachScoreInputs;
  reporterUserId?: string;
  discoveredVia?: string;
  containmentSteps?: BreachContainmentStep[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const tenant = requireTenant(req);
  if (tenant instanceof NextResponse) return tenant;

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Drill prefill
  if (body.drillCode) {
    const scenario = getDrillScenario(body.drillCode);
    if (!scenario) {
      return NextResponse.json({ error: `Unknown drillCode: ${body.drillCode}` }, { status: 404 });
    }
    body = {
      ...body,
      title: body.title ?? scenario.title,
      narrative: body.narrative ?? scenario.narrative,
      category: body.category ?? scenario.category,
      affectedCount: body.affectedCount ?? scenario.scoreInputs.affectedCount,
      affectedCategories: body.affectedCategories ?? scenario.affectedCategories,
      sectoralOverlays: body.sectoralOverlays ?? scenario.sectoralOverlays,
      scoreInputs: body.scoreInputs ?? scenario.scoreInputs,
      discoveredVia: body.discoveredVia ?? "drill",
      containmentSteps: body.containmentSteps ?? scenario.containmentSteps,
    };
  }

  if (!body.title || !body.narrative) {
    return NextResponse.json({ error: "title and narrative are required" }, { status: 400 });
  }

  const detectedAt = body.detectedAt ? new Date(body.detectedAt) : new Date();
  const { certInDueAt, dpbDueAt } = computeDeadlines(detectedAt);

  // AI classification — drives severity + draft narrative
  const classification = await classifyBreach({
    freeText: `${body.title}\n\n${body.narrative}`,
    scoreInputs: body.scoreInputs ?? {
      affectedCount: body.affectedCount,
      affectedCategories: body.affectedCategories,
    },
  });

  const customDueAts = computeCustomDueAts(detectedAt, body.sectoralOverlays ?? []);

  SEQ_COUNTER += 1;
  const refNo = buildRefNo(SEQ_COUNTER + Math.floor(Date.now() / 1000) % 1000);

  const record = await insertBreach({
    tenantId: tenant,
    refNo,
    detectedAt: detectedAt.toISOString(),
    reportedAt: new Date().toISOString(),
    certInDueAt: certInDueAt.toISOString(),
    dpbDueAt: dpbDueAt.toISOString(),
    severity: classification.severity,
    category: body.category ?? classification.category,
    affectedCount: body.affectedCount ?? null,
    affectedCategories: body.affectedCategories ?? [],
    rootCause: null,
    status: "open",
    certInFiledAt: null,
    dpbInitialFiledAt: null,
    dpbDetailedFiledAt: null,
    notificationsSent: 0,
    evidenceBucketPath: null,
    title: body.title,
    narrative: body.narrative,
    discoveredVia: body.discoveredVia ?? "user_report",
    reporterUserId: body.reporterUserId ?? null,
    containmentSteps: body.containmentSteps ?? [],
    sectoralOverlays: body.sectoralOverlays ?? [],
    customDueAts,
    evidence: [],
    aiClassification: classification,
    alertsFired: [],
  });

  // Fire team alert immediately — DPO/CISO need to know
  await notifyBreach(buildTeamAlert(record));

  return NextResponse.json(record, { status: 201 });
}
