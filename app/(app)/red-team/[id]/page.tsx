import Link from "next/link";
import {
  Badge,
  Panel,
  StatCard,
  ghostButtonClass,
  primaryButtonClass,
} from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import {
  formatDateTime,
  formatLatency,
  formatNumber,
  formatPercent,
  titleCase,
} from "@/lib/format";
import { canWrite, requireTenantContext } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { rerunRedTeam } from "../actions";
import AutoRefresh from "./AutoRefresh";

function outcomeTone(outcome: string) {
  if (outcome === "fail") return "crit" as const;
  if (outcome === "error") return "warn" as const;
  return "safe" as const;
}

export default async function RedTeamRunPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { view?: string };
}) {
  const { org, role } = await requireTenantContext();
  const run = await prisma.redTeamRun.findFirst({
    where: { id: params.id, orgId: org.id },
    include: {
      app: { select: { name: true } },
      items: { orderBy: [{ corpus: "asc" }, { sourceId: "asc" }] },
    },
  });

  if (!run) notFound();

  const view = searchParams.view ?? "all";
  const items = run.items.filter((item) => {
    if (view === "fail") return item.outcome === "fail";
    if (view === "error") return item.outcome === "error";
    if (view === "regressions") return item.isRegression;
    return true;
  });

  const corpora = JSON.parse(run.corporaJson || "[]") as string[];
  const regressions = JSON.parse(run.regressionsJson || "[]") as {
    id?: string;
    corpus?: string;
    excerpt?: string;
  }[];
  const live = run.status === "queued" || run.status === "running";

  return (
    <div className="space-y-6">
      <AutoRefresh active={live} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
            Red team run
          </p>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
            {run.targetName}
          </h1>
          <p className="mt-2 font-body text-[14px] text-mute">
            {titleCase(run.targetKind)} · {run.trigger}
            {run.app?.name ? ` · ${run.app.name}` : ""} ·{" "}
            {formatDateTime(run.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/red-team" className={ghostButtonClass}>
            All scans
          </Link>
          <Link href={`/red-team/${run.id}/export`} className={ghostButtonClass}>
            Export report
          </Link>
          {canWrite(role) ? (
            <form action={rerunRedTeam}>
              <input type="hidden" name="runId" value={run.id} />
              <button type="submit" className={primaryButtonClass}>
                Re-run
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {run.errorMessage ? (
        <p className="rounded-sm border border-crit/30 bg-crit/10 px-4 py-3 font-body text-[13px] text-crit">
          {run.errorMessage}
        </p>
      ) : null}

      {live ? (
        <p className="rounded-sm border border-warn/30 bg-warn/10 px-4 py-3 font-body text-[13px] text-warn">
          Scan {run.status}. This page refreshes until it finishes.
          {run.totalItems ? ` ${run.totalItems} items queued.` : ""}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline lg:grid-cols-5">
        <StatCard
          label="Pass rate"
          value={run.passRate == null ? "—" : formatPercent(run.passRate, 0)}
          tone={run.passRate != null && run.passRate < 0.85 ? "crit" : "signal"}
        />
        <StatCard label="Passed" value={formatNumber(run.passed)} />
        <StatCard
          label="Failed"
          value={formatNumber(run.failed)}
          tone={run.failed > 0 ? "crit" : "neutral"}
        />
        <StatCard label="Errors" value={formatNumber(run.errors)} />
        <StatCard
          label="Regressions"
          value={formatNumber(regressions.length)}
          tone={regressions.length > 0 ? "crit" : "neutral"}
        />
      </div>

      <Panel title="Configuration">
        <dl className="grid gap-0 sm:grid-cols-2">
          {[
            ["Corpora", corpora.join(", ") || "custom only"],
            ["Custom prompts", String(run.customCount)],
            ["Concurrency", String(run.concurrency)],
            ["Timeout", `${run.timeoutSeconds}s`],
            ["URL", run.targetUrl ?? "PromptGuard detector"],
            [
              "Duration",
              run.startedAt && run.finishedAt
                ? `${Math.max(1, Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000))}s`
                : live
                  ? "in progress"
                  : "—",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-hairline px-5 py-3 last:border-0 sm:even:border-l"
            >
              <dt className="font-body text-[13px] text-mute">{label}</dt>
              <dd className="max-w-[60%] truncate text-right font-mono text-[12px] text-ink">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      {regressions.length > 0 ? (
        <Panel
          title="Regressions"
          description="Cases that passed last time and failed now"
        >
          <ul className="divide-y divide-hairline">
            {regressions.map((row, index) => (
              <li key={`${row.id}-${index}`} className="px-5 py-3">
                <p className="font-mono text-[11px] text-mute">
                  {row.corpus} · {row.id}
                </p>
                <p className="mt-1 font-body text-[13px] text-ink">{row.excerpt}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel
        title="Cases"
        action={
          <div className="flex gap-3 font-body text-[13px]">
            {[
              ["all", "All"],
              ["fail", "Failed"],
              ["error", "Errors"],
              ["regressions", "Regressions"],
            ].map(([key, label]) => (
              <Link
                key={key}
                href={
                  key === "all"
                    ? `/red-team/${run.id}`
                    : `/red-team/${run.id}?view=${key}`
                }
                className={
                  view === key ? "text-signal" : "text-mute hover:text-ink"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        }
      >
        {items.length === 0 ? (
          <p className="px-5 py-6 font-body text-[13px] text-mute">
            {live ? "Waiting for the first results…" : "Nothing in this view."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-hairline bg-elevated/60 font-mono text-[10px] uppercase tracking-wider text-mute">
                  <th className="px-5 py-2 text-left">Outcome</th>
                  <th className="px-5 py-2 text-left">Corpus</th>
                  <th className="px-5 py-2 text-left">Prompt</th>
                  <th className="px-5 py-2 text-left">Decision</th>
                  <th className="px-5 py-2 text-right">Latency</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-hairline last:border-0 hover:bg-elevated/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={outcomeTone(item.outcome)}>
                          {item.outcome}
                        </Badge>
                        {item.isRegression ? (
                          <Badge tone="crit">regression</Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-mute">
                      {item.corpus}
                      <span className="block text-mute/70">{item.expected}</span>
                    </td>
                    <td className="px-5 py-3 font-body text-[13px] text-ink">
                      {item.promptExcerpt}
                      {item.error ? (
                        <span className="mt-1 block text-[12px] text-crit">
                          {item.error}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] text-mute">
                      {item.detectorStatus ??
                        (item.httpStatus != null ? `HTTP ${item.httpStatus}` : "—")}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-mute">
                      {formatLatency(item.latencyMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
