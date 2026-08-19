import Link from "next/link";
import PassRateChart from "@/components/dashboard/PassRateChart";
import SubmitButton from "@/components/dashboard/SubmitButton";
import {
  Badge,
  EmptyState,
  Panel,
  StatCard,
  primaryButtonClass,
} from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@/lib/format";
import { canUseRedTeam } from "@/lib/redteam/plans";
import { canWrite, requireTenantContext } from "@/lib/tenant";
import { deleteSchedule, setScheduleEnabled } from "./actions";

function outcomeTone(status: string) {
  if (status === "failed") return "crit" as const;
  if (status === "running" || status === "queued") return "warn" as const;
  return "signal" as const;
}

export default async function RedTeamPage() {
  const { org, role } = await requireTenantContext();
  const writable = canWrite(role);

  if (!canUseRedTeam(org.plan)) {
    return (
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
            Red team
          </p>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
            Adversarial testing
          </h1>
        </div>
        <EmptyState
          title="Red teaming is on Team"
          body="Weekly jailbreak, injection, and prompt-leak scans against your own apps, with pass-rate history and a report you can export for a security review. This workspace is on the Free plan."
        />
      </div>
    );
  }

  const [runs, schedules] = await Promise.all([
    prisma.redTeamRun.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { app: { select: { name: true } } },
    }),
    prisma.redTeamSchedule.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const completed = runs.filter((run) => run.status === "completed");
  const latest = completed[0];
  const avgPass =
    completed.length === 0
      ? null
      : completed.reduce((sum, run) => sum + (run.passRate ?? 0), 0) /
        completed.length;
  const openRegressions = completed[0]
    ? JSON.parse(completed[0].regressionsJson || "[]").length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
            Red team
          </p>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
            Adversarial testing
          </h1>
          <p className="mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-mute">
            Run curated jailbreak and injection packs against PromptGuard or your
            own HTTP endpoint. Diffs call out regressions after a model swap.
          </p>
        </div>
        {writable ? (
          <Link href="/red-team/new" className={primaryButtonClass}>
            New scan
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline lg:grid-cols-4">
        <StatCard
          label="Latest pass rate"
          value={latest?.passRate == null ? "—" : formatPercent(latest.passRate, 0)}
          hint={latest ? formatRelative(latest.createdAt) : "no completed runs"}
          tone={
            latest?.passRate != null && latest.passRate < 0.85 ? "crit" : "signal"
          }
        />
        <StatCard
          label="Average pass rate"
          value={avgPass == null ? "—" : formatPercent(avgPass, 0)}
          hint={`${formatNumber(completed.length)} completed`}
        />
        <StatCard
          label="Latest regressions"
          value={formatNumber(openRegressions)}
          hint="new fails vs prior run"
          tone={openRegressions > 0 ? "crit" : "neutral"}
        />
        <StatCard
          label="Weekly schedules"
          value={formatNumber(schedules.filter((row) => row.enabled).length)}
          hint={`${formatNumber(schedules.length)} total`}
        />
      </div>

      {completed.length > 1 ? (
        <Panel title="Pass rate" description="Completed scans, oldest to newest">
          <PassRateChart
            runs={completed.slice(0, 12).map((run) => ({
              id: run.id,
              passRate: run.passRate,
              createdAt: run.createdAt.toISOString(),
            }))}
          />
        </Panel>
      ) : null}

      {schedules.length > 0 ? (
        <Panel title="Weekly schedules">
          <ul className="divide-y divide-hairline">
            {schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-display text-[15px] font-semibold tracking-tighter text-ink">
                    {schedule.targetName}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-mute">
                    {schedule.enabled ? "enabled" : "paused"} · next{" "}
                    {formatDateTime(schedule.nextRunAt)}
                    {schedule.lastRunAt
                      ? ` · last ${formatRelative(schedule.lastRunAt)}`
                      : ""}
                  </p>
                </div>
                {writable ? (
                  <div className="flex gap-2">
                    <form action={setScheduleEnabled}>
                      <input type="hidden" name="scheduleId" value={schedule.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={schedule.enabled ? "false" : "true"}
                      />
                      <SubmitButton variant="ghost" pendingLabel="Saving…">
                        {schedule.enabled ? "Pause" : "Resume"}
                      </SubmitButton>
                    </form>
                    <form action={deleteSchedule}>
                      <input type="hidden" name="scheduleId" value={schedule.id} />
                      <SubmitButton variant="ghost" pendingLabel="Removing…">
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Scans">
        {runs.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No scans yet"
              body="Start with a gateway replay of the jailbreak and injection packs. That tells you whether PromptGuard still catches the cases you care about after a model or policy change."
              action={
                writable ? (
                  <Link href="/red-team/new" className={primaryButtonClass}>
                    Configure a run
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-hairline bg-elevated/60 font-mono text-[10px] uppercase tracking-wider text-mute">
                  <th className="px-5 py-2 text-left">When</th>
                  <th className="px-5 py-2 text-left">Target</th>
                  <th className="px-5 py-2 text-left">Status</th>
                  <th className="px-5 py-2 text-right">Pass rate</th>
                  <th className="px-5 py-2 text-right">Failed</th>
                  <th className="px-5 py-2 text-right">Regressions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const regressions = JSON.parse(run.regressionsJson || "[]") as unknown[];
                  return (
                    <tr
                      key={run.id}
                      className="border-b border-hairline last:border-0 hover:bg-elevated/40"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/red-team/${run.id}`}
                          className="font-mono text-[12px] text-mute hover:text-signal"
                        >
                          {formatRelative(run.createdAt)}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-body text-[13px] text-ink">{run.targetName}</p>
                        <p className="font-mono text-[11px] text-mute">
                          {run.targetKind}
                          {run.app?.name ? ` · ${run.app.name}` : ""}
                          {run.trigger === "schedule" ? " · scheduled" : ""}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={outcomeTone(run.status)}>{run.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[12px] text-ink">
                        {run.passRate == null ? "—" : formatPercent(run.passRate, 0)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[12px] text-crit">
                        {run.status === "completed" ? formatNumber(run.failed) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[12px] text-mute">
                        {run.status === "completed"
                          ? formatNumber(regressions.length)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
