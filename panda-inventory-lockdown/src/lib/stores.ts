import "server-only";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { StoreDataSchema, type Product, type StoreData } from "@/lib/schema";

const STORES_DIR = join(process.cwd(), "data", "stores");

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

/** Flatten every product across a store's categories. */
export function allProducts(store: StoreData): Product[] {
  return store.categories.flatMap((c) => c.products);
}

/** Total number of products in a store. */
export function productCount(store: StoreData): number {
  return store.categories.reduce((n, c) => n + c.products.length, 0);
}

/** Products with the highest rolling-average usage per $1000. */
export function topProducts(store: StoreData, limit = 5): Product[] {
  return allProducts(store)
    .filter((p) => p.averagePer1k !== null)
    .sort((a, b) => (b.averagePer1k ?? 0) - (a.averagePer1k ?? 0))
    .slice(0, limit);
}

export interface StoreSummary {
  number: string;
  aco?: string;
  fiscalWeek?: string;
  categoryCount: number;
  productCount: number;
  top: Product[];
}

export function summarize(store: StoreData): StoreSummary {
  return {
    number: store.store.number,
    aco: store.store.aco,
    fiscalWeek: store.store.fiscalWeek,
    categoryCount: store.categories.filter((c) => c.products.length > 0).length,
    productCount: productCount(store),
    top: topProducts(store, 3),
  };
}
