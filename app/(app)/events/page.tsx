import Link from "next/link";
import {
  Badge,
  EmptyState,
  Panel,
  ghostButtonClass,
  primaryButtonClass,
  riskTone,
  statusTone,
} from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { formatDateTime, formatLatency, formatPercent } from "@/lib/format";
import { requireTenantContext } from "@/lib/tenant";
import EventFilters from "./EventFilters";

const PAGE_SIZE = 25;

type SearchParams = {
  status?: string;
  appId?: string;
  tier?: string;
  direction?: string;
  q?: string;
  page?: string;
};

function buildWhere(orgId: string, params: SearchParams) {
  const where: Prisma.DetectionEventWhereInput = { orgId };

  if (params.status === "blocked" || params.status === "allowed") {
    where.status = params.status;
  }
  if (params.appId) where.appId = params.appId;
  if (params.direction === "input" || params.direction === "output") {
    where.direction = params.direction;
  }

  const tier = Number(params.tier);
  if (tier === 1 || tier === 2 || tier === 3) where.tierCaught = tier;

  if (params.q) {
    where.OR = [
      { promptExcerpt: { contains: params.q } },
      { heuristics: { contains: params.q } },
      { endpoint: { contains: params.q } },
      { model: { contains: params.q } },
    ];
  }

  return where;
}

function pageHref(params: SearchParams, page: number) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }
  if (page > 1) next.set("page", String(page));
  const query = next.toString();
  return query ? `/events?${query}` : "/events";
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { org } = await requireTenantContext();

  const page = Math.max(1, Number(searchParams.page) || 1);
  const where = buildWhere(org.id, searchParams);

  const [events, total, apps] = await Promise.all([
    prisma.detectionEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        app: { select: { name: true } },
        feedback: { select: { verdict: true }, take: 1 },
      },
    }),
    prisma.detectionEvent.count({ where }),
    prisma.app.findMany({
      where: { orgId: org.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Detection feed
        </p>
        <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
          Events
        </h1>
        <p className="mt-2 font-body text-[14px] text-mute">
          Every prompt your gateway scored, with the tier that decided it.
        </p>
      </div>

      <Panel>
        <EventFilters apps={apps} />

        {events.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No events match"
              body="Either no traffic has reached this workspace yet, or the current filters exclude everything. Send a test request from the setup checklist to confirm the gateway is wired up."
              action={
                <Link href="/onboarding" className={primaryButtonClass}>
                  Setup checklist
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-hairline bg-elevated/60 font-mono text-[10px] uppercase tracking-wider text-mute">
                  <th className="px-5 py-2 text-left">Time</th>
                  <th className="px-5 py-2 text-left">App</th>
                  <th className="px-5 py-2 text-left">Status</th>
                  <th className="px-5 py-2 text-left">Risk</th>
                  <th className="px-5 py-2 text-left">Tier</th>
                  <th className="px-5 py-2 text-right">Confidence</th>
                  <th className="px-5 py-2 text-right">Latency</th>
                  <th className="px-5 py-2 text-left">Excerpt</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-hairline last:border-0 hover:bg-elevated/40"
                  >
                    <td className="whitespace-nowrap px-5 py-3">
                      <Link
                        href={`/events/${event.id}`}
                        className="font-mono text-[12px] text-mute hover:text-signal"
                      >
                        {formatDateTime(event.createdAt)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-body text-[13px] text-ink">
                      {event.app.name}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(event.status)}>
                        {event.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {event.riskLevel ? (
                        <Badge tone={riskTone(event.riskLevel)}>
                          {event.riskLevel}
                        </Badge>
                      ) : (
                        <span className="font-mono text-[12px] text-mute">—</span>
                      )}
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
                    <td className="max-w-[320px] px-5 py-3">
                      <span className="line-clamp-1 font-mono text-[12px] text-mute">
                        {event.promptExcerpt ?? "retention: hash only"}
                      </span>
                      {event.feedback.length > 0 && (
                        <span className="ml-2 font-mono text-[10px] uppercase text-signal">
                          flagged
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-hairline px-5 py-3">
            <span className="font-mono text-[11px] text-mute">
              Page {page} of {pageCount} · {total} events
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={pageHref(searchParams, page - 1)}
                  className={ghostButtonClass}
                >
                  Previous
                </Link>
              )}
              {page < pageCount && (
                <Link
                  href={pageHref(searchParams, page + 1)}
                  className={ghostButtonClass}
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
