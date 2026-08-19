import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { executeRun } from "@/lib/redteam/execute";
import { canUseRedTeam, nextWeeklyRunAt, redTeamLimits } from "@/lib/redteam/plans";
import { resolveCorpusItems } from "@/lib/redteam/catalog";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const query = new URL(request.url).searchParams.get("secret");
    return bearer === secret || query === secret;
  }
  return process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.redTeamSchedule.findMany({
    where: { enabled: true, nextRunAt: { lte: new Date() } },
  });

  const started: string[] = [];

  for (const schedule of due) {
    const org = await prisma.org.findUnique({ where: { id: schedule.orgId } });
    if (!org || !canUseRedTeam(org.plan)) continue;

    const limits = redTeamLimits(org.plan);
    const corpora = JSON.parse(schedule.corporaJson || "[]") as string[];
    const items = resolveCorpusItems(
      Array.isArray(corpora) ? corpora : [],
      schedule.customText,
      limits.maxItems
    );

    const run = await prisma.redTeamRun.create({
      data: {
        orgId: schedule.orgId,
        appId: schedule.appId,
        targetId: schedule.targetId,
        status: "queued",
        trigger: "schedule",
        targetKind: schedule.targetKind,
        targetUrl: schedule.targetUrl,
        targetName: schedule.targetName,
        method: schedule.method,
        headersJson: schedule.headersJson,
        bodyTemplate: schedule.bodyTemplate,
        corporaJson: schedule.corporaJson,
        customText: schedule.customText,
        customCount: items.filter((item) => item.corpus === "custom").length,
        concurrency: schedule.concurrency,
        timeoutSeconds: schedule.timeoutSeconds,
        totalItems: items.length,
      },
    });

    await prisma.redTeamSchedule.update({
      where: { id: schedule.id },
      data: { lastRunAt: new Date(), nextRunAt: nextWeeklyRunAt() },
    });

    await executeRun(run.id);
    started.push(run.id);
  }

  return NextResponse.json({ started: started.length, ids: started });
}
