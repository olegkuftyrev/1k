import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  parsePandaPdf,
  parseUsageNumber,
} from "../scripts/ingest/parsePandaPdf.js";
import { StoreDataSchema, type Product, type StoreData } from "../src/lib/schema.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(here, "fixtures/store-3847.pdf");

describe("parseUsageNumber", () => {
  it("parses plain decimals", () => {
    expect(parseUsageNumber("16.80")).toBe(16.8);
    expect(parseUsageNumber("0")).toBe(0);
  });

  it("treats parentheses as negative", () => {
    expect(parseUsageNumber("(0.18)")).toBe(-0.18);
    expect(parseUsageNumber("(43.65)")).toBe(-43.65);
  });

  it("recovers decimal points rendered as spaces", () => {
    expect(parseUsageNumber("0 22")).toBe(0.22);
    expect(parseUsageNumber("(0 05)")).toBe(-0.05);
    expect(parseUsageNumber("2 75")).toBe(2.75);
  });

  it("returns null for blank / non-numeric", () => {
    expect(parseUsageNumber("")).toBeNull();
    expect(parseUsageNumber("   ")).toBeNull();
    expect(parseUsageNumber("Salt")).toBeNull();
  });
});

describe("parsePandaPdf (store 3847 fixture)", () => {
  let store: StoreData;
  const find = (n: string): Product | undefined => {
    for (const c of store.categories)
      for (const p of c.products) if (p.productNumber === n) return p;
    return undefined;
  };

  beforeAll(async () => {
    store = await parsePandaPdf(fixture, "store-3847.pdf");
  });

  it("produces schema-valid data", () => {
    expect(StoreDataSchema.safeParse(store).success).toBe(true);
  });

  it("extracts store metadata", () => {
    expect(store.store.number).toBe("3847");
    expect(store.store.aco).toBe("ACO-JOSEPHINE CERVANTES");
    expect(store.store.fiscalWeek).toBe("Rolling 4 Weeks");
    expect(store.source.weekLabels).toEqual(["W25 '26", "W26 '26", "W27 '26"]);
  });

  it("finds all 8 categories with expected product counts", () => {
    const counts = Object.fromEntries(
      store.categories.map((c) => [c.name, c.products.length]),
    );
    expect(counts).toEqual({
      Meat: 10,
      Seafood: 1,
      Produce: 13,
      Grocery: 23,
      Beverages: 22,
      Paper: 23,
      Condiments: 5,
      "Other Cogs": 0,
    });
  });

  it("parses a normal row", () => {
    const p = find("P10002");
    expect(p?.name).toBe("Chicken, Orange Dark Battered K-");
    expect(p?.unit).toBe("LB");
    expect(p?.weeks.map((w) => w.value)).toEqual([16.8, 18.9, 19.32]);
    expect(p?.averagePer1k).toBe(18.3);
  });

  it("recovers decimal-as-space rows", () => {
    const p = find("P1114");
    expect(p?.name).toBe("Salt");
    expect(p?.weeks.map((w) => w.value)).toEqual([0.22, 0.24, 0.24]);
    expect(p?.averagePer1k).toBe(0.23);
  });

  it("handles negatives and blank cells", () => {
    const starch = find("P1272");
    expect(starch?.weeks.map((w) => w.value)).toEqual([-0.18, 0.71, null]);
    expect(starch?.averagePer1k).toBe(0.25);

    const lid = find("P35062");
    expect(lid?.weeks.map((w) => w.value)).toEqual([46.45, -43.65, 3.12]);

    const bev = find("P163");
    expect(bev?.weeks.map((w) => w.value)).toEqual([null, 0.23, null]);
  });
});
