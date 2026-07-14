"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

/** A usage/average value: a finite number, or null to clear the cell. */
const nullableNumber = z.number().finite().nullable();

const usageInput = z.object({
  storeNumber: z.string().min(1),
  productNumber: z.string().min(1),
  label: z.string().min(1),
  value: nullableNumber,
});

const averageInput = z.object({
  storeNumber: z.string().min(1),
  productNumber: z.string().min(1),
  value: nullableNumber,
});

const unitsInput = z.object({
  productNumber: z.string().min(1),
  value: z.number().finite().positive(),
});

const weekPlanInput = z.object({
  storeNumber: z.string().min(1),
  days: z
    .array(
      z.object({
        delivery: z.boolean(),
        sales: z.number().finite().nonnegative(),
      }),
    )
    .length(7),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function revalidateStore(storeNumber: string) {
  revalidatePath("/");
  revalidatePath(`/stores/${storeNumber}`);
}

/** Find a product id within a given store, or null when absent. */
async function findProductId(
  storeNumber: string,
  productNumber: string,
): Promise<string | null> {
  const product = await prisma.product.findFirst({
    where: {
      productNumber: productNumber.toUpperCase(),
      category: { store: { number: storeNumber } },
    },
    select: { id: true },
  });
  return product?.id ?? null;
}

/** Update a single week's usage value for a product. */
export async function updateWeeklyUsage(
  input: z.infer<typeof usageInput>,
): Promise<ActionResult> {
  const parsed = usageInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { storeNumber, productNumber, label, value } = parsed.data;

  const productId = await findProductId(storeNumber, productNumber);
  if (!productId) return { ok: false, error: "Product not found." };

  const updated = await prisma.weeklyUsage.updateMany({
    where: { productId, label },
    data: { value },
  });
  if (updated.count === 0) return { ok: false, error: "Week not found." };

  revalidateStore(storeNumber);
  return { ok: true };
}

/** Update a product's rolling-average usage per $1000. */
export async function updateProductAverage(
  input: z.infer<typeof averageInput>,
): Promise<ActionResult> {
  const parsed = averageInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { storeNumber, productNumber, value } = parsed.data;

  const productId = await findProductId(storeNumber, productNumber);
  if (!productId) return { ok: false, error: "Product not found." };

  await prisma.product.update({
    where: { id: productId },
    data: { averagePer1k: value },
  });

  revalidateStore(storeNumber);
  return { ok: true };
}

/**
 * Set the global units-per-case for a product number. Affects every store.
 * `storeNumber` is only used to revalidate the page the edit came from.
 */
export async function updateUnitsPerCase(
  input: z.infer<typeof unitsInput> & { storeNumber?: string },
): Promise<ActionResult> {
  const parsed = unitsInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Must be a positive number." };
  const { productNumber, value } = parsed.data;
  const key = productNumber.toUpperCase();

  await prisma.productCase.upsert({
    where: { productNumber: key },
    create: { productNumber: key, unitsPerCase: value },
    update: { unitsPerCase: value },
  });

  revalidatePath("/");
  if (input.storeNumber) revalidatePath(`/stores/${input.storeNumber}`);
  return { ok: true };
}

/** Save one store's delivery days and seven daily forecast values. */
export async function updateStoreWeekPlan(
  input: z.infer<typeof weekPlanInput>,
): Promise<ActionResult> {
  const parsed = weekPlanInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid week plan." };
  const { storeNumber, days } = parsed.data;

  const deliveryDays = days.flatMap((day, index) =>
    day.delivery ? [index] : [],
  );
  const forecastSales = days.map((day) => Math.round(day.sales));

  await prisma.store.update({
    where: { number: storeNumber },
    data: { deliveryDays, forecastSales },
  });

  revalidateStore(storeNumber);
  return { ok: true };
}
