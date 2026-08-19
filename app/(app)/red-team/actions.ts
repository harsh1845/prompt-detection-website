"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCustomPrompts, resolveCorpusItems } from "@/lib/redteam/catalog";
import { executeRun } from "@/lib/redteam/execute";
import {
  canUseRedTeam,
  clamp,
  nextWeeklyRunAt,
  redTeamLimits,
} from "@/lib/redteam/plans";
import { prisma } from "@/lib/db";
import { canWrite, requireTenantContext } from "@/lib/tenant";

export type RunFormState = { error?: string };

const DEFAULT_BODY = '{"text":"{{prompt}}"}';

function parseCorpora(formData: FormData) {
  return formData
    .getAll("corpora")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function parseHeadersJson(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "{}";
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Headers must be a JSON object.");
    }
    return JSON.stringify(parsed);
  } catch {
    throw new Error("Headers must be valid JSON, for example {\"Authorization\":\"Bearer …\"}.");
  }
}

function parseHttpUrl(raw: string) {
  const url = raw.trim();
  if (!url) throw new Error("Provide a target URL.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Target URL is not valid.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Target URL must be http or https.");
  }
  return url;
}

export async function startRedTeamRun(
  _prev: RunFormState,
  formData: FormData
): Promise<RunFormState> {
  const { org, role, user } = await requireTenantContext();
  if (!canUseRedTeam(org.plan)) {
    return { error: "Red teaming is available on the Team plan and above." };
  }
  if (!canWrite(role)) {
    return { error: "Viewers cannot start scans. Ask an analyst or admin." };
  }

  const limits = redTeamLimits(org.plan);
  const kind = String(formData.get("kind") ?? "gateway") === "http" ? "http" : "gateway";
  const appId = String(formData.get("appId") ?? "").trim() || null;
  const existingTargetId = String(formData.get("targetId") ?? "").trim() || null;
  const customText = String(formData.get("customText") ?? "");
  const corpora = parseCorpora(formData);
  const saveTarget = formData.get("saveTarget") === "on";
  const scheduleWeekly = formData.get("scheduleWeekly") === "on";

  let concurrency = clamp(Number(formData.get("concurrency") ?? 2), 1, limits.maxConcurrency);
  let timeoutSeconds = clamp(Number(formData.get("timeoutSeconds") ?? 15), 5, 60);

  if (appId) {
    const app = await prisma.app.findFirst({
      where: { id: appId, orgId: org.id },
      select: { id: true },
    });
    if (!app) return { error: "Choose an app from this workspace." };
  }

  let targetId: string | null = existingTargetId;
  let targetUrl: string | null = null;
  let targetName = "PromptGuard gateway";
  let method = "POST";
  let headersJson = "{}";
  let bodyTemplate = DEFAULT_BODY;

  if (existingTargetId) {
    const saved = await prisma.redTeamTarget.findFirst({
      where: { id: existingTargetId, orgId: org.id },
    });
    if (!saved) return { error: "Saved target not found." };
    targetId = saved.id;
    targetUrl = saved.url;
    targetName = saved.name;
    method = saved.method;
    headersJson = saved.headersJson;
    bodyTemplate = saved.bodyTemplate;
  } else if (kind === "http") {
    try {
      targetUrl = parseHttpUrl(String(formData.get("url") ?? ""));
      headersJson = parseHeadersJson(String(formData.get("headersJson") ?? ""));
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid target." };
    }
    method = String(formData.get("method") ?? "POST").toUpperCase() || "POST";
    bodyTemplate = String(formData.get("bodyTemplate") ?? "").trim() || DEFAULT_BODY;
    targetName =
      String(formData.get("targetName") ?? "").trim() ||
      (() => {
        try {
          return new URL(targetUrl).host;
        } catch {
          return "HTTP target";
        }
      })();

    if (saveTarget) {
      const created = await prisma.redTeamTarget.create({
        data: {
          orgId: org.id,
          appId,
          name: targetName,
          kind: "http",
          url: targetUrl,
          method,
          headersJson,
          bodyTemplate,
        },
      });
      targetId = created.id;
    }
  } else {
    const app = appId
      ? await prisma.app.findFirst({
          where: { id: appId, orgId: org.id },
          select: { name: true },
        })
      : null;
    targetName = app ? `${app.name} via gateway` : "PromptGuard gateway";
  }

  const customCount = parseCustomPrompts(customText, limits.maxCustom).length;
  const items = resolveCorpusItems(corpora, customText, limits.maxItems);
  if (items.length === 0) {
    return { error: "Pick at least one corpus, or paste a custom prompt list." };
  }

  if (scheduleWeekly) {
    await prisma.redTeamSchedule.create({
      data: {
        orgId: org.id,
        appId,
        targetId,
        enabled: true,
        cadence: "weekly",
        targetKind: kind,
        targetUrl,
        targetName,
        method,
        headersJson,
        bodyTemplate,
        corporaJson: JSON.stringify(corpora),
        customText,
        concurrency,
        timeoutSeconds,
        nextRunAt: nextWeeklyRunAt(),
      },
    });
  }

  const run = await prisma.redTeamRun.create({
    data: {
      orgId: org.id,
      appId,
      targetId,
      createdById: user.id,
      status: "queued",
      trigger: "manual",
      targetKind: kind,
      targetUrl,
      targetName,
      method,
      headersJson,
      bodyTemplate,
      corporaJson: JSON.stringify(corpora),
      customText,
      customCount,
      concurrency,
      timeoutSeconds,
      totalItems: items.length,
    },
  });

  void executeRun(run.id);
  revalidatePath("/red-team");
  redirect(`/red-team/${run.id}`);
}

export async function rerunRedTeam(formData: FormData) {
  const { org, role, user } = await requireTenantContext();
  if (!canUseRedTeam(org.plan) || !canWrite(role)) {
    redirect("/overview?error=forbidden");
  }

  const runId = String(formData.get("runId") ?? "");
  const previous = await prisma.redTeamRun.findFirst({
    where: { id: runId, orgId: org.id },
  });
  if (!previous) redirect("/red-team");

  const run = await prisma.redTeamRun.create({
    data: {
      orgId: org.id,
      appId: previous.appId,
      targetId: previous.targetId,
      createdById: user.id,
      status: "queued",
      trigger: "manual",
      targetKind: previous.targetKind,
      targetUrl: previous.targetUrl,
      targetName: previous.targetName,
      method: previous.method,
      headersJson: previous.headersJson,
      bodyTemplate: previous.bodyTemplate,
      corporaJson: previous.corporaJson,
      customText: previous.customText,
      customCount: previous.customCount,
      concurrency: previous.concurrency,
      timeoutSeconds: previous.timeoutSeconds,
      totalItems: previous.totalItems,
    },
  });

  void executeRun(run.id);
  redirect(`/red-team/${run.id}`);
}

export async function setScheduleEnabled(formData: FormData) {
  const { org, role } = await requireTenantContext();
  if (!canWrite(role)) redirect("/overview?error=forbidden");

  const scheduleId = String(formData.get("scheduleId") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";

  await prisma.redTeamSchedule.updateMany({
    where: { id: scheduleId, orgId: org.id },
    data: {
      enabled,
      ...(enabled ? { nextRunAt: nextWeeklyRunAt() } : {}),
    },
  });

  revalidatePath("/red-team");
}

export async function deleteSchedule(formData: FormData) {
  const { org, role } = await requireTenantContext();
  if (!canWrite(role)) redirect("/overview?error=forbidden");

  const scheduleId = String(formData.get("scheduleId") ?? "");
  await prisma.redTeamSchedule.deleteMany({
    where: { id: scheduleId, orgId: org.id },
  });
  revalidatePath("/red-team");
}
