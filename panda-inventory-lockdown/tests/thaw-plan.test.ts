import { describe, expect, it } from "vitest";
import { defaultDays, type PlannerDays } from "../src/lib/planner";
import type { StoreData } from "../src/lib/schema";
import {
  THAW_PRODUCTS,
  buildStoreThawPlan,
  buildThawWindows,
  formatBagQuantity,
} from "../src/lib/thaw-plan";

function plannerDays(
  deliveryDays: number[],
  sales: number[],
): PlannerDays {
  return defaultDays(deliveryDays, 0).map((day, index) => ({
    ...day,
    sales: sales[index],
  }));
}

function storeWithProducts(
  products: Array<{ productNumber: string; averagePer1k: number }>,
): StoreData {
  return {
    store: { number: "3698" },
    source: { file: "", parsedAt: "", weekLabels: [] },
    delivery: { deliveryDays: [] },
    categories: [
      {
        name: "Meat",
        products: products.map((product) => ({
          ...product,
          name: product.productNumber,
          category: "Meat",
          unit: "LB",
          weeks: [],
        })),
      },
    ],
  };
}

describe("buildThawWindows", () => {
  it("builds the expected 48-hour windows for Monday, Wednesday, Friday", () => {
    const days = plannerDays(
      [1, 3, 5],
      [6352, 7382, 7192, 7094, 8530, 8537, 7476],
    );

    expect(buildThawWindows(days)).toEqual([
      {
        deliveryDay: 1,
        readyDay: 3,
        coverageDays: [3, 4],
        salesTarget: 15624,
      },
      {
        deliveryDay: 3,
        readyDay: 5,
        coverageDays: [5, 6],
        salesTarget: 16013,
      },
      {
        deliveryDay: 5,
        readyDay: 0,
        coverageDays: [0, 1, 2],
        salesTarget: 20926,
      },
    ]);
  });

  it("builds 24-hour cabinet windows for Monday, Wednesday, Friday", () => {
    const days = plannerDays(
      [1, 3, 5],
      [6352, 7382, 7192, 7094, 8530, 8537, 7476],
    );

    expect(buildThawWindows(days, 1)).toEqual([
      {
        deliveryDay: 1,
        readyDay: 2,
        coverageDays: [2, 3],
        salesTarget: 14286,
      },
      {
        deliveryDay: 3,
        readyDay: 4,
        coverageDays: [4, 5],
        salesTarget: 17067,
      },
      {
        deliveryDay: 5,
        readyDay: 6,
        coverageDays: [6, 0, 1],
        salesTarget: 21210,
      },
    ]);
  });

  it("reworks the windows when a store changes to Tuesday and Friday", () => {
    const days = plannerDays(
      [2, 5],
      [6000, 7000, 8000, 9000, 10000, 11000, 12000],
    );

    expect(buildThawWindows(days)).toEqual([
      {
        deliveryDay: 2,
        readyDay: 4,
        coverageDays: [4, 5, 6],
        salesTarget: 33000,
      },
      {
        deliveryDay: 5,
        readyDay: 0,
        coverageDays: [0, 1, 2, 3],
        salesTarget: 30000,
      },
    ]);
  });

  it("covers all seven days when there is one weekly delivery", () => {
    const days = plannerDays([2], [1, 2, 3, 4, 5, 6, 7]);
    const [window] = buildThawWindows(days);

    expect(window.coverageDays).toEqual([4, 5, 6, 0, 1, 2, 3]);
    expect(window.salesTarget).toBe(28);
  });
});

describe("buildStoreThawPlan", () => {
  it("matches the verified PX3698 bag quantities", () => {
    const store = storeWithProducts([
      { productNumber: "P10008", averagePer1k: 0.63 },
      { productNumber: "P10019", averagePer1k: 3.42 },
      { productNumber: "P10028", averagePer1k: 6.98 },
      { productNumber: "P5007", averagePer1k: 2 },
      { productNumber: "P5020", averagePer1k: 1.63 },
    ]);
    const days = plannerDays(
      [1, 3, 5],
      [6352, 7382, 7192, 7094, 8530, 8537, 7476],
    );
    const unitsPerCase = {
      P10008: 40,
      P10019: 40,
      P10028: 40,
      P5007: 40,
      P5020: 40,
    };

    const plan = buildStoreThawPlan(store, unitsPerCase, days);

    expect(plan.cabinetWindows.map((window) => window.readyDay)).toEqual([
      2, 4, 6,
    ]);
    expect(plan.wicWindows.map((window) => window.readyDay)).toEqual([3, 5, 0]);
    expect(plan.cabinet.map((product) => product.bagsByDelivery)).toEqual([
      [2, 2, 2],
      [7, 8, 10],
      [13, 15, 19],
    ]);
    expect(plan.wic.slice(0, 2).map((product) => product.bagsByDelivery)).toEqual([
      [4, 5, 6],
      [4, 4, 5],
    ]);
  });

  it("keeps BBQ brisket in WIC and excludes BBQ pork", () => {
    expect(THAW_PRODUCTS).toContainEqual({
      productNumber: "P5052",
      name: "BBQ Brisket",
      location: "wic",
    });
    expect(
      THAW_PRODUCTS.some((product) => product.productNumber === "P8065"),
    ).toBe(false);
  });
});

describe("formatBagQuantity", () => {
  it("converts five bags into a case and keeps the remainder", () => {
    expect(formatBagQuantity(14)).toEqual(["2 cs", "4 bags"]);
    expect(formatBagQuantity(5)).toEqual(["1 cs"]);
    expect(formatBagQuantity(1)).toEqual(["1 bag"]);
  });
});
