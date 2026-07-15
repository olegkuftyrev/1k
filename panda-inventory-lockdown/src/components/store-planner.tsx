"use client";

import { useMemo, useState, useTransition } from "react";
import { DeliveryPlanner } from "@/components/delivery-planner";
import { ProductsExplorer } from "@/components/products-explorer";
import { updateStoreWeekPlan } from "@/lib/actions";
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
  warningsOnly,
}: {
  store: StoreData;
  unitsPerCase: UnitsPerCase;
  initialDays: PlannerDays;
  warningsOnly: boolean;
}) {
  const [days, setDays] = useState<PlannerDays>(initialDays);
  const [draftDays, setDraftDays] = useState<PlannerDays>(initialDays);
  const [selectedDaySet, setSelectedDaySet] = useState<Set<number>>(
    () => new Set(),
  );
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    setSelectedDaySet((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
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
        error={error}
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
