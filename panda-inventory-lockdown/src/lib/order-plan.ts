import { casesForTarget } from "./ordering/calculate";
import { sumSales, type PlannerDays } from "./planner";
import type { Product, StoreData, UnitsPerCase } from "./schema";

export type OrderPlanKind = "meat" | "vegetables";

export interface DeliveryOrderWindow {
  deliveryDay: number;
  coverageDays: number[];
  salesTarget: number;
}

export interface OrderPlanProduct {
  productNumber: string;
  name: string;
  category: string;
  averagePer1k: number | null;
  unitsPerCase: number | null;
  casesByDelivery: Array<number | null>;
  weeklyCases: number | null;
}

export interface StoreOrderPlan {
  windows: DeliveryOrderWindow[];
  products: OrderPlanProduct[];
}

const MEAT_ORDER_PRODUCTS = [
  ["P10002", "Orange Dark Battered Chicken"],
  ["P16032", "Battered Tempura Shrimp"],
  ["P10028", "Teriyaki Thigh Chicken"],
  ["P5017", "BB Strip Breaded Beef"],
  ["P10027", "Breast Strip Battered Chicken"],
  ["P10019", "Dark Diced Chicken"],
  ["P5007", "Sliced Marinated Beef"],
  ["P10018", "Breast Bites Battered Chicken"],
  ["P5020", "Top Sirloin Steak"],
  ["P10008", "Breast Sliced Chicken"],
] as const;

const VEGETABLE_PLAN_EXTRAS = ["P1102"] as const;

function daysUntil(start: number, end: number): number[] {
  const days: number[] = [];
  let day = start;
  while (day !== end && days.length < 7) {
    days.push(day);
    day = (day + 1) % 7;
  }
  return days;
}

/** One consumption window per delivery, covering through the next delivery. */
export function buildDeliveryOrderWindows(
  days: PlannerDays,
): DeliveryOrderWindow[] {
  const deliveryDays = days
    .flatMap((day, index) => (day.delivery ? [index] : []))
    .sort((a, b) => a - b);

  if (deliveryDays.length === 0) return [];

  return deliveryDays.map((deliveryDay, index) => {
    const nextDeliveryDay = deliveryDays[(index + 1) % deliveryDays.length];
    const coverageDays =
      deliveryDays.length === 1
        ? Array.from(
            { length: 7 },
            (_, offset) => (deliveryDay + offset) % 7,
          )
        : daysUntil(deliveryDay, nextDeliveryDay);

    return {
      deliveryDay,
      coverageDays,
      salesTarget: sumSales(days, coverageDays),
    };
  });
}

function allProducts(store: StoreData): Product[] {
  return store.categories.flatMap((category) => category.products);
}

function productsForKind(store: StoreData, kind: OrderPlanKind): Product[] {
  if (kind === "vegetables") {
    const produce = store.categories
      .filter((category) => category.name.toLowerCase() === "produce")
      .flatMap((category) => category.products);
    const included = new Set(
      produce.map((product) => product.productNumber.toUpperCase()),
    );
    const productsByNumber = new Map(
      allProducts(store).map((product) => [
        product.productNumber.toUpperCase(),
        product,
      ]),
    );
    const extras = VEGETABLE_PLAN_EXTRAS.flatMap((productNumber) => {
      const product = productsByNumber.get(productNumber);
      return product && !included.has(productNumber) ? [product] : [];
    });
    return [...produce, ...extras];
  }

  const productsByNumber = new Map(
    allProducts(store).map((product) => [
      product.productNumber.toUpperCase(),
      product,
    ]),
  );
  return MEAT_ORDER_PRODUCTS.flatMap(([productNumber, name]) => {
    const product = productsByNumber.get(productNumber);
    return product ? [{ ...product, name }] : [];
  });
}

function buildProductPlan(
  product: Product,
  unitsPerCase: UnitsPerCase,
  windows: DeliveryOrderWindow[],
): OrderPlanProduct {
  const caseSize = unitsPerCase[product.productNumber.toUpperCase()] ?? null;
  const casesByDelivery = windows.map((window) => {
    const exactCases = casesForTarget(
      product.averagePer1k,
      caseSize,
      window.salesTarget,
    );
    return exactCases === null ? null : Math.ceil(Math.max(0, exactCases));
  });
  const availableCases = casesByDelivery.filter(
    (cases): cases is number => cases !== null,
  );

  return {
    productNumber: product.productNumber,
    name: product.name,
    category: product.category,
    averagePer1k: product.averagePer1k,
    unitsPerCase: caseSize,
    casesByDelivery,
    weeklyCases:
      availableCases.length === casesByDelivery.length
        ? availableCases.reduce((total, cases) => total + cases, 0)
        : null,
  };
}

export function buildStoreOrderPlan(
  store: StoreData,
  unitsPerCase: UnitsPerCase,
  days: PlannerDays,
  kind: OrderPlanKind,
): StoreOrderPlan {
  const windows = buildDeliveryOrderWindows(days);
  return {
    windows,
    products: productsForKind(store, kind).map((product) =>
      buildProductPlan(product, unitsPerCase, windows),
    ),
  };
}
