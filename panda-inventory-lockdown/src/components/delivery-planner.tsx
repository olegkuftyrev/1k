"use client";

import { Check, Laptop, Minus, Pencil, Plus, Truck, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  preDeliveryDays,
  preDeliverySalesTarget,
  orderDays,
  editing,
  isPending,
  error,
  onFocusDay,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onToggleDelivery,
  onChangeSales,
}: {
  days: PlannerDays;
  focusedDay: number;
  selectedDay: number | null;
  coverage: number[];
  salesTarget: number;
  preDeliveryDays: number[];
  preDeliverySalesTarget: number;
  orderDays: Set<number>;
  editing: boolean;
  isPending: boolean;
  error: string | null;
  onFocusDay: (day: number) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onToggleDelivery: (day: number, value: boolean) => void;
  onChangeSales: (day: number, dollars: number) => void;
}) {
  const coverageSet = new Set(coverage);
  const preDeliverySet = new Set(preDeliveryDays);
  const focused = days[focusedDay];

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div>
            <p className="text-sm font-semibold">Delivery schedule</p>
            <p className="text-xs text-muted-foreground">
              2-day order lead · {fmtTarget(salesTarget)} forecasted
            </p>
          </div>
          {editing ? (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={onSaveEditing}
                disabled={isPending}
              >
                <Check className="size-3.5" />
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelEditing}
                disabled={isPending}
              >
                <X className="size-3.5" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStartEditing}
            >
              <Pencil className="size-3.5" />
              Edit week
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {WEEK_ORDER.map((day) => {
            const cfg = days[day];
            const isDelivery = cfg.delivery;
            const isOrder = orderDays.has(day);
            const isSelected = day === selectedDay;
            const isFocused = day === focusedDay;
            const inCoverage = coverageSet.has(day);
            const beforeDelivery = preDeliverySet.has(day);
            const showRole = isDelivery || isOrder || inCoverage;
            return (
              <button
                key={day}
                type="button"
                title={FULL_DAY_LABELS[day]}
                onClick={() => {
                  onFocusDay(day);
                  if (editing) onToggleDelivery(day, !isDelivery);
                }}
                className={cn(
                  "flex min-h-16 items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-left transition-colors",
                  editing ? "hover:bg-accent/70" : "cursor-default",
                  inCoverage
                    ? "border-brand bg-brand/10 text-foreground"
                    : isDelivery
                      ? "border-border text-foreground"
                      : isOrder
                        ? "border-navy/40 text-foreground"
                        : "border-border text-muted-foreground",
                  isSelected && "ring-2 ring-brand/40 ring-offset-1 ring-offset-card",
                  isFocused && !isSelected && "ring-2 ring-navy/25",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold uppercase",
                      inCoverage
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border bg-muted text-foreground",
                    )}
                  >
                    {DAY_LABELS[day].slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {FULL_DAY_LABELS[day]}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {cfg.sales ? fmtTarget(cfg.sales) : "—"} forecasted
                      {beforeDelivery ? " · before delivery" : ""}
                    </span>
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  {editing ? (
                    <span onClick={(event) => event.stopPropagation()}>
                      <ForecastStepper
                        dollars={cfg.sales}
                        disabled={isPending}
                        label={`Forecasted sales for ${FULL_DAY_LABELS[day]} in thousands`}
                        onChange={(dollars) => onChangeSales(day, dollars)}
                      />
                    </span>
                  ) : null}
                  {showRole ? (
                    <span
                      className={cn(
                        "flex min-h-7 min-w-7 items-center justify-center rounded border px-2 text-xs font-semibold uppercase",
                        inCoverage
                          ? "border-brand bg-brand text-brand-foreground"
                          : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      <DayRole
                        isDelivery={isDelivery}
                        isOrder={isOrder}
                        inCoverage={inCoverage}
                      />
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {editing ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-sm font-semibold">{FULL_DAY_LABELS[focusedDay]}</p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Delivery day?
                </span>
                <div className="flex gap-1.5">
                  <ToggleButton
                    label="Yes"
                    active={focused.delivery}
                    disabled={isPending}
                    onClick={() => onToggleDelivery(focusedDay, true)}
                  />
                  <ToggleButton
                    label="No"
                    active={!focused.delivery}
                    disabled={isPending}
                    onClick={() => onToggleDelivery(focusedDay, false)}
                  />
                </div>
              </div>

              <p className="max-w-sm text-xs text-muted-foreground">
                Tap any day row to turn delivery on or off. Use plus and minus
                on that row to adjust the forecast.
              </p>
            </div>
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : null}
          </div>
        ) : null}

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
            {preDeliveryDays.length > 0 ? (
              <>
                · count on-hand through{" "}
                <span className="font-medium text-foreground">
                  {preDeliveryDays.map((d) => DAY_LABELS[d]).join(", ")}
                </span>{" "}
                ({fmtTarget(preDeliverySalesTarget)})
              </>
            ) : null}
            {" "}
            ·{" "}
            <span className="font-medium text-foreground">
              {fmtTarget(salesTarget)}
            </span>{" "}
            forecasted
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

function DayRole({
  isDelivery,
  isOrder,
  inCoverage,
}: {
  isDelivery: boolean;
  isOrder: boolean;
  inCoverage: boolean;
}) {
  if (isDelivery || isOrder) {
    return (
      <span className="inline-flex items-center gap-1">
        {isDelivery ? (
          <Truck className="size-3" aria-label="Delivery" />
        ) : null}
        {isDelivery && isOrder ? <span aria-hidden>+</span> : null}
        {isOrder ? <Laptop className="size-3" aria-label="Order" /> : null}
      </span>
    );
  }

  return inCoverage ? "Covered" : null;
}

const FORECAST_STEP_DOLLARS = 500;

function ForecastStepper({
  dollars,
  disabled,
  label,
  onChange,
}: {
  dollars: number;
  disabled: boolean;
  label: string;
  onChange: (dollars: number) => void;
}) {
  const decrease = () => {
    onChange(Math.max(0, dollars - FORECAST_STEP_DOLLARS));
  };

  const increase = () => {
    onChange(dollars + FORECAST_STEP_DOLLARS);
  };

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex h-9 items-center overflow-hidden rounded-lg border border-input bg-card"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="h-9 rounded-none border-r"
        onClick={decrease}
        disabled={disabled || dollars <= 0}
        aria-label={`${label}: decrease by $0.5K`}
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="flex h-9 min-w-20 items-center justify-center px-3 text-sm font-semibold tabular-nums">
        {fmtTarget(dollars)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="h-9 rounded-none border-l"
        onClick={increase}
        disabled={disabled}
        aria-label={`${label}: increase by $0.5K`}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

function ToggleButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
