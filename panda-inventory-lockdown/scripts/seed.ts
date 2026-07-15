import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  ForecastSalesMapSchema,
  StoreDataSchema,
} from "../src/lib/schema.js";
import { DEFAULT_DELIVERY_DAYS, upsertStore } from "./lib/upsertStore.js";

/**
 * Seed / migrate the existing JSON data into Postgres.
 *
 *   npm run db:seed
 *
 * Idempotent: re-running upserts stores and refreshes the units-per-case map.
 * Reads the already-validated files under data/ so the source PDFs are not
 * needed.
 */

const DATA_DIR = join(process.cwd(), "data");
const STORES_DIR = join(DATA_DIR, "stores");

/** Read a JSON object file, stripping metadata keys that start with "_". */
async function readMap(file: string): Promise<Record<string, unknown>> {
  try {
    const raw = JSON.parse(await readFile(join(DATA_DIR, file), "utf8"));
    return Object.fromEntries(
      Object.entries(raw).filter(([k]) => !k.startsWith("_")),
    );
  } catch {
    return {};
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    // 1. Units-per-case (global map).
    const units = await readMap("units-per-case.json");
    let unitCount = 0;
    for (const [productNumber, value] of Object.entries(units)) {
      const unitsPerCase = Number(value);
      if (!Number.isFinite(unitsPerCase) || unitsPerCase <= 0) continue;
      await prisma.productCase.upsert({
        where: { productNumber: productNumber.toUpperCase() },
        create: { productNumber: productNumber.toUpperCase(), unitsPerCase },
        update: { unitsPerCase },
      });
      unitCount += 1;
    }
    console.log(`Units-per-case: ${unitCount} products`);

    // 2. Managers and delivery-day overrides.
    const managers = (await readMap("managers.json")) as Record<string, string>;
    const delivery = (await readMap("delivery.json")) as Record<
      string,
      number[]
    >;
    const forecasts = ForecastSalesMapSchema.parse(
      await readMap("forecast-sales.json"),
    );

    // 3. Stores.
    let files: string[] = [];
    try {
      files = (await readdir(STORES_DIR)).filter((f) => f.endsWith(".json"));
    } catch {
      files = [];
    }
    files.sort();

    for (const file of files) {
      const raw = JSON.parse(await readFile(join(STORES_DIR, file), "utf8"));
      const store = StoreDataSchema.parse(raw);
      const number = store.store.number;
      const result = await upsertStore(prisma, store, {
        manager: managers[number] ?? null,
        deliveryDays: delivery[number] ?? DEFAULT_DELIVERY_DAYS,
        forecastSales: forecasts[number],
      });
      console.log(
        `Store ${number}: ${result.categories} categories, ${result.products} products` +
          `${managers[number] ? ` · ${managers[number]}` : ""}`,
      );
    }

    console.log(`\nSeed complete: ${files.length} stores.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
