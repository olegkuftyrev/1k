import type { Product, UnitsPerCase } from "@/lib/schema";

export const WEEK_VARIANCE_WARNING_THRESHOLD = 0.5;

export function hasMissingCaseSize(
  product: Product,
  unitsPerCase: UnitsPerCase,
): boolean {
  return !unitsPerCase[product.productNumber.toUpperCase()];
}

export function hasHighWeekVariance(
  product: Product,
  threshold = WEEK_VARIANCE_WARNING_THRESHOLD,
): boolean {
  for (let i = 1; i < product.weeks.length; i++) {
    const previous = product.weeks[i - 1]?.value;
    const current = product.weeks[i]?.value;
    if (previous === null || previous === undefined) continue;
    if (current === null || current === undefined) continue;
    if (previous === 0) {
      if (current !== 0) return true;
      continue;
    }
    if (Math.abs(current - previous) / Math.abs(previous) > threshold) {
      return true;
    }
  }
  return false;
}

export function hasProductWarning(
  product: Product,
  unitsPerCase: UnitsPerCase,
): boolean {
  return (
    hasMissingCaseSize(product, unitsPerCase) || hasHighWeekVariance(product)
  );
}

export function productWarningCount(
  products: Product[],
  unitsPerCase: UnitsPerCase,
): number {
  return products.filter((product) => hasProductWarning(product, unitsPerCase))
    .length;
}
