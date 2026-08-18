export type DetectionResult = {
  status: "allowed" | "blocked";
  label: string | null;
  riskLevel: string | null;
  confidence: number | null;
  tierCaught: number | null;
  maxChunkProbability: number | null;
  latencyMs: number | null;
  heuristics: string[];
  explanation: string | null;
  sanitizedText: string | null;
};

type RawDetectorResponse = {
  status?: unknown;
  label?: unknown;
  risk_level?: unknown;
  confidence?: unknown;
  tier_caught?: unknown;
  max_chunk_probability?: unknown;
  latency_ms?: unknown;
  heuristics?: unknown;
  explanation?: unknown;
  sanitized_text?: unknown;
};

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Both detector surfaces are supported: the FastAPI lightweight path returns the
 * full explanation payload, the Rust cascade returns the minimal decision only.
 */
export function normalizeDetection(
  payload: unknown,
  fallbackLatencyMs: number
): DetectionResult {
  const raw = (payload ?? {}) as RawDetectorResponse;
  const status = raw.status === "blocked" ? "blocked" : "allowed";

  return {
    status,
    label: asString(raw.label),
    riskLevel: asString(raw.risk_level),
    confidence: asNumber(raw.confidence),
    tierCaught: asNumber(raw.tier_caught),
    maxChunkProbability: asNumber(raw.max_chunk_probability),
    latencyMs: asNumber(raw.latency_ms) ?? fallbackLatencyMs,
    heuristics: Array.isArray(raw.heuristics)
      ? raw.heuristics.filter((item): item is string => typeof item === "string")
      : [],
    explanation: asString(raw.explanation),
    sanitizedText: asString(raw.sanitized_text),
  };
}

export class DetectorUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DetectorUnavailableError";
  }
}

export async function runDetection(text: string): Promise<{
  result: DetectionResult;
  raw: unknown;
}> {
  const detectorUrl = process.env.DETECTOR_API_URL;
  if (!detectorUrl) {
    throw new DetectorUnavailableError(
      "Detector backend is not configured. Set DETECTOR_API_URL."
    );
  }

  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch(`${detectorUrl.replace(/\/$/, "")}/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      cache: "no-store",
    });
  } catch {
    throw new DetectorUnavailableError("Could not reach the detector backend.");
  }

  const elapsed = Date.now() - startedAt;
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : `Detector returned ${response.status}.`;
    throw new DetectorUnavailableError(detail);
  }

  return { result: normalizeDetection(payload, elapsed), raw: payload };
}
