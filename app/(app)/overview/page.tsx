import Link from "next/link";
import TrafficChart from "@/components/dashboard/TrafficChart";
import {
  Badge,
  EmptyState,
  Panel,
  StatCard,
  ghostButtonClass,
  primaryButtonClass,
  statusTone,
} from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { getOverviewMetrics } from "@/lib/events";
import {
  formatLatency,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@/lib/format";
import { requireTenantContext } from "@/lib/tenant";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { org } = await requireTenantContext();

  const [metrics, recent, appCount] = await Promise.all([
    getOverviewMetrics(org.id, 24),
    prisma.detectionEvent.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { app: { select: { name: true } } },
    }),
    prisma.app.count({ where: { orgId: org.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
            Last 24 hours
          </p>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
            Overview
          </h1>
        </div>
        <div className="flex gap-3">
          <Link href="/events" className={ghostButtonClass}>
            View all events
          </Link>
          <Link href="/apps" className={primaryButtonClass}>
            Apps &amp; keys
          </Link>
        </div>
      </div>

      {searchParams.error === "forbidden" && (
        <p className="rounded-sm border border-crit/30 bg-crit/10 px-4 py-3 font-body text-[13px] text-crit">
          That area is restricted to workspace admins.
        </p>
      )}

      {metrics.total === 0 ? (
        <EmptyState
          title="No detection events yet"
          body={
            appCount === 0
              ? "Create an app, issue a key, and send one request through the gateway. Events land here within a second of your first call."
              : "Your workspace has apps but no traffic yet. Send a request through the gateway with an app key and this page fills in."
          }
          action={
            <Link href="/onboarding" className={primaryButtonClass}>
              Open setup checklist
            </Link>
          }
        />
      ) : null}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline lg:grid-cols-5">
        <StatCard
          label="Requests scanned"
          value={formatNumber(metrics.total)}
          hint="24h window"
        />
        <StatCard
          label="Blocked"
          value={formatNumber(metrics.blocked)}
          hint={`${formatPercent(metrics.blockRate)} of traffic`}
          tone={metrics.blocked > 0 ? "crit" : "neutral"}
        />
        <StatCard
          label="P50 latency"
          value={formatLatency(metrics.p50)}
          hint="detector round trip"
          tone="signal"
        />
        <StatCard
          label="P95 latency"
          value={formatLatency(metrics.p95)}
          hint="detector round trip"
          tone="signal"
        />
        <StatCard
          label="Open alerts"
          value={formatNumber(metrics.openAlerts)}
          hint="unread"
          tone={metrics.openAlerts > 0 ? "crit" : "neutral"}
        />
      </div>

      <Panel title="Allow vs block" description="Hourly, last 24 hours">
        <TrafficChart data={metrics.byHour} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top apps" description="Ranked by volume in the window">
          {metrics.topApps.length === 0 ? (
            <p className="px-5 py-6 font-body text-[13px] text-mute">
              No app traffic in this window.
            </p>
          ) : (
            <ul>
              {metrics.topApps.map((app) => (
                <li
                  key={app.id}
                  className="flex items-center justify-between border-b border-hairline px-5 py-3 last:border-0"
                >
                  <Link
                    href={`/apps/${app.id}`}
                    className="font-body text-[13px] text-ink hover:text-signal"
                  >
                    {app.name}
                  </Link>
                  <span className="font-mono text-[12px] text-mute">
                    {formatNumber(app.total)} req ·{" "}
                    <span className={app.blocked > 0 ? "text-crit" : "text-mute"}>
                      {formatNumber(app.blocked)} blocked
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Caught by tier"
          description="Which cascade stage made the decision"
        >
          {metrics.byTier.length === 0 ? (
            <p className="px-5 py-6 font-body text-[13px] text-mute">
              No tier attribution yet.
            </p>
          ) : (
            <ul>
              {metrics.byTier.map((tier) => (
                <li
                  key={tier.tier}
                  className="flex items-center justify-between border-b border-hairline px-5 py-3 last:border-0"
                >
                  <span className="font-body text-[13px] text-ink">
                    {tier.tier}
                  </span>
                  <span className="font-mono text-[12px] text-mute">
                    {formatNumber(tier.count)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Latest events"
        description="Newest first"
        action={
          <Link
            href="/events"
            className="font-body text-[13px] text-signal hover:underline"
          >
            All events
          </Link>
        }
      >
        {recent.length === 0 ? (
          <p className="px-5 py-6 font-body text-[13px] text-mute">
            Nothing recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-hairline bg-elevated/60 font-mono text-[10px] uppercase tracking-wider text-mute">
                  <th className="px-5 py-2 text-left">Time</th>
                  <th className="px-5 py-2 text-left">App</th>
                  <th className="px-5 py-2 text-left">Status</th>
                  <th className="px-5 py-2 text-left">Tier</th>
                  <th className="px-5 py-2 text-right">Confidence</th>
                  <th className="px-5 py-2 text-right">Latency</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-hairline last:border-0 hover:bg-elevated/40"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/events/${event.id}`}
                        className="font-mono text-[12px] text-mute hover:text-signal"
                      >
                        {formatRelative(event.createdAt)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-body text-[13px] text-ink">
                      {event.app.name}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(event.status)}>
                        {event.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] text-mute">
                      {event.tierCaught ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-ink">
                      {event.confidence === null
                        ? "—"
                        : formatPercent(event.confidence, 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-mute">
                      {formatLatency(event.latencyMs)}
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
