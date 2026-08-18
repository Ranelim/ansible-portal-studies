/** Shared recency window for Quality Overview KPIs and list handoff. */
export const QUALITY_WINDOW_DAYS = 7;

/** Days since a demo timestamp (`2 hours ago` or `May 25, 2026 14:30`). */
export function daysSinceLabel(createdAt: string): number | null {
  const parsed = Date.parse(createdAt);
  if (!Number.isNaN(parsed)) {
    return (Date.now() - parsed) / 86_400_000;
  }
  const lower = createdAt.trim().toLowerCase();
  if (lower === 'just now') return 0;
  const mins = lower.match(/^(\d+)\s+min ago$/);
  if (mins) return Number(mins[1]) / (60 * 24);
  const hours = lower.match(/^(\d+)\s+hours? ago$/);
  if (hours) return Number(hours[1]) / 24;
  const days = lower.match(/^(\d+)\s+days? ago$/);
  if (days) return Number(days[1]);
  const weeks = lower.match(/^(\d+)\s+weeks? ago$/);
  if (weeks) return Number(weeks[1]) * 7;
  return null;
}

export function isWithinQualityWindow(createdAt: string): boolean {
  const days = daysSinceLabel(createdAt);
  return days !== null && days <= QUALITY_WINDOW_DAYS;
}
