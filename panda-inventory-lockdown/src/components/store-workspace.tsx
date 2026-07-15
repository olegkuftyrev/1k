"use client";

import { useState } from "react";
import { AlertTriangle, Layers, Package, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { StorePlanner } from "@/components/store-planner";
import { Card, CardContent } from "@/components/ui/card";
import type { PlannerDays } from "@/lib/planner";
import type { StoreData, UnitsPerCase } from "@/lib/schema";
import { cn } from "@/lib/utils";

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
          icon={<Package className="size-5" />}
        />
        <StatCard
          label="Categories"
          value={categoryCount}
          icon={<Layers className="size-5" />}
        />
        <StatCard
          label="Top cases / $1K"
          value={topCasesLabel}
          icon={<TrendingUp className="size-5" />}
        />
        <Card className="py-0">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">
                Warnings
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {warningCount}
              </p>
              <button
                type="button"
                aria-pressed={warningsOnly}
                onClick={() => setWarningsOnly((value) => !value)}
                className={cn(
                  "mt-1 rounded border px-2 py-0.5 text-xs font-medium transition-colors",
                  warningsOnly
                    ? "border-amber-600 bg-amber-50 text-amber-900"
                    : "border-border bg-card text-muted-foreground hover:bg-accent",
                )}
              >
                Display warnings only
              </button>
            </div>
          </CardContent>
        </Card>
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
