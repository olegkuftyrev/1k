import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { PrintPlanButton } from "@/components/print-thaw-plan-button";
import { buttonVariants } from "@/components/ui/button";
import {
  buildStoreContainerPlan,
  type ContainerGroupPlan,
} from "@/lib/container-plan";
import { fmtTarget } from "@/lib/format";
import {
  DAY_LABELS,
  FULL_DAY_LABELS,
} from "@/lib/planner";
import type { DeliveryOrderWindow } from "@/lib/order-plan";
import {
  getAllStores,
  getManagers,
  getStore,
  getStoreAddresses,
  getStorePlannerDays,
} from "@/lib/stores";
import styles from "./container-plan.module.css";

export async function generateStaticParams() {
  const stores = await getAllStores();
  return stores.map((store) => ({ number: store.store.number }));
}

export default async function ContainerPlanPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const [store, days, managers] = await Promise.all([
    getStore(number),
    getStorePlannerDays(number),
    getManagers(),
  ]);
  if (!store) notFound();

  const plan = buildStoreContainerPlan(store, days);
  const address = getStoreAddresses()[number] ?? "Address Not Found";
  const manager = managers[number];
  const hasIncompleteProducts = plan.groups.some((group) =>
    group.products.some((product) => product.averagePer1k === null),
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
            <h1>Container Needs Plan</h1>
            <p>{address}</p>
          </div>
        </div>
        <PrintPlanButton
          disabled={plan.windows.length === 0}
          label="Print container plan"
        />
      </div>

      {plan.windows.length === 0 ? (
        <div className={styles.emptyState}>
          <AlertTriangle aria-hidden />
          <div>
            <h2>No delivery days saved</h2>
            <p>Set at least one delivery day before printing this plan.</p>
          </div>
        </div>
      ) : (
        <div className={styles.previewStack}>
          {hasIncompleteProducts ? (
            <div className={styles.warning}>
              <AlertTriangle aria-hidden />
              Products with missing usage are marked unavailable and excluded
              from a final store total.
            </div>
          ) : null}
          <ContainerSheet
            storeNumber={number}
            address={address}
            manager={manager}
            windows={plan.windows}
            groups={plan.groups}
            totalContainersToKeep={plan.totalContainersToKeep}
          />
        </div>
      )}
    </div>
  );
}

function ContainerSheet({
  storeNumber,
  address,
  manager,
  windows,
  groups,
  totalContainersToKeep,
}: {
  storeNumber: string;
  address: string;
  manager?: string;
  windows: DeliveryOrderWindow[];
  groups: ContainerGroupPlan[];
  totalContainersToKeep: number | null;
}) {
  const tableStyle = {
    "--container-columns": `minmax(8.5rem, 1.65fr) repeat(${windows.length}, minmax(2.9rem, 1fr))`,
  } as CSSProperties;

  return (
    <div className={styles.sheetScroller}>
      <section className={styles.sheet} aria-label="Container Needs Plan">
        <div className={styles.topRule} />
        <header className={styles.sheetHeader}>
          <div className={styles.brandLine}>
            <span className={styles.storeBadge}>PX{storeNumber}</span>
            <span className={styles.storeMeta}>
              {manager ? `${manager} | ` : ""}
              {address}
            </span>
          </div>
          <div className={styles.titleLine}>
            <div>
              <h2>Container Needs Plan</h2>
              <p>Peak container inventory for saved forecasts</p>
            </div>
            <div className={styles.grandTotal}>
              <strong>{totalContainersToKeep ?? "-"}</strong>
              <span>Total containers to keep</span>
            </div>
          </div>
          <div
            className={styles.coverageGrid}
            style={{
              gridTemplateColumns: `repeat(${windows.length}, minmax(0, 1fr))`,
            }}
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

        <div className={styles.summaryGrid}>
          {groups.map((group) => (
            <div className={styles.summaryItem} key={group.id}>
              <span>{group.shortTitle}</span>
              <div>
                <strong>{group.containersToKeep ?? "-"}</strong>
                <small>to keep</small>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`${styles.groupGrid} ${windows.length > 3 ? styles.groupGridMany : ""}`}
        >
          {groups.map((group) => (
            <ContainerGroupTable
              key={group.id}
              group={group}
              windows={windows}
              tableStyle={tableStyle}
            />
          ))}
        </div>

        <footer className={styles.sheetFooter}>
          <p>
            <strong>Calculation:</strong> meat uses whole 8 LB bags, then 1 or
            3 bags per pan. Standard produce uses 7 LB per container; broccoli
            and onion use whole packages.
          </p>
          <p>
            <strong>To keep:</strong> rounded product needs are added, then the
            highest delivery total is used.
          </p>
        </footer>
      </section>
    </div>
  );
}

function ContainerGroupTable({
  group,
  windows,
  tableStyle,
}: {
  group: ContainerGroupPlan;
  windows: DeliveryOrderWindow[];
  tableStyle: CSSProperties;
}) {
  return (
    <section className={styles.group} aria-label={group.title}>
      <header className={styles.groupHeader}>
        <div>
          <h3>{group.title}</h3>
          <span>{group.products.length} products</span>
        </div>
        <div className={styles.keepCount}>
          <strong>{group.containersToKeep ?? "-"}</strong>
          <span>to keep</span>
        </div>
      </header>
      <div className={styles.planTable} style={tableStyle}>
        <div className={styles.tableHead}>
          <div>Product / capacity</div>
          {windows.map((window) => (
            <div key={window.deliveryDay}>{DAY_LABELS[window.deliveryDay]}</div>
          ))}
        </div>
        {group.products.map((product) => (
          <div className={styles.productRow} key={product.productNumber}>
            <div className={styles.productCell}>
              <strong>{product.name}</strong>
              <span>
                {product.productNumber} | {capacityLabel(product)}
              </span>
            </div>
            {product.containersByDelivery.map((containers, index) => (
              <ContainerCell
                key={`${product.productNumber}-${windows[index].deliveryDay}`}
                containers={containers}
                exact={product.exactByDelivery[index]}
                requiredBags={product.requiredBagsByDelivery[index]}
                requiredPackages={product.requiredPackagesByDelivery[index]}
                packageLabel={product.packageLabel}
              />
            ))}
          </div>
        ))}
        <div className={styles.totalRow}>
          <div>Total containers</div>
          {group.totalsByDelivery.map((total, index) => (
            <div key={windows[index].deliveryDay}>{total ?? "-"}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContainerCell({
  containers,
  exact,
  requiredBags,
  requiredPackages,
  packageLabel,
}: {
  containers: number | null;
  exact: number | null;
  requiredBags: number | null;
  requiredPackages: number | null;
  packageLabel?: string;
}) {
  if (containers === null || exact === null) {
    return <div className={styles.unavailable}>N/A</div>;
  }

  return (
    <div className={styles.quantityCell}>
      <strong>{containers}</strong>
      <span>
        {requiredPackages !== null
          ? `${requiredPackages} ${packageLabel ?? "package"}${requiredPackages === 1 ? "" : "s"}`
          : requiredBags === null
            ? `(${exact.toFixed(2)})`
            : `${requiredBags} ${requiredBags === 1 ? "bag" : "bags"}`}
      </span>
    </div>
  );
}

function capacityLabel(product: ContainerGroupPlan["products"][number]): string {
  if (
    product.packageLabel !== undefined &&
    product.containersPerPackage !== undefined
  ) {
    return `${product.containersPerPackage} pan${product.containersPerPackage === 1 ? "" : "s"}/${product.packageLabel}`;
  }
  if (product.bagsPerContainer !== undefined) {
    return `${product.bagsPerContainer} ${product.bagsPerContainer === 1 ? "bag" : "bags"}/pan`;
  }
  return `${product.poundsPerContainer} lb/container`;
}
