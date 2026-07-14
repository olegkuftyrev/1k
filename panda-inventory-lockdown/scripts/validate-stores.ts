import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { StoreDataSchema } from "../src/lib/schema.js";

/**
 * Validate every committed store JSON against the schema.
 * This is the automated half of "manually verify each store, no data mistakes".
 *
 *   npm run validate:stores
 */
async function main() {
  const dir = resolve("data/stores");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  } catch {
    console.log("No data/stores directory yet — nothing to validate.");
    return;
  }

  if (files.length === 0) {
    console.log("No store JSON files found in data/stores.");
    return;
  }

  let failed = 0;
  for (const file of files) {
    const path = resolve(dir, file);
    const raw = JSON.parse(await readFile(path, "utf8"));
    const result = StoreDataSchema.safeParse(raw);
    if (result.success) {
      const productCount = result.data.categories.reduce(
        (n, c) => n + c.products.length,
        0,
      );
      console.log(
        `OK   ${file} — store ${result.data.store.number}, ${result.data.categories.length} categories, ${productCount} products`,
      );
    } else {
      failed++;
      console.error(`FAIL ${file}`);
      for (const issue of result.error.issues) {
        console.error(`     ${issue.path.join(".")}: ${issue.message}`);
      }
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} file(s) failed validation.`);
    process.exit(1);
  }
  console.log(`\nAll ${files.length} store file(s) valid.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
