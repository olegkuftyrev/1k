import "server-only";
import { prisma } from "@/lib/db";
import { toStoreData, type StoreRow } from "@/lib/mappers";
import type {
  DeliveryMap,
  Managers,
  Product,
  StoreData,
  UnitsPerCase,
} from "@/lib/schema";
import { casesPer1k } from "@/lib/ordering/calculate";
import { defaultDays, type PlannerDays } from "@/lib/planner";

/** Default delivery days when a store has no explicit schedule: Mon/Wed/Fri. */
export const DEFAULT_DELIVERY_DAYS = [1, 3, 5];

/** Prisma include tree with children pre-sorted by position for stable order. */
const STORE_INCLUDE = {
  categories: {
    orderBy: { position: "asc" as const },
    include: {
      products: {
        orderBy: { position: "asc" as const },
        include: {
          weeks: { orderBy: { position: "asc" as const } },
        },
      },
    },
  },
};

/** Load every store, sorted by store number, as canonical StoreData. */
export async function getAllStores(): Promise<StoreData[]> {
  const rows = await prisma.store.findMany({
    orderBy: { number: "asc" },
    include: STORE_INCLUDE,
  });
  return rows.map((r) => toStoreData(r as unknown as StoreRow));
}

/** Load a single store by its number, or null if missing. */
export async function getStore(number: string): Promise<StoreData | null> {
  const row = await prisma.store.findUnique({
    where: { number },
    include: STORE_INCLUDE,
  });
  return row ? toStoreData(row as unknown as StoreRow) : null;
}

/** Load the master units-per-case map (product number -> units per case). */
export async function getUnitsPerCase(): Promise<UnitsPerCase> {
  const rows = await prisma.productCase.findMany();
  const map: UnitsPerCase = {};
  for (const r of rows) map[r.productNumber.toUpperCase()] = r.unitsPerCase;
  return map;
}

/** Units per case for a product, or null when unknown. */
export function unitsPerCaseFor(
  map: UnitsPerCase,
  productNumber: string,
): number | null {
  return map[productNumber.toUpperCase()] ?? null;
}

/** Map of store number -> manager name (only stores that have one). */
export async function getManagers(): Promise<Managers> {
  const rows = await prisma.store.findMany({
    select: { number: true, manager: true },
  });
  const map: Managers = {};
  for (const r of rows) if (r.manager) map[r.number] = r.manager;
  return map;
}

/** Map of store number -> delivery days. */
export async function getDeliveryMap(): Promise<DeliveryMap> {
  const rows = await prisma.store.findMany({
    select: { number: true, deliveryDays: true },
  });
  const map: DeliveryMap = {};
  for (const r of rows) map[r.number] = r.deliveryDays;
  return map;
}

/** Delivery days for a store, falling back to the Mon/Wed/Fri default. */
export function deliveryDaysFor(map: DeliveryMap, number: string): number[] {
  const days = map[number];
  return days && days.length > 0 ? days : DEFAULT_DELIVERY_DAYS;
}

/** Persisted planner settings for one store, falling back to defaults. */
export async function getStorePlannerDays(number: string): Promise<PlannerDays> {
  const row = await prisma.store.findUnique({
    where: { number },
    select: { deliveryDays: true, forecastSales: true },
  });
  const deliveryDays =
    row?.deliveryDays && row.deliveryDays.length > 0
      ? row.deliveryDays
      : DEFAULT_DELIVERY_DAYS;
  const defaults = defaultDays(deliveryDays);
  const forecastSales = row?.forecastSales ?? [];

  return defaults.map((day, index) => ({
    ...day,
    sales:
      Number.isFinite(forecastSales[index]) && forecastSales[index] > 0
        ? forecastSales[index]
        : day.sales,
  }));
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
