import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-sm border border-hairline bg-base px-3.5 py-2.5 font-body text-[14px] text-ink outline-none transition-colors placeholder:text-mute/60 focus:border-signal/70";

export const labelClass =
  "font-mono text-[11px] uppercase tracking-wider text-mute";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-sm bg-signal px-4 py-2.5 font-body text-[13px] font-semibold text-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-sm border border-hairline px-4 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-sm border border-crit/40 px-3 py-2 font-body text-[13px] font-medium text-crit transition-colors hover:bg-crit/10 disabled:cursor-not-allowed disabled:opacity-60";

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-md border border-hairline bg-card ${className}`}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          <div>
            {title && (
              <h2 className="font-display text-[15px] font-semibold tracking-tighter text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 font-body text-[13px] text-mute">
                {description}
              </p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "signal" | "crit";
}) {
  const valueTone =
    tone === "crit" ? "text-crit" : tone === "signal" ? "text-signal" : "text-ink";

  return (
    <div className="bg-card px-4 py-4">
      <p className="font-body text-[12px] text-mute">{label}</p>
      <p className={`mt-1.5 font-mono text-[22px] tracking-tight ${valueTone}`}>
        {value}
      </p>
      {hint && <p className="mt-1 font-mono text-[11px] text-mute/70">{hint}</p>}
    </div>
  );
}

type BadgeTone = "neutral" | "signal" | "crit" | "warn" | "safe";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "border-white/10 bg-elevated text-mute",
  signal: "border-signal/35 bg-signal/10 text-signal",
  crit: "border-crit/35 bg-crit/10 text-crit",
  warn: "border-warn/35 bg-warn/10 text-warn",
  safe: "border-white/12 bg-elevated text-ink",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): BadgeTone {
  return status === "blocked" ? "crit" : "safe";
}

export function riskTone(risk: string | null): BadgeTone {
  if (risk === "high") return "crit";
  if (risk === "medium") return "warn";
  return "neutral";
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-hairline px-5 py-8 text-left">
      <h3 className="font-display text-[15px] font-semibold tracking-tighter text-ink">
        {title}
      </h3>
      <p className="max-w-xl font-body text-[13px] leading-relaxed text-mute">
        {body}
      </p>
      {action}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-3 rounded-sm border border-crit/30 bg-crit/10 px-3 py-2 font-body text-[13px] text-crit">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-3 rounded-sm border border-signal/30 bg-signal/10 px-3 py-2 font-body text-[13px] text-signal">
      {message}
    </p>
  );
}
