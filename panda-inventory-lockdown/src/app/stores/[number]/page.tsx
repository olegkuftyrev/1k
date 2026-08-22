import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleOff, TriangleAlert } from "lucide-react";
import { StoreWorkspace } from "@/components/store-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fmtCases } from "@/lib/format";
import { hasStoreReport, isActiveStore } from "@/lib/store-roster";
import {
  getAllStores,
  getManagers,
  getStore,
  getStoreAddresses,
  getStorePlannerDays,
  getStoreSelectedOrderDays,
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

  const managers = await getManagers();
  const addresses = getStoreAddresses();
  const manager = managers[store.store.number];
  const address = addresses[store.store.number] ?? "Address Not Found";
  const active = isActiveStore(store.store.number);
  const reported = hasStoreReport(store);

  const header = (
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
        <span
          className={`flex h-11 min-w-20 items-center justify-center rounded-lg px-2 text-lg font-bold tabular-nums ${
            active
              ? "bg-brand text-brand-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          PX{store.store.number}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{address}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {manager ? `Manager · ${manager}` : "Manager Not Found"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <CircleOff className="size-3" />
            Inactive
          </Badge>
        ) : !reported ? (
          <Badge className="border border-amber-300 bg-amber-100 text-amber-900">
            <TriangleAlert className="size-3" />
            Missing report
          </Badge>
        ) : null}
        {active && reported && store.source.weekLabels.length > 0 ? (
          <Badge variant="outline">
            Rolling {store.source.weekLabels.length} Weeks
          </Badge>
        ) : null}
        {active && reported
          ? store.source.weekLabels.map((w) => (
              <Badge key={w} variant="secondary" className="font-normal">
                {w}
              </Badge>
            ))
          : null}
      </div>
    </div>
  );

  if (!active) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card className="bg-muted/40 text-center ring-foreground/10">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-10">
            <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <CircleOff className="size-5" />
            </span>
            <div className="max-w-md">
              <h2 className="text-base font-semibold text-foreground">
                This store is inactive
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Its historical report is retained, but inventory calculations
                and ordering tools are disabled.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reported) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card className="bg-amber-50/40 ring-amber-300/80">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <TriangleAlert className="size-5" />
            </span>
            <div className="max-w-md">
              <h2 className="text-base font-semibold text-foreground">
                Inventory report is missing
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Inventory Usage per $1,000 data has not been imported for this
                active store. Ordering and printable plans will appear after the
                report is available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unitsPerCase = await getUnitsPerCase();
  const [plannerDays, selectedOrderDays] = await Promise.all([
    getStorePlannerDays(store.store.number),
    getStoreSelectedOrderDays(store.store.number),
  ]);

  const categoryCount = store.categories.filter(
    (c) => c.products.length > 0,
  ).length;
  const top = topProductsByCases(store, unitsPerCase, 1)[0];
  const warningCount = store.categories.reduce(
    (count, category) =>
      count + productWarningCount(category.products, unitsPerCase),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {header}

      <StoreWorkspace
        store={store}
        unitsPerCase={unitsPerCase}
        initialDays={plannerDays}
        initialSelectedDays={selectedOrderDays}
        productCount={productCount(store)}
        categoryCount={categoryCount}
        topCasesLabel={top ? fmtCases(top.casesPer1k) : "—"}
        warningCount={warningCount}
      />
    </div>
  );
}
