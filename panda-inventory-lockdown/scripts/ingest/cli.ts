import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parsePandaPdf } from "./parsePandaPdf.js";

/**
 * CLI: convert a store "Inventory Usage per $1000" PDF into verified JSON.
 *
 *   npm run ingest -- <path-to-pdf> [outDir]
 *
 * Output is written to <outDir>/<storeNumber>.json (default outDir: data/stores).
 */
async function main() {
  const pdfPath = process.argv[2];
  const outDir = process.argv[3] ?? "data/stores";
  if (!pdfPath) {
    console.error("Usage: npm run ingest -- <path-to-pdf> [outDir]");
    process.exit(1);
  }

  const store = await parsePandaPdf(resolve(pdfPath), basename(pdfPath));
  const productCount = store.categories.reduce(
    (n, c) => n + c.products.length,
    0,
  );

  await mkdir(outDir, { recursive: true });
  const outPath = resolve(
    outDir,
    `${store.store.number || "unknown"}.json`,
  );
  await writeFile(outPath, JSON.stringify(store, null, 2) + "\n", "utf8");

  console.log(`Store ${store.store.number}: ${store.categories.length} categories, ${productCount} products`);
  for (const c of store.categories) {
    console.log(`  - ${c.name}: ${c.products.length}`);
  }
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
