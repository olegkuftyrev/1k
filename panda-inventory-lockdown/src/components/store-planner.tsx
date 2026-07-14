"use client";

import { useMemo, useState, useTransition } from "react";
import { DeliveryPlanner } from "@/components/delivery-planner";
import { ProductsExplorer } from "@/components/products-explorer";
import { updateStoreWeekPlan } from "@/lib/actions";
import {
  coverageWindow,
  firstDeliveryDay,
  orderDaySet,
  sumSales,
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
  const [selectedDay, setSelectedDay] = useState<number | null>(() =>
    firstDeliveryDay(initialDays),
  );
  const [focusedDay, setFocusedDay] = useState<number>(
    () => firstDeliveryDay(initialDays) ?? 1,
  );
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeDays = editing ? draftDays : days;

  const orderDays = useMemo(() => orderDaySet(activeDays), [activeDays]);
  const coverage = useMemo(
    () => coverageWindow(activeDays, selectedDay),
    [activeDays, selectedDay],
  );
  const salesTarget = useMemo(
    () => sumSales(activeDays, coverage),
    [activeDays, coverage],
  );

  const handleFocusDay = (day: number) => {
    setFocusedDay(day);
    if (activeDays[day].delivery) setSelectedDay(day);
  };

  const handleToggleDelivery = (day: number, value: boolean) => {
    setDraftDays((prev) => {
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
    setSelectedDay(firstDeliveryDay(days));
    setFocusedDay(firstDeliveryDay(days) ?? 1);
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
        focusedDay={focusedDay}
        selectedDay={selectedDay}
        coverage={coverage}
        salesTarget={salesTarget}
        orderDays={orderDays}
        editing={editing}
        isPending={isPending}
        error={error}
        onFocusDay={handleFocusDay}
        onStartEditing={handleStartEditing}
        onCancelEditing={handleCancelEditing}
        onSaveEditing={handleSaveEditing}
        onToggleDelivery={handleToggleDelivery}
        onChangeSales={handleChangeSales}
      />

      <ProductsExplorer
        store={store}
        unitsPerCase={unitsPerCase}
        salesTarget={salesTarget}
        days={activeDays}
        selectedDay={selectedDay}
        coverage={coverage}
        warningsOnly={warningsOnly}
      />
    </div>
  );
}
