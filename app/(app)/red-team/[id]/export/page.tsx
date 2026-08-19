import Link from "next/link";
import { Badge, ghostButtonClass } from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { formatDateTime, formatPercent, titleCase } from "@/lib/format";
import { requireTenantContext } from "@/lib/tenant";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function RedTeamExportPage({
  params,
}: {
  params: { id: string };
}) {
  const { org } = await requireTenantContext();
  const run = await prisma.redTeamRun.findFirst({
    where: { id: params.id, orgId: org.id },
    include: {
      app: { select: { name: true } },
      items: { orderBy: [{ corpus: "asc" }, { sourceId: "asc" }] },
    },
  });

  if (!run) notFound();

  const corpora = JSON.parse(run.corporaJson || "[]") as string[];
  const regressions = JSON.parse(run.regressionsJson || "[]") as {
    id?: string;
    excerpt?: string;
    corpus?: string;
  }[];

  return (
    <div className="space-y-8 print:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
            Security review export
          </p>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
            Red-team report
          </h1>
        </div>
        <div className="flex gap-3">
          <Link href={`/red-team/${run.id}`} className={ghostButtonClass}>
            Back to run
          </Link>
          <PrintButton />
        </div>
      </div>

      <header className="border-b border-hairline pb-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-mute">
          PromptGuard · {org.name}
        </p>
        <h2 className="mt-2 font-display text-[24px] font-semibold tracking-tighter text-ink">
          {run.targetName}
        </h2>
        <p className="mt-2 font-body text-[14px] text-mute">
          {formatDateTime(run.createdAt)} · {titleCase(run.targetKind)} ·{" "}
          {run.app?.name ?? "unlinked app"} · corpora {corpora.join(", ") || "custom"}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="font-body text-[12px] text-mute">Pass rate</p>
          <p className="mt-1 font-mono text-[22px] text-ink">
            {run.passRate == null ? "—" : formatPercent(run.passRate, 0)}
          </p>
        </div>
        <div>
          <p className="font-body text-[12px] text-mute">Passed</p>
          <p className="mt-1 font-mono text-[22px] text-ink">{run.passed}</p>
        </div>
        <div>
          <p className="font-body text-[12px] text-mute">Failed</p>
          <p className="mt-1 font-mono text-[22px] text-crit">{run.failed}</p>
        </div>
        <div>
          <p className="font-body text-[12px] text-mute">Regressions</p>
          <p className="mt-1 font-mono text-[22px] text-ink">{regressions.length}</p>
        </div>
      </section>

      {regressions.length > 0 ? (
        <section>
          <h3 className="font-display text-[16px] font-semibold tracking-tighter text-ink">
            New failures since last run
          </h3>
          <ul className="mt-3 space-y-2">
            {regressions.map((row, index) => (
              <li key={`${row.id}-${index}`} className="font-body text-[13px] text-ink">
                <span className="font-mono text-[11px] text-mute">
                  {row.corpus} · {row.id}
                </span>
                <span className="mt-1 block text-mute">{row.excerpt}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="font-body text-[13px] text-mute">
          No regressions against the previous completed scan of this target.
        </p>
      )}

      <section>
        <h3 className="font-display text-[16px] font-semibold tracking-tighter text-ink">
          Case results
        </h3>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="border-b border-hairline font-mono text-[10px] uppercase tracking-wider text-mute">
              <th className="py-2 pr-3">Outcome</th>
              <th className="py-2 pr-3">Corpus</th>
              <th className="py-2">Prompt</th>
            </tr>
          </thead>
          <tbody>
            {run.items.map((item) => (
              <tr key={item.id} className="border-b border-hairline">
                <td className="py-2 pr-3">
                  <Badge
                    tone={
                      item.outcome === "fail"
                        ? "crit"
                        : item.outcome === "error"
                          ? "warn"
                          : "safe"
                    }
                  >
                    {item.outcome}
                  </Badge>
                </td>
                <td className="py-2 pr-3 font-mono text-[11px] text-mute">
                  {item.corpus}
                </td>
                <td className="py-2 font-body text-[13px] text-ink">
                  {item.promptExcerpt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="font-body text-[12px] text-mute">
        Scoring: gateway replay treats blocked attacks and allowed benign prompts as
        passes. HTTP targets that return PromptGuard JSON are scored the same way;
        otherwise attack passes require a refusal or 401/403.
      </p>
    </div>
  );
}
