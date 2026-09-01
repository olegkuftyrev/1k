import { describe, expect, it } from "vitest";
import { buildStoreContainerPlan } from "../src/lib/container-plan";
import { defaultDays, type PlannerDays } from "../src/lib/planner";
import type { Product, StoreData } from "../src/lib/schema";

function plannerDays(deliveryDays: number[], sales: number[]): PlannerDays {
  return defaultDays(deliveryDays, 0).map((day, index) => ({
    ...day,
    sales: sales[index],
  }));
}

function storeWithUsage(usage: Record<string, number | null>): StoreData {
  const products: Product[] = Object.entries(usage).map(
    ([productNumber, averagePer1k]) => ({
      productNumber,
      name: productNumber,
      category: "Test",
      averagePer1k,
      unit: "LB",
      weeks: [],
    }),
  );
  return {
    store: { number: "3847" },
    source: { file: "", parsedAt: "", weekLabels: [] },
    delivery: { deliveryDays: [] },
    categories: [{ name: "Test", products }],
  };
}

const allUsage = {
  P10008: 0.47,
  P5020: 1.76,
  P19186: 1.64,
  P19045: 1.31,
  P19055: 1.17,
  P19169: 0.57,
  P19909: 1.8,
  P19910: 0.44,
  P10019: 3.75,
  P10028: 10.59,
  P5007: 2.18,
  P19013: 7.43,
  P19048: 3.57,
  P19016: 2.07,
  P19085: 0.84,
};

describe("buildStoreContainerPlan", () => {
  it("rounds each product before adding container totals", () => {
    const days = plannerDays(
      [1, 3, 5],
      [7000, 7000, 7000, 7000, 7000, 7000, 7587.86],
    );
    const plan = buildStoreContainerPlan(storeWithUsage(allUsage), days);
    const halfStainless = plan.groups[0];

    expect(halfStainless.products[0].exactByDelivery[0]).toBeCloseTo(0.8225);
    expect(halfStainless.products[0].containersByDelivery[0]).toBe(1);
    expect(halfStainless.products[1].containersByDelivery[0]).toBe(4);
    expect(halfStainless.totalsByDelivery).toEqual([5, 5, 7]);
    expect(halfStainless.containersToKeep).toBe(7);
    expect(halfStainless.products[0].requiredBagsByDelivery).toEqual([1, 1, 2]);
    expect(halfStainless.products[1].requiredBagsByDelivery).toEqual([4, 4, 5]);
    expect(plan.groups[1].products[0].poundsPerContainer).toBe(7);
    expect(plan.groups[1].products[0].containersByDelivery[0]).toBe(4);
    expect(plan.groups[1].products[1].poundsPerContainer).toBe(7);
    expect(plan.groups[1].products[2].poundsPerContainer).toBe(7);
  });

  it("uses whole broccoli cases and splits each onion bag across both pan sizes", () => {
    const days = plannerDays([1], [0, 1000, 0, 0, 0, 0, 0]);
    const usage = { ...allUsage, P19013: 20, P19048: 50 };
    const plan = buildStoreContainerPlan(storeWithUsage(usage), days);
    const halfOnion = plan.groups[1].products.find(
      (product) => product.productNumber === "P19048",
    );
    const fullBroccoli = plan.groups[3].products.find(
      (product) => product.productNumber === "P19013",
    );
    const fullOnion = plan.groups[3].products.find(
      (product) => product.productNumber === "P19048",
    );

    expect(halfOnion?.requiredPackagesByDelivery).toEqual([1]);
    expect(halfOnion?.containersByDelivery).toEqual([2]);
    expect(fullBroccoli?.requiredPackagesByDelivery).toEqual([1]);
    expect(fullBroccoli?.containersByDelivery).toEqual([1]);
    expect(fullOnion?.requiredPackagesByDelivery).toEqual([1]);
    expect(fullOnion?.containersByDelivery).toEqual([2]);
  });

  it("uses the store's saved delivery windows and forecasts", () => {
    const days = plannerDays(
      [2, 5],
      [6000, 7000, 8000, 9000, 10000, 11000, 12000],
    );
    const plan = buildStoreContainerPlan(storeWithUsage(allUsage), days);

    expect(plan.windows.map((window) => window.salesTarget)).toEqual([
      27000, 36000,
    ]);
    expect(plan.groups.every((group) => group.totalsByDelivery.length === 2)).toBe(
      true,
    );
  });

  it("excludes celery from container needs", () => {
    const days = plannerDays([1], [1000, 0, 0, 0, 0, 0, 0]);
    const plan = buildStoreContainerPlan(storeWithUsage(allUsage), days);

    expect(
      plan.groups.flatMap((group) =>
        group.products.map((product) => product.productNumber),
      ),
    ).not.toContain("P19085");
  });

  it("does not publish a complete total when product usage is missing", () => {
    const incomplete = { ...allUsage, P19016: null };
    const days = plannerDays(
      [1, 3, 5],
      [7000, 7000, 7000, 7000, 7000, 7000, 7000],
    );
    const plan = buildStoreContainerPlan(storeWithUsage(incomplete), days);

    expect(plan.groups[3].totalsByDelivery).toEqual([null, null, null]);
    expect(plan.groups[3].containersToKeep).toBeNull();
    expect(plan.totalContainersToKeep).toBeNull();
  });
});
