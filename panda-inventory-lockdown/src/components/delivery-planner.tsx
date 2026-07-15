"use client";

import { useState } from "react";
import { Check, Pencil, Truck, X } from "lucide-react";
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
  selectedDays,
  salesTarget,
  editing,
  isPending,
  error,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onToggleSelectedDay,
  onToggleDelivery,
  onChangeSales,
}: {
  days: PlannerDays;
  selectedDays: number[];
  salesTarget: number;
  editing: boolean;
  isPending: boolean;
  error: string | null;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onToggleSelectedDay: (day: number) => void;
  onToggleDelivery: (day: number, value: boolean) => void;
  onChangeSales: (day: number, dollars: number) => void;
}) {
  const selectedDaySet = new Set(selectedDays);

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div>
            <p className="text-sm font-semibold">Delivery schedule</p>
            <p className="text-xs text-muted-foreground">
              {selectedDays.length > 0 ? (
                <>
                  {selectedDays.length} day
                  {selectedDays.length === 1 ? "" : "s"} selected ·{" "}
                  {fmtTarget(salesTarget)} forecasted
                </>
              ) : (
                "No days selected"
              )}
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
            const isSelected = selectedDaySet.has(day);
            const dayIdentity = (
              <>
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold uppercase",
                    isSelected
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-muted text-foreground",
                  )}
                >
                  {DAY_LABELS[day].slice(0, 1)}
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {FULL_DAY_LABELS[day]}
                    </span>
                    {editing ? (
                      <DeliveryToggle
                        active={isDelivery}
                        disabled={isPending}
                        label={`${isDelivery ? "Remove" : "Add"} ${FULL_DAY_LABELS[day]} delivery truck`}
                        onClick={() => onToggleDelivery(day, !isDelivery)}
                      />
                    ) : isDelivery ? (
                      <DeliveryBadge />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "block text-xs",
                      cfg.sales > 20000
                        ? "font-semibold text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {cfg.sales ? fmtTarget(cfg.sales) : "$0"} forecasted
                  </span>
                </span>
              </>
            );
            return (
              <div
                key={day}
                title={FULL_DAY_LABELS[day]}
                className={cn(
                  "flex min-h-16 items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-left transition-colors",
                  isSelected
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border text-foreground",
                )}
              >
                {editing ? (
                  <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    {dayIdentity}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleSelectedDay(day)}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Remove" : "Add"} ${FULL_DAY_LABELS[day]} from order coverage`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {dayIdentity}
                  </button>
                )}

                <span className="flex shrink-0 items-center gap-2">
                  {editing ? (
                    <ForecastInput
                      dollars={cfg.sales}
                      disabled={isPending}
                      label={`Forecasted sales for ${FULL_DAY_LABELS[day]} in thousands`}
                      onChange={(dollars) => onChangeSales(day, dollars)}
                    />
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>

        {editing ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">
              Delivery? only controls the truck marker. Forecasts are entered in
              thousands.
            </p>
            {error ? (
              <p className="mt-2 text-xs text-destructive">{error}</p>
            ) : null}
          </div>
        ) : null}

        {selectedDays.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Ordering for{" "}
            <span className="font-medium text-foreground">
              {selectedDays.map((d) => DAY_LABELS[d]).join(", ")}
            </span>{" "}
            ·{" "}
            <span className="font-medium text-foreground">
              {fmtTarget(salesTarget)}
            </span>{" "}
            forecasted
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select the days this order needs to cover.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryBadge() {
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded border border-brand/40 bg-brand/10 text-brand"
      title="Delivery"
    >
      <Truck className="size-3.5" aria-label="Delivery" />
    </span>
  );
}

function DeliveryToggle({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2 text-[11px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span>Delivery?</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] uppercase",
          active
            ? "bg-brand-foreground/20 text-brand-foreground"
            : "bg-background text-muted-foreground",
        )}
      >
        {active ? "Yes" : "No"}
      </span>
    </button>
  );
}

function formatForecastValue(dollars: number) {
  return `${dollars / 1000}`;
}

function ForecastInput({
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
  const [text, setText] = useState(() => formatForecastValue(dollars));

  const numericValue = Number(text);
  const isHigh = Number.isFinite(numericValue) && numericValue > 20;

  const handleChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 1
        ? `${parts[0]}.${parts.slice(1).join("")}`
        : parts[0];

    if (normalized.replace(/\D/g, "").length > 3) return;

    setText(normalized);
    const thousands = Number(normalized);
    if (normalized !== "" && normalized !== "." && Number.isFinite(thousands)) {
      onChange(Math.max(0, thousands * 1000));
    }
  };

  const handleBlur = () => {
    if (text === "" || text === ".") {
      setText("0");
      onChange(0);
    }
  };

  return (
    <div
      className={cn(
        "inline-flex h-9 items-center rounded-lg border bg-card px-2 transition-colors",
        isHigh ? "border-destructive text-destructive" : "border-input",
      )}
    >
      <span className="text-sm font-semibold">$</span>
      <input
        type="text"
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        inputMode="decimal"
        maxLength={4}
        aria-label={label}
        aria-invalid={isHigh || undefined}
        className="h-8 w-14 bg-transparent px-1 text-center text-sm font-semibold tabular-nums outline-none disabled:opacity-50"
      />
      <span className="text-xs font-semibold">K</span>
    </div>
  );
}
