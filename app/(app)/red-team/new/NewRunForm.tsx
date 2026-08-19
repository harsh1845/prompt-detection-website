"use client";

import { useFormState } from "react-dom";
import { useMemo, useState } from "react";
import SubmitButton from "@/components/dashboard/SubmitButton";
import {
  FormError,
  inputClass,
  labelClass,
} from "@/components/dashboard/ui";
import type { CorpusPackMeta } from "@/lib/redteam/catalog";
import { startRedTeamRun } from "../actions";

type AppOption = { id: string; name: string; slug: string };
type SavedTarget = {
  id: string;
  name: string;
  kind: string;
  url: string | null;
};

export default function NewRunForm({
  apps,
  packs,
  targets,
  maxConcurrency,
  maxCustom,
}: {
  apps: AppOption[];
  packs: CorpusPackMeta[];
  targets: SavedTarget[];
  maxConcurrency: number;
  maxCustom: number;
}) {
  const [state, action] = useFormState(startRedTeamRun, {});
  const [kind, setKind] = useState<"gateway" | "http">("gateway");
  const [selected, setSelected] = useState<Record<string, boolean>>({
    jailbreak: true,
    injection: true,
  });

  const selectedCount = useMemo(
    () =>
      packs
        .filter((pack) => selected[pack.id])
        .reduce((sum, pack) => sum + pack.itemCount, 0),
    [packs, selected]
  );

  return (
    <form action={action} className="space-y-8">
      <div>
        <p className={labelClass}>Target</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: "gateway" as const,
                title: "Replay through our gateway",
                body: "Send the corpus to PromptGuard. Attacks should be blocked; benign prompts should be allowed.",
              },
              {
                value: "http" as const,
                title: "Registered HTTP endpoint",
                body: "POST prompts at your chatbot or API. Refusals and PromptGuard-shaped JSON count as passes on attacks.",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-sm border px-4 py-3 ${
                kind === option.value
                  ? "border-signal/50 bg-signal/5"
                  : "border-hairline hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={option.value}
                checked={kind === option.value}
                onChange={() => setKind(option.value)}
                className="sr-only"
              />
              <span className="font-display text-[14px] font-semibold tracking-tighter text-ink">
                {option.title}
              </span>
              <span className="mt-1 block font-body text-[13px] leading-relaxed text-mute">
                {option.body}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="appId">
            App (optional)
          </label>
          <select id="appId" name="appId" className={`mt-2 ${inputClass}`}>
            <option value="">No app linked</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
        </div>

        {targets.length > 0 && kind === "http" ? (
          <div>
            <label className={labelClass} htmlFor="targetId">
              Saved target
            </label>
            <select id="targetId" name="targetId" className={`mt-2 ${inputClass}`}>
              <option value="">New endpoint</option>
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name}
                  {target.url ? ` · ${target.url}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {kind === "http" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="url">
              Endpoint URL
            </label>
            <input
              id="url"
              name="url"
              placeholder="https://chat.example.com/v1/messages"
              className={`mt-2 ${inputClass}`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="targetName">
              Display name
            </label>
            <input
              id="targetName"
              name="targetName"
              placeholder="production-chat"
              className={`mt-2 ${inputClass}`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="method">
              Method
            </label>
            <select id="method" name="method" defaultValue="POST" className={`mt-2 ${inputClass}`}>
              <option>POST</option>
              <option>PUT</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="bodyTemplate">
              JSON body template
            </label>
            <textarea
              id="bodyTemplate"
              name="bodyTemplate"
              rows={3}
              defaultValue={'{"text":"{{prompt}}"}'}
              className={`mt-2 font-mono text-[13px] ${inputClass}`}
            />
            <p className="mt-2 font-body text-[12px] text-mute">
              <span className="font-mono">{"{{prompt}}"}</span> is replaced with each
              corpus item. Chat Completions example:{" "}
              <span className="font-mono">
                {'{"messages":[{"role":"user","content":"{{prompt}}"}]}'}
              </span>
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="headersJson">
              Headers JSON (optional)
            </label>
            <input
              id="headersJson"
              name="headersJson"
              placeholder='{"Authorization":"Bearer …"}'
              className={`mt-2 font-mono text-[13px] ${inputClass}`}
            />
          </div>
          <label className="flex items-center gap-2 font-body text-[13px] text-ink">
            <input type="checkbox" name="saveTarget" className="accent-signal" />
            Save this target for later runs
          </label>
        </div>
      ) : null}

      <div>
        <p className={labelClass}>Corpora</p>
        <p className="mt-2 font-body text-[13px] text-mute">
          {selectedCount} curated items selected before the custom list. Caps keep
          this from turning into a load test.
        </p>
        <ul className="mt-4 space-y-2">
          {packs.map((pack) => (
            <li key={pack.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-hairline px-4 py-3 hover:border-white/20">
                <input
                  type="checkbox"
                  name="corpora"
                  value={pack.id}
                  checked={Boolean(selected[pack.id])}
                  onChange={(event) =>
                    setSelected((current) => ({
                      ...current,
                      [pack.id]: event.target.checked,
                    }))
                  }
                  className="mt-1 accent-signal"
                />
                <span>
                  <span className="font-display text-[14px] font-semibold tracking-tighter text-ink">
                    {pack.name}
                  </span>
                  <span className="ml-2 font-mono text-[11px] text-mute">
                    {pack.itemCount} items
                  </span>
                  <span className="mt-1 block font-body text-[13px] leading-relaxed text-mute">
                    {pack.description}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className={labelClass} htmlFor="customText">
          Custom prompts (optional, max {maxCustom})
        </label>
        <textarea
          id="customText"
          name="customText"
          rows={5}
          placeholder={"One prompt per line.\nPrefix a line with benign: for a hard negative."}
          className={`mt-2 font-mono text-[13px] ${inputClass}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="concurrency">
            Concurrency (1–{maxConcurrency})
          </label>
          <input
            id="concurrency"
            name="concurrency"
            type="number"
            min={1}
            max={maxConcurrency}
            defaultValue={2}
            className={`mt-2 ${inputClass}`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="timeoutSeconds">
            Timeout per item (seconds)
          </label>
          <input
            id="timeoutSeconds"
            name="timeoutSeconds"
            type="number"
            min={5}
            max={60}
            defaultValue={15}
            className={`mt-2 ${inputClass}`}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 font-body text-[13px] text-ink">
        <input type="checkbox" name="scheduleWeekly" className="accent-signal" />
        Also run this weekly
      </label>

      <FormError message={state?.error} />
      <SubmitButton pendingLabel="Queuing scan…">Start scan</SubmitButton>
    </form>
  );
}
