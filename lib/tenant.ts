import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ORG_COOKIE, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Org, User } from "@/lib/generated/prisma/client";

export type Role = "admin" | "analyst" | "viewer";

export const ROLES: Role[] = ["admin", "analyst", "viewer"];

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Manage apps, keys, members, billing and settings.",
  analyst: "Review events, flag false positives, run scans.",
  viewer: "Read-only access to events and dashboards.",
};

export type TenantContext = {
  user: User;
  org: Org;
  role: Role;
  orgs: { id: string; name: string; slug: string; role: Role }[];
};

export function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}

/** Admins configure the workspace. */
export function canManage(role: Role) {
  return role === "admin";
}

/** Analysts and admins can label events and trigger runs. */
export function canWrite(role: Role) {
  return role !== "viewer";
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) return null;

  const preferredOrgId = cookies().get(ORG_COOKIE)?.value;
  const active =
    memberships.find((m) => m.orgId === preferredOrgId) ?? memberships[0];

  return {
    user,
    org: active.org,
    role: isRole(active.role) ? active.role : "viewer",
    orgs: memberships.map((m) => ({
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      role: isRole(m.role) ? m.role : "viewer",
    })),
  };
}

export async function requireTenantContext(): Promise<TenantContext> {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  return context;
}

export async function requireManager(): Promise<TenantContext> {
  const context = await requireTenantContext();
  if (!canManage(context.role)) redirect("/overview?error=forbidden");
  return context;
}
