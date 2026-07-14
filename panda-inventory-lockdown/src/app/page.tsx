import Link from "next/link";
import { ChevronRight, Layers, Package, Store, Truck } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fmtInt, fmtUsage } from "@/lib/format";
import { getAllStores, productCount, summarize } from "@/lib/stores";

export default async function DashboardPage() {
  const stores = await getAllStores();

  const totalProducts = stores.reduce((n, s) => n + productCount(s), 0);
  const totalCategories = stores.reduce(
    (n, s) => n + s.categories.filter((c) => c.products.length > 0).length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Inventory lockdown overview across all stores.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Stores"
          value={fmtInt(stores.length)}
          icon={<Store className="size-5" />}
        />
        <StatCard
          label="Products"
          value={fmtInt(totalProducts)}
          icon={<Package className="size-5" />}
        />
        <StatCard
          label="Categories"
          value={fmtInt(totalCategories)}
          icon={<Layers className="size-5" />}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Stores</h2>

        {stores.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No stores yet. Import a store report with{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                npm run ingest -- &lt;pdf&gt;
              </code>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {stores.map((store) => {
              const s = summarize(store);
              return (
                <Link
                  key={s.number}
                  href={`/stores/${s.number}`}
                  className="group"
                >
                  <Card className="h-full transition-colors group-hover:border-brand/50">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-foreground">
                              {s.number.slice(-2)}
                            </span>
                            Store {s.number}
                          </CardTitle>
                          {s.aco ? (
                            <CardDescription className="mt-1 truncate">
                              {s.aco}
                            </CardDescription>
                          ) : null}
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary" className="gap-1">
                          <Package className="size-3" />
                          {s.productCount} products
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Layers className="size-3" />
                          {s.categoryCount} categories
                        </Badge>
                        {s.fiscalWeek ? (
                          <Badge variant="outline" className="gap-1">
                            <Truck className="size-3" />
                            {s.fiscalWeek}
                          </Badge>
                        ) : null}
                      </div>

                      {s.top.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Top usage / $1K
                          </p>
                          <ul className="flex flex-col gap-1">
                            {s.top.map((p) => (
                              <li
                                key={p.productNumber}
                                className="flex items-center justify-between gap-2 text-sm"
                              >
                                <span className="truncate">{p.name}</span>
                                <span className="shrink-0 font-medium tabular-nums">
                                  {fmtUsage(p.averagePer1k)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
