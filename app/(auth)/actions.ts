"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ORG_COOKIE,
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  normalizeEmail,
  sha256,
  slugify,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AuthFormState = { error?: string };

const MIN_PASSWORD_LENGTH = 10;

function emailLooksValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function uniqueOrgSlug(base: string) {
  const slug = slugify(base);
  const existing = await prisma.org.findUnique({ where: { slug } });
  if (!existing) return slug;
  return `${slug}-${randomBytes(3).toString("hex")}`;
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const orgName = String(formData.get("orgName") ?? "").trim();

  if (!emailLooksValid(email)) return { error: "Enter a valid work email." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (orgName.length < 2) return { error: "Enter your company or team name." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "That email already has an account." };

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: hashPassword(password),
    },
  });

  const org = await prisma.org.create({
    data: {
      name: orgName,
      slug: await uniqueOrgSlug(orgName),
      memberships: { create: { userId: user.id, role: "admin" } },
    },
  });

  await createSession(user.id);
  cookies().set(ORG_COOKIE, org.id, { path: "/", sameSite: "lax" });

  redirect("/onboarding");
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Email or password is incorrect." };
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  await createSession(user.id);
  if (membership) {
    cookies().set(ORG_COOKIE, membership.orgId, { path: "/", sameSite: "lax" });
  }

  redirect("/overview");
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}

export async function acceptInvite(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  const invite = await prisma.invite.findUnique({
    where: { tokenHash: sha256(token) },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) {
    return { error: "This invite link is no longer valid." };
  }

  const sessionUser = await getSessionUser();
  let userId = sessionUser?.id;

  if (!userId) {
    const existing = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existing) {
      if (!verifyPassword(password, existing.passwordHash)) {
        return { error: "Enter your existing password to join this workspace." };
      }
      userId = existing.id;
    } else {
      if (password.length < MIN_PASSWORD_LENGTH) {
        return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
      }
      const created = await prisma.user.create({
        data: {
          email: invite.email,
          name: name || null,
          passwordHash: hashPassword(password),
        },
      });
      userId = created.id;
    }

    await createSession(userId);
  }

  await prisma.membership.upsert({
    where: { userId_orgId: { userId, orgId: invite.orgId } },
    update: { role: invite.role },
    create: { userId, orgId: invite.orgId, role: invite.role },
  });

  await prisma.invite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  cookies().set(ORG_COOKIE, invite.orgId, { path: "/", sameSite: "lax" });
  redirect("/overview");
}
