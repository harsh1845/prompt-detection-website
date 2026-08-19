"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { FormError, inputClass, labelClass } from "@/components/dashboard/ui";
import { signUp } from "../actions";

export default function SignupPage() {
  const [state, action] = useFormState(signUp, {});

  return (
    <div>
      <h1 className="font-display text-[30px] font-semibold tracking-tighter text-ink">
        Create your workspace
      </h1>
      <p className="mt-2 font-body text-[14px] text-mute">
        You become the admin. Invite your team once the gateway is live.
      </p>

      <form action={action} className="mt-8 space-y-4">
        <div>
          <label className={labelClass} htmlFor="orgName">
            Company or team
          </label>
          <input
            id="orgName"
            name="orgName"
            required
            className={`mt-2 ${inputClass}`}
            placeholder="Northwind AI"
          />
        </div>

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

        <div>
          <label className={labelClass} htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`mt-2 ${inputClass}`}
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            className={`mt-2 ${inputClass}`}
            placeholder="At least 10 characters"
          />
        </div>

        <FormError message={state?.error} />

        <SubmitButton pendingLabel="Creating…" className="w-full">
          Create workspace
        </SubmitButton>
      </form>

      <p className="mt-6 font-body text-[13px] text-mute">
        Already have an account?{" "}
        <Link href="/login" className="text-signal hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
