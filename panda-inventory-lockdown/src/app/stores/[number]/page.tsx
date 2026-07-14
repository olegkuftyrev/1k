import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Package, TrendingUp } from "lucide-react";
import { DeliverySchedule } from "@/components/delivery-schedule";
import { ProductsExplorer } from "@/components/products-explorer";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtCases } from "@/lib/format";
import {
  deliveryDaysFor,
  getAllStores,
  getDeliveryMap,
  getManagers,
  getStore,
  getUnitsPerCase,
  productCount,
  topProductsByCases,
} from "@/lib/stores";

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
  const deliveryMap = await getDeliveryMap();
  const deliveryDays = deliveryDaysFor(deliveryMap, store.store.number);

  const categoryCount = store.categories.filter(
    (c) => c.products.length > 0,
  ).length;
  const top = topProductsByCases(store, unitsPerCase, 1)[0];
  const weekCount = store.source.weekLabels.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 text-muted-foreground"
          render={<Link href="/" />}
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Button>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-brand text-lg font-bold text-brand-foreground">
            {store.store.number.slice(-2)}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              Store {store.store.number}
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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Products"
          value={productCount(store)}
          icon={<Package className="size-5" />}
        />
        <StatCard
          label="Categories"
          value={categoryCount}
          icon={<Layers className="size-5" />}
        />
        <StatCard
          label="Top cases / $1K"
          value={top ? fmtCases(top.casesPer1k) : "—"}
          icon={<TrendingUp className="size-5" />}
        />
      </section>

      <DeliverySchedule deliveryDays={deliveryDays} />

      <ProductsExplorer store={store} unitsPerCase={unitsPerCase} />
    </div>
  );
}
