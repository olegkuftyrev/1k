import { basename, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { parsePandaPdf } from "./parsePandaPdf.js";
import { upsertStore } from "../lib/upsertStore.js";

/**
 * CLI: convert a store "Inventory Usage per $1000" PDF into the database.
 *
 *   npm run ingest -- <path-to-pdf>
 *
 * Upserts the store and its full category/product/week tree. Manager and
 * delivery-day assignments are preserved across re-ingests.
 */
async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error("Usage: npm run ingest -- <path-to-pdf>");
    process.exit(1);
  }

  const store = await parsePandaPdf(resolve(pdfPath), basename(pdfPath));
  if (!store.store.number) {
    console.error("Could not determine store number from the PDF.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const result = await upsertStore(prisma, store);
    console.log(
      `Store ${store.store.number}: ${result.categories} categories, ${result.products} products`,
    );
    for (const c of store.categories) {
      console.log(`  - ${c.name}: ${c.products.length}`);
    }
    console.log("Saved to database.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
