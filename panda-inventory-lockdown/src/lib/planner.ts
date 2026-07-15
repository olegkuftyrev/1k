/**
 * Pure helpers for the interactive delivery planner.
 *
 * A week is modelled as 7 day slots, indexed 0=Sun … 6=Sat. Each slot records
 * whether the store receives a delivery that day and the forecasted sales ($)
 * for that day. Delivery markers are informational; users select the days an
 * order covers directly in the schedule.
 */

export interface DayConfig {
  /** Store receives a delivery this day. */
  delivery: boolean;
  /** Forecasted sales for this day, in dollars. */
  sales: number;
}

/** Seven day slots, index 0=Sun … 6=Sat. */
export type PlannerDays = DayConfig[];

/** Default per-day forecasted sales when none has been entered. */
export const DEFAULT_DAY_SALES = 5000;

/** Days rendered Monday-first, then the weekend. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const FULL_DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Calendar label for a weekday in the current Monday-through-Sunday week. */
export function scheduleDateLabel(day: number, today = new Date()): string {
  if (day === today.getDay()) return "Today";

  const todayFromMonday = (today.getDay() + 6) % 7;
  const dayFromMonday = (day + 6) % 7;
  const date = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + dayFromMonday - todayFromMonday,
    12,
  );

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

/** Build a fresh week from a list of delivery day indices. */
export function defaultDays(
  deliveryDays: number[],
  daySales = DEFAULT_DAY_SALES,
): PlannerDays {
  const set = new Set(deliveryDays);
  return Array.from({ length: 7 }, (_, d) => ({
    delivery: set.has(d),
    sales: daySales,
  }));
}

/** Total forecasted sales across a set of day indices. */
export function sumSales(days: PlannerDays, dayIndices: number[]): number {
  return dayIndices.reduce((sum, d) => sum + (days[d]?.sales ?? 0), 0);
}
