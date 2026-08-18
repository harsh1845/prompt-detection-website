import { Panel, StatCard } from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { formatDateTime, formatNumber } from "@/lib/format";
import { canManage, requireTenantContext } from "@/lib/tenant";
import WorkspaceForm from "./WorkspaceForm";

export default async function WorkspaceSettingsPage() {
  const { org, role } = await requireTenantContext();

  const [appCount, eventCount, memberCount] = await Promise.all([
    prisma.app.count({ where: { orgId: org.id } }),
    prisma.detectionEvent.count({ where: { orgId: org.id } }),
    prisma.membership.count({ where: { orgId: org.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Settings
        </p>
        <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
          Workspace
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline lg:grid-cols-4">
        <StatCard label="Plan" value={org.plan} tone="signal" />
        <StatCard label="Apps" value={formatNumber(appCount)} />
        <StatCard label="Events stored" value={formatNumber(eventCount)} />
        <StatCard label="Members" value={formatNumber(memberCount)} />
      </div>

      <Panel
        title="General"
        description={
          canManage(role)
            ? "Name and data retention for this workspace"
            : "Read-only — admins manage these settings"
        }
      >
        <WorkspaceForm
          name={org.name}
          retentionMode={org.retentionMode}
          rawTtlDays={org.rawTtlDays}
          disabled={!canManage(role)}
        />
      </Panel>

      <Panel title="Workspace identity">
        <dl className="divide-y divide-hairline">
          {[
            ["Workspace ID", org.id],
            ["Slug", org.slug],
            ["Created", formatDateTime(org.createdAt)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between px-5 py-3"
            >
              <dt className="font-body text-[13px] text-mute">{label}</dt>
              <dd className="font-mono text-[12px] text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
