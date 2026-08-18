import {
  Badge,
  Panel,
  dangerButtonClass,
  ghostButtonClass,
} from "@/components/dashboard/ui";
import { prisma } from "@/lib/db";
import { formatRelative } from "@/lib/format";
import {
  ROLE_DESCRIPTIONS,
  ROLES,
  canManage,
  requireTenantContext,
} from "@/lib/tenant";
import { removeMember, revokeInvite, updateMemberRole } from "../actions";
import InviteForm from "./InviteForm";

export default async function MembersPage() {
  const { org, role, user } = await requireTenantContext();

  const [memberships, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { orgId: org.id },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invite.findMany({
      where: { orgId: org.id, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const manage = canManage(role);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Settings
        </p>
        <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
          Members
        </h1>
      </div>

      <Panel title="Roles">
        <ul className="divide-y divide-hairline">
          {ROLES.map((item) => (
            <li key={item} className="flex items-start gap-4 px-5 py-3">
              <Badge tone={item === "admin" ? "signal" : "neutral"}>{item}</Badge>
              <p className="font-body text-[13px] text-mute">
                {ROLE_DESCRIPTIONS[item]}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      {manage && (
        <Panel
          title="Invite a teammate"
          description="Share the generated link — it works once and expires in 7 days"
        >
          <InviteForm />
        </Panel>
      )}

      <Panel title="Workspace members">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-hairline bg-elevated/60 font-mono text-[10px] uppercase tracking-wider text-mute">
                <th className="px-5 py-2 text-left">Person</th>
                <th className="px-5 py-2 text-left">Role</th>
                <th className="px-5 py-2 text-left">Joined</th>
                {manage && <th className="px-5 py-2" />}
              </tr>
            </thead>
            <tbody>
              {memberships.map((membership) => (
                <tr
                  key={membership.id}
                  className="border-b border-hairline last:border-0"
                >
                  <td className="px-5 py-3">
                    <p className="font-body text-[13px] text-ink">
                      {membership.user.name ?? membership.user.email}
                      {membership.userId === user.id && (
                        <span className="ml-2 font-mono text-[10px] uppercase text-signal">
                          you
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[11px] text-mute">
                      {membership.user.email}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    {manage ? (
                      <form action={updateMemberRole} className="flex gap-2">
                        <input
                          type="hidden"
                          name="membershipId"
                          value={membership.id}
                        />
                        <select
                          name="role"
                          defaultValue={membership.role}
                          className="rounded-sm border border-hairline bg-base px-2 py-1.5 font-body text-[13px] text-ink outline-none focus:border-signal/70"
                        >
                          {ROLES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className={ghostButtonClass}>
                          Save
                        </button>
                      </form>
                    ) : (
                      <Badge>{membership.role}</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] text-mute">
                    {formatRelative(membership.createdAt)}
                  </td>
                  {manage && (
                    <td className="px-5 py-3 text-right">
                      <form action={removeMember}>
                        <input
                          type="hidden"
                          name="membershipId"
                          value={membership.id}
                        />
                        <button type="submit" className={dangerButtonClass}>
                          Remove
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {invites.length > 0 && (
        <Panel title="Pending invites">
          <ul className="divide-y divide-hairline">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div>
                  <p className="font-body text-[13px] text-ink">{invite.email}</p>
                  <p className="font-mono text-[11px] text-mute">
                    {invite.role} · expires {formatRelative(invite.expiresAt)}
                  </p>
                </div>
                {manage && (
                  <form action={revokeInvite}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button type="submit" className={dangerButtonClass}>
                      Revoke
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
