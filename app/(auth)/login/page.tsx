"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/dashboard/SubmitButton";
import { FormError, inputClass, labelClass } from "@/components/dashboard/ui";
import { signIn } from "../actions";

export default function LoginPage() {
  const [state, action] = useFormState(signIn, {});

  return (
    <div>
      <h1 className="font-display text-[30px] font-semibold tracking-tighter text-ink">
        Log in
      </h1>
      <p className="mt-2 font-body text-[14px] text-mute">
        Access your detection events, apps, and gateway keys.
      </p>

      <form action={action} className="mt-8 space-y-4">
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
            autoComplete="current-password"
            required
            className={`mt-2 ${inputClass}`}
            placeholder="••••••••••"
          />
        </div>

        <FormError message={state?.error} />

        <SubmitButton pendingLabel="Signing in…" className="w-full">
          Log in
        </SubmitButton>
      </form>

      <p className="mt-6 font-body text-[13px] text-mute">
        No workspace yet?{" "}
        <Link href="/signup" className="text-signal hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
