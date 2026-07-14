"use client";

import { useState } from "react";
import { PackageCheck, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fmtTarget } from "@/lib/format";
import {
  DAY_LABELS,
  FULL_DAY_LABELS,
  WEEK_ORDER,
  type PlannerDays,
} from "@/lib/planner";
import { cn } from "@/lib/utils";

export function DeliveryPlanner({
  days,
  focusedDay,
  selectedDay,
  coverage,
  salesTarget,
  orderDays,
  onFocusDay,
  onToggleDelivery,
  onChangeSales,
}: {
  days: PlannerDays;
  focusedDay: number;
  selectedDay: number | null;
  coverage: number[];
  salesTarget: number;
  orderDays: Set<number>;
  onFocusDay: (day: number) => void;
  onToggleDelivery: (day: number, value: boolean) => void;
  onChangeSales: (day: number, dollars: number) => void;
}) {
  const coverageSet = new Set(coverage);
  const focused = days[focusedDay];

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-sm font-semibold">Delivery schedule</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-brand" />
              Delivery
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full border border-brand" />
              Order by
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_ORDER.map((day) => {
            const cfg = days[day];
            const isDelivery = cfg.delivery;
            const isOrder = orderDays.has(day);
            const isSelected = day === selectedDay;
            const isFocused = day === focusedDay;
            const inCoverage = coverageSet.has(day) && !isDelivery;
            return (
              <button
                key={day}
                type="button"
                title={FULL_DAY_LABELS[day]}
                onClick={() => onFocusDay(day)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition-colors",
                  isDelivery
                    ? "border-brand bg-brand text-brand-foreground"
                    : inCoverage
                      ? "border-brand/40 bg-brand/10 text-foreground"
                      : isOrder
                        ? "border-brand/60 bg-brand/5 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-accent",
                  isSelected && "ring-2 ring-navy ring-offset-1 ring-offset-card",
                  isFocused && !isSelected && "ring-2 ring-navy/40",
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {DAY_LABELS[day]}
                </span>
                {isDelivery ? (
                  <Truck className="size-4" aria-label="Delivery" />
                ) : isOrder ? (
                  <PackageCheck
                    className="size-4 text-brand"
                    aria-label="Order by"
                  />
                ) : (
                  <span className="size-4" aria-hidden />
                )}
                <span className="text-[10px] tabular-nums opacity-80">
                  {cfg.sales ? fmtTarget(cfg.sales) : "—"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-sm font-semibold">{FULL_DAY_LABELS[focusedDay]}</p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Delivery day?</span>
              <div className="flex gap-1.5">
                <ToggleButton
                  label="Yes"
                  active={focused.delivery}
                  onClick={() => onToggleDelivery(focusedDay, true)}
                />
                <ToggleButton
                  label="No"
                  active={!focused.delivery}
                  onClick={() => onToggleDelivery(focusedDay, false)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Sales</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">$</span>
                <SalesInput
                  key={focusedDay}
                  dollars={focused.sales}
                  label={`Projected sales for ${FULL_DAY_LABELS[focusedDay]} in thousands`}
                  onChange={(dollars) => onChangeSales(focusedDay, dollars)}
                />
                <span className="text-sm text-muted-foreground">K</span>
              </div>
            </div>
          </div>
        </div>

        {selectedDay !== null && coverage.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Ordering for{" "}
            <span className="font-medium text-foreground">
              {FULL_DAY_LABELS[selectedDay]}
            </span>{" "}
            delivery · covers{" "}
            <span className="font-medium text-foreground">
              {coverage.map((d) => DAY_LABELS[d]).join(", ")}
            </span>{" "}
            ·{" "}
            <span className="font-medium text-foreground">
              {fmtTarget(salesTarget)}
            </span>{" "}
            projected
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tap a delivery day to see the cases to order below.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SalesInput({
  dollars,
  label,
  onChange,
}: {
  dollars: number;
  label: string;
  onChange: (dollars: number) => void;
}) {
  const [text, setText] = useState(() => (dollars ? String(dollars / 1000) : ""));

  return (
    <Input
      value={text}
      onChange={(e) => {
        const clean = e.target.value.replace(/[^0-9.]/g, "");
        setText(clean);
        const k = parseFloat(clean);
        onChange(Number.isFinite(k) && k > 0 ? k * 1000 : 0);
      }}
      placeholder="0"
      inputMode="decimal"
      aria-label={label}
      className="h-9 w-16 text-center font-semibold"
    />
  );
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-lg border px-3 text-sm font-semibold transition-colors",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
