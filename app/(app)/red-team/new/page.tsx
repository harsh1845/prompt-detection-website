import Link from "next/link";
import { ghostButtonClass, Panel } from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { listCorpusPacks } from "@/lib/redteam/catalog";
import { canUseRedTeam, redTeamLimits } from "@/lib/redteam/plans";
import { requireTenantContext } from "@/lib/tenant";
import NewRunForm from "./NewRunForm";

export default async function NewRedTeamRunPage() {
  const { org } = await requireTenantContext();

  if (!canUseRedTeam(org.plan)) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-[28px] font-semibold tracking-tighter text-ink">
          Red teaming
        </h1>
        <p className="font-body text-[14px] text-mute">
          Adversarial scans are on the Team plan. Upgrade this workspace to run
          jailbreak, injection, and prompt-leak corpora against your own apps.
        </p>
        <Link href="/red-team" className={ghostButtonClass}>
          Back
        </Link>
      </div>
    );
  }

  const [apps, targets] = await Promise.all([
    prisma.app.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.redTeamTarget.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, kind: true, url: true },
    }),
  ]);

  const limits = redTeamLimits(org.plan);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Red team
        </p>
        <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
          New scan
        </h1>
        <p className="mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-mute">
          Point the runner at PromptGuard or at your own HTTP surface. Concurrency
          and timeouts are capped so a misclick cannot DDoS the target.
        </p>
      </div>

      <Panel>
        <div className="px-5 py-5">
          <NewRunForm
            apps={apps}
            packs={listCorpusPacks()}
            targets={targets}
            maxConcurrency={limits.maxConcurrency}
            maxCustom={limits.maxCustom}
          />
        </div>
      </Panel>
    </div>
  );
}
