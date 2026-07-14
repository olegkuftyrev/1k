"use client";

import { Input } from "@/components/ui/input";
import { BASE_SALES } from "@/lib/ordering/calculate";
import { cn } from "@/lib/utils";

export const SALES_TARGET_PRESETS = [11000, 22000, 35000, 85000] as const;

export function SalesTargetBar({
  salesTarget,
  custom,
  onPreset,
  onCustomChange,
  onReset,
}: {
  salesTarget: number;
  custom: string;
  onPreset: (value: number) => void;
  onCustomChange: (raw: string) => void;
  onReset: () => void;
}) {
  const isCustom = custom !== "";
  const activePreset = isCustom ? null : salesTarget;
  const isRaw = salesTarget === BASE_SALES && !isCustom;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-1 gap-1.5">
        {SALES_TARGET_PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPreset(value)}
            className={cn(
              "h-10 flex-1 rounded-lg border text-sm font-semibold transition-colors",
              activePreset === value
                ? "border-red-600 bg-red-600 text-white"
                : "border-border bg-background text-muted-foreground hover:bg-accent",
            )}
          >
            ${value / 1000}K
          </button>
        ))}
      </div>

      <Input
        value={custom}
        onChange={(e) => onCustomChange(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder="K"
        inputMode="decimal"
        aria-label="Custom sales target in thousands"
        className={cn(
          "h-10 w-14 text-center font-semibold",
          isCustom && "border-red-500 text-red-600",
        )}
      />

      <button
        type="button"
        onClick={onReset}
        disabled={isRaw}
        className="h-10 shrink-0 rounded-lg border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
      >
        Reset
      </button>
    </div>
  );
}
