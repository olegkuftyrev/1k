import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Soup } from "lucide-react";
import { PrintPlanButton } from "@/components/print-thaw-plan-button";
import { buttonVariants } from "@/components/ui/button";
import { fmtTarget } from "@/lib/format";
import {
  buildStoreOrderPlan,
  type DeliveryOrderWindow,
  type OrderPlanKind,
  type OrderPlanProduct,
} from "@/lib/order-plan";
import { DAY_LABELS, FULL_DAY_LABELS } from "@/lib/planner";
import {
  getAllStores,
  getManagers,
  getStore,
  getStoreAddresses,
  getStorePlannerDays,
  getUnitsPerCase,
} from "@/lib/stores";
import styles from "./order-plan.module.css";

export async function generateStaticParams() {
  const stores = await getAllStores();
  return stores.flatMap((store) =>
    (["meat", "vegetables"] as const).map((kind) => ({
      number: store.store.number,
      kind,
    })),
  );
}

function parseKind(value: string): OrderPlanKind | null {
  return value === "meat" || value === "vegetables" ? value : null;
}

export default async function OrderPlanPage({
  params,
}: {
  params: Promise<{ number: string; kind: string }>;
}) {
  const { number, kind: kindParam } = await params;
  const kind = parseKind(kindParam);
  if (!kind) notFound();

  const [store, unitsPerCase, days, managers] = await Promise.all([
    getStore(number),
    getUnitsPerCase(),
    getStorePlannerDays(number),
    getManagers(),
  ]);
  if (!store) notFound();

  const plan = buildStoreOrderPlan(store, unitsPerCase, days, kind);
  const address = getStoreAddresses()[number] ?? "Address Not Found";
  const manager = managers[number];
  const title = kind === "meat" ? "Meat Order Plan" : "Vegetable Order Plan";
  const hasIncompleteProducts = plan.products.some(
    (product) => product.weeklyCases === null,
  );

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
            <h1>{title}</h1>
            <p>{address}</p>
          </div>
        </div>
        <PrintPlanButton
          disabled={plan.windows.length === 0}
          label={`Print ${kind === "meat" ? "meat" : "vegetable"} plan`}
        />
      </div>

      {plan.windows.length === 0 ? (
        <div className={styles.emptyState}>
          <AlertTriangle aria-hidden />
          <div>
            <h2>No delivery days saved</h2>
            <p>Set at least one delivery day before printing an order plan.</p>
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
          <OrderSheet
            storeNumber={number}
            address={address}
            manager={manager}
            title={title}
            kind={kind}
            windows={plan.windows}
            products={plan.products}
          />
        </div>
      )}
    </div>
  );
}

function OrderSheet({
  storeNumber,
  address,
  manager,
  title,
  kind,
  windows,
  products,
}: {
  storeNumber: string;
  address: string;
  manager?: string;
  title: string;
  kind: OrderPlanKind;
  windows: DeliveryOrderWindow[];
  products: OrderPlanProduct[];
}) {
  const density =
    products.length <= 8
      ? "sparse"
      : products.length <= 11
        ? "comfortable"
        : "dense";
  const tableStyle = {
    "--order-columns": `minmax(13rem, 1.8fr) repeat(${windows.length + 1}, minmax(4.5rem, 1fr))`,
  } as CSSProperties;

  return (
    <div className={styles.sheetScroller}>
      <section
        className={styles.sheet}
        data-density={density}
        aria-label={title}
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
          <p>{products.length} products · Whole cases for saved forecasts</p>
          <div
            className={styles.coverageGrid}
            style={{ gridTemplateColumns: `repeat(${windows.length}, minmax(0, 1fr))` }}
          >
            {windows.map((window) => (
              <div className={styles.coverageItem} key={window.deliveryDay}>
                <strong>{FULL_DAY_LABELS[window.deliveryDay]} delivery</strong>
                <span>
                  Covers {window.coverageDays.map((day) => DAY_LABELS[day]).join(" + ")}
                </span>
                <span>{fmtTarget(window.salesTarget)}</span>
              </div>
            ))}
          </div>
        </header>

        <div className={styles.planTable} style={tableStyle}>
          <div className={styles.tableHead}>
            <div>Product</div>
            {windows.map((window) => (
              <div key={window.deliveryDay}>
                {FULL_DAY_LABELS[window.deliveryDay]}
              </div>
            ))}
            <div>Per week</div>
          </div>
          {products.map((product) => (
            <div className={styles.productRow} key={product.productNumber}>
              <div className={styles.productCell}>
                <ProductImage kind={kind} productNumber={product.productNumber} />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.productNumber}</span>
                </div>
              </div>
              {product.casesByDelivery.map((cases, index) => (
                <CaseCell
                  key={`${product.productNumber}-${windows[index].deliveryDay}`}
                  cases={cases}
                />
              ))}
              <CaseCell cases={product.weeklyCases} weekly />
            </div>
          ))}
        </div>

        <footer className={styles.sheetFooter}>
          <p>
            <strong>Ordering rule:</strong> subtract cases expected on hand at
            delivery, then order the remaining whole cases.
          </p>
          <div className={styles.assumption}>Quantities assume 0 cases on hand</div>
        </footer>
      </section>
    </div>
  );
}

function ProductImage({
  kind,
  productNumber,
}: {
  kind: OrderPlanKind;
  productNumber: string;
}) {
  if (kind === "vegetables" && productNumber === "P1102") {
    return (
      <span
        aria-hidden
        className={`${styles.productImage} ${styles.noodleImage}`}
      >
        <Soup />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={styles.productImage}
      data-kind={kind}
      data-product={productNumber}
    />
  );
}

function CaseCell({
  cases,
  weekly = false,
}: {
  cases: number | null;
  weekly?: boolean;
}) {
  return (
    <div className={`${styles.quantityCell} ${weekly ? styles.weekly : ""}`}>
      {cases === null ? (
        <span className={styles.unavailable}>Unavailable</span>
      ) : (
        <>
          <strong>{cases}</strong>
          <span>cs</span>
        </>
      )}
    </div>
  );
}
