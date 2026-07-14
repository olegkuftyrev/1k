import "server-only";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  DeliveryMapSchema,
  ManagersSchema,
  StoreDataSchema,
  UnitsPerCaseSchema,
  type DeliveryMap,
  type Managers,
  type Product,
  type StoreData,
  type UnitsPerCase,
} from "@/lib/schema";
import { casesPer1k } from "@/lib/ordering/calculate";

const STORES_DIR = join(process.cwd(), "data", "stores");
const UNITS_PER_CASE_FILE = join(process.cwd(), "data", "units-per-case.json");
const MANAGERS_FILE = join(process.cwd(), "data", "managers.json");
const DELIVERY_FILE = join(process.cwd(), "data", "delivery.json");

/** Default delivery days when a store has no explicit schedule: Mon/Wed/Fri. */
export const DEFAULT_DELIVERY_DAYS = [1, 3, 5];

/** Load and validate every store JSON, sorted by store number. */
export async function getAllStores(): Promise<StoreData[]> {
  let files: string[] = [];
  try {
    files = (await readdir(STORES_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  const stores = await Promise.all(
    files.map(async (file) => {
      const raw = JSON.parse(await readFile(join(STORES_DIR, file), "utf8"));
      return StoreDataSchema.parse(raw);
    }),
  );

  return stores.sort((a, b) => a.store.number.localeCompare(b.store.number));
}

/** Load a single store by its number, or null if missing. */
export async function getStore(number: string): Promise<StoreData | null> {
  const stores = await getAllStores();
  return stores.find((s) => s.store.number === number) ?? null;
}

/**
 * Load and validate the master units-per-case map.
 * Metadata keys (prefixed with "_") are stripped before validation.
 */
export async function getUnitsPerCase(): Promise<UnitsPerCase> {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(await readFile(UNITS_PER_CASE_FILE, "utf8"));
  } catch {
    return {};
  }
  const entries = Object.fromEntries(
    Object.entries(raw).filter(([k]) => !k.startsWith("_")),
  );
  return UnitsPerCaseSchema.parse(entries);
}

/** Units per case for a product, or null when unknown. */
export function unitsPerCaseFor(
  map: UnitsPerCase,
  productNumber: string,
): number | null {
  return map[productNumber.toUpperCase()] ?? null;
}

/**
 * Load and validate the store-manager map.
 * Metadata keys (prefixed with "_") are stripped before validation.
 */
export async function getManagers(): Promise<Managers> {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(await readFile(MANAGERS_FILE, "utf8"));
  } catch {
    return {};
  }
  const entries = Object.fromEntries(
    Object.entries(raw).filter(([k]) => !k.startsWith("_")),
  );
  return ManagersSchema.parse(entries);
}

/**
 * Load and validate the store→delivery-days map.
 * Metadata keys (prefixed with "_") are stripped before validation.
 */
export async function getDeliveryMap(): Promise<DeliveryMap> {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(await readFile(DELIVERY_FILE, "utf8"));
  } catch {
    return {};
  }
  const entries = Object.fromEntries(
    Object.entries(raw).filter(([k]) => !k.startsWith("_")),
  );
  return DeliveryMapSchema.parse(entries);
}

/** Delivery days for a store, falling back to the Mon/Wed/Fri default. */
export function deliveryDaysFor(map: DeliveryMap, number: string): number[] {
  return map[number] ?? DEFAULT_DELIVERY_DAYS;
}

/** Flatten every product across a store's categories. */
export function allProducts(store: StoreData): Product[] {
  return store.categories.flatMap((c) => c.products);
}

/** Total number of products in a store. */
export function productCount(store: StoreData): number {
  return store.categories.reduce((n, c) => n + c.products.length, 0);
}

/** A product ranked by how many cases it consumes per $1000 of sales. */
export interface ProductCaseUsage {
  product: Product;
  casesPer1k: number;
}

/**
 * Products with the highest case usage per $1000 of sales.
 * Ranking by cases (not raw units) keeps high-count paper goods from
 * outranking bulk food: 108 napkins is a fraction of a case, whereas
 * dark-diced chicken may be several cases.
 * Products without a known case size are excluded (cases can't be computed).
 */
export function topProductsByCases(
  store: StoreData,
  unitsPerCase: UnitsPerCase,
  limit = 5,
): ProductCaseUsage[] {
  return allProducts(store)
    .map((product) => ({
      product,
      casesPer1k: casesPer1k(
        product.averagePer1k,
        unitsPerCase[product.productNumber.toUpperCase()] ?? null,
      ),
    }))
    .filter((x): x is ProductCaseUsage => x.casesPer1k !== null)
    .sort((a, b) => b.casesPer1k - a.casesPer1k)
    .slice(0, limit);
}

/** Number of weeks of data actually present in the report. */
export function weekCount(store: StoreData): number {
  return store.source.weekLabels.length;
}

export interface StoreSummary {
  number: string;
  weekCount: number;
  categoryCount: number;
  productCount: number;
  top: ProductCaseUsage[];
}

export function summarize(
  store: StoreData,
  unitsPerCase: UnitsPerCase,
): StoreSummary {
  return {
    number: store.store.number,
    weekCount: weekCount(store),
    categoryCount: store.categories.filter((c) => c.products.length > 0).length,
    productCount: productCount(store),
    top: topProductsByCases(store, unitsPerCase, 5),
  };
}
