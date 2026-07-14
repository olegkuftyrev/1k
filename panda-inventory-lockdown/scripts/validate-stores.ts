import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { StoreDataSchema, UnitsPerCaseSchema } from "../src/lib/schema.js";

/** Load the master units-per-case map, stripping "_"-prefixed metadata keys. */
async function loadUnitsPerCase(): Promise<Record<string, number>> {
  try {
    const raw = JSON.parse(
      await readFile(resolve("data/units-per-case.json"), "utf8"),
    );
    const entries = Object.fromEntries(
      Object.entries(raw).filter(([k]) => !k.startsWith("_")),
    );
    return UnitsPerCaseSchema.parse(entries);
  } catch {
    return {};
  }
}

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

  const unitsPerCase = await loadUnitsPerCase();

  let failed = 0;
  for (const file of files) {
    const path = resolve(dir, file);
    const raw = JSON.parse(await readFile(path, "utf8"));
    const result = StoreDataSchema.safeParse(raw);
    if (result.success) {
      const products = result.data.categories.flatMap((c) => c.products);
      console.log(
        `OK   ${file} — store ${result.data.store.number}, ${result.data.categories.length} categories, ${products.length} products`,
      );
      const missing = products
        .map((p) => p.productNumber.toUpperCase())
        .filter((pn) => !(pn in unitsPerCase));
      if (missing.length > 0) {
        console.warn(
          `WARN ${file} — ${missing.length} product(s) missing a units-per-case entry: ${missing.join(", ")}`,
        );
      }
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
