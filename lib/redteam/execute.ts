import { createHash } from "node:crypto";
import { recordRedTeamAlert } from "@/lib/alerts";
import { prisma } from "@/lib/db";
import { DetectorUnavailableError, runDetection } from "@/lib/detector";
import type { Org, RedTeamRun } from "@/lib/generated/prisma/client";
import { resolveCorpusItems, type CorpusItem } from "./catalog";
import { clamp, redTeamLimits } from "./plans";
import {
  excerpt,
  parseDetectorStatus,
  scoreItem,
  type ItemOutcome,
  type TargetKind,
} from "./scoring";

const inflight = new Set<string>();

type ProbeResult = {
  outcome: ItemOutcome;
  detectorStatus: string | null;
  httpStatus: number | null;
  latencyMs: number | null;
  error: string | null;
  body: string;
};

type Regression = { id: string; corpus: string; excerpt: string };

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function runWorker() {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }

  const size = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: size }, () => runWorker()));
  return results;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function renderBody(template: string, prompt: string) {
  if (!template.includes("{{prompt}}")) return template;
  const escaped = JSON.stringify(prompt).slice(1, -1);
  const candidate = template.replaceAll("{{prompt}}", escaped);
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return template.replaceAll("{{prompt}}", prompt);
  }
}

function parseHeaders(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.trim()) headers[key] = value;
    }
    return headers;
  } catch {
    return {};
  }
}

function assertHttpUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Target URL is not valid.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Target URL must be http or https.");
  }
}

function detectorUrl() {
  const base = process.env.DETECTOR_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new DetectorUnavailableError(
      "Detector backend is not configured. Set DETECTOR_API_URL."
    );
  }
  return `${base}/detect`;
}

async function probeGateway(text: string, _timeoutMs: number): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const { result, raw } = await runDetection(text);
    return {
      outcome: "pass",
      detectorStatus: result.status,
      httpStatus: 200,
      latencyMs: result.latencyMs ?? Date.now() - started,
      error: null,
      body: JSON.stringify(raw),
    };
  } catch (error) {
    return {
      outcome: "error",
      detectorStatus: null,
      httpStatus: null,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "Detector request failed.",
      body: "",
    };
  }
}

async function probeHttp(
  run: RedTeamRun,
  text: string,
  timeoutMs: number
): Promise<ProbeResult> {
  if (!run.targetUrl) {
    return {
      outcome: "error",
      detectorStatus: null,
      httpStatus: null,
      latencyMs: null,
      error: "No target URL on this run.",
      body: "",
    };
  }

  assertHttpUrl(run.targetUrl);
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = parseHeaders(run.headersJson);
  if (!Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const rendered = renderBody(run.bodyTemplate, text);
    let body: BodyInit = rendered;
    try {
      body = JSON.stringify(JSON.parse(rendered));
    } catch {
      body = rendered;
    }

    const response = await fetch(run.targetUrl, {
      method: run.method || "POST",
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    const responseText = await response.text();
    const detectorStatus = parseDetectorStatus(responseText);

    return {
      outcome: "pass",
      detectorStatus,
      httpStatus: response.status,
      latencyMs: Date.now() - started,
      error: null,
      body: responseText,
    };
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");
    return {
      outcome: "error",
      detectorStatus: null,
      httpStatus: null,
      latencyMs: Date.now() - started,
      error: aborted
        ? `Timed out after ${Math.round(timeoutMs / 1000)}s.`
        : error instanceof Error
          ? error.message
          : "HTTP request failed.",
      body: "",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeItem(
  run: RedTeamRun,
  item: CorpusItem,
  timeoutMs: number
): Promise<ProbeResult> {
  const kind = (run.targetKind === "http" ? "http" : "gateway") as TargetKind;
  const probe =
    kind === "gateway"
      ? await probeGateway(item.text, timeoutMs)
      : await probeHttp(run, item.text, timeoutMs);

  return {
    ...probe,
    outcome: scoreItem({
      expected: item.expected,
      targetKind: kind,
      detectorStatus: probe.detectorStatus,
      httpStatus: probe.httpStatus,
      body: probe.body,
      transportError: probe.outcome === "error" && Boolean(probe.error),
    }),
  };
}

async function previousOutcomes(run: RedTeamRun) {
  const previous = await prisma.redTeamRun.findFirst({
    where: {
      orgId: run.orgId,
      id: { not: run.id },
      status: "completed",
      targetKind: run.targetKind,
      ...(run.appId ? { appId: run.appId } : {}),
      ...(run.targetUrl ? { targetUrl: run.targetUrl } : { targetUrl: null }),
    },
    orderBy: { finishedAt: "desc" },
    include: {
      items: { select: { sourceId: true, promptHash: true, outcome: true } },
    },
  });

  const bySource = new Map<string, string>();
  const byHash = new Map<string, string>();
  for (const item of previous?.items ?? []) {
    bySource.set(item.sourceId, item.outcome);
    byHash.set(item.promptHash, item.outcome);
  }
  return { bySource, byHash };
}

type RemoteJob = {
  status: string;
  error?: string;
  summary?: {
    total?: number;
    passed?: number;
    failed?: number;
    errors?: number;
    pass_rate?: number | null;
  };
  regressions?: { id?: string; corpus?: string; excerpt?: string }[];
  items?: {
    id?: string;
    corpus?: string;
    text?: string;
    expected?: string;
    outcome?: string;
    detector_status?: string | null;
    http_status?: number | null;
    latency_ms?: number | null;
    error?: string | null;
    response_excerpt?: string | null;
  }[];
};

async function executeViaRunner(
  run: RedTeamRun,
  items: CorpusItem[],
  org: Org
) {
  const base = process.env.REDTEAM_RUNNER_URL?.replace(/\/$/, "");
  if (!base) return false;

  const previous = await previousOutcomes(run);
  const previousItems = items
    .filter((item) => previous.bySource.get(item.id) || previous.byHash.get(sha256(item.text)))
    .map((item) => ({
      id: item.id,
      text: item.text,
      outcome: previous.bySource.get(item.id) ?? previous.byHash.get(sha256(item.text)),
    }));

  const targetUrl =
    run.targetKind === "gateway" ? detectorUrl() : run.targetUrl;
  if (!targetUrl) throw new Error("No target URL for this run.");

  const created = await fetch(`${base}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_id: run.id,
      target: {
        kind: run.targetKind,
        url: targetUrl,
        method: run.method,
        headers: parseHeaders(run.headersJson),
        body_template: run.bodyTemplate,
      },
      corpora: JSON.parse(run.corporaJson) as string[],
      custom_text: run.customText ?? "",
      concurrency: run.concurrency,
      timeout_seconds: run.timeoutSeconds,
      max_items: items.length,
      previous_items: previousItems,
    }),
  });

  if (!created.ok) {
    throw new Error(`Red-team runner returned ${created.status}.`);
  }

  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const poll = await fetch(`${base}/jobs/${run.id}`, { cache: "no-store" });
    if (!poll.ok) continue;
    const job = (await poll.json()) as RemoteJob;
    if (job.status === "running" || job.status === "queued") continue;
    if (job.status === "failed") {
      throw new Error(job.error || "Red-team runner failed.");
    }
    await persistRemoteResult(run, org, items, job);
    return true;
  }

  throw new Error("Red-team runner timed out after 15 minutes.");
}

async function persistRemoteResult(
  run: RedTeamRun,
  org: Org,
  localItems: CorpusItem[],
  job: RemoteJob
) {
  const byId = new Map(localItems.map((item) => [item.id, item]));
  const previous = await previousOutcomes(run);
  const regressions: Regression[] = (job.regressions ?? []).map((row) => ({
    id: String(row.id ?? ""),
    corpus: String(row.corpus ?? ""),
    excerpt: String(row.excerpt ?? ""),
  }));
  const regressionIds = new Set(regressions.map((row) => row.id));

  const rows = (job.items ?? []).map((row) => {
    const local = row.id ? byId.get(row.id) : undefined;
    const text = local?.text ?? row.text ?? "";
    const sourceId = row.id ?? local?.id ?? sha256(text).slice(0, 12);
    const promptHash = sha256(text || sourceId);
    const outcome = (row.outcome === "fail" || row.outcome === "error"
      ? row.outcome
      : "pass") as ItemOutcome;
    return {
      runId: run.id,
      orgId: run.orgId,
      corpus: row.corpus ?? local?.corpus ?? "custom",
      sourceId,
      promptHash,
      promptExcerpt: excerpt(text || row.response_excerpt || sourceId),
      expected: (row.expected === "benign" ? "benign" : "attack") as "attack" | "benign",
      outcome,
      detectorStatus: row.detector_status ?? null,
      httpStatus: row.http_status ?? null,
      latencyMs: row.latency_ms ?? null,
      error: row.error ?? null,
      responseExcerpt: row.response_excerpt ?? null,
      isRegression:
        regressionIds.has(sourceId) ||
        (previous.bySource.get(sourceId) === "pass" && outcome === "fail"),
    };
  });

  await finishRun(run, org, rows, regressions, job.summary?.pass_rate ?? null);
}

async function persistLocalResult(
  run: RedTeamRun,
  org: Org,
  items: CorpusItem[],
  probes: ProbeResult[]
) {
  const previous = await previousOutcomes(run);
  const rows = items.map((item, index) => {
    const probe = probes[index];
    const promptHash = sha256(item.text);
    const prior =
      previous.bySource.get(item.id) ?? previous.byHash.get(promptHash);
    const isRegression = prior === "pass" && probe.outcome === "fail";
    return {
      runId: run.id,
      orgId: run.orgId,
      corpus: item.corpus,
      sourceId: item.id,
      promptHash,
      promptExcerpt: excerpt(item.text),
      expected: item.expected,
      outcome: probe.outcome,
      detectorStatus: probe.detectorStatus,
      httpStatus: probe.httpStatus,
      latencyMs: probe.latencyMs,
      error: probe.error,
      responseExcerpt: probe.body ? excerpt(probe.body) : null,
      isRegression,
    };
  });

  const regressions: Regression[] = rows
    .filter((row) => row.isRegression)
    .map((row) => ({
      id: row.sourceId,
      corpus: row.corpus,
      excerpt: row.promptExcerpt,
    }));

  await finishRun(run, org, rows, regressions, null);
}

async function finishRun(
  run: RedTeamRun,
  org: Org,
  rows: {
    runId: string;
    orgId: string;
    corpus: string;
    sourceId: string;
    promptHash: string;
    promptExcerpt: string;
    expected: string;
    outcome: ItemOutcome;
    detectorStatus: string | null;
    httpStatus: number | null;
    latencyMs: number | null;
    error: string | null;
    responseExcerpt: string | null;
    isRegression: boolean;
  }[],
  regressions: Regression[],
  remotePassRate: number | null
) {
  const passed = rows.filter((row) => row.outcome === "pass").length;
  const failed = rows.filter((row) => row.outcome === "fail").length;
  const errors = rows.filter((row) => row.outcome === "error").length;
  const scored = passed + failed;
  const passRate =
    remotePassRate ?? (scored > 0 ? passed / scored : null);

  await prisma.$transaction([
    prisma.redTeamItem.deleteMany({ where: { runId: run.id } }),
    prisma.redTeamItem.createMany({ data: rows }),
    prisma.redTeamRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        totalItems: rows.length,
        passed,
        failed,
        errors,
        passRate,
        regressionsJson: JSON.stringify(regressions),
        finishedAt: new Date(),
        errorMessage: null,
      },
    }),
  ]);

  await recordRedTeamAlert(org, {
    runId: run.id,
    targetName: run.targetName,
    failed,
    regressions: regressions.length,
    passRate,
  });
}

export async function executeRun(runId: string) {
  if (inflight.has(runId)) return;
  inflight.add(runId);

  try {
    const run = await prisma.redTeamRun.findUnique({
      where: { id: runId },
    });
    if (!run) return;

    const org = await prisma.org.findUnique({ where: { id: run.orgId } });
    if (!org) return;

    const limits = redTeamLimits(org.plan);
    const corpora = JSON.parse(run.corporaJson) as string[];
    const items = resolveCorpusItems(
      Array.isArray(corpora) ? corpora : [],
      run.customText ?? "",
      Math.min(limits.maxItems, 100)
    );

    if (items.length === 0) {
      await prisma.redTeamRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          errorMessage: "No corpus items to run.",
          finishedAt: new Date(),
        },
      });
      return;
    }

    await prisma.redTeamRun.update({
      where: { id: run.id },
      data: {
        status: "running",
        startedAt: new Date(),
        totalItems: items.length,
        errorMessage: null,
      },
    });

    const usedRunner = await executeViaRunner(run, items, org).catch(
      () => false
    );
    if (usedRunner) return;

    const timeoutMs = clamp(run.timeoutSeconds, 5, 60) * 1000;
    const concurrency = clamp(
      run.concurrency,
      1,
      redTeamLimits(org.plan).maxConcurrency
    );
    const probes = await mapPool(items, concurrency, (item) =>
      probeItem(run, item, timeoutMs)
    );
    await persistLocalResult(run, org, items, probes);
  } catch (error) {
    await prisma.redTeamRun.update({
      where: { id: runId },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorMessage:
          error instanceof Error ? error.message : "Red-team run failed.",
      },
    });
  } finally {
    inflight.delete(runId);
  }
}
