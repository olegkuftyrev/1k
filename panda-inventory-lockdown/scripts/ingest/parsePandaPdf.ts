import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  StoreDataSchema,
  type Category,
  type Product,
  type StoreData,
  type WeeklyUsage,
} from "../../src/lib/schema.js";

interface Item {
  x: number;
  y: number;
  w: number;
  str: string;
}
type Row = Item[];

const Y_TOLERANCE = 2.5;
const COLUMN_TOLERANCE = 70;

/**
 * Normalize a numeric cell from the report into a number.
 *
 * Handles two quirks of the source PDF:
 *  - Negatives are wrapped in parentheses, e.g. "(0.18)" -> -0.18.
 *  - The decimal point is sometimes rendered as a space, e.g. "0 22" -> 0.22.
 *
 * Returns null for blank / non-numeric cells.
 */
export function parseUsageNumber(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;

  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1).trim();
  }

  // Decimal-as-space artifact: "0 22" -> "0.22".
  s = s.replace(/(\d)\s+(\d)/g, "$1.$2");
  // Drop any remaining stray characters (stray spaces, currency, commas).
  s = s.replace(/[^0-9.]/g, "");

  if (s === "" || s === ".") return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

function center(it: Item): number {
  return it.x + it.w / 2;
}

function groupRows(items: Item[]): Row[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Row[] = [];
  let current: Row = [];
  let currentY: number | null = null;
  for (const it of sorted) {
    if (currentY === null || Math.abs(it.y - currentY) <= Y_TOLERANCE) {
      current.push(it);
      currentY = currentY === null ? it.y : currentY;
    } else {
      rows.push(current.sort((a, b) => a.x - b.x));
      current = [it];
      currentY = it.y;
    }
  }
  if (current.length) rows.push(current.sort((a, b) => a.x - b.x));
  return rows;
}

interface ColumnLayout {
  unitCenter: number;
  weekColumns: { label: string; center: number }[];
  averageCenter: number | null;
}

function findColumnLayout(headerRow: Row): ColumnLayout {
  let unitCenter = Number.NaN;
  let averageCenter: number | null = null;
  const weekColumns: { label: string; center: number }[] = [];
  for (const it of headerRow) {
    const t = it.str.trim();
    if (/^Unit$/i.test(t)) unitCenter = center(it);
    else if (/^W\d+/i.test(t)) weekColumns.push({ label: t, center: center(it) });
    else if (/^Average$/i.test(t)) averageCenter = center(it);
  }
  weekColumns.sort((a, b) => a.center - b.center);
  return { unitCenter, weekColumns, averageCenter };
}

/** Find the item whose center is nearest `target`, within tolerance. */
function nearestByCenter(items: Item[], target: number): Item | null {
  let best: Item | null = null;
  let bestDist = COLUMN_TOLERANCE;
  for (const it of items) {
    const d = Math.abs(center(it) - target);
    if (d <= bestDist) {
      bestDist = d;
      best = it;
    }
  }
  return best;
}

function extractStoreMeta(rows: Row[]): {
  number: string;
  aco?: string;
  rdo?: string;
  fiscalWeek?: string;
} {
  const all = rows.flat();
  const numberItem = all.find((it) => /^\d{3,6}$/.test(it.str.trim()));
  const acoItem = all.find((it) => /^ACO-/i.test(it.str.trim()));
  const fiscalItem = all.find((it) => /\s+weeks?$/i.test(it.str.trim()));
  const rdoItem = all.find((it) => /^All$/i.test(it.str.trim()));
  return {
    number: numberItem ? numberItem.str.trim() : "",
    aco: acoItem?.str.trim(),
    rdo: rdoItem?.str.trim(),
    fiscalWeek: fiscalItem?.str.trim(),
  };
}

function parseCategoryPage(rows: Row[]): {
  categoryName: string | null;
  category: Category | null;
} {
  // Category title, e.g. "Meat Inventory Usage per $1000".
  let categoryName: string | null = null;
  for (const row of rows) {
    for (const it of row) {
      const m = it.str.match(/^(.+?)\s+Inventory Usage per \$?1000/i);
      if (m && m[1]) {
        categoryName = m[1].trim();
        break;
      }
    }
    if (categoryName) break;
  }
  if (!categoryName) return { categoryName: null, category: null };

  // Header row containing "Product Number".
  const headerRow = rows.find((row) =>
    row.some((it) => /^Product Number$/i.test(it.str.trim())),
  );
  if (!headerRow) {
    return { categoryName, category: { name: categoryName, products: [] } };
  }
  const layout = findColumnLayout(headerRow);
  const unitLeftBound = layout.unitCenter - COLUMN_TOLERANCE;

  const products: Product[] = [];
  for (const row of rows) {
    const productItem = row.find((it) => /^P\d{2,6}$/i.test(it.str.trim()));
    if (!productItem) continue;

    const numericTargets = [
      ...layout.weekColumns.map((c) => c.center),
      ...(layout.averageCenter !== null ? [layout.averageCenter] : []),
    ];
    const numericItems = new Set<Item>();

    const unitItem = row.find(
      (it) =>
        /^[A-Z]{1,5}$/.test(it.str.trim()) &&
        Math.abs(center(it) - layout.unitCenter) <= COLUMN_TOLERANCE,
    );

    const weeks: WeeklyUsage[] = layout.weekColumns.map((col) => {
      const hit = nearestByCenter(
        row.filter((it) => it !== productItem && it !== unitItem),
        col.center,
      );
      if (hit) numericItems.add(hit);
      return { label: col.label, value: hit ? parseUsageNumber(hit.str) : null };
    });

    let averagePer1k: number | null = null;
    if (layout.averageCenter !== null) {
      const hit = nearestByCenter(
        row.filter(
          (it) => it !== productItem && it !== unitItem && !numericItems.has(it),
        ),
        layout.averageCenter,
      );
      if (hit) {
        numericItems.add(hit);
        averagePer1k = parseUsageNumber(hit.str);
      }
    }

    const nameItems = row
      .filter(
        (it) =>
          it !== productItem &&
          it !== unitItem &&
          !numericItems.has(it) &&
          center(it) > center(productItem) &&
          center(it) < unitLeftBound,
      )
      .sort((a, b) => a.x - b.x);
    const name = nameItems
      .map((it) => it.str.trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    products.push({
      productNumber: productItem.str.trim().toUpperCase(),
      name,
      category: categoryName,
      unit: unitItem ? unitItem.str.trim().toUpperCase() : "",
      weeks,
      averagePer1k,
    });
  }

  return { categoryName, category: { name: categoryName, products } };
}

export async function parsePandaPdf(
  input: string | Uint8Array,
  fileName?: string,
): Promise<StoreData> {
  const data =
    typeof input === "string" ? new Uint8Array(await readFile(input)) : input;
  const resolvedName =
    fileName ?? (typeof input === "string" ? basename(input) : "buffer.pdf");

  const doc = await getDocument({ data }).promise;

  const categories: Category[] = [];
  let meta: ReturnType<typeof extractStoreMeta> | null = null;
  let weekLabels: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items: Item[] = content.items
      .map((it) => {
        const anyIt = it as { transform?: number[]; width?: number; str?: string };
        return {
          x: anyIt.transform ? anyIt.transform[4]! : 0,
          y: anyIt.transform ? anyIt.transform[5]! : 0,
          w: anyIt.width ?? 0,
          str: anyIt.str ?? "",
        };
      })
      .filter((i) => i.str.trim() !== "");

    const rows = groupRows(items);
    if (!meta) meta = extractStoreMeta(rows);

    const { category } = parseCategoryPage(rows);
    if (category) {
      categories.push(category);
      if (weekLabels.length === 0) {
        const headerRow = rows.find((row) =>
          row.some((it) => /^Product Number$/i.test(it.str.trim())),
        );
        if (headerRow) {
          weekLabels = findColumnLayout(headerRow).weekColumns.map((c) => c.label);
        }
      }
    }
  }

  const storeData: StoreData = StoreDataSchema.parse({
    store: {
      number: meta?.number ?? "",
      aco: meta?.aco,
      rdo: meta?.rdo,
      fiscalWeek: meta?.fiscalWeek,
    },
    source: {
      file: resolvedName,
      parsedAt: new Date().toISOString(),
      weekLabels,
    },
    delivery: { deliveryDays: [] },
    categories,
  });

  return storeData;
}
