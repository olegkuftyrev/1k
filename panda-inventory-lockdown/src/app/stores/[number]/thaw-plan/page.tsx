import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { PrintThawPlanButton } from "@/components/print-thaw-plan-button";
import { buttonVariants } from "@/components/ui/button";
import {
  getAllStores,
  getManagers,
  getStore,
  getStoreAddresses,
  getStorePlannerDays,
  getUnitsPerCase,
} from "@/lib/stores";
import {
  buildStoreThawPlan,
  deliveryLabel,
  formatBagQuantity,
  formatCoverageDays,
  readyLabel,
  type ThawProductPlan,
  type ThawWindow,
} from "@/lib/thaw-plan";
import styles from "./thaw-plan.module.css";

export async function generateStaticParams() {
  const stores = await getAllStores();
  return stores.map((store) => ({ number: store.store.number }));
}

export default async function ThawPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ location?: string }>;
}) {
  const { number } = await params;
  const requestedLocation = (await searchParams).location;
  const location =
    requestedLocation === "cabinet" || requestedLocation === "wic"
      ? requestedLocation
      : null;
  const [store, unitsPerCase, days, managers] = await Promise.all([
    getStore(number),
    getUnitsPerCase(),
    getStorePlannerDays(number),
    getManagers(),
  ]);
  if (!store) notFound();

  const plan = buildStoreThawPlan(store, unitsPerCase, days);
  const address = getStoreAddresses()[number] ?? "Address Not Found";
  const manager = managers[number];
  const visibleProducts =
    location === "cabinet"
      ? plan.cabinet
      : location === "wic"
        ? plan.wic
        : [...plan.cabinet, ...plan.wic];
  const hasIncompleteProducts = visibleProducts.some(
    (product) => product.weeklyBags === null,
  );
  const routeTitle =
    location === "cabinet"
      ? "24-Hour Thawing Cabinet Plan"
      : location === "wic"
        ? "WIC Thaw Plan"
        : "Thaw plan";
  const hasWindows =
    location === "cabinet"
      ? plan.cabinetWindows.length > 0
      : location === "wic"
        ? plan.wicWindows.length > 0
        : plan.cabinetWindows.length > 0 || plan.wicWindows.length > 0;

  return (
    <div className={styles.route}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarCopy}>
          <Link
            href={`/stores/${number}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            PX{number}
          </Link>
          <div>
            <h1>{routeTitle}</h1>
            <p>{address}</p>
          </div>
        </div>
        <PrintThawPlanButton disabled={!hasWindows} />
      </div>

      {!hasWindows ? (
        <div className={styles.emptyState}>
          <AlertTriangle aria-hidden />
          <div>
            <h2>No delivery days saved</h2>
            <p>Set at least one delivery day before printing a thaw plan.</p>
          </div>
        </div>
      ) : (
        <div className={styles.previewStack}>
          {hasIncompleteProducts ? (
            <div className={styles.warning}>
              <AlertTriangle aria-hidden />
              Products with missing usage or case-size data are marked unavailable.
            </div>
          ) : null}
          {location !== "wic" ? (
            <ThawSheet
              storeNumber={number}
              address={address}
              manager={manager}
              title="Thawing Cabinet"
              detail="24-Hour Meat Thaw Plan | Chicken products"
              destination="Place in thawing cabinet"
              windows={plan.cabinetWindows}
              products={plan.cabinet}
            />
          ) : null}
          {location !== "cabinet" ? (
            <ThawSheet
              storeNumber={number}
              address={address}
              manager={manager}
              title="WIC"
              detail="48-Hour Meat Thaw Plan | Beef products"
              destination="Place in WIC"
              windows={plan.wicWindows}
              products={plan.wic}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function ThawSheet({
  storeNumber,
  address,
  manager,
  title,
  detail,
  destination,
  windows,
  products,
}: {
  storeNumber: string;
  address: string;
  manager?: string;
  title: string;
  detail: string;
  destination: string;
  windows: ThawWindow[];
  products: ThawProductPlan[];
}) {
  const density =
    products.length <= 3
      ? "sparse"
      : products.length <= 5
        ? "comfortable"
        : "dense";
  const tableStyle = {
    "--thaw-columns": `minmax(17rem, 1.85fr) repeat(${windows.length + 1}, minmax(7rem, 1fr))`,
  } as CSSProperties;

  return (
    <div className={styles.sheetScroller}>
      <section
        className={styles.sheet}
        data-density={density}
        aria-label={`${title} thaw plan`}
      >
        <div className={styles.topRule} />
        <header className={styles.sheetHeader}>
          <div className={styles.brandLine}>
            <span className={styles.storeBadge}>PX{storeNumber}</span>
            <span className={styles.storeMeta}>
              {manager ? `${manager} · ` : ""}
              {address}
            </span>
          </div>
          <h2>{title}</h2>
          <p>{detail}</p>
          <div
            className={styles.coverageGrid}
            style={{ gridTemplateColumns: `repeat(${windows.length}, minmax(0, 1fr))` }}
          >
            {windows.map((window) => (
              <div className={styles.coverageItem} key={window.deliveryDay}>
                <strong>{deliveryLabel(window)}</strong>
                <span>{readyLabel(window)}</span>
                <span>Covers {formatCoverageDays(window.coverageDays)}</span>
              </div>
            ))}
          </div>
        </header>

        <div className={styles.planTable} style={tableStyle}>
          <div className={styles.tableHead}>
            <div>Product</div>
            {windows.map((window) => (
              <div key={window.deliveryDay}>{deliveryLabel(window)}</div>
            ))}
            <div>Per week</div>
          </div>
          {products.map((product) => (
            <div className={styles.productRow} key={product.productNumber}>
              <div className={styles.productCell}>
                <ProductImage productNumber={product.productNumber} />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.productNumber}</span>
                </div>
              </div>
              {product.bagsByDelivery.map((bags, index) => (
                <QuantityCell
                  key={`${product.productNumber}-${windows[index].deliveryDay}`}
                  bags={bags}
                />
              ))}
              <QuantityCell bags={product.weeklyBags} weekly />
            </div>
          ))}
        </div>

        <footer className={styles.sheetFooter}>
          <div className={styles.caseKey}>
            1 case = 5 bags = 40 LB
            <br />1 bag = 8 LB
          </div>
          <p>
            <strong>Keep unused bags frozen.</strong>{" "}
            Quantities use this
            store&apos;s saved delivery schedule, forecast, and current product
            averages.
          </p>
          <div className={styles.destination}>{destination}</div>
        </footer>
      </section>
    </div>
  );
}

function ProductImage({ productNumber }: { productNumber: string }) {
  return (
    <span
      aria-hidden
      className={styles.productImage}
      data-product={productNumber}
    />
  );
}

function QuantityCell({
  bags,
  weekly = false,
}: {
  bags: number | null;
  weekly?: boolean;
}) {
  const parts = formatBagQuantity(bags);
  return (
    <div className={`${styles.quantityCell} ${weekly ? styles.weekly : ""}`}>
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 ? <small>+</small> : null}
          <strong>{part}</strong>
        </span>
      ))}
    </div>
  );
}
