"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/db";
import { canManage, requireTenantContext } from "@/lib/tenant";

export type AppFormState = { error?: string };
export type KeyFormState = { error?: string; secret?: string; name?: string };

const PROVIDERS = new Set([
  "openai",
  "anthropic",
  "google",
  "self-hosted",
  "other",
]);

export async function createApp(
  _prev: AppFormState,
  formData: FormData
): Promise<AppFormState> {
  const { org, role } = await requireTenantContext();
  if (!canManage(role)) return { error: "Only admins can create apps." };

  const name = String(formData.get("name") ?? "").trim();
  const provider = String(formData.get("provider") ?? "");
  const environment = String(formData.get("environment") ?? "production").trim();

  if (name.length < 2) return { error: "Give the app a recognizable name." };

  const baseSlug = slugify(name);
  const existing = await prisma.app.findFirst({
    where: { orgId: org.id, slug: baseSlug },
  });

  if (existing) {
    return { error: `An app with the slug '${baseSlug}' already exists.` };
  }

  const app = await prisma.app.create({
    data: {
      orgId: org.id,
      name,
      slug: baseSlug,
      provider: PROVIDERS.has(provider) ? provider : null,
      environment: environment || "production",
    },
  });

  revalidatePath("/apps");
  redirect(`/apps/${app.id}`);
}

export async function createApiKey(
  _prev: KeyFormState,
  formData: FormData
): Promise<KeyFormState> {
  const { org, role, user } = await requireTenantContext();
  if (!canManage(role)) return { error: "Only admins can issue keys." };

  const appId = String(formData.get("appId") ?? "");
  const name = String(formData.get("name") ?? "").trim() || "Gateway key";

  const app = await prisma.app.findFirst({
    where: { id: appId, orgId: org.id },
    select: { id: true },
  });

  if (!app) return { error: "App not found in this workspace." };

  const generated = generateApiKey();

  await prisma.apiKey.create({
    data: {
      orgId: org.id,
      appId: app.id,
      name,
      prefix: generated.prefix,
      last4: generated.last4,
      keyHash: generated.keyHash,
      createdById: user.id,
    },
  });

  revalidatePath(`/apps/${app.id}`);
  revalidatePath("/onboarding");

  // Returned once, never stored in plaintext.
  return { secret: generated.secret, name };
}

export async function revokeApiKey(formData: FormData) {
  const { org, role } = await requireTenantContext();
  if (!canManage(role)) redirect("/overview?error=forbidden");

  const keyId = String(formData.get("keyId") ?? "");
  const appId = String(formData.get("appId") ?? "");

  await prisma.apiKey.updateMany({
    where: { id: keyId, orgId: org.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  revalidatePath(`/apps/${appId}`);
}
