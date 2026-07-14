"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SalesTargetBar } from "@/components/sales-target-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fmtCases, fmtTarget, fmtUsage } from "@/lib/format";
import { BASE_SALES, casesForTarget } from "@/lib/ordering/calculate";
import type {
  Category,
  Product,
  StoreData,
  UnitsPerCase,
} from "@/lib/schema";
import { cn } from "@/lib/utils";

export function ProductsExplorer({
  store,
  unitsPerCase,
}: {
  store: StoreData;
  unitsPerCase: UnitsPerCase;
}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [salesTarget, setSalesTarget] = useState<number>(BASE_SALES);
  const [custom, setCustom] = useState("");

  const handlePreset = (value: number) => {
    setCustom("");
    setSalesTarget(value);
  };

  const handleCustomChange = (raw: string) => {
    setCustom(raw);
    const k = parseFloat(raw);
    setSalesTarget(Number.isFinite(k) && k > 0 ? k * 1000 : BASE_SALES);
  };

  const handleReset = () => {
    setCustom("");
    setSalesTarget(BASE_SALES);
  };

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
        products: c.products.filter(
          (p) =>
            q === "" ||
            p.name.toLowerCase().includes(q) ||
            p.productNumber.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.products.length > 0);
  }, [categories, activeCat, query]);

  const resultCount = filtered.reduce((n, c) => n + c.products.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-30 -mx-4 flex flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <SalesTargetBar
          salesTarget={salesTarget}
          custom={custom}
          onPreset={handlePreset}
          onCustomChange={handleCustomChange}
          onReset={handleReset}
        />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
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
      </p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No products found.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((category) => (
            <CategorySection
              key={category.name}
              category={category}
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
          : "border-border bg-background text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}

function CategorySection({
  category,
  weekLabels,
  unitsPerCase,
  salesTarget,
}: {
  category: Category;
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
  weekLabels,
  unitsPerCase,
  salesTarget,
}: {
  product: Product;
  weekLabels: string[];
  unitsPerCase: number | null;
  salesTarget: number;
}) {
  const cases = casesForTarget(
    product.averagePer1k,
    unitsPerCase,
    salesTarget,
  );
  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              {product.productNumber} · {product.unit}
              {unitsPerCase !== null ? (
                <> · {unitsPerCase} {product.unit}/case</>
              ) : (
                <> · <span className="text-destructive">no case size</span></>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-right">
            <div>
              <p className="text-sm font-medium tabular-nums leading-none text-muted-foreground">
                {fmtUsage(product.averagePer1k)}
              </p>
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

        {product.weeks.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {product.weeks.map((w, i) => (
              <Badge
                key={`${w.label}-${i}`}
                variant="secondary"
                className="gap-1 font-normal tabular-nums"
              >
                <span className="text-muted-foreground">
                  {weekLabels[i] ?? w.label}
                </span>
                {fmtUsage(w.value)}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
