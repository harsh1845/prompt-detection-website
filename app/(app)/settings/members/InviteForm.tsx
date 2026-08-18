"use client";

import { useFormState } from "react-dom";
import CopyBlock from "@/components/dashboard/CopyBlock";
import SubmitButton from "@/components/dashboard/SubmitButton";
import {
  FormError,
  FormSuccess,
  inputClass,
  labelClass,
} from "@/components/dashboard/ui";
import { inviteMember } from "../actions";

export default function InviteForm() {
  const [state, action] = useFormState(inviteMember, {});

  return (
    <div className="space-y-4 px-5 py-5">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <label className={labelClass} htmlFor="inviteEmail">
            Email
          </label>
          <input
            id="inviteEmail"
            name="email"
            type="email"
            required
            placeholder="teammate@company.com"
            className={`mt-2 ${inputClass}`}
          />
        </div>

        <div className="min-w-[160px]">
          <label className={labelClass} htmlFor="inviteRole">
            Role
          </label>
          <select
            id="inviteRole"
            name="role"
            defaultValue="analyst"
            className={`mt-2 ${inputClass}`}
          >
            <option value="admin">Admin</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <SubmitButton pendingLabel="Creating…">Create invite</SubmitButton>
      </form>

      <FormError message={state.error} />
      <FormSuccess message={state.success} />

      {state.inviteUrl && (
        <CopyBlock value={state.inviteUrl} label="Invite link" />
      )}
    </div>
  );
}
