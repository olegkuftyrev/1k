"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_ORDER.map((day) => {
            const cfg = days[day];
            const isDelivery = cfg.delivery;
            const isOrder = orderDays.has(day);
            const isSelected = day === selectedDay;
            const isFocused = day === focusedDay;
            const inCoverage = coverageSet.has(day);
            const role = isDelivery
              ? isOrder
                ? "Both"
                : "Delivery"
              : isOrder
                ? "Order by"
                : inCoverage
                  ? "Covered"
                  : "Forecast";
            return (
              <button
                key={day}
                type="button"
                title={FULL_DAY_LABELS[day]}
                onClick={() => onFocusDay(day)}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-between gap-1 rounded-lg border bg-card px-1 py-2 text-center transition-colors hover:bg-accent/70",
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
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {DAY_LABELS[day]}
                </span>
                <span className="text-sm font-semibold tabular-nums leading-none">
                  {cfg.sales ? fmtTarget(cfg.sales) : "—"}
                </span>
                <span
                  className={cn(
                    "min-h-4 max-w-full truncate rounded px-1.5 text-[9px] font-semibold uppercase leading-4 tracking-wide",
                    inCoverage
                      ? "bg-brand text-brand-foreground"
                      : isOrder
                        ? "border border-navy/30 text-navy"
                        : isDelivery
                          ? "bg-muted text-muted-foreground"
                          : "text-muted-foreground",
                  )}
                >
                  {role}
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

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Forecast</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">$</span>
                  <SalesInput
                    key={focusedDay}
                    dollars={focused.sales}
                    disabled={isPending}
                    label={`Forecasted sales for ${FULL_DAY_LABELS[focusedDay]} in thousands`}
                    onChange={(dollars) => onChangeSales(focusedDay, dollars)}
                  />
                  <span className="text-sm text-muted-foreground">K</span>
                </div>
              </div>
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

function SalesInput({
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
      disabled={disabled}
      className="h-9 w-16 text-center font-semibold"
    />
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
