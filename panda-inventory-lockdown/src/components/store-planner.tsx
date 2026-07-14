"use client";

import { useEffect, useMemo, useState } from "react";
import { DeliveryPlanner } from "@/components/delivery-planner";
import { ProductsExplorer } from "@/components/products-explorer";
import {
  coverageWindow,
  defaultDays,
  firstDeliveryDay,
  orderDaySet,
  sumSales,
  type PlannerDays,
} from "@/lib/planner";
import type { StoreData, UnitsPerCase } from "@/lib/schema";

const STORAGE_VERSION = "v1";

interface PersistedState {
  days: PlannerDays;
  selectedDay: number | null;
}

/** Read a saved plan from localStorage, or null when absent/invalid. */
function loadPlan(key: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (Array.isArray(parsed.days) && parsed.days.length === 7) return parsed;
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

export function StorePlanner({
  store,
  unitsPerCase,
  deliveryDays,
}: {
  store: StoreData;
  unitsPerCase: UnitsPerCase;
  deliveryDays: number[];
}) {
  const storageKey = `pil:planner:${STORAGE_VERSION}:${store.store.number}`;

  const [days, setDays] = useState<PlannerDays>(() =>
    defaultDays(deliveryDays),
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(() =>
    firstDeliveryDay(defaultDays(deliveryDays)),
  );
  const [focusedDay, setFocusedDay] = useState<number>(
    () => firstDeliveryDay(defaultDays(deliveryDays)) ?? 1,
  );

  // Restore any saved plan for this store after mount (avoids SSR mismatch;
  // state must be seeded from localStorage here rather than in an initializer).
  useEffect(() => {
    const restored = loadPlan(storageKey);
    if (!restored) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setDays(restored.days);
    setSelectedDay(restored.selectedDay);
    setFocusedDay(restored.selectedDay ?? firstDeliveryDay(restored.days) ?? 1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey]);

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ days, selectedDay } satisfies PersistedState),
      );
    } catch {
      /* storage may be unavailable */
    }
  }, [storageKey, days, selectedDay]);

  const orderDays = useMemo(() => orderDaySet(days), [days]);
  const coverage = useMemo(
    () => coverageWindow(days, selectedDay),
    [days, selectedDay],
  );
  const salesTarget = useMemo(
    () => sumSales(days, coverage),
    [days, coverage],
  );

  const handleFocusDay = (day: number) => {
    setFocusedDay(day);
    if (days[day].delivery) setSelectedDay(day);
  };

  const handleToggleDelivery = (day: number, value: boolean) => {
    setDays((prev) => {
      const next = prev.map((d, i) =>
        i === day ? { ...d, delivery: value } : d,
      );
      if (value) {
        setSelectedDay(day);
      } else if (selectedDay === day) {
        setSelectedDay(firstDeliveryDay(next));
      }
      return next;
    });
    setFocusedDay(day);
  };

  const handleChangeSales = (day: number, dollars: number) => {
    setDays((prev) =>
      prev.map((d, i) => (i === day ? { ...d, sales: dollars } : d)),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <DeliveryPlanner
        days={days}
        focusedDay={focusedDay}
        selectedDay={selectedDay}
        coverage={coverage}
        salesTarget={salesTarget}
        orderDays={orderDays}
        onFocusDay={handleFocusDay}
        onToggleDelivery={handleToggleDelivery}
        onChangeSales={handleChangeSales}
      />

      <ProductsExplorer
        store={store}
        unitsPerCase={unitsPerCase}
        salesTarget={salesTarget}
      />
    </div>
  );
}
