"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { FormError, inputClass, labelClass } from "@/components/dashboard/ui";
import { createApp } from "./actions";

export default function CreateAppForm() {
  const [state, action] = useFormState(createApp, {});

  return (
    <form action={action} className="grid gap-4 px-5 py-5 sm:grid-cols-3">
      <div>
        <label className={labelClass} htmlFor="name">
          App name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="production-chat"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="provider">
          Model provider
        </label>
        <select
          id="provider"
          name="provider"
          defaultValue="openai"
          className={`mt-2 ${inputClass}`}
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google</option>
          <option value="self-hosted">Self-hosted</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="environment">
          Environment
        </label>
        <input
          id="environment"
          name="environment"
          defaultValue="production"
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div className="sm:col-span-3">
        <FormError message={state.error} />
        <div className="mt-3">
          <SubmitButton pendingLabel="Creating…">Create app</SubmitButton>
        </div>
      </div>
    </form>
  );
}
