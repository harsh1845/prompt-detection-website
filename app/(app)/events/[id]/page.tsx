import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Panel,
  StatCard,
  riskTone,
  statusTone,
} from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { parseHeuristics } from "@/lib/events";
import {
  formatDateTime,
  formatLatency,
  formatPercent,
  formatRelative,
  titleCase,
} from "@/lib/format";
import { canWrite, requireTenantContext } from "@/lib/tenant";
import FeedbackForm from "./FeedbackForm";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { org, role } = await requireTenantContext();

  const event = await prisma.detectionEvent.findFirst({
    where: { id: params.id, orgId: org.id },
    include: {
      app: true,
      apiKey: { select: { name: true, prefix: true, last4: true } },
      feedback: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
      },
    },
  });

  if (!event) notFound();

  const heuristics = parseHeuristics(event.heuristics);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/events"
          className="font-body text-[13px] text-mute transition-colors hover:text-ink"
        >
          ← Back to events
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[26px] font-semibold tracking-tighter text-ink">
            {event.app.name}
          </h1>
          <Badge tone={statusTone(event.status)}>{event.status}</Badge>
          {event.riskLevel && (
            <Badge tone={riskTone(event.riskLevel)}>{event.riskLevel} risk</Badge>
          )}
          <Badge>{event.direction}</Badge>
        </div>
        <p className="mt-2 font-mono text-[12px] text-mute">
          {formatDateTime(event.createdAt)} · {formatRelative(event.createdAt)} ·{" "}
          {event.id}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline lg:grid-cols-4">
        <StatCard label="Label" value={event.label ?? "—"} />
        <StatCard
          label="Confidence"
          value={
            event.confidence === null ? "—" : formatPercent(event.confidence, 1)
          }
          tone="signal"
        />
        <StatCard
          label="Tier caught"
          value={event.tierCaught ? String(event.tierCaught) : "—"}
        />
        <StatCard label="Latency" value={formatLatency(event.latencyMs)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Classification">
          <dl className="divide-y divide-hairline">
            {[
              ["Max chunk probability", event.maxChunkProbability === null ? "—" : formatPercent(event.maxChunkProbability, 1)],
              ["Model", event.model ?? "—"],
              ["Endpoint", event.endpoint ?? "—"],
              ["Environment", event.app.environment],
              [
                "API key",
                event.apiKey
                  ? `${event.apiKey.name} (${event.apiKey.prefix}…${event.apiKey.last4})`
                  : "—",
              ],
              ["Prompt hash", event.promptHash.slice(0, 24)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between px-5 py-3"
              >
                <dt className="font-body text-[13px] text-mute">{label}</dt>
                <dd className="max-w-[60%] truncate font-mono text-[12px] text-ink">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel
          title="Heuristic flags"
          description="Structural signals from the sanitizer and router"
        >
          <div className="flex flex-wrap gap-2 px-5 py-5">
            {heuristics.length === 0 ? (
              <p className="font-body text-[13px] text-mute">
                No structural flags triggered.
              </p>
            ) : (
              heuristics.map((flag) => (
                <Badge key={flag} tone="signal">
                  {flag.replace(/_/g, " ")}
                </Badge>
              ))
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Prompt"
        description={
          event.rawPrompt
            ? "Raw retention is enabled for this workspace"
            : event.promptExcerpt
              ? "Excerpt only — retention is set to hashed"
              : "Retention is set to none, so only the hash was stored"
        }
      >
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-5 py-5 font-mono text-[12px] leading-6 text-mute">
          {event.rawPrompt ?? event.promptExcerpt ?? event.promptHash}
        </pre>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Label this decision"
          description="Feedback here is the training signal for the detector"
        >
          <FeedbackForm
            eventId={event.id}
            status={event.status}
            disabled={!canWrite(role)}
          />
        </Panel>

        <Panel title="Feedback history">
          {event.feedback.length === 0 ? (
            <p className="px-5 py-5 font-body text-[13px] text-mute">
              No one has labelled this event yet.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {event.feedback.map((entry) => (
                <li key={entry.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      tone={
                        entry.verdict === "false_positive"
                          ? "warn"
                          : entry.verdict === "false_negative"
                            ? "crit"
                            : "safe"
                      }
                    >
                      {titleCase(entry.verdict)}
                    </Badge>
                    <span className="font-mono text-[11px] text-mute">
                      {formatRelative(entry.createdAt)}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="mt-2 font-body text-[13px] text-ink">
                      {entry.note}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[11px] text-mute/70">
                    {entry.user?.email ?? "removed user"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
