"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ORG_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";

export async function switchOrg(formData: FormData) {
  const { user } = await requireTenantContext();
  const orgId = String(formData.get("orgId") ?? "");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, orgId },
  });

  if (!membership) redirect("/overview");

  cookies().set(ORG_COOKIE, orgId, { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
  redirect("/overview");
}
