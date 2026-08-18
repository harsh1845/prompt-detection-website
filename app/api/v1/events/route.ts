import { NextResponse } from "next/server";
import { evaluateAlertRules } from "@/lib/alerts";
import { authenticateApiKey } from "@/lib/api-keys";
import { normalizeDetection } from "@/lib/detector";
import { recordDetectionEvent } from "@/lib/events";
import {
  MAX_DETECT_TEXT,
  jsonError,
  readJsonBody,
  resolveApp,
  unauthorized,
} from "@/lib/gateway";

/**
 * Reporting endpoint for teams running the detector themselves (Docker cascade or
 * the FastAPI service). They classify locally and forward the decision here, so
 * prompt text never has to leave their network.
 */
export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const body = await readJsonBody(request);
  if (!body) return jsonError("Invalid JSON body.", 400);

  if (body.status !== "allowed" && body.status !== "blocked") {
    return jsonError("Field 'status' must be 'allowed' or 'blocked'.", 400);
  }

  const text = typeof body.text === "string" ? body.text : null;
  const promptHash =
    typeof body.prompt_hash === "string" ? body.prompt_hash : null;

  if (!text && !promptHash) {
    return jsonError("Send either 'text' or 'prompt_hash'.", 400);
  }
  if (text && text.length > MAX_DETECT_TEXT) {
    return jsonError(`Field 'text' exceeds ${MAX_DETECT_TEXT} characters.`, 413);
  }

  const resolved = await resolveApp(auth.org, auth.app, body.app);
  if ("error" in resolved) return resolved.error;

  const result = normalizeDetection(body, 0);

  const event = await recordDetectionEvent({
    org: auth.org,
    app: resolved.app,
    apiKey: auth.apiKey,
    result,
    text,
    promptHash,
    direction: body.direction === "output" ? "output" : "input",
    model: typeof body.model === "string" ? body.model : null,
    endpoint: typeof body.endpoint === "string" ? body.endpoint : null,
  });

  await evaluateAlertRules(auth.org, resolved.app, event);

  return NextResponse.json({ event_id: event.id, app: resolved.app.slug }, { status: 201 });
}
