import { NextResponse } from "next/server";
import { evaluateAlertRules, recordGatewayError } from "@/lib/alerts";
import { authenticateApiKey } from "@/lib/api-keys";
import { DetectorUnavailableError, runDetection } from "@/lib/detector";
import { recordDetectionEvent } from "@/lib/events";
import {
  MAX_DETECT_TEXT,
  jsonError,
  readJsonBody,
  resolveApp,
  unauthorized,
} from "@/lib/gateway";

/**
 * Tenant gateway. Customers point their LLM calls here with a workspace API key;
 * we classify the prompt, persist the event, and evaluate alert rules.
 */
export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const body = await readJsonBody(request);
  if (!body) return jsonError("Invalid JSON body.", 400);

  const text = typeof body.text === "string" ? body.text : "";
  if (text.trim().length < 3) {
    return jsonError("Field 'text' must be at least 3 characters.", 400);
  }
  if (text.length > MAX_DETECT_TEXT) {
    return jsonError(`Field 'text' exceeds ${MAX_DETECT_TEXT} characters.`, 413);
  }

  const resolved = await resolveApp(auth.org, auth.app, body.app);
  if ("error" in resolved) return resolved.error;

  try {
    const { result } = await runDetection(text);

    const event = await recordDetectionEvent({
      org: auth.org,
      app: resolved.app,
      apiKey: auth.apiKey,
      result,
      text,
      direction: body.direction === "output" ? "output" : "input",
      model: typeof body.model === "string" ? body.model : null,
      endpoint: typeof body.endpoint === "string" ? body.endpoint : null,
    });

    await evaluateAlertRules(auth.org, resolved.app, event);

    return NextResponse.json({
      status: result.status,
      label: result.label,
      risk_level: result.riskLevel,
      confidence: result.confidence,
      tier_caught: result.tierCaught,
      latency_ms: result.latencyMs,
      heuristics: result.heuristics,
      explanation: result.explanation,
      event_id: event.id,
      app: resolved.app.slug,
    });
  } catch (error) {
    if (error instanceof DetectorUnavailableError) {
      await recordGatewayError(auth.org, resolved.app, error.message);
      return jsonError(error.message, 502);
    }
    throw error;
  }
}
