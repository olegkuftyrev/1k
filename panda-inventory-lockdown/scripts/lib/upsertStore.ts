import type { PrismaClient } from "@prisma/client";
import type { StoreData } from "../../src/lib/schema.js";

/** Default delivery days (Mon/Wed/Fri) applied to a store with no schedule. */
export const DEFAULT_DELIVERY_DAYS = [1, 3, 5];

export interface UpsertStoreOptions {
  /**
   * Manager name. `undefined` preserves the existing value (so re-ingesting a
   * PDF never clobbers it); `null` clears it.
   */
  manager?: string | null;
  /** Delivery days (0=Sun ... 6=Sat). `undefined` preserves existing / default. */
  deliveryDays?: number[];
  /** Initial Sun-Sat forecasts. Existing saved forecasts are always preserved. */
  forecastSales?: number[];
}

/**
 * Upsert a parsed store and its full category/product/week tree into the
 * database. Categories/products/weeks are fully replaced on each call;
 * manager and deliveryDays are preserved unless explicitly provided. Forecasts
 * are initialized from defaults for new stores and preserved on re-ingestion.
 */
export async function upsertStore(
  prisma: PrismaClient,
  data: StoreData,
  opts: UpsertStoreOptions = {},
): Promise<{ storeId: string; categories: number; products: number }> {
  const number = data.store.number;
  if (!number) throw new Error("Cannot upsert a store without a number.");

  const existing = await prisma.store.findUnique({ where: { number } });

  const manager =
    opts.manager !== undefined ? opts.manager : (existing?.manager ?? null);
  const deliveryDays =
    opts.deliveryDays ??
    (existing?.deliveryDays?.length
      ? existing.deliveryDays
      : DEFAULT_DELIVERY_DAYS);
  const forecastSales =
    existing?.forecastSales?.length === 7
      ? existing.forecastSales
      : opts.forecastSales;

  let productTotal = 0;

  const storeId = await prisma.$transaction(async (tx) => {
    const store = await tx.store.upsert({
      where: { number },
      create: {
        number,
        aco: data.store.aco ?? null,
        rdo: data.store.rdo ?? null,
        fiscalWeek: data.store.fiscalWeek ?? null,
        sourceFile: data.source.file,
        parsedAt: data.source.parsedAt ? new Date(data.source.parsedAt) : null,
        weekLabels: data.source.weekLabels,
        manager,
        deliveryDays,
        ...(forecastSales ? { forecastSales } : {}),
      },
      update: {
        aco: data.store.aco ?? null,
        rdo: data.store.rdo ?? null,
        fiscalWeek: data.store.fiscalWeek ?? null,
        sourceFile: data.source.file,
        parsedAt: data.source.parsedAt ? new Date(data.source.parsedAt) : null,
        weekLabels: data.source.weekLabels,
        manager,
        deliveryDays,
        ...(forecastSales ? { forecastSales } : {}),
      },
    });

    // Full replace of the category/product/week tree (cascades to children).
    await tx.category.deleteMany({ where: { storeId: store.id } });

    for (const [ci, category] of data.categories.entries()) {
      await tx.category.create({
        data: {
          storeId: store.id,
          name: category.name,
          position: ci,
          products: {
            create: category.products.map((p, pi) => {
              productTotal += 1;
              return {
                productNumber: p.productNumber.toUpperCase(),
                name: p.name,
                unit: p.unit,
                averagePer1k: p.averagePer1k,
                position: pi,
                weeks: {
                  create: p.weeks.map((w, wi) => ({
                    label: w.label,
                    value: w.value,
                    position: wi,
                  })),
                },
              };
            }),
          },
        },
      });
    }

    return store.id;
  });

  return {
    storeId,
    categories: data.categories.length,
    products: productTotal,
  };
}
