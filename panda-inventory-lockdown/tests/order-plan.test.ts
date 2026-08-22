import { describe, expect, it } from "vitest";
import { defaultDays, type PlannerDays } from "../src/lib/planner";
import type { Product, StoreData } from "../src/lib/schema";
import {
  buildDeliveryOrderWindows,
  buildStoreOrderPlan,
} from "../src/lib/order-plan";

function plannerDays(
  deliveryDays: number[],
  sales: number[],
): PlannerDays {
  return defaultDays(deliveryDays, 0).map((day, index) => ({
    ...day,
    sales: sales[index],
  }));
}

function product(
  productNumber: string,
  name: string,
  category: string,
  averagePer1k: number,
): Product {
  return {
    productNumber,
    name,
    category,
    averagePer1k,
    unit: "LB",
    weeks: [],
  };
}

function storeWithProducts(products: Product[]): StoreData {
  const categoryNames = [...new Set(products.map((item) => item.category))];
  return {
    store: { number: "3698" },
    source: { file: "", parsedAt: "", weekLabels: [] },
    delivery: { deliveryDays: [] },
    categories: categoryNames.map((name) => ({
      name,
      products: products.filter((item) => item.category === name),
    })),
  };
}

describe("buildDeliveryOrderWindows", () => {
  it("covers Monday-Tuesday, Wednesday-Thursday, and Friday-Sunday", () => {
    const days = plannerDays(
      [1, 3, 5],
      [6352, 7382, 7192, 7094, 8530, 8537, 7476],
    );

    expect(buildDeliveryOrderWindows(days)).toEqual([
      { deliveryDay: 1, coverageDays: [1, 2], salesTarget: 14574 },
      { deliveryDay: 3, coverageDays: [3, 4], salesTarget: 15624 },
      { deliveryDay: 5, coverageDays: [5, 6, 0], salesTarget: 22365 },
    ]);
  });

  it("reworks coverage for a Tuesday and Friday schedule", () => {
    const days = plannerDays(
      [2, 5],
      [6000, 7000, 8000, 9000, 10000, 11000, 12000],
    );

    expect(buildDeliveryOrderWindows(days)).toEqual([
      { deliveryDay: 2, coverageDays: [2, 3, 4], salesTarget: 27000 },
      { deliveryDay: 5, coverageDays: [5, 6, 0, 1], salesTarget: 36000 },
    ]);
  });
});

describe("buildStoreOrderPlan", () => {
  const days = plannerDays(
    [1, 3, 5],
    [6352, 7382, 7192, 7094, 8530, 8537, 7476],
  );

  it("includes every Produce product, zero-usage rows, and Chow Mein noodles", () => {
    const store = storeWithProducts([
      product("P19013", "Broccoli", "Produce", 4.87),
      product("P19085", "Celery K -", "Produce", 1.23),
      product("P19046", "Onion, Green", "Produce", 0),
      product("P1102", "Noodles, (K-) Chow Mein", "Grocery", 13.63),
    ]);
    const plan = buildStoreOrderPlan(
      store,
      { P19013: 20, P19085: 30, P19046: 10, P1102: 30 },
      days,
      "vegetables",
    );

    expect(plan.products.map((item) => item.productNumber)).toEqual([
      "P19013",
      "P19085",
      "P19046",
      "P1102",
    ]);
    expect(plan.products[2].casesByDelivery).toEqual([0, 0, 0]);
    expect(plan.products[3].casesByDelivery).toEqual([7, 8, 11]);
  });

  it("matches verified PX3698 case quantities and excludes LTO products", () => {
    const store = storeWithProducts([
      product("P10002", "Orange", "Meat", 19.91),
      product("P16032", "Shrimp", "Seafood", 3.57),
      product("P5052", "LTO Brisket", "Meat", 2.54),
      product("P10006", "LTO Chicken", "Meat", 1.51),
    ]);
    const plan = buildStoreOrderPlan(
      store,
      { P10002: 40, P16032: 20, P5052: 40, P10006: 40 },
      days,
      "meat",
    );

    expect(plan.products.map((item) => item.productNumber)).toEqual([
      "P10002",
      "P16032",
    ]);
    expect(plan.products.map((item) => item.casesByDelivery)).toEqual([
      [8, 8, 12],
      [3, 3, 4],
    ]);
  });
});
