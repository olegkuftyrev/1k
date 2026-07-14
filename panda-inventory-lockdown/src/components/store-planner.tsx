"use client";

import { useMemo, useState, useTransition } from "react";
import { DeliveryPlanner } from "@/components/delivery-planner";
import { ProductsExplorer } from "@/components/products-explorer";
import { updateStoreWeekPlan } from "@/lib/actions";
import {
  coverageWindow,
  orderDaySet,
  preDeliveryWindow,
  sumSales,
  upcomingDeliveryDay,
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
  const [todayDay] = useState(() => new Date().getDay());
  const [days, setDays] = useState<PlannerDays>(initialDays);
  const [draftDays, setDraftDays] = useState<PlannerDays>(initialDays);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeDays = editing ? draftDays : days;

  const orderDays = useMemo(() => orderDaySet(activeDays), [activeDays]);
  const selectedDay = useMemo(
    () => upcomingDeliveryDay(activeDays, todayDay),
    [activeDays, todayDay],
  );
  const coverage = useMemo(
    () => coverageWindow(activeDays, selectedDay),
    [activeDays, selectedDay],
  );
  const preDeliveryDays = useMemo(
    () => preDeliveryWindow(selectedDay, todayDay),
    [selectedDay, todayDay],
  );
  const salesTarget = useMemo(
    () => sumSales(activeDays, coverage),
    [activeDays, coverage],
  );
  const preDeliverySalesTarget = useMemo(
    () => sumSales(activeDays, preDeliveryDays),
    [activeDays, preDeliveryDays],
  );

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
        selectedDay={selectedDay}
        coverage={coverage}
        salesTarget={salesTarget}
        preDeliveryDays={preDeliveryDays}
        preDeliverySalesTarget={preDeliverySalesTarget}
        orderDays={orderDays}
        editing={editing}
        isPending={isPending}
        error={error}
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
        preDeliveryDays={preDeliveryDays}
        preDeliverySalesTarget={preDeliverySalesTarget}
        warningsOnly={warningsOnly}
      />
    </div>
  );
}
