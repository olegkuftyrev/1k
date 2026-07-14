import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Package, TrendingUp } from "lucide-react";
import { ProductsExplorer } from "@/components/products-explorer";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtUsage } from "@/lib/format";
import {
  getAllStores,
  getStore,
  productCount,
  topProducts,
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

  const categoryCount = store.categories.filter(
    (c) => c.products.length > 0,
  ).length;
  const top = topProducts(store, 1)[0];

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
          <span className="flex size-11 items-center justify-center rounded-lg bg-red-600 text-lg font-bold text-white">
            {store.store.number.slice(-2)}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              Store {store.store.number}
            </h1>
            {store.store.aco ? (
              <p className="truncate text-sm text-muted-foreground">
                {store.store.aco}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {store.store.fiscalWeek ? (
            <Badge variant="outline">{store.store.fiscalWeek}</Badge>
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
          label="Top usage / $1K"
          value={top ? fmtUsage(top.averagePer1k) : "—"}
          icon={<TrendingUp className="size-5" />}
        />
      </section>

      <ProductsExplorer store={store} />
    </div>
  );
}
