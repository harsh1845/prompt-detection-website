"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ghostButtonClass } from "@/components/dashboard/ui";

const selectClass =
  "rounded-sm border border-hairline bg-base px-2.5 py-2 font-body text-[13px] text-ink outline-none focus:border-signal/70";

export default function EventFilters({
  apps,
}: {
  apps: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`/events?${next.toString()}`);
    },
    [params, router]
  );

  const hasFilters = ["status", "appId", "tier", "direction", "q"].some((key) =>
    params.get(key)
  );

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-5 py-4">
      <select
        aria-label="Status"
        className={selectClass}
        value={params.get("status") ?? ""}
        onChange={(event) => update("status", event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="blocked">Blocked</option>
        <option value="allowed">Allowed</option>
      </select>

      <select
        aria-label="App"
        className={selectClass}
        value={params.get("appId") ?? ""}
        onChange={(event) => update("appId", event.target.value)}
      >
        <option value="">All apps</option>
        {apps.map((app) => (
          <option key={app.id} value={app.id}>
            {app.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Tier"
        className={selectClass}
        value={params.get("tier") ?? ""}
        onChange={(event) => update("tier", event.target.value)}
      >
        <option value="">All tiers</option>
        <option value="1">Tier 1 — heuristics</option>
        <option value="2">Tier 2 — SVM</option>
        <option value="3">Tier 3 — SLM</option>
      </select>

      <select
        aria-label="Direction"
        className={selectClass}
        value={params.get("direction") ?? ""}
        onChange={(event) => update("direction", event.target.value)}
      >
        <option value="">Input &amp; output</option>
        <option value="input">Input</option>
        <option value="output">Output</option>
      </select>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("q");
          update("q", typeof value === "string" ? value.trim() : "");
        }}
      >
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search excerpt or heuristic"
          className="w-56 rounded-sm border border-hairline bg-base px-3 py-2 font-body text-[13px] text-ink outline-none placeholder:text-mute/60 focus:border-signal/70"
        />
        <button type="submit" className={ghostButtonClass}>
          Search
        </button>
      </form>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/events")}
          className="font-body text-[13px] text-mute transition-colors hover:text-ink"
        >
          Clear
        </button>
      )}
    </div>
  );
}
