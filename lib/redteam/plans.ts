export function canUseRedTeam(plan: string) {
  return plan !== "free";
}

export function redTeamLimits(plan: string) {
  if (plan === "business" || plan === "enterprise") {
    return { maxItems: 100, maxConcurrency: 8, maxCustom: 50 };
  }
  return { maxItems: 80, maxConcurrency: 4, maxCustom: 50 };
}

export function nextWeeklyRunAt(from = new Date()) {
  return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
