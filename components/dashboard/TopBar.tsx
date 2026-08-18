import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { switchOrg } from "@/app/(app)/actions";
import type { TenantContext } from "@/lib/tenant";
import OrgSwitcher from "./OrgSwitcher";

export default function TopBar({ context }: { context: TenantContext }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-base/95 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 lg:h-16 lg:flex-nowrap lg:py-0">
        <div className="flex items-center gap-3">
          {context.orgs.length > 1 ? (
            <OrgSwitcher
              orgs={context.orgs}
              activeOrgId={context.org.id}
              action={switchOrg}
            />
          ) : (
            <span className="font-display text-[15px] font-semibold tracking-tighter text-ink">
              {context.org.name}
            </span>
          )}
          <span className="rounded-sm border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-mute">
            {context.org.plan}
          </span>
          <span className="rounded-sm border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-mute">
            {context.role}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-body text-[13px] text-mute transition-colors hover:text-ink"
          >
            Marketing site
          </Link>
          <span className="hidden font-mono text-[11px] text-mute sm:inline">
            {context.user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-sm border border-hairline px-3 py-1.5 font-body text-[12px] text-ink transition-colors hover:border-white/25"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
