"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/dashboard/SubmitButton";
import {
  FormError,
  FormSuccess,
  inputClass,
  labelClass,
} from "@/components/dashboard/ui";
import { submitFeedback } from "../actions";

export default function FeedbackForm({
  eventId,
  status,
  disabled,
}: {
  eventId: string;
  status: string;
  disabled: boolean;
}) {
  const [state, action] = useFormState(submitFeedback, {});

  if (disabled) {
    return (
      <p className="px-5 py-5 font-body text-[13px] text-mute">
        Viewers cannot label events. Ask an admin for the analyst role.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4 px-5 py-5">
      <input type="hidden" name="eventId" value={eventId} />

      <div>
        <label className={labelClass} htmlFor="verdict">
          Verdict
        </label>
        <select
          id="verdict"
          name="verdict"
          defaultValue={status === "blocked" ? "false_positive" : "false_negative"}
          className={`mt-2 ${inputClass}`}
        >
          <option value="false_positive">
            False positive — this was safe traffic
          </option>
          <option value="false_negative">
            False negative — this was an attack we allowed
          </option>
          <option value="confirmed">Confirmed — the decision was right</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="note">
          Note
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          placeholder="Optional context for whoever retrains the detector."
          className={`mt-2 ${inputClass} resize-y`}
        />
      </div>

      <FormError message={state.error} />
      <FormSuccess message={state.success} />

      <SubmitButton pendingLabel="Saving…">Record feedback</SubmitButton>
    </form>
  );
}
