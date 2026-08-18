export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatLatency(value: number | null) {
  if (value === null) return "—";
  return `${value.toFixed(value < 10 ? 1 : 0)} ms`;
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(value);
}

export function formatRelative(value: Date) {
  const seconds = Math.round((Date.now() - value.getTime()) / 1000);
  if (seconds < 60) return `${Math.max(seconds, 0)}s ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

export function formatHourLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
