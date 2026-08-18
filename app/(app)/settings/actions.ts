"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { normalizeEmail, sha256 } from "@/lib/auth";
import { sendTestAlert } from "@/lib/alerts";
import { prisma } from "@/lib/db";
import { canManage, isRole, requireTenantContext } from "@/lib/tenant";

export type SettingsState = { error?: string; success?: string };
export type InviteState = SettingsState & { inviteUrl?: string };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RETENTION_MODES = new Set(["none", "hashed", "raw"]);

function appUrl() {
  return process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function updateWorkspace(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { org, role } = await requireTenantContext();
  if (!canManage(role)) return { error: "Only admins can change the workspace." };

  const name = String(formData.get("name") ?? "").trim();
  const retentionMode = String(formData.get("retentionMode") ?? "hashed");
  const rawTtlDays = Number(formData.get("rawTtlDays") ?? 7);

  if (name.length < 2) return { error: "Workspace name is too short." };
  if (!RETENTION_MODES.has(retentionMode)) {
    return { error: "Pick a valid retention mode." };
  }
  if (!Number.isFinite(rawTtlDays) || rawTtlDays < 1 || rawTtlDays > 365) {
    return { error: "Raw retention must be between 1 and 365 days." };
  }

  await prisma.org.update({
    where: { id: org.id },
    data: { name, retentionMode, rawTtlDays: Math.round(rawTtlDays) },
  });

  revalidatePath("/settings/general");
  revalidatePath("/", "layout");

  return { success: "Workspace updated." };
}

export async function updateAlertSettings(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { org, role } = await requireTenantContext();
  if (!canManage(role)) return { error: "Only admins can change alerting." };

  const webhook = String(formData.get("slackWebhookUrl") ?? "").trim();
  const blockRate = Number(formData.get("alertBlockRatePercent") ?? 25);
  const minVolume = Number(formData.get("alertMinVolume") ?? 20);
  const confidenceFloor = Number(formData.get("alertConfidenceFloor") ?? 0.9);
  const highConfidence = formData.get("alertOnHighConfidence") === "on";

  if (webhook && !/^https:\/\/hooks\.slack\.com\//.test(webhook)) {
    return { error: "Use an https://hooks.slack.com/... incoming webhook URL." };
  }
  if (blockRate < 1 || blockRate > 100) {
    return { error: "Block-rate threshold must be between 1 and 100." };
  }
  if (minVolume < 1) return { error: "Minimum volume must be at least 1." };
  if (confidenceFloor < 0.5 || confidenceFloor > 1) {
    return { error: "Confidence floor must be between 0.5 and 1." };
  }

  await prisma.org.update({
    where: { id: org.id },
    data: {
      slackWebhookUrl: webhook || null,
      alertBlockRatePercent: Math.round(blockRate),
      alertMinVolume: Math.round(minVolume),
      alertConfidenceFloor: confidenceFloor,
      alertOnHighConfidence: highConfidence,
    },
  });

  revalidatePath("/settings/integrations");
  return { success: "Alert rules saved." };
}

export async function triggerTestAlert(
  _prev: SettingsState,
  _formData: FormData
): Promise<SettingsState> {
  const { org, role } = await requireTenantContext();
  if (!canManage(role)) return { error: "Only admins can send test alerts." };

  const fresh = await prisma.org.findUnique({ where: { id: org.id } });
  if (!fresh) return { error: "Workspace not found." };

  const delivered = await sendTestAlert(fresh);
  revalidatePath("/alerts");

  return {
    success: delivered
      ? "Test alert delivered to Slack."
      : "Test alert created in-app. Add a Slack webhook to deliver externally.",
  };
}

export async function inviteMember(
  _prev: InviteState,
  formData: FormData
): Promise<InviteState> {
  const { org, role, user } = await requireTenantContext();
  if (!canManage(role)) return { error: "Only admins can invite members." };

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const inviteRole = String(formData.get("role") ?? "analyst");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!isRole(inviteRole)) return { error: "Pick a valid role." };

  const existingMember = await prisma.membership.findFirst({
    where: { orgId: org.id, user: { email } },
  });
  if (existingMember) return { error: "That person is already a member." };

  const token = randomBytes(24).toString("base64url");

  await prisma.invite.create({
    data: {
      orgId: org.id,
      email,
      role: inviteRole,
      tokenHash: sha256(token),
      invitedById: user.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  revalidatePath("/settings/members");

  return {
    success: `Invite created for ${email}. It expires in 7 days.`,
    inviteUrl: `${appUrl()}/invite/${token}`,
  };
}

export async function updateMemberRole(formData: FormData) {
  const { org, role, user } = await requireTenantContext();
  if (!canManage(role)) return;

  const membershipId = String(formData.get("membershipId") ?? "");
  const nextRole = String(formData.get("role") ?? "");
  if (!isRole(nextRole)) return;

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, orgId: org.id },
  });
  if (!membership) return;

  // Never let the last admin demote themselves out of the workspace.
  if (membership.userId === user.id && nextRole !== "admin") {
    const adminCount = await prisma.membership.count({
      where: { orgId: org.id, role: "admin" },
    });
    if (adminCount <= 1) return;
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: nextRole },
  });

  revalidatePath("/settings/members");
}

export async function removeMember(formData: FormData) {
  const { org, role } = await requireTenantContext();
  if (!canManage(role)) return;

  const membershipId = String(formData.get("membershipId") ?? "");
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, orgId: org.id },
  });
  if (!membership) return;

  if (membership.role === "admin") {
    const adminCount = await prisma.membership.count({
      where: { orgId: org.id, role: "admin" },
    });
    if (adminCount <= 1) return;
  }

  await prisma.membership.delete({ where: { id: membership.id } });
  revalidatePath("/settings/members");
}

export async function revokeInvite(formData: FormData) {
  const { org, role } = await requireTenantContext();
  if (!canManage(role)) return;

  const inviteId = String(formData.get("inviteId") ?? "");
  await prisma.invite.deleteMany({
    where: { id: inviteId, orgId: org.id, acceptedAt: null },
  });

  revalidatePath("/settings/members");
}
