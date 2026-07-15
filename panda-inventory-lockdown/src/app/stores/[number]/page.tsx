import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StoreWorkspace } from "@/components/store-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtCases } from "@/lib/format";
import {
  getAllStores,
  getManagers,
  getStore,
  getStorePlannerDays,
  getUnitsPerCase,
  productCount,
  topProductsByCases,
} from "@/lib/stores";
import { productWarningCount } from "@/lib/warnings";

export async function generateStaticParams() {
  const stores = await getAllStores();
  return stores.map((s) => ({ number: s.store.number }));
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const store = await getStore(number);
  if (!store) notFound();

  const unitsPerCase = await getUnitsPerCase();
  const managers = await getManagers();
  const manager = managers[store.store.number];
  const plannerDays = await getStorePlannerDays(store.store.number);

  const categoryCount = store.categories.filter(
    (c) => c.products.length > 0,
  ).length;
  const top = topProductsByCases(store, unitsPerCase, 1)[0];
  const weekCount = store.source.weekLabels.length;
  const warningCount = store.categories.reduce(
    (count, category) =>
      count + productWarningCount(category.products, unitsPerCase),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 text-muted-foreground"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Button>
        <div className="flex items-center gap-3">
          <span className="flex h-11 min-w-16 items-center justify-center rounded-lg bg-brand px-2 text-lg font-bold tabular-nums text-brand-foreground">
            {store.store.number}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              Store
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {manager ? `Manager · ${manager}` : "Manager Not Found"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {weekCount > 0 ? (
            <Badge variant="outline">Rolling {weekCount} Weeks</Badge>
          ) : null}
          {store.source.weekLabels.map((w) => (
            <Badge key={w} variant="secondary" className="font-normal">
              {w}
            </Badge>
          ))}
        </div>
      </div>

      <StoreWorkspace
        store={store}
        unitsPerCase={unitsPerCase}
        initialDays={plannerDays}
        productCount={productCount(store)}
        categoryCount={categoryCount}
        topCasesLabel={top ? fmtCases(top.casesPer1k) : "—"}
        warningCount={warningCount}
      />
    </div>
  );
}
