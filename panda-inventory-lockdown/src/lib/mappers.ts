import type { StoreData } from "@/lib/schema";

/**
 * Structural shape of a store row loaded from the database (Prisma), decoupled
 * from generated Prisma types so this mapper stays pure and unit-testable
 * without a database connection. Relations are expected pre-sorted by
 * `position`.
 */
export interface StoreRow {
  number: string;
  aco: string | null;
  rdo: string | null;
  fiscalWeek: string | null;
  sourceFile: string | null;
  parsedAt: Date | null;
  weekLabels: string[];
  deliveryDays: number[];
  categories: {
    name: string;
    products: {
      productNumber: string;
      name: string;
      unit: string;
      averagePer1k: number | null;
      weeks: { label: string; value: number | null }[];
    }[];
  }[];
}

/** Convert a database store row into the app's canonical `StoreData` shape. */
export function toStoreData(row: StoreRow): StoreData {
  return {
    store: {
      number: row.number,
      aco: row.aco ?? undefined,
      rdo: row.rdo ?? undefined,
      fiscalWeek: row.fiscalWeek ?? undefined,
    },
    source: {
      file: row.sourceFile ?? "",
      parsedAt: row.parsedAt ? row.parsedAt.toISOString() : "",
      weekLabels: row.weekLabels,
    },
    delivery: { deliveryDays: row.deliveryDays },
    categories: row.categories.map((c) => ({
      name: c.name,
      products: c.products.map((p) => ({
        productNumber: p.productNumber,
        name: p.name,
        category: c.name,
        unit: p.unit,
        weeks: p.weeks.map((w) => ({ label: w.label, value: w.value })),
        averagePer1k: p.averagePer1k,
      })),
    })),
  };
}
