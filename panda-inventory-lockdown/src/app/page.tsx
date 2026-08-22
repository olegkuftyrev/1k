import Link from "next/link";
import {
  ChevronRight,
  CircleOff,
  Layers,
  Package,
  Store,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fmtCases, fmtInt } from "@/lib/format";
import { hasStoreReport, isActiveStore } from "@/lib/store-roster";
import {
  getAllStores,
  getManagers,
  getStoreAddresses,
  getUnitsPerCase,
  productCount,
  summarize,
} from "@/lib/stores";

export default async function DashboardPage() {
  const stores = await getAllStores();
  const managers = await getManagers();
  const addresses = getStoreAddresses();
  const unitsPerCase = await getUnitsPerCase();
  const activeStores = stores.filter((store) =>
    isActiveStore(store.store.number),
  );
  const inactiveStores = stores.filter(
    (store) => !isActiveStore(store.store.number),
  );
  const activeStoresWithReports = activeStores.filter(hasStoreReport);

  const totalProducts = activeStoresWithReports.reduce(
    (n, s) => n + productCount(s),
    0,
  );
  const totalCategories = activeStoresWithReports.reduce(
    (n, s) => n + s.categories.filter((c) => c.products.length > 0).length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Inventory lockdown overview for the active store roster.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Stores"
          value={fmtInt(activeStores.length)}
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Active stores
          </h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {activeStores.length} stores
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {activeStores.map((store) => {
            const reported = hasStoreReport(store);
            const s = summarize(store, unitsPerCase);
            return (
              <Link
                key={s.number}
                href={`/stores/${s.number}`}
                className="group"
              >
                <Card
                  className={
                    reported
                      ? "h-full transition-colors group-hover:ring-brand/40"
                      : "h-full bg-amber-50/40 ring-amber-300/80 transition-colors group-hover:ring-amber-400"
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="flex flex-wrap items-center gap-2">
                          <span className="flex h-8 min-w-16 items-center justify-center rounded-md bg-brand px-2 text-sm font-bold tabular-nums text-brand-foreground">
                            PX{s.number}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {addresses[s.number] ?? "Address Not Found"}
                          </span>
                        </CardTitle>
                        <CardDescription className="mt-1 truncate">
                          {managers[s.number]
                            ? `Manager · ${managers[s.number]}`
                            : "Manager Not Found"}
                        </CardDescription>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {reported ? (
                      <>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary" className="gap-1">
                            <Package className="size-3" />
                            {s.productCount} products
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Layers className="size-3" />
                            {s.categoryCount} categories
                          </Badge>
                          {s.weekCount > 0 ? (
                            <Badge variant="outline" className="gap-1">
                              <Truck className="size-3" />
                              Rolling {s.weekCount} Weeks
                            </Badge>
                          ) : null}
                        </div>

                        {s.top.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Top cases / $1K
                            </p>
                            <ul className="flex flex-col gap-1">
                              {s.top.map((t) => (
                                <li
                                  key={t.product.productNumber}
                                  className="flex items-center justify-between gap-2 text-sm"
                                >
                                  <span className="truncate">
                                    {t.product.name}
                                  </span>
                                  <span className="shrink-0 font-medium tabular-nums">
                                    {fmtCases(t.casesPer1k)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border border-amber-300 bg-amber-100 text-amber-900">
                          <TriangleAlert className="size-3" />
                          Missing report
                        </Badge>
                        <span className="text-xs text-amber-900/75">
                          Inventory Usage per $1,000 is unavailable.
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {inactiveStores.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Inactive stores
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {inactiveStores.length} stores
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {inactiveStores.map((store) => {
              const s = summarize(store, unitsPerCase);
              return (
                <Card
                  key={s.number}
                  className="h-full bg-muted/40 text-muted-foreground ring-foreground/5"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-8 min-w-16 items-center justify-center rounded-md bg-muted-foreground/10 px-2 text-sm font-bold tabular-nums text-muted-foreground">
                        PX{s.number}
                      </span>
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <CircleOff className="size-3" />
                        Inactive
                      </Badge>
                    </div>
                    <CardTitle className="truncate text-muted-foreground">
                      {addresses[s.number] ?? "Address Not Found"}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {managers[s.number]
                        ? `Manager · ${managers[s.number]}`
                        : "Manager Not Found"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
