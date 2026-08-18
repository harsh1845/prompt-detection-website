import Link from "next/link";
import { sha256 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InviteForm from "./InviteForm";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await prisma.invite.findUnique({
    where: { tokenHash: sha256(params.token) },
    include: { org: true },
  });

  const invalid =
    !invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now();

  if (invalid) {
    return (
      <div>
        <h1 className="font-display text-[28px] font-semibold tracking-tighter text-ink">
          Invite unavailable
        </h1>
        <p className="mt-3 font-body text-[14px] leading-relaxed text-mute">
          This link has already been used, expired, or was revoked. Ask an admin
          in the workspace to send a new invite.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block font-body text-[13px] text-signal hover:underline"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true },
  });

  return (
    <InviteForm
      token={params.token}
      email={invite.email}
      orgName={invite.org.name}
      role={invite.role}
      hasAccount={Boolean(existingUser)}
    />
  );
}
