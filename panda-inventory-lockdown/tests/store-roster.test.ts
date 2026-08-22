import { describe, expect, it } from "vitest";
import type { StoreData } from "../src/lib/schema";
import {
  ACTIVE_STORE_NUMBERS,
  applyStoreRoster,
  hasStoreReport,
  isActiveStore,
} from "../src/lib/store-roster";

function reportStore(number: string): StoreData {
  return {
    store: { number },
    source: {
      file: `${number}.pdf`,
      parsedAt: "2026-08-22T00:00:00.000Z",
      weekLabels: ["W31 '26"],
    },
    delivery: { deliveryDays: [2, 5] },
    categories: [
      {
        name: "Meat",
        products: [
          {
            productNumber: "P1",
            name: "Test product",
            category: "Meat",
            unit: "LB",
            weeks: [{ label: "W31 '26", value: 1 }],
            averagePer1k: 1,
          },
        ],
      },
    ],
  };
}

describe("store roster", () => {
  it("renders every active store first and inactive stores last", () => {
    const stores = applyStoreRoster([
      reportStore("3847"),
      reportStore("2874"),
      reportStore("1020"),
      reportStore("1088"),
    ]);

    expect(stores.map((store) => store.store.number)).toEqual([
      ...ACTIVE_STORE_NUMBERS,
      "1088",
      "2874",
    ]);
  });

  it("creates empty placeholders for active stores with missing reports", () => {
    const stores = applyStoreRoster([reportStore("1020")]);
    const missing = stores.find((store) => store.store.number === "1505");

    expect(missing).toBeDefined();
    expect(hasStoreReport(missing!)).toBe(false);
    expect(missing!.categories).toEqual([]);
  });

  it("recognizes only configured active stores", () => {
    expect(isActiveStore("1649")).toBe(true);
    expect(isActiveStore("3698")).toBe(false);
  });
});
