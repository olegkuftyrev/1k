import { describe, expect, it } from "vitest";
import { hasHighWeekVariance } from "../src/lib/warnings";
import type { Product } from "../src/lib/schema";

function product(values: Array<number | null>): Product {
  return {
    productNumber: "P10001",
    name: "Test Product",
    category: "Test",
    unit: "LB",
    averagePer1k: null,
    weeks: values.map((value, index) => ({
      label: `W${index + 1}`,
      value,
    })),
  };
}

describe("hasHighWeekVariance", () => {
  it("flags adjacent week changes over 200 percent", () => {
    expect(hasHighWeekVariance(product([1.49, 4.48, null]))).toBe(true);
  });

  it("allows adjacent week changes up to 200 percent", () => {
    expect(hasHighWeekVariance(product([1.49, 4.47, null]))).toBe(false);
  });

  it("allows stable adjacent week values", () => {
    expect(hasHighWeekVariance(product([2.22, 2.39, 2.38]))).toBe(false);
  });

  it("ignores blank week values when comparing variance", () => {
    expect(hasHighWeekVariance(product([2.22, null, 2.38]))).toBe(false);
  });
});
