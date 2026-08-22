import { casesForTarget } from "./ordering/calculate";
import {
  DAY_LABELS,
  FULL_DAY_LABELS,
  sumSales,
  type PlannerDays,
} from "./planner";
import type { Product, StoreData, UnitsPerCase } from "./schema";

export const BAGS_PER_CASE = 5;

export type ThawLocation = "cabinet" | "wic";

export interface ThawProductDefinition {
  productNumber: string;
  name: string;
  location: ThawLocation;
}

export const THAW_PRODUCTS: ThawProductDefinition[] = [
  {
    productNumber: "P10008",
    name: "Breast Sliced Chicken",
    location: "cabinet",
  },
  {
    productNumber: "P10019",
    name: "Dark Diced Chicken",
    location: "cabinet",
  },
  {
    productNumber: "P10028",
    name: "Teriyaki Thigh Chicken",
    location: "cabinet",
  },
  {
    productNumber: "P5007",
    name: "Sliced Marinated Beef",
    location: "wic",
  },
  {
    productNumber: "P5020",
    name: "Top Sirloin Steak",
    location: "wic",
  },
];

export interface ThawWindow {
  deliveryDay: number;
  readyDay: number;
  coverageDays: number[];
  salesTarget: number;
}

export interface ThawProductPlan extends ThawProductDefinition {
  averagePer1k: number | null;
  unitsPerCase: number | null;
  bagsByDelivery: Array<number | null>;
  weeklyBags: number | null;
}

export interface StoreThawPlan {
  cabinetWindows: ThawWindow[];
  wicWindows: ThawWindow[];
  cabinet: ThawProductPlan[];
  wic: ThawProductPlan[];
}

function daysUntil(start: number, end: number): number[] {
  const days: number[] = [];
  let day = start;
  while (day !== end && days.length < 7) {
    days.push(day);
    day = (day + 1) % 7;
  }
  return days;
}

/**
 * Build one thaw coverage window per saved delivery day.
 *
 * A delivery received on day D is ready after `readyAfterDays`. It covers every
 * forecast day from that ready day through the day before the next delivery
 * becomes ready.
 */
export function buildThawWindows(
  days: PlannerDays,
  readyAfterDays = 2,
): ThawWindow[] {
  const deliveryDays = days
    .flatMap((day, index) => (day.delivery ? [index] : []))
    .sort((a, b) => a - b);

  if (deliveryDays.length === 0) return [];

  return deliveryDays.map((deliveryDay, index) => {
    const readyDay = (deliveryDay + readyAfterDays) % 7;
    const nextDeliveryDay = deliveryDays[(index + 1) % deliveryDays.length];
    const nextReadyDay = (nextDeliveryDay + readyAfterDays) % 7;
    const coverageDays =
      deliveryDays.length === 1
        ? Array.from({ length: 7 }, (_, offset) => (readyDay + offset) % 7)
        : daysUntil(readyDay, nextReadyDay);

    return {
      deliveryDay,
      readyDay,
      coverageDays,
      salesTarget: sumSales(days, coverageDays),
    };
  });
}

function findProduct(store: StoreData, productNumber: string): Product | null {
  const normalized = productNumber.toUpperCase();
  for (const category of store.categories) {
    const product = category.products.find(
      (candidate) => candidate.productNumber.toUpperCase() === normalized,
    );
    if (product) return product;
  }
  return null;
}

function buildProductPlan(
  definition: ThawProductDefinition,
  store: StoreData,
  unitsPerCase: UnitsPerCase,
  windows: ThawWindow[],
): ThawProductPlan {
  const product = findProduct(store, definition.productNumber);
  const averagePer1k = product?.averagePer1k ?? null;
  const caseSize = unitsPerCase[definition.productNumber] ?? null;
  const bagsByDelivery = windows.map((window) => {
    const exactCases = casesForTarget(
      averagePer1k,
      caseSize,
      window.salesTarget,
    );
    return exactCases === null ? null : Math.ceil(exactCases * BAGS_PER_CASE);
  });
  const availableBags = bagsByDelivery.filter(
    (bags): bags is number => bags !== null,
  );

  return {
    ...definition,
    averagePer1k,
    unitsPerCase: caseSize,
    bagsByDelivery,
    weeklyBags:
      availableBags.length === bagsByDelivery.length
        ? availableBags.reduce((total, bags) => total + bags, 0)
        : null,
  };
}

export function buildStoreThawPlan(
  store: StoreData,
  unitsPerCase: UnitsPerCase,
  days: PlannerDays,
): StoreThawPlan {
  const cabinetWindows = buildThawWindows(days, 1);
  const wicWindows = buildThawWindows(days, 2);
  const cabinet = THAW_PRODUCTS.filter(
    (product) => product.location === "cabinet",
  ).map((definition) =>
    buildProductPlan(definition, store, unitsPerCase, cabinetWindows),
  );
  const wic = THAW_PRODUCTS.filter((product) => product.location === "wic").map(
    (definition) =>
      buildProductPlan(definition, store, unitsPerCase, wicWindows),
  );

  return {
    cabinetWindows,
    wicWindows,
    cabinet,
    wic,
  };
}

export function formatCoverageDays(days: number[]): string {
  return days.map((day) => DAY_LABELS[day]).join(" + ");
}

export function deliveryLabel(window: ThawWindow): string {
  return `${FULL_DAY_LABELS[window.deliveryDay]} delivery`;
}

export function readyLabel(window: ThawWindow): string {
  return `Ready ${FULL_DAY_LABELS[window.readyDay]}`;
}

export function formatBagQuantity(totalBags: number | null): string[] {
  if (totalBags === null) return ["Unavailable"];
  const cases = Math.floor(totalBags / BAGS_PER_CASE);
  const bags = totalBags % BAGS_PER_CASE;
  const parts: string[] = [];
  if (cases > 0) parts.push(`${cases} cs`);
  if (bags > 0) parts.push(`${bags} ${bags === 1 ? "bag" : "bags"}`);
  return parts.length > 0 ? parts : ["0 bags"];
}
