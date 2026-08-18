import { Panel } from "@/components/dashboard/ui";
import { canManage, requireTenantContext } from "@/lib/tenant";
import AlertSettingsForm from "./AlertSettingsForm";

const rules = [
  {
    name: "Block-rate spike",
    detail:
      "Fires when the share of blocked traffic in the last hour crosses your threshold, once the workspace has enough volume to be meaningful.",
  },
  {
    name: "High-confidence injection",
    detail:
      "Fires when a single request is blocked at or above your confidence floor — the signal that someone is actively probing.",
  },
  {
    name: "Detector unreachable",
    detail:
      "Fires when the gateway cannot reach the detector backend, so a silent outage does not look like clean traffic.",
  },
];

export default async function IntegrationsPage() {
  const { org, role } = await requireTenantContext();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Settings
        </p>
        <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tighter text-ink">
          Alerts &amp; Slack
        </h1>
        <p className="mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-mute">
          Rules are evaluated inline as events arrive, so there is no scheduler to
          babysit. Each rule has its own cooldown to keep an attack burst from
          flooding your channel.
        </p>
      </div>

      <Panel
        title="Delivery and thresholds"
        description={
          canManage(role)
            ? "Applies to every app in this workspace"
            : "Read-only — admins manage alerting"
        }
      >
        <AlertSettingsForm
          slackWebhookUrl={org.slackWebhookUrl}
          alertBlockRatePercent={org.alertBlockRatePercent}
          alertMinVolume={org.alertMinVolume}
          alertConfidenceFloor={org.alertConfidenceFloor}
          alertOnHighConfidence={org.alertOnHighConfidence}
          disabled={!canManage(role)}
        />
      </Panel>

      <Panel title="Active rules">
        <ul className="divide-y divide-hairline">
          {rules.map((rule) => (
            <li key={rule.name} className="px-5 py-4">
              <p className="font-display text-[14px] font-semibold tracking-tighter text-ink">
                {rule.name}
              </p>
              <p className="mt-1 font-body text-[13px] leading-relaxed text-mute">
                {rule.detail}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
