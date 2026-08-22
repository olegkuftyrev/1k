import { casesForTarget } from "./ordering/calculate";
import {
  buildDeliveryOrderWindows,
  type DeliveryOrderWindow,
} from "./order-plan";
import type { PlannerDays } from "./planner";
import type { Product, StoreData } from "./schema";

export const MEAT_BAG_WEIGHT_LB = 8;

export interface ContainerProductDefinition {
  productNumber: string;
  name: string;
  poundsPerContainer: number;
  bagsPerContainer?: number;
  packageWeightLb?: number;
  containersPerPackage?: number;
  packageLabel?: string;
}

export interface ContainerGroupDefinition {
  id: string;
  title: string;
  shortTitle: string;
  products: ContainerProductDefinition[];
}

export const CONTAINER_GROUPS: ContainerGroupDefinition[] = [
  {
    id: "half-stainless-4",
    title: "1/2 Size 4\" Deep Stainless Steel Pan",
    shortTitle: "1/2 Size 4\" Stainless",
    products: [
      {
        productNumber: "P10008",
        name: "Breast Sliced Chicken",
        poundsPerContainer: 8,
        bagsPerContainer: 1,
      },
      {
        productNumber: "P5020",
        name: "Top Sirloin Steak",
        poundsPerContainer: 8,
        bagsPerContainer: 1,
      },
    ],
  },
  {
    id: "half-cambro-6",
    title: "Cambro 1/2 Size 6\" Deep Food Pan",
    shortTitle: "1/2 Size 6\" Cambro",
    products: [
      {
        productNumber: "P19186",
        name: "Green Beans",
        poundsPerContainer: 7,
      },
      {
        productNumber: "P19045",
        name: "Mushrooms",
        poundsPerContainer: 7,
      },
      {
        productNumber: "P19055",
        name: "Zucchini",
        poundsPerContainer: 7,
      },
      {
        productNumber: "P19169",
        name: "Baby Broccoli",
        poundsPerContainer: 7,
      },
      {
        productNumber: "P19909",
        name: "Red Bell Pepper",
        poundsPerContainer: 7,
      },
      {
        productNumber: "P19910",
        name: "Yellow Bell Pepper",
        poundsPerContainer: 7,
      },
      {
        productNumber: "P19048",
        name: "Yellow Onion",
        poundsPerContainer: 25,
        packageWeightLb: 50,
        containersPerPackage: 2,
        packageLabel: "50 LB bag",
      },
    ],
  },
  {
    id: "stainless-4",
    title: "4\" Deep Stainless Steel Pan",
    shortTitle: "4\" Stainless",
    products: [
      {
        productNumber: "P10019",
        name: "Dark Diced Chicken",
        poundsPerContainer: 24,
        bagsPerContainer: 3,
      },
      {
        productNumber: "P10028",
        name: "Teriyaki Thigh Chicken",
        poundsPerContainer: 24,
        bagsPerContainer: 3,
      },
      {
        productNumber: "P5007",
        name: "Sliced Marinated Beef",
        poundsPerContainer: 24,
        bagsPerContainer: 3,
      },
    ],
  },
  {
    id: "cambro-6",
    title: "Cambro 6\" Deep Food Pan",
    shortTitle: "6\" Cambro",
    products: [
      {
        productNumber: "P19013",
        name: "Broccoli",
        poundsPerContainer: 20,
        packageWeightLb: 20,
        containersPerPackage: 1,
        packageLabel: "case",
      },
      {
        productNumber: "P19048",
        name: "Yellow Onion",
        poundsPerContainer: 25,
        packageWeightLb: 50,
        containersPerPackage: 2,
        packageLabel: "50 LB bag",
      },
      {
        productNumber: "P19016",
        name: "Cabbage",
        poundsPerContainer: 7,
      },
      {
        productNumber: "P19085",
        name: "Celery",
        poundsPerContainer: 7,
      },
    ],
  },
];

export interface ContainerProductPlan extends ContainerProductDefinition {
  averagePer1k: number | null;
  exactByDelivery: Array<number | null>;
  requiredBagsByDelivery: Array<number | null>;
  requiredPackagesByDelivery: Array<number | null>;
  containersByDelivery: Array<number | null>;
}

export interface ContainerGroupPlan extends Omit<ContainerGroupDefinition, "products"> {
  products: ContainerProductPlan[];
  totalsByDelivery: Array<number | null>;
  containersToKeep: number | null;
}

export interface StoreContainerPlan {
  windows: DeliveryOrderWindow[];
  groups: ContainerGroupPlan[];
  totalContainersToKeep: number | null;
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
  store: StoreData,
  definition: ContainerProductDefinition,
  windows: DeliveryOrderWindow[],
): ContainerProductPlan {
  const product = findProduct(store, definition.productNumber);
  const averagePer1k = product?.averagePer1k ?? null;
  const exactByDelivery = windows.map((window) =>
    casesForTarget(
      averagePer1k,
      definition.poundsPerContainer,
      window.salesTarget,
    ),
  );
  const requiredBagsByDelivery = windows.map((window) => {
    if (definition.bagsPerContainer === undefined) return null;
    const exactBags = casesForTarget(
      averagePer1k,
      MEAT_BAG_WEIGHT_LB,
      window.salesTarget,
    );
    return exactBags === null ? null : Math.ceil(Math.max(0, exactBags));
  });
  const requiredPackagesByDelivery = windows.map((window) => {
    if (definition.packageWeightLb === undefined) return null;
    const exactPackages = casesForTarget(
      averagePer1k,
      definition.packageWeightLb,
      window.salesTarget,
    );
    return exactPackages === null
      ? null
      : Math.ceil(Math.max(0, exactPackages));
  });

  return {
    ...definition,
    averagePer1k,
    exactByDelivery,
    requiredBagsByDelivery,
    requiredPackagesByDelivery,
    containersByDelivery: exactByDelivery.map((exact, index) => {
      if (exact === null) return null;
      if (definition.containersPerPackage !== undefined) {
        const requiredPackages = requiredPackagesByDelivery[index];
        return requiredPackages === null
          ? null
          : requiredPackages * definition.containersPerPackage;
      }
      if (definition.bagsPerContainer !== undefined) {
        const requiredBags = requiredBagsByDelivery[index];
        return requiredBags === null
          ? null
          : Math.ceil(requiredBags / definition.bagsPerContainer);
      }
      return Math.ceil(Math.max(0, exact));
    }),
  };
}

function totalForWindow(
  products: ContainerProductPlan[],
  windowIndex: number,
): number | null {
  const values = products.map(
    (product) => product.containersByDelivery[windowIndex] ?? null,
  );
  if (values.some((value) => value === null)) return null;
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export function buildStoreContainerPlan(
  store: StoreData,
  days: PlannerDays,
): StoreContainerPlan {
  const windows = buildDeliveryOrderWindows(days);
  const groups = CONTAINER_GROUPS.map((definition) => {
    const products = definition.products.map((product) =>
      buildProductPlan(store, product, windows),
    );
    const totalsByDelivery = windows.map((_, index) =>
      totalForWindow(products, index),
    );
    const availableTotals = totalsByDelivery.filter(
      (total): total is number => total !== null,
    );

    return {
      id: definition.id,
      title: definition.title,
      shortTitle: definition.shortTitle,
      products,
      totalsByDelivery,
      containersToKeep:
        availableTotals.length === totalsByDelivery.length &&
        availableTotals.length > 0
          ? Math.max(...availableTotals)
          : null,
    };
  });
  const groupNeeds = groups.map((group) => group.containersToKeep);

  return {
    windows,
    groups,
    totalContainersToKeep: groupNeeds.some((need) => need === null)
      ? null
      : groupNeeds.reduce<number>((total, need) => total + (need ?? 0), 0),
  };
}
