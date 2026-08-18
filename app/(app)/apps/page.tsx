import Link from "next/link";
import { Badge, EmptyState, Panel } from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { formatNumber, formatRelative } from "@/lib/format";
import { canManage, requireTenantContext } from "@/lib/tenant";
import CreateAppForm from "./CreateAppForm";

export default async function AppsPage() {
  const { org, role } = await requireTenantContext();

  const apps = await prisma.app.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { events: true, apiKeys: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Gateway
        </p>
        <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
          Apps &amp; keys
        </h1>
        <p className="mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-mute">
          An app is one surface you protect — a production chatbot, an internal RAG
          tool, a support agent. Each app gets its own keys so events and blast
          radius stay separated.
        </p>
      </div>

      {canManage(role) && (
        <Panel title="New app" description="Named per surface, not per model">
          <CreateAppForm />
        </Panel>
      )}

      <Panel title="Your apps">
        {apps.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No apps yet"
              body={
                canManage(role)
                  ? "Create your first app above, then issue a key and send a request through the gateway."
                  : "An admin needs to create the first app for this workspace."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {apps.map((app) => (
              <li
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <Link
                    href={`/apps/${app.id}`}
                    className="font-display text-[15px] font-semibold tracking-tighter text-ink hover:text-signal"
                  >
                    {app.name}
                  </Link>
                  <p className="mt-1 font-mono text-[11px] text-mute">
                    {app.slug} · {app.environment}
                    {app.provider ? ` · ${app.provider}` : ""} · created{" "}
                    {formatRelative(app.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge>{formatNumber(app._count.events)} events</Badge>
                  <Badge tone={app._count.apiKeys > 0 ? "signal" : "warn"}>
                    {formatNumber(app._count.apiKeys)} keys
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
