"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canWrite, requireTenantContext } from "@/lib/tenant";

export async function markAlertRead(formData: FormData) {
  const { org, role } = await requireTenantContext();
  if (!canWrite(role)) return;

  const alertId = String(formData.get("alertId") ?? "");

  await prisma.alert.updateMany({
    where: { id: alertId, orgId: org.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/alerts");
  revalidatePath("/", "layout");
}

export async function markAllAlertsRead() {
  const { org, role } = await requireTenantContext();
  if (!canWrite(role)) return;

  await prisma.alert.updateMany({
    where: { orgId: org.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/alerts");
  revalidatePath("/", "layout");
}
