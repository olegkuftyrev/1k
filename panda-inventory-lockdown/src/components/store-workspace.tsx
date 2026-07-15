"use client";

import { useState } from "react";
import { AlertTriangle, Layers, Package, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { StorePlanner } from "@/components/store-planner";
import { Switch } from "@/components/ui/switch";
import type { PlannerDays } from "@/lib/planner";
import type { StoreData, UnitsPerCase } from "@/lib/schema";

export function StoreWorkspace({
  store,
  unitsPerCase,
  initialDays,
  initialSelectedDays,
  productCount,
  categoryCount,
  topCasesLabel,
  warningCount,
}: {
  store: StoreData;
  unitsPerCase: UnitsPerCase;
  initialDays: PlannerDays;
  initialSelectedDays: number[];
  productCount: number;
  categoryCount: number;
  topCasesLabel: string;
  warningCount: number;
}) {
  const [warningsOnly, setWarningsOnly] = useState(false);

  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Products"
          value={productCount}
          icon={<Package />}
        />
        <StatCard
          label="Categories"
          value={categoryCount}
          icon={<Layers />}
        />
        <StatCard
          label="Top cases / $1K"
          value={topCasesLabel}
          icon={<TrendingUp />}
        />
        <StatCard
          label="Warnings"
          value={warningCount}
          icon={<AlertTriangle />}
          tone="warning"
          action={
            <Switch
              checked={warningsOnly}
              onCheckedChange={setWarningsOnly}
              aria-label="Display warnings only"
            />
          }
        />
      </section>

      <StorePlanner
        store={store}
        unitsPerCase={unitsPerCase}
        initialDays={initialDays}
        initialSelectedDays={initialSelectedDays}
        warningsOnly={warningsOnly}
      />
    </>
  );
}
