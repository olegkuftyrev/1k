/**
 * Pure helpers for the interactive delivery planner.
 *
 * A week is modelled as 7 day slots, indexed 0=Sun … 6=Sat. Each slot records
 * whether the store receives a delivery that day and the projected sales ($)
 * for that day. An order placed for a delivery must cover sales from the
 * delivery day up to (but not including) the next delivery day.
 */

export interface DayConfig {
  /** Store receives a delivery this day. */
  delivery: boolean;
  /** Projected sales for this day, in dollars. */
  sales: number;
}

/** Seven day slots, index 0=Sun … 6=Sat. */
export type PlannerDays = DayConfig[];

/** Ordering must happen this many days before delivery. */
export const ORDER_LEAD_DAYS = 2;

/** Default per-day projected sales when none has been entered. */
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

/** Sorted list of day indices that have a delivery. */
export function deliveryDayList(days: PlannerDays): number[] {
  return days.flatMap((d, i) => (d.delivery ? [i] : []));
}

/**
 * Days on which an order must be placed, i.e. `ORDER_LEAD_DAYS` before a
 * delivery. A day may be both a delivery day and an order-by day.
 */
export function orderDaySet(days: PlannerDays, lead = ORDER_LEAD_DAYS): Set<number> {
  const out = new Set<number>();
  for (let d = 0; d < 7; d++) {
    if (days[(d + lead) % 7]?.delivery) out.add(d);
  }
  return out;
}

/**
 * Days a delivery must cover: from the delivery day (inclusive) up to but not
 * including the next delivery day, wrapping across the week. Returns [] when
 * the given day has no delivery.
 */
export function coverageWindow(
  days: PlannerDays,
  selectedDay: number | null,
): number[] {
  if (selectedDay === null || !days[selectedDay]?.delivery) return [];
  const cover = [selectedDay];
  let d = (selectedDay + 1) % 7;
  let guard = 0;
  while (!days[d]?.delivery && guard < 7) {
    cover.push(d);
    d = (d + 1) % 7;
    guard++;
  }
  return cover;
}

/** Total projected sales across a set of day indices. */
export function sumSales(days: PlannerDays, dayIndices: number[]): number {
  return dayIndices.reduce((sum, d) => sum + (days[d]?.sales ?? 0), 0);
}

/** First delivery day in Monday-first order, or null when there are none. */
export function firstDeliveryDay(days: PlannerDays): number | null {
  return WEEK_ORDER.find((d) => days[d]?.delivery) ?? null;
}
