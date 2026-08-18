"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/dashboard/SubmitButton";
import {
  FormError,
  FormSuccess,
  inputClass,
  labelClass,
} from "@/components/dashboard/ui";
import { updateWorkspace } from "../actions";

export default function WorkspaceForm({
  name,
  retentionMode,
  rawTtlDays,
  disabled,
}: {
  name: string;
  retentionMode: string;
  rawTtlDays: number;
  disabled: boolean;
}) {
  const [state, action] = useFormState(updateWorkspace, {});

  return (
    <form action={action} className="space-y-5 px-5 py-5">
      <div>
        <label className={labelClass} htmlFor="name">
          Workspace name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          disabled={disabled}
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="retentionMode">
          Prompt retention
        </label>
        <select
          id="retentionMode"
          name="retentionMode"
          defaultValue={retentionMode}
          disabled={disabled}
          className={`mt-2 ${inputClass}`}
        >
          <option value="none">None — store only a hash</option>
          <option value="hashed">Hashed + short excerpt (default)</option>
          <option value="raw">Raw — store the full prompt</option>
        </select>
        <p className="mt-2 font-body text-[13px] leading-relaxed text-mute">
          Retention applies to new events only. Excerpts are capped at 240
          characters so analysts can triage without warehousing whole prompts.
        </p>
      </div>

      <div className="max-w-[220px]">
        <label className={labelClass} htmlFor="rawTtlDays">
          Raw retention TTL (days)
        </label>
        <input
          id="rawTtlDays"
          name="rawTtlDays"
          type="number"
          min={1}
          max={365}
          defaultValue={rawTtlDays}
          disabled={disabled}
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <FormError message={state.error} />
      <FormSuccess message={state.success} />

      {!disabled && <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>}
    </form>
  );
}
