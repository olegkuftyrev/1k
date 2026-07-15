"use client";

import { useMemo, useState, useTransition } from "react";
import { DeliveryPlanner } from "@/components/delivery-planner";
import { ProductsExplorer } from "@/components/products-explorer";
import {
  updateStoreSelectedOrderDays,
  updateStoreWeekPlan,
} from "@/lib/actions";
import {
  sumSales,
  WEEK_ORDER,
  type PlannerDays,
} from "@/lib/planner";
import type { StoreData, UnitsPerCase } from "@/lib/schema";

export function StorePlanner({
  store,
  unitsPerCase,
  initialDays,
  initialSelectedDays,
  warningsOnly,
}: {
  store: StoreData;
  unitsPerCase: UnitsPerCase;
  initialDays: PlannerDays;
  initialSelectedDays: number[];
  warningsOnly: boolean;
}) {
  const [days, setDays] = useState<PlannerDays>(initialDays);
  const [draftDays, setDraftDays] = useState<PlannerDays>(initialDays);
  const [selectedDaySet, setSelectedDaySet] = useState<Set<number>>(
    () => new Set(initialSelectedDays),
  );
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSelectionPending, startSelectionTransition] = useTransition();

  const activeDays = editing ? draftDays : days;
  const selectedDays = useMemo(
    () => WEEK_ORDER.filter((day) => selectedDaySet.has(day)),
    [selectedDaySet],
  );
  const salesTarget = useMemo(
    () => sumSales(activeDays, selectedDays),
    [activeDays, selectedDays],
  );

  const handleToggleSelectedDay = (day: number) => {
    if (isSelectionPending) return;

    const previous = new Set(selectedDaySet);
    const next = new Set(previous);
    if (next.has(day)) next.delete(day);
    else next.add(day);

    setSelectedDaySet(next);
    setSelectionError(null);
    startSelectionTransition(async () => {
      try {
        const result = await updateStoreSelectedOrderDays({
          storeNumber: store.store.number,
          selectedDays: WEEK_ORDER.filter((value) => next.has(value)),
        });
        if (result.ok) return;

        setSelectedDaySet(previous);
        setSelectionError(result.error ?? "Could not save selected days.");
      } catch {
        setSelectedDaySet(previous);
        setSelectionError("Could not save selected days.");
      }
    });
  };

  const handleToggleDelivery = (day: number, value: boolean) => {
    setDraftDays((prev) => {
      return prev.map((d, i) =>
        i === day ? { ...d, delivery: value } : d,
      );
    });
  };

  const handleChangeSales = (day: number, dollars: number) => {
    setDraftDays((prev) =>
      prev.map((d, i) => (i === day ? { ...d, sales: dollars } : d)),
    );
  };

  const handleStartEditing = () => {
    setDraftDays(days);
    setError(null);
    setEditing(true);
  };

  const handleCancelEditing = () => {
    setDraftDays(days);
    setError(null);
    setEditing(false);
  };

  const handleSaveEditing = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateStoreWeekPlan({
        storeNumber: store.store.number,
        days: draftDays,
      });
      if (result.ok) {
        setDays(draftDays);
        setEditing(false);
      } else {
        setError(result.error ?? "Could not save week plan.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <DeliveryPlanner
        days={activeDays}
        selectedDays={selectedDays}
        salesTarget={salesTarget}
        editing={editing}
        isPending={isPending}
        isSelectionPending={isSelectionPending}
        error={error}
        selectionError={selectionError}
        onStartEditing={handleStartEditing}
        onCancelEditing={handleCancelEditing}
        onSaveEditing={handleSaveEditing}
        onToggleSelectedDay={handleToggleSelectedDay}
        onToggleDelivery={handleToggleDelivery}
        onChangeSales={handleChangeSales}
      />

      <ProductsExplorer
        store={store}
        unitsPerCase={unitsPerCase}
        salesTarget={salesTarget}
        days={activeDays}
        selectedDays={selectedDays}
        warningsOnly={warningsOnly}
      />
    </div>
  );
}
