"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/dashboard/SubmitButton";
import {
  FormError,
  FormSuccess,
  inputClass,
  labelClass,
} from "@/components/dashboard/ui";
import { triggerTestAlert, updateAlertSettings } from "../actions";

export default function AlertSettingsForm({
  slackWebhookUrl,
  alertBlockRatePercent,
  alertMinVolume,
  alertConfidenceFloor,
  alertOnHighConfidence,
  disabled,
}: {
  slackWebhookUrl: string | null;
  alertBlockRatePercent: number;
  alertMinVolume: number;
  alertConfidenceFloor: number;
  alertOnHighConfidence: boolean;
  disabled: boolean;
}) {
  const [state, action] = useFormState(updateAlertSettings, {});
  const [testState, testAction] = useFormState(triggerTestAlert, {});

  return (
    <div className="space-y-5 px-5 py-5">
      <form action={action} className="space-y-5">
        <div>
          <label className={labelClass} htmlFor="slackWebhookUrl">
            Slack incoming webhook
          </label>
          <input
            id="slackWebhookUrl"
            name="slackWebhookUrl"
            defaultValue={slackWebhookUrl ?? ""}
            disabled={disabled}
            placeholder="https://hooks.slack.com/services/..."
            className={`mt-2 ${inputClass}`}
          />
          <p className="mt-2 font-body text-[13px] text-mute">
            Leave empty to keep alerts in-app only.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="alertBlockRatePercent">
              Block-rate threshold (%)
            </label>
            <input
              id="alertBlockRatePercent"
              name="alertBlockRatePercent"
              type="number"
              min={1}
              max={100}
              defaultValue={alertBlockRatePercent}
              disabled={disabled}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="alertMinVolume">
              Minimum hourly volume
            </label>
            <input
              id="alertMinVolume"
              name="alertMinVolume"
              type="number"
              min={1}
              defaultValue={alertMinVolume}
              disabled={disabled}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="alertConfidenceFloor">
              Confidence floor
            </label>
            <input
              id="alertConfidenceFloor"
              name="alertConfidenceFloor"
              type="number"
              step="0.01"
              min={0.5}
              max={1}
              defaultValue={alertConfidenceFloor}
              disabled={disabled}
              className={`mt-2 ${inputClass}`}
            />
          </div>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="alertOnHighConfidence"
            defaultChecked={alertOnHighConfidence}
            disabled={disabled}
            className="h-4 w-4 accent-[#FFC78A]"
          />
          <span className="font-body text-[13px] text-ink">
            Alert on every high-confidence injection block
          </span>
        </label>

        <FormError message={state?.error} />
        <FormSuccess message={state?.success} />

        {!disabled && (
          <SubmitButton pendingLabel="Saving…">Save alert rules</SubmitButton>
        )}
      </form>

      {!disabled && (
        <form action={testAction} className="border-t border-hairline pt-5">
          <SubmitButton variant="ghost" pendingLabel="Sending…">
            Send test alert
          </SubmitButton>
          <FormError message={testState?.error} />
          <FormSuccess message={testState?.success} />
        </form>
      )}
    </div>
  );
}
