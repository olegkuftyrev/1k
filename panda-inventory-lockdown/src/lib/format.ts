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
