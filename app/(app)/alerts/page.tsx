import Link from "next/link";
import {
  Badge,
  EmptyState,
  Panel,
  ghostButtonClass,
} from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { formatDateTime, formatRelative, titleCase } from "@/lib/format";
import { canWrite, requireTenantContext } from "@/lib/tenant";
import { markAlertRead, markAllAlertsRead } from "./actions";

export default async function AlertsPage() {
  const { org, role } = await requireTenantContext();

  const alerts = await prisma.alert.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = alerts.filter((alert) => !alert.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
            Notifications
          </p>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
            Alerts
          </h1>
          <p className="mt-2 font-body text-[14px] text-mute">
            {unread} unread ·{" "}
            <Link
              href="/settings/integrations"
              className="text-signal hover:underline"
            >
              configure rules
            </Link>
          </p>
        </div>

        {unread > 0 && canWrite(role) && (
          <form action={markAllAlertsRead}>
            <button type="submit" className={ghostButtonClass}>
              Mark all read
            </button>
          </form>
        )}
      </div>

      <Panel>
        {alerts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No alerts yet"
              body="Alerts appear here when the block rate spikes, a high-confidence injection lands, or the detector goes unreachable. Send a test alert from settings to confirm delivery."
              action={
                <Link href="/settings/integrations" className={ghostButtonClass}>
                  Alert settings
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={`px-5 py-4 ${alert.readAt ? "" : "bg-elevated/30"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          alert.severity === "critical"
                            ? "crit"
                            : alert.severity === "warning"
                              ? "warn"
                              : "neutral"
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <span className="font-mono text-[11px] text-mute">
                        {titleCase(alert.kind)}
                      </span>
                      {alert.deliveredSlack && (
                        <span className="font-mono text-[10px] uppercase text-signal">
                          slack
                        </span>
                      )}
                    </div>

                    <p className="mt-2 font-display text-[15px] font-semibold tracking-tighter text-ink">
                      {alert.title}
                    </p>
                    <p className="mt-1 font-body text-[13px] leading-relaxed text-mute">
                      {alert.body}
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-mute/70">
                      {formatDateTime(alert.createdAt)} ·{" "}
                      {formatRelative(alert.createdAt)}
                      {alert.appName ? ` · ${alert.appName}` : ""}
                    </p>
                  </div>

                  {!alert.readAt && canWrite(role) && (
                    <form action={markAlertRead}>
                      <input type="hidden" name="alertId" value={alert.id} />
                      <button
                        type="submit"
                        className="font-body text-[13px] text-mute transition-colors hover:text-ink"
                      >
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
