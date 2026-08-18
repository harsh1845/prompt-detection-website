import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { App, Org } from "@/lib/generated/prisma/client";

export const MAX_DETECT_TEXT = 12_000;

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorized = () =>
  jsonError(
    "Missing or invalid API key. Send it as 'Authorization: Bearer <key>'.",
    401
  );

/**
 * A key can be scoped to one app, or to the whole org. Org-scoped keys must name
 * the app on each request so events never land in an ambiguous bucket.
 */
export async function resolveApp(
  org: Org,
  keyApp: App | null,
  requested: unknown
): Promise<{ app: App } | { error: NextResponse }> {
  if (keyApp) return { app: keyApp };

  if (typeof requested !== "string" || requested.trim().length === 0) {
    return {
      error: jsonError(
        "This key is not bound to an app. Include an 'app' field with the app slug or id.",
        400
      ),
    };
  }

  const identifier = requested.trim();
  const app = await prisma.app.findFirst({
    where: {
      orgId: org.id,
      OR: [{ id: identifier }, { slug: identifier }],
    },
  });

  if (!app) {
    return {
      error: jsonError(`No app named '${identifier}' in this workspace.`, 404),
    };
  }

  return { app };
}

export async function readJsonBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
