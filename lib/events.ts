import { sha256 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { DetectionResult } from "@/lib/detector";
import type { App, ApiKey, Org } from "@/lib/generated/prisma/client";

const EXCERPT_LENGTH = 240;

export type RetentionMode = "none" | "hashed" | "raw";

export function resolveRetention(org: Pick<Org, "retentionMode">): RetentionMode {
  if (org.retentionMode === "none" || org.retentionMode === "raw") {
    return org.retentionMode;
  }
  return "hashed";
}

/**
 * Retention is per-org and defaults to hashed: we keep a fingerprint plus a
 * short excerpt so analysts can triage, without storing whole prompts.
 */
function applyRetention(text: string, mode: RetentionMode) {
  const promptHash = sha256(text);

  if (mode === "none") {
    return { promptHash, promptExcerpt: null, rawPrompt: null };
  }

  const excerpt =
    text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text;

  return {
    promptHash,
    promptExcerpt: excerpt,
    rawPrompt: mode === "raw" ? text : null,
  };
}

export type RecordEventInput = {
  org: Org;
  app: App;
  apiKey?: ApiKey | null;
  result: DetectionResult;
  /** Present when the gateway saw the prompt. Absent for self-hosted reporters. */
  text?: string | null;
  /** Required when `text` is absent so every event stays fingerprinted. */
  promptHash?: string | null;
  direction?: "input" | "output";
  model?: string | null;
  endpoint?: string | null;
};

export async function recordDetectionEvent(input: RecordEventInput) {
  const retention = input.text
    ? applyRetention(input.text, resolveRetention(input.org))
    : {
        promptHash: input.promptHash ?? "unavailable",
        promptExcerpt: null,
        rawPrompt: null,
      };

  return prisma.detectionEvent.create({
    data: {
      orgId: input.org.id,
      appId: input.app.id,
      apiKeyId: input.apiKey?.id ?? null,
      direction: input.direction ?? "input",
      status: input.result.status,
      label: input.result.label,
      riskLevel: input.result.riskLevel,
      tierCaught: input.result.tierCaught,
      confidence: input.result.confidence,
      maxChunkProbability: input.result.maxChunkProbability,
      latencyMs: input.result.latencyMs,
      heuristics: JSON.stringify(input.result.heuristics),
      model: input.model ?? null,
      endpoint: input.endpoint ?? null,
      ...retention,
    },
  });
}

export function parseHeuristics(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function percentile(sorted: number[], fraction: number) {
  if (sorted.length === 0) return null;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(fraction * sorted.length) - 1)
  );
  return sorted[index];
}

export type OverviewMetrics = {
  total: number;
  blocked: number;
  allowed: number;
  blockRate: number;
  p50: number | null;
  p95: number | null;
  byHour: { hour: string; allowed: number; blocked: number }[];
  byTier: { tier: string; count: number }[];
  topApps: { id: string; name: string; total: number; blocked: number }[];
  openAlerts: number;
};

export async function getOverviewMetrics(
  orgId: string,
  windowHours = 24
): Promise<OverviewMetrics> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const [events, apps, openAlerts] = await Promise.all([
    prisma.detectionEvent.findMany({
      where: { orgId, createdAt: { gte: since } },
      select: {
        status: true,
        latencyMs: true,
        tierCaught: true,
        appId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.app.findMany({ where: { orgId }, select: { id: true, name: true } }),
    prisma.alert.count({ where: { orgId, readAt: null } }),
  ]);

  const blocked = events.filter((event) => event.status === "blocked").length;
  const latencies = events
    .map((event) => event.latencyMs)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);

  const buckets = new Map<string, { allowed: number; blocked: number }>();
  for (let index = windowHours - 1; index >= 0; index -= 1) {
    const stamp = new Date(Date.now() - index * 60 * 60 * 1000);
    stamp.setMinutes(0, 0, 0);
    buckets.set(stamp.toISOString(), { allowed: 0, blocked: 0 });
  }

  for (const event of events) {
    const stamp = new Date(event.createdAt);
    stamp.setMinutes(0, 0, 0);
    const bucket = buckets.get(stamp.toISOString());
    if (!bucket) continue;
    if (event.status === "blocked") bucket.blocked += 1;
    else bucket.allowed += 1;
  }

  const tierCounts = new Map<string, number>();
  for (const event of events) {
    const key = event.tierCaught ? `Tier ${event.tierCaught}` : "Unattributed";
    tierCounts.set(key, (tierCounts.get(key) ?? 0) + 1);
  }

  const appTotals = new Map<string, { total: number; blocked: number }>();
  for (const event of events) {
    const current = appTotals.get(event.appId) ?? { total: 0, blocked: 0 };
    current.total += 1;
    if (event.status === "blocked") current.blocked += 1;
    appTotals.set(event.appId, current);
  }

  const appNames = new Map(apps.map((app) => [app.id, app.name]));

  return {
    total: events.length,
    blocked,
    allowed: events.length - blocked,
    blockRate: events.length === 0 ? 0 : blocked / events.length,
    p50: percentile(latencies, 0.5),
    p95: percentile(latencies, 0.95),
    byHour: [...buckets.entries()].map(([hour, counts]) => ({
      hour,
      ...counts,
    })),
    byTier: [...tierCounts.entries()]
      .map(([tier, count]) => ({ tier, count }))
      .sort((a, b) => a.tier.localeCompare(b.tier)),
    topApps: [...appTotals.entries()]
      .map(([id, counts]) => ({
        id,
        name: appNames.get(id) ?? "Removed app",
        ...counts,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    openAlerts,
  };
}
