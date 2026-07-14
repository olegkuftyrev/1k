/**
 * Ordering calculation engine.
 *
 * Core formula (confirmed against the legacy dashboard and store 3847 data):
 *
 *   casesPer1k  = averagePer1k / unitsPerCase        // cases per $1,000 of sales
 *   casesNeeded = casesPer1k * (salesTarget / 1000)  // cases for projected sales
 *
 * `averagePer1k` is the report's "Average" column (usage in the product's unit
 * per $1,000 of sales). `unitsPerCase` converts that usage into whole cases.
 *
 * On-hand subtraction and rounding are optional layers on top of the core
 * projection so the same engine serves both a pure projection view and an
 * actual order-quantity view.
 */

/** Baseline sales figure the report's usage rates are expressed against. */
export const BASE_SALES = 1000;

export interface OrderInput {
  /** Report "Average" usage per $1,000 of sales, in the product's unit. */
  averagePer1k: number | null;
  /** Units (lb/ct/gal/…) per case for this product. */
  unitsPerCase: number | null;
  /** Projected sales for the coverage period, in dollars. */
  salesTarget: number;
  /** Cases currently counted on hand. Omitted/null → projection only. */
  onHandCases?: number | null;
  /** Round order quantity up to whole cases. Default false (fractional). */
  roundUp?: boolean;
}

export interface OrderResult {
  /** Cases consumed per $1,000 of sales. null when inputs are incomplete. */
  casesPer1k: number | null;
  /** Cases needed for the projected sales target. null when incomplete. */
  casesNeeded: number | null;
  /**
   * Cases to order: casesNeeded − onHand, never negative. Equal to
   * casesNeeded when no on-hand count is supplied. Rounded up when
   * `roundUp` is set. null when casesNeeded is null.
   */
  orderCases: number | null;
}

/** Cases consumed per $1,000 of sales, or null when inputs are incomplete. */
export function casesPer1k(
  averagePer1k: number | null,
  unitsPerCase: number | null,
): number | null {
  if (averagePer1k === null || unitsPerCase === null) return null;
  if (unitsPerCase <= 0) return null;
  return averagePer1k / unitsPerCase;
}

/** Cases needed for a given projected sales target. */
export function casesForTarget(
  averagePer1k: number | null,
  unitsPerCase: number | null,
  salesTarget: number,
): number | null {
  const per1k = casesPer1k(averagePer1k, unitsPerCase);
  if (per1k === null) return null;
  return per1k * (salesTarget / BASE_SALES);
}

/** Full order computation: projection, optional on-hand subtraction, rounding. */
export function calculateOrder(input: OrderInput): OrderResult {
  const per1k = casesPer1k(input.averagePer1k, input.unitsPerCase);
  const needed = casesForTarget(
    input.averagePer1k,
    input.unitsPerCase,
    input.salesTarget,
  );

  let orderCases: number | null = needed;
  if (needed !== null) {
    const onHand = input.onHandCases ?? 0;
    orderCases = Math.max(0, needed - onHand);
    if (input.roundUp) orderCases = Math.ceil(orderCases);
  }

  return { casesPer1k: per1k, casesNeeded: needed, orderCases };
}
