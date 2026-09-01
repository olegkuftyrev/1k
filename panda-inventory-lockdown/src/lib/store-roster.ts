import type { StoreData } from "@/lib/schema";

export const ACTIVE_STORE_NUMBERS = [
  "1020",
  "1505",
  "1564",
  "1649",
  "1961",
  "2154",
  "2605",
  "3847",
] as const;

const ACTIVE_STORE_SET = new Set<string>(ACTIVE_STORE_NUMBERS);

export function isActiveStore(number: string): boolean {
  return ACTIVE_STORE_SET.has(number);
}

export function hasStoreReport(store: StoreData): boolean {
  return (
    store.source.file.trim().length > 0 &&
    store.categories.some((category) => category.products.length > 0)
  );
}

export function emptyStore(number: string): StoreData {
  return {
    store: { number },
    source: {
      file: "",
      parsedAt: "",
      weekLabels: [],
    },
    delivery: { deliveryDays: [] },
    categories: [],
  };
}

export function applyStoreRoster(stores: StoreData[]): StoreData[] {
  const byNumber = new Map(
    stores.map((store) => [store.store.number, store] as const),
  );
  const active = ACTIVE_STORE_NUMBERS.map(
    (number) => byNumber.get(number) ?? emptyStore(number),
  );
  const inactive = stores
    .filter((store) => !isActiveStore(store.store.number))
    .sort(
      (left, right) =>
        Number(left.store.number) - Number(right.store.number),
    );

  return [...active, ...inactive];
}
