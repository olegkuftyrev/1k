/** Format a usage-per-$1000 value for display. null -> em dash. */
export function fmtUsage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Compact integer formatting, e.g. 1,234. */
export function fmtInt(value: number): string {
  return value.toLocaleString("en-US");
}

/** Format a case count for display, e.g. "10.07cs". null -> em dash. */
export function fmtCases(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2)}cs`;
}

/**
 * Format a dollar sales target compactly, e.g. 22000 -> "$22K",
 * 1000 -> "$1K", 1500 -> "$1.5K".
 */
export function fmtTarget(value: number): string {
  const k = value / 1000;
  const label = Number.isInteger(k) ? String(k) : k.toFixed(1);
  return `$${label}K`;
}
