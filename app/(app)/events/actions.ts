"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canWrite, requireTenantContext } from "@/lib/tenant";

export type FeedbackState = { error?: string; success?: string };

const VERDICTS = new Set(["false_positive", "false_negative", "confirmed"]);

export async function submitFeedback(
  _prev: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const { org, user, role } = await requireTenantContext();

  if (!canWrite(role)) {
    return { error: "Viewers cannot label events." };
  }

  const eventId = String(formData.get("eventId") ?? "");
  const verdict = String(formData.get("verdict") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!VERDICTS.has(verdict)) return { error: "Pick a verdict." };

  const event = await prisma.detectionEvent.findFirst({
    where: { id: eventId, orgId: org.id },
    select: { id: true },
  });

  if (!event) return { error: "Event not found in this workspace." };

  await prisma.eventFeedback.create({
    data: {
      eventId: event.id,
      orgId: org.id,
      userId: user.id,
      verdict,
      note: note || null,
    },
  });

  revalidatePath(`/events/${event.id}`);
  revalidatePath("/events");

  return { success: "Feedback recorded. It feeds detector retraining." };
}
