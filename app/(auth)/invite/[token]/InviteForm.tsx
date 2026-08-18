"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { FormError, inputClass, labelClass } from "@/components/dashboard/ui";
import { acceptInvite } from "../../actions";

export default function InviteForm({
  token,
  email,
  orgName,
  role,
  hasAccount,
}: {
  token: string;
  email: string;
  orgName: string;
  role: string;
  hasAccount: boolean;
}) {
  const [state, action] = useFormState(acceptInvite, {});

  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold tracking-tighter text-ink">
        Join {orgName}
      </h1>
      <p className="mt-2 font-body text-[14px] text-mute">
        Invited as <span className="font-mono text-signal">{role}</span> for{" "}
        <span className="font-mono text-ink">{email}</span>.
      </p>

      <form action={action} className="mt-8 space-y-4">
        <input type="hidden" name="token" value={token} />

        {!hasAccount && (
          <div>
            <label className={labelClass} htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              className={`mt-2 ${inputClass}`}
              placeholder="Optional"
            />
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="password">
            {hasAccount ? "Your existing password" : "Choose a password"}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={hasAccount ? "current-password" : "new-password"}
            required
            minLength={hasAccount ? undefined : 10}
            className={`mt-2 ${inputClass}`}
            placeholder={hasAccount ? "••••••••••" : "At least 10 characters"}
          />
        </div>

        <FormError message={state.error} />

        <SubmitButton pendingLabel="Joining…" className="w-full">
          Join workspace
        </SubmitButton>
      </form>
    </div>
  );
}
