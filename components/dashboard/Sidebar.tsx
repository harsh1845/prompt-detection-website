"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryNav = [
  { href: "/overview", label: "Overview" },
  { href: "/events", label: "Events" },
  { href: "/apps", label: "Apps & keys" },
  { href: "/red-team", label: "Red team" },
  { href: "/alerts", label: "Alerts" },
];

const setupNav = [
  { href: "/onboarding", label: "Setup checklist" },
  { href: "/settings/general", label: "Workspace" },
  { href: "/settings/members", label: "Members" },
  { href: "/settings/integrations", label: "Alerts & Slack" },
];

function NavList({
  items,
  pathname,
  unread,
}: {
  items: { href: string; label: string }[];
  pathname: string;
  unread?: number;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center justify-between rounded-sm px-3 py-2 font-body text-[13px] transition-colors ${
                active
                  ? "bg-elevated text-ink"
                  : "text-mute hover:bg-elevated/60 hover:text-ink"
              }`}
            >
              <span>{item.label}</span>
              {item.href === "/alerts" && unread ? (
                <span className="rounded-sm bg-crit/15 px-1.5 py-0.5 font-mono text-[10px] text-crit">
                  {unread}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Sidebar({ unreadAlerts }: { unreadAlerts: number }) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-hairline bg-elevated/40 print:hidden lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center border-b border-hairline px-5">
        <Link
          href="/overview"
          className="font-display text-[16px] font-semibold tracking-tighter text-ink"
        >
          PromptGuard
        </Link>
      </div>

      <nav className="space-y-6 px-3 py-5">
        <div>
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-mute/70">
            Monitor
          </p>
          <NavList
            items={primaryNav}
            pathname={pathname}
            unread={unreadAlerts}
          />
        </div>

        <div>
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-mute/70">
            Configure
          </p>
          <NavList items={setupNav} pathname={pathname} />
        </div>
      </nav>
    </aside>
  );
}
