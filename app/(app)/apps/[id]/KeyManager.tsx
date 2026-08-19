"use client";

import { useFormState } from "react-dom";
import CopyBlock from "@/components/dashboard/CopyBlock";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { FormError, inputClass, labelClass } from "@/components/dashboard/ui";
import { createApiKey } from "../actions";

export default function KeyManager({ appId }: { appId: string }) {
  const [state, action] = useFormState(createApiKey, {});

  return (
    <div className="space-y-4 px-5 py-5">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="appId" value={appId} />
        <div className="min-w-[220px] flex-1">
          <label className={labelClass} htmlFor="keyName">
            Key label
          </label>
          <input
            id="keyName"
            name="name"
            placeholder="production gateway"
            className={`mt-2 ${inputClass}`}
          />
        </div>
        <SubmitButton pendingLabel="Issuing…">Issue key</SubmitButton>
      </form>

      <FormError message={state?.error} />

      {state?.secret && (
        <div className="space-y-3 rounded-sm border border-signal/30 bg-signal/5 p-4">
          <p className="font-body text-[13px] text-ink">
            Copy <span className="font-mono text-signal">{state.name}</span> now —
            this is the only time the secret is shown. We store a hash, so it
            cannot be recovered later.
          </p>
          <CopyBlock value={state.secret} label="API key" />
        </div>
      )}
    </div>
  );
}
