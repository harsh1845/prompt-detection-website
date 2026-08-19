import { prisma } from "@/lib/db";
import type { App, DetectionEvent, Org } from "@/lib/generated/prisma/client";

const SPIKE_WINDOW_MINUTES = 60;
const COOLDOWN_MINUTES: Record<string, number> = {
  block_rate_spike: 60,
  high_confidence_injection: 15,
  gateway_error: 15,
  red_team_regression: 30,
};

type AlertDraft = {
  kind: keyof typeof COOLDOWN_MINUTES | string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  appId?: string | null;
  appName?: string | null;
};

async function recentlyAlerted(orgId: string, kind: string) {
  const cooldown = COOLDOWN_MINUTES[kind] ?? 15;
  const since = new Date(Date.now() - cooldown * 60 * 1000);

  const existing = await prisma.alert.findFirst({
    where: { orgId, kind, createdAt: { gte: since } },
    select: { id: true },
  });

  return Boolean(existing);
}

async function deliverToSlack(org: Org, draft: AlertDraft) {
  if (!org.slackWebhookUrl) return false;

  const icon =
    draft.severity === "critical"
      ? ":rotating_light:"
      : draft.severity === "warning"
        ? ":warning:"
        : ":information_source:";

  try {
    const response = await fetch(org.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${icon} *${draft.title}*\n${draft.body}`,
      }),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function createAlert(org: Org, draft: AlertDraft) {
  if (await recentlyAlerted(org.id, draft.kind)) return null;

  const delivered = await deliverToSlack(org, draft);

  return prisma.alert.create({
    data: {
      orgId: org.id,
      appId: draft.appId ?? null,
      appName: draft.appName ?? null,
      kind: draft.kind,
      severity: draft.severity,
      title: draft.title,
      body: draft.body,
      deliveredSlack: delivered,
    },
  });
}

/**
 * Phase 1 rules run inline after ingest so the MVP needs no scheduler. Each rule
 * has its own cooldown to keep a noisy attack burst from flooding Slack.
 */
export async function evaluateAlertRules(
  org: Org,
  app: App,
  event: DetectionEvent
) {
  if (
    org.alertOnHighConfidence &&
    event.status === "blocked" &&
    typeof event.confidence === "number" &&
    event.confidence >= org.alertConfidenceFloor
  ) {
    await createAlert(org, {
      kind: "high_confidence_injection",
      severity: "critical",
      title: `High-confidence injection blocked on ${app.name}`,
      body: [
        `Confidence ${(event.confidence * 100).toFixed(1)}%`,
        event.tierCaught ? `caught at tier ${event.tierCaught}` : null,
        event.label ? `labelled ${event.label}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      appId: app.id,
      appName: app.name,
    });
  }

  const since = new Date(Date.now() - SPIKE_WINDOW_MINUTES * 60 * 1000);
  const [total, blocked] = await Promise.all([
    prisma.detectionEvent.count({
      where: { orgId: org.id, createdAt: { gte: since } },
    }),
    prisma.detectionEvent.count({
      where: { orgId: org.id, status: "blocked", createdAt: { gte: since } },
    }),
  ]);

  if (total >= org.alertMinVolume) {
    const rate = (blocked / total) * 100;
    if (rate >= org.alertBlockRatePercent) {
      await createAlert(org, {
        kind: "block_rate_spike",
        severity: "warning",
        title: `Block rate at ${rate.toFixed(1)}% in the last hour`,
        body: `${blocked} of ${total} requests were blocked across ${org.name}. Threshold is ${org.alertBlockRatePercent}%.`,
        appId: app.id,
        appName: app.name,
      });
    }
  }
}

export async function recordGatewayError(
  org: Org,
  app: App | null,
  detail: string
) {
  await createAlert(org, {
    kind: "gateway_error",
    severity: "warning",
    title: "Detector unreachable from the gateway",
    body: detail,
    appId: app?.id ?? null,
    appName: app?.name ?? null,
  });
}

export async function sendTestAlert(org: Org) {
  const delivered = await deliverToSlack(org, {
    kind: "test",
    severity: "info",
    title: "PromptGuard test alert",
    body: `Alert delivery is wired up for ${org.name}.`,
  });

  await prisma.alert.create({
    data: {
      orgId: org.id,
      kind: "test",
      severity: "info",
      title: "PromptGuard test alert",
      body: delivered
        ? "Delivered to your Slack webhook."
        : "Created in-app. Add a Slack webhook to deliver externally.",
      deliveredSlack: delivered,
    },
  });

  return delivered;
}

export async function recordRedTeamAlert(
  org: Org,
  input: {
    runId: string;
    targetName: string;
    failed: number;
    regressions: number;
    passRate: number | null;
  }
) {
  if (input.failed === 0 && input.regressions === 0) return null;

  const pass = input.passRate === null ? "n/a" : `${(input.passRate * 100).toFixed(1)}%`;
  const title =
    input.regressions > 0
      ? `Red team failed ${input.regressions} new case${input.regressions === 1 ? "" : "s"} since last run`
      : `Red team failed ${input.failed} case${input.failed === 1 ? "" : "s"} on ${input.targetName}`;

  return createAlert(org, {
    kind: "red_team_regression",
    severity: input.regressions > 0 ? "critical" : "warning",
    title,
    body: [
      `${input.targetName}`,
      `Pass rate ${pass}`,
      `${input.failed} failed`,
      input.regressions > 0 ? `${input.regressions} regressions` : null,
      `Run ${input.runId}`,
    ]
      .filter(Boolean)
      .join(" · "),
  });
}
