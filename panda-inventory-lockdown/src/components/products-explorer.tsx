"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Pencil, Search, ShoppingCart, X } from "lucide-react";
import {
  updateProductAverage,
  updateUnitsPerCase,
  updateWeeklyUsageAndAverage,
} from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fmtCases, fmtTarget, fmtUsage } from "@/lib/format";
import { calculateOrder, casesForTarget } from "@/lib/ordering/calculate";
import {
  DAY_LABELS,
  FULL_DAY_LABELS,
  sumSales,
  type PlannerDays,
} from "@/lib/planner";
import type {
  Category,
  Product,
  StoreData,
  UnitsPerCase,
} from "@/lib/schema";
import { cn } from "@/lib/utils";
import {
  hasHighWeekVariance,
  hasMissingCaseSize,
  hasProductWarning,
} from "@/lib/warnings";

export function ProductsExplorer({
  store,
  unitsPerCase,
  salesTarget,
  days,
  selectedDay,
  coverage,
  preDeliveryDays,
  preDeliverySalesTarget,
  warningsOnly,
}: {
  store: StoreData;
  unitsPerCase: UnitsPerCase;
  salesTarget: number;
  days: PlannerDays;
  selectedDay: number | null;
  coverage: number[];
  preDeliveryDays: number[];
  preDeliverySalesTarget: number;
  warningsOnly: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");

  const categories = useMemo(
    () => store.categories.filter((c) => c.products.length > 0),
    [store.categories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => activeCat === "all" || c.name === activeCat)
      .map((c) => ({
        ...c,
        products: c.products.filter((p) => {
          const matchesQuery =
            q === "" ||
            p.name.toLowerCase().includes(q) ||
            p.productNumber.toLowerCase().includes(q);
          return (
            matchesQuery && (!warningsOnly || hasProductWarning(p, unitsPerCase))
          );
        }),
      }))
      .filter((c) => c.products.length > 0);
  }, [categories, activeCat, query, unitsPerCase, warningsOnly]);

  const resultCount = filtered.reduce((n, c) => n + c.products.length, 0);
  const products = useMemo(
    () => categories.flatMap((category) => category.products),
    [categories],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-30 -mx-4 flex flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <QuickOrder
          products={products}
          unitsPerCase={unitsPerCase}
          days={days}
          selectedDay={selectedDay}
          coverage={coverage}
          preDeliveryDays={preDeliveryDays}
          preDeliverySalesTarget={preDeliverySalesTarget}
        />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="bg-card pl-9"
            inputMode="search"
          />
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip
          label="All"
          active={activeCat === "all"}
          onClick={() => setActiveCat("all")}
        />
        {categories.map((c) => (
          <FilterChip
            key={c.name}
            label={c.name}
            active={activeCat === c.name}
            onClick={() => setActiveCat(c.name)}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {resultCount} product{resultCount === 1 ? "" : "s"}
        {query ? ` matching “${query}”` : ""} · cases for{" "}
        <span className="font-medium text-foreground">
          {fmtTarget(salesTarget)}
        </span>{" "}
        sales
        {warningsOnly ? " · warnings only" : ""}
      </p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {warningsOnly ? "No warnings found." : "No products found."}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((category) => (
            <CategorySection
              key={category.name}
              category={category}
              storeNumber={store.store.number}
              weekLabels={store.source.weekLabels}
              unitsPerCase={unitsPerCase}
              salesTarget={salesTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickOrder({
  products,
  unitsPerCase,
  days,
  selectedDay,
  coverage,
  preDeliveryDays,
  preDeliverySalesTarget,
}: {
  products: Product[];
  unitsPerCase: UnitsPerCase;
  days: PlannerDays;
  selectedDay: number | null;
  coverage: number[];
  preDeliveryDays: number[];
  preDeliverySalesTarget: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedProductNumber, setSelectedProductNumber] = useState<string | null>(
    null,
  );
  const [onHandText, setOnHandText] = useState("");

  const selectedProduct = useMemo(
    () =>
      products.find(
        (product) => product.productNumber === selectedProductNumber,
      ) ?? null,
    [products, selectedProductNumber],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 6);
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.productNumber.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [products, query]);

  const orderDays = coverage;
  const quickSalesTarget = useMemo(
    () => sumSales(days, orderDays),
    [days, orderDays],
  );
  const quickTotalSalesTarget = quickSalesTarget + preDeliverySalesTarget;
  const quickTotalDays = orderDays.length + preDeliveryDays.length;
  const averageDaySales =
    quickTotalDays > 0 ? quickTotalSalesTarget / quickTotalDays : 0;
  const onHandCases = Number(onHandText);
  const validOnHand =
    onHandText.trim() === "" ? 0 : Number.isFinite(onHandCases) ? onHandCases : null;
  const selectedUnits = selectedProduct
    ? unitsPerCase[selectedProduct.productNumber.toUpperCase()] ?? null
    : null;
  const selectedMissingCaseSize = selectedProduct
    ? hasMissingCaseSize(selectedProduct, unitsPerCase)
    : false;
  const selectedHighVariance = selectedProduct
    ? hasHighWeekVariance(selectedProduct)
    : false;
  const averageDayCases = selectedProduct
    ? casesForTarget(
        selectedProduct.averagePer1k,
        selectedUnits,
        averageDaySales,
      )
    : null;
  const order = selectedProduct
    ? calculateOrder({
        averagePer1k: selectedProduct.averagePer1k,
        unitsPerCase: selectedUnits,
        salesTarget: quickTotalSalesTarget,
        onHandCases: validOnHand,
        roundUp: true,
      })
    : null;
  const canCalculate =
    selectedProduct !== null &&
    selectedUnits !== null &&
    selectedProduct.averagePer1k !== null &&
    selectedDay !== null &&
    orderDays.length > 0 &&
    validOnHand !== null;

  const handlePickProduct = (product: Product) => {
    setSelectedProductNumber(product.productNumber);
    setQuery(product.name);
  };

  return (
    <div className="flex flex-col gap-3">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              type="button"
              size="lg"
              className="h-11 w-full justify-center text-base"
            />
          }
        >
          <ShoppingCart className="size-4" />
          Quick order
        </SheetTrigger>

        <SheetContent side="center" className="gap-0 p-0">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-brand" />
              Quick order
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 p-4 pt-0">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Delivery selection
              </p>
              {selectedDay !== null && orderDays.length > 0 ? (
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <p className="font-semibold">
                      {FULL_DAY_LABELS[selectedDay]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Covers</p>
                    <p className="font-semibold">
                      {orderDays.map((day) => DAY_LABELS[day]).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Order need</p>
                    <p className="font-semibold tabular-nums">
                      {fmtTarget(quickTotalSalesTarget)}
                    </p>
                  </div>
                  {preDeliveryDays.length > 0 ? (
                    <div className="col-span-3 rounded-md bg-card px-2 py-1 text-xs text-muted-foreground">
                      On-hand is consumed through{" "}
                      <span className="font-medium text-foreground">
                        {preDeliveryDays.map((day) => DAY_LABELS[day]).join(", ")}
                      </span>{" "}
                      before delivery ({fmtTarget(preDeliverySalesTarget)}).
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a delivery day in the schedule before calculating an
                  order.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedProductNumber(null);
                  }}
                  placeholder="Search product for quick order..."
                  className="bg-card pl-9"
                  inputMode="search"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    On hand at the time of delivery
                  </span>
                  <Input
                    value={onHandText}
                    onChange={(event) =>
                      setOnHandText(event.target.value.replace(/[^0-9.]/g, ""))
                    }
                    placeholder="0"
                    inputMode="decimal"
                    className="w-20 text-center font-semibold tabular-nums"
                    aria-label="Cases on hand at the time of delivery"
                  />
                  <span className="text-sm text-muted-foreground">cs</span>
                </div>
                <div className="ml-auto text-right text-xs text-muted-foreground">
                  <span>Avg day use</span>{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {averageDayCases === null ? "—" : fmtCases(averageDayCases)}
                  </span>
                </div>
              </div>
            </div>

            {query.trim() && selectedProduct === null ? (
              <div className="flex max-h-48 flex-col overflow-auto rounded-lg border bg-card">
                {matches.length > 0 ? (
                  matches.map((product) => (
                    <button
                      key={product.productNumber}
                      type="button"
                      onClick={() => handlePickProduct(product)}
                      className="flex items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {product.productNumber} · {product.unit}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    No products found.
                  </p>
                )}
              </div>
            ) : null}

            <div className="rounded-lg border bg-muted/40 p-3">
              {selectedProduct ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {selectedProduct.name}
                        </p>
                        {hasProductWarning(selectedProduct, unitsPerCase) ? (
                          <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedProduct.productNumber}
                        {selectedUnits
                          ? ` · ${selectedUnits} ${selectedProduct.unit}/case`
                          : " · no case size"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold tabular-nums text-brand">
                        {canCalculate ? fmtCases(order?.orderCases) : "—"}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        order
                      </p>
                    </div>
                  </div>

                  {selectedMissingCaseSize || selectedHighVariance ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      <p className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="size-3.5" />
                        Warning
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {selectedMissingCaseSize ? (
                          <li>No case size is set for this product.</li>
                        ) : null}
                        {selectedHighVariance ? (
                          <li>Week-to-week usage variance is high.</li>
                        ) : null}
                      </ul>
                    </div>
                  ) : null}

                  <p className="text-xs text-muted-foreground">
                    Uses{" "}
                    <span className="font-medium text-foreground">
                      {fmtTarget(quickSalesTarget)}
                    </span>{" "}
                    forecast for{" "}
                    <span className="font-medium text-foreground">
                      {orderDays.map((day) => DAY_LABELS[day]).join(", ") || "—"}
                    </span>
                    {selectedDay !== null ? (
                      <>
                        {" "}
                        toward{" "}
                        <span className="font-medium text-foreground">
                          {FULL_DAY_LABELS[selectedDay]}
                        </span>{" "}
                        delivery
                      </>
                    ) : null}
                    .
                    {preDeliveryDays.length > 0 ? (
                      <>
                        {" "}
                        Also protects{" "}
                        <span className="font-medium text-foreground">
                          {fmtTarget(preDeliverySalesTarget)}
                        </span>{" "}
                        of forecasted sales before that delivery because your
                        on-hand count is from today.
                      </>
                    ) : null}
                  </p>

                  {!canCalculate ? (
                    <p className="text-xs text-destructive">
                      Select a delivery day, enter a valid on-hand count, and make
                      sure this product has an average and case size.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Need {fmtCases(order?.casesNeeded)} before subtracting{" "}
                      {validOnHand ?? 0}cs on hand.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Search a product, enter current cases on hand, and the quick
                  order will use today through the selected delivery coverage.
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}


function FilterChip({
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
        "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}

function CategorySection({
  category,
  storeNumber,
  weekLabels,
  unitsPerCase,
  salesTarget,
}: {
  category: Category;
  storeNumber: string;
  weekLabels: string[];
  unitsPerCase: UnitsPerCase;
  salesTarget: number;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{category.name}</h3>
        <span className="text-xs text-muted-foreground">
          {category.products.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {category.products.map((p) => (
          <ProductRow
            key={p.productNumber}
            product={p}
            storeNumber={storeNumber}
            weekLabels={weekLabels}
            unitsPerCase={unitsPerCase[p.productNumber.toUpperCase()] ?? null}
            salesTarget={salesTarget}
          />
        ))}
      </div>
    </section>
  );
}

function ProductRow({
  product,
  storeNumber,
  weekLabels,
  unitsPerCase,
  salesTarget,
}: {
  product: Product;
  storeNumber: string;
  weekLabels: string[];
  unitsPerCase: number | null;
  salesTarget: number;
}) {
  const router = useRouter();
  const [averageOverride, setAverageOverride] = useState<number | null>();
  const [caseSizeOverride, setCaseSizeOverride] = useState<number | null>();
  const [weekOverrides, setWeekOverrides] = useState<Record<number, number | null>>(
    {},
  );
  const [editingUsage, setEditingUsage] = useState(false);

  const average =
    averageOverride === undefined ? product.averagePer1k : averageOverride;
  const caseSize =
    caseSizeOverride === undefined ? unitsPerCase : caseSizeOverride;
  const weeks = product.weeks.map((week, index) =>
    Object.hasOwn(weekOverrides, index)
      ? { ...week, value: weekOverrides[index] }
      : week,
  );
  const displayProduct = { ...product, weeks };
  const cases = casesForTarget(average, caseSize, salesTarget);
  const productNumber = product.productNumber.toUpperCase();
  const highVariance = hasHighWeekVariance(displayProduct);

  const saveAverage = async (value: number | null) => {
    const result = await updateProductAverage({
      storeNumber,
      productNumber,
      value,
    });
    if (result.ok) setAverageOverride(value);
    return result;
  };

  const saveCaseSize = async (value: number | null) => {
    if (value === null) return { ok: false, error: "Must be a positive number." };
    const result = await updateUnitsPerCase({
      storeNumber,
      productNumber,
      value,
    });
    if (result.ok) setCaseSizeOverride(value);
    return result;
  };

  const saveWeek = async (index: number, label: string, value: number | null) => {
    const nextWeeks = weeks.map((week, weekIndex) =>
      weekIndex === index ? { ...week, value } : week,
    );
    const nextAverage = averageFromWeeks(nextWeeks);
    const result = await updateWeeklyUsageAndAverage({
      storeNumber,
      productNumber,
      label,
      value,
      averagePer1k: nextAverage,
    });
    if (result.ok) {
      setWeekOverrides((prev) => ({ ...prev, [index]: value }));
      setAverageOverride(nextAverage);
      router.refresh();
    }
    return result;
  };

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
              <span>{product.productNumber}</span>
              <span>·</span>
              <span>{product.unit}</span>
              <span>·</span>
              <InlineNumberEditor
                value={caseSize}
                nullable={false}
                min={0}
                displayValue={(value) =>
                  value === null ? (
                    <span className="text-destructive">no case size</span>
                  ) : (
                    <>
                      {formatNumber(value)} {product.unit}/case
                    </>
                  )
                }
                inputLabel={`${product.name} case size`}
                onSave={saveCaseSize}
                enabled={false}
              />
              {highVariance ? (
                <>
                  <span>·</span>
                  <span className="font-medium text-amber-700">
                    high variance
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-right">
            {weeks.length > 0 ? (
              <Button
                type="button"
                variant={editingUsage ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setEditingUsage((current) => !current)}
              >
                {editingUsage ? (
                  <Check className="size-3.5" />
                ) : (
                  <Pencil className="size-3.5" />
                )}
                {editingUsage ? "Done" : "Edit usage"}
              </Button>
            ) : null}
            <div>
              <InlineNumberEditor
                value={average}
                nullable
                align="right"
                displayClassName="text-sm font-medium tabular-nums leading-none text-muted-foreground"
                displayValue={(value) => fmtUsage(value)}
                inputLabel={`${product.name} average per $1K`}
                onSave={saveAverage}
                enabled={false}
              />
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                avg / $1K
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums leading-none text-brand">
                {fmtCases(cases)}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                order
              </p>
            </div>
          </div>
        </div>

        {weeks.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {weeks.map((w, i) => (
              <Badge
                key={`${w.label}-${i}`}
                variant="secondary"
                className="gap-1 font-normal tabular-nums"
              >
                <span className="text-muted-foreground">
                  {weekLabels[i] ?? w.label}
                </span>
                <InlineNumberEditor
                  value={w.value}
                  nullable
                  displayValue={(value) => fmtUsage(value)}
                  inputLabel={`${product.name} ${weekLabels[i] ?? w.label} usage`}
                  onSave={(value) => saveWeek(i, w.label, value)}
                  enabled={editingUsage}
                />
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InlineNumberEditor({
  value,
  nullable,
  min,
  align = "left",
  displayClassName,
  displayValue,
  inputLabel,
  onSave,
  enabled = false,
}: {
  value: number | null;
  nullable: boolean;
  min?: number;
  align?: "left" | "right";
  displayClassName?: string;
  displayValue: (value: number | null) => React.ReactNode;
  inputLabel: string;
  onSave: (value: number | null) => Promise<{ ok: boolean; error?: string }>;
  enabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!enabled) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded px-0.5",
          align === "right" && "justify-end text-right",
          displayClassName,
        )}
      >
        {displayValue(value)}
      </span>
    );
  }

  const startEditing = () => {
    setDraft(value === null ? "" : String(value));
    setError(null);
    setEditing(true);
  };

  const stopEditing = () => {
    setEditing(false);
    setError(null);
    setDraft("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    const nextValue = trimmed === "" && nullable ? null : Number(trimmed);

    if (trimmed === "" && !nullable) {
      setError("Required.");
      return;
    }
    if (nextValue !== null && !Number.isFinite(nextValue)) {
      setError("Enter a number.");
      return;
    }
    if (nextValue !== null && min !== undefined && nextValue <= min) {
      setError("Must be positive.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await onSave(nextValue);
      if (result.ok) {
        setEditing(false);
      } else {
        setError(result.error ?? "Could not save.");
      }
    });
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className={cn(
          "inline-flex items-center gap-1 rounded px-0.5 text-left underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          align === "right" && "justify-end text-right",
          displayClassName,
        )}
        title={`Edit ${inputLabel}`}
      >
        <span>{displayValue(value)}</span>
        <Pencil className="size-3 opacity-60" />
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-1",
        align === "right" && "justify-end",
      )}
    >
      <Input
        aria-label={inputLabel}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        inputMode="decimal"
        className="h-7 w-20 px-2 text-sm tabular-nums"
        disabled={isPending}
        autoFocus
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon-xs"
        title={`Save ${inputLabel}`}
        disabled={isPending}
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title={`Cancel ${inputLabel}`}
        disabled={isPending}
        onClick={stopEditing}
      >
        <X className="size-3.5" />
      </Button>
      {error ? (
        <span className="basis-full text-[10px] leading-none text-destructive">
          {error}
        </span>
      ) : null}
    </form>
  );
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toString();
}

function averageFromWeeks(weeks: Product["weeks"]) {
  const values = weeks
    .map((week) => week.value)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  if (values.length === 0) return null;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(average * 100) / 100;
}
