import { z } from "zod";

/**
 * Authoritative data contract for a single Panda Express store, derived from
 * the store's "Inventory Usage per $1000" report (one PDF per store).
 *
 * The report is the source of the per-product usage rates. Delivery schedule
 * is NOT present in the report and is filled in separately.
 */

export const WeeklyUsageSchema = z.object({
  /** Column label as printed in the report, e.g. "W25 '26". */
  label: z.string().min(1),
  /** Usage per $1000 for that week. null when the cell was blank. */
  value: z.number().nullable(),
});
export type WeeklyUsage = z.infer<typeof WeeklyUsageSchema>;

export const ProductSchema = z.object({
  /** Panda product number, e.g. "P10002". */
  productNumber: z.string().regex(/^P\d+$/i),
  /** Display name, e.g. "Chicken, Orange Dark Battered K-". */
  name: z.string().min(1),
  /** Category name, e.g. "Meat". */
  category: z.string().min(1),
  /** Unit of measure as printed, e.g. "LB", "CT", "GAL", "BOTL". */
  unit: z.string().min(1),
  /** Per-week usage-per-$1000 columns, in report order. */
  weeks: z.array(WeeklyUsageSchema),
  /** Rolling-average usage per $1000 (the "Average" column). null if blank. */
  averagePer1k: z.number().nullable(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CategorySchema = z.object({
  name: z.string().min(1),
  products: z.array(ProductSchema),
});
export type Category = z.infer<typeof CategorySchema>;

export const DeliveryScheduleSchema = z.object({
  /** Days of week the store receives deliveries (0=Sun ... 6=Sat). */
  deliveryDays: z.array(z.number().int().min(0).max(6)),
});
export type DeliverySchedule = z.infer<typeof DeliveryScheduleSchema>;

export const StoreMetaSchema = z.object({
  /** Panda store number, e.g. "3847". */
  number: z.string().min(1),
  /** Area Coach of Operations, e.g. "ACO-JOSEPHINE CERVANTES". */
  aco: z.string().optional(),
  /** Regional Director of Operations filter, e.g. "All". */
  rdo: z.string().optional(),
  /** Fiscal-week filter, e.g. "Rolling 4 Weeks". */
  fiscalWeek: z.string().optional(),
});
export type StoreMeta = z.infer<typeof StoreMetaSchema>;

/**
 * Master map of product number → units (lbs/each) per case.
 * Shared across all stores; used to convert usage into case counts.
 * Keys beginning with "_" (e.g. "_description") are metadata and stripped
 * before validation by the loader.
 */
export const UnitsPerCaseSchema = z.record(
  z.string().regex(/^P\d+$/i),
  z.number().positive(),
);
export type UnitsPerCase = z.infer<typeof UnitsPerCaseSchema>;

export const StoreDataSchema = z.object({
  store: StoreMetaSchema,
  source: z.object({
    /** Original PDF file name the data was parsed from. */
    file: z.string(),
    /** ISO timestamp of when parsing ran. */
    parsedAt: z.string(),
    /** Week column labels found in the report, in order. */
    weekLabels: z.array(z.string()),
  }),
  /** Delivery schedule — not in the usage report; filled in later. */
  delivery: DeliveryScheduleSchema.default({ deliveryDays: [] }),
  categories: z.array(CategorySchema),
});
export type StoreData = z.infer<typeof StoreDataSchema>;
