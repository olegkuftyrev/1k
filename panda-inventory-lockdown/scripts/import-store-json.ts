import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  ForecastSalesMapSchema,
  StoreDataSchema,
} from "../src/lib/schema.js";
import { upsertStore } from "./lib/upsertStore.js";

async function readDataMap(file: string): Promise<Record<string, unknown>> {
  const raw = JSON.parse(await readFile(resolve("data", file), "utf8"));
  return Object.fromEntries(
    Object.entries(raw).filter(([key]) => !key.startsWith("_")),
  );
}

async function main() {
  const storeNumbers = process.argv.slice(2);
  if (storeNumbers.length === 0) {
    throw new Error("Provide at least one store number to import.");
  }

  const forecasts = ForecastSalesMapSchema.parse(
    await readDataMap("forecast-sales.json"),
  );
  const caseSizes = await readDataMap("units-per-case.json");
  const prisma = new PrismaClient();

  try {
    for (const [productNumber, rawValue] of Object.entries(caseSizes)) {
      const unitsPerCase = Number(rawValue);
      if (!Number.isFinite(unitsPerCase) || unitsPerCase <= 0) continue;
      await prisma.productCase.upsert({
        where: { productNumber: productNumber.toUpperCase() },
        create: { productNumber: productNumber.toUpperCase(), unitsPerCase },
        update: { unitsPerCase },
      });
    }

    for (const storeNumber of storeNumbers) {
      if (!/^\d+$/.test(storeNumber)) {
        throw new Error(`Invalid store number: ${storeNumber}`);
      }
      const raw = JSON.parse(
        await readFile(resolve("data", "stores", `${storeNumber}.json`), "utf8"),
      );
      const store = StoreDataSchema.parse(raw);
      if (store.store.number !== storeNumber) {
        throw new Error(
          `${storeNumber}.json contains store ${store.store.number}`,
        );
      }

      const result = await upsertStore(prisma, store, {
        forecastSales: forecasts[storeNumber],
      });
      console.log(
        `Store ${storeNumber}: ${result.categories} categories, ${result.products} products`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
