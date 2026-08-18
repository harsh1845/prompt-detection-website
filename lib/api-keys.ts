import { randomBytes } from "node:crypto";
import { sha256 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { App, ApiKey, Org } from "@/lib/generated/prisma/client";

const KEY_PREFIX = "pg_live_";

export type GeneratedKey = {
  secret: string;
  keyHash: string;
  prefix: string;
  last4: string;
};

export function generateApiKey(): GeneratedKey {
  const secret = `${KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
  return {
    secret,
    keyHash: sha256(secret),
    prefix: secret.slice(0, KEY_PREFIX.length + 4),
    last4: secret.slice(-4),
  };
}

export function maskKey(key: Pick<ApiKey, "prefix" | "last4">) {
  return `${key.prefix}${"•".repeat(10)}${key.last4}`;
}

function extractToken(request: Request) {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  const direct = request.headers.get("x-api-key");
  return direct?.trim() || null;
}

export type AuthenticatedKey = {
  apiKey: ApiKey;
  org: Org;
  app: App | null;
};

/**
 * Resolves an inbound gateway request to a tenant. Returns null for missing,
 * unknown, or revoked keys so callers can answer with a single 401.
 */
export async function authenticateApiKey(
  request: Request
): Promise<AuthenticatedKey | null> {
  const token = extractToken(request);
  if (!token) return null;

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: sha256(token) },
    include: { org: true, app: true },
  });

  if (!apiKey || apiKey.revokedAt) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { apiKey, org: apiKey.org, app: apiKey.app };
}
