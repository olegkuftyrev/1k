# Technical Specification — Panda Express Inventory Lockdown Ordering App

## Complexity Assessment

**Hard.**

Reasons:
- Multi-tenant data model (many stores, each with its own product list and delivery schedule).
- A data-ingestion pipeline (PDF → JSON) that must be manually verified per store for correctness.
- A calculation engine whose exact formula is **not yet finalized** — it will be defined once real store JSON exists. The architecture must isolate this so the formula can be added/changed without reworking the rest of the app.
- Brand-new standalone repository — full scaffolding, tooling, and conventions decided from scratch.

---

## 1. Product Overview

A web application that helps **Panda Express store managers** run "inventory lockdown" and produce accurate product orders.

Core idea (as described by the user):
- For each store and each product category, the app knows how much product is needed for the coverage period (e.g. the week).
- The manager counts what is **on hand**.
- The app computes how much to **order** = (needed) − (on hand), adjusted for delivery schedule.
- Example: need 8 cases of orange chicken, counted 5 on hand → order 3.

Key facts confirmed by the user:
- **Multiple stores.** Each store has its **own delivery days** and its **own product list**.
- The **unit system is the same** across all stores.
- The **calculation formula is the same** across all stores.
- The **exact formula is deferred** — it will "make sense once we have the JSON data." The engine is therefore designed as a pluggable module with a stable interface.
- Source data arrives as a **PDF per store**, which we convert to **JSON**, then **manually verify** each store's data (referred to by the user as verifying "1k usage") before trusting it.
- This must live in a **separate, brand-new repository** (independent of the surrounding ORDINA workspace).

---

## 2. Technical Context

| Area | Choice | Rationale |
|------|--------|-----------|
| Language | TypeScript (strict) | Requested; type safety critical for financial/inventory math and data schemas. |
| Framework | Next.js (App Router) + React | Requested (frontend + backend in one app via Route Handlers / Server Components). |
| Styling | Tailwind CSS | Fast, consistent UI; standard with Next.js. |
| Data validation | Zod | Runtime validation of store JSON; single source of truth for TS types via `z.infer`. |
| Testing | Vitest + React Testing Library | Fast unit tests for the calc engine, schema, and components. |
| Lint / format | ESLint + Prettier | Enforced conventions. |
| Package manager | npm | Default, no extra tooling required. |
| Store data | Version-controlled JSON files (`/data/stores/*.json`) | Data must be manually reviewed/verified, so it belongs in git and in PRs, not a hidden DB. |
| On-hand counts | Client-side state for MVP (no auth/DB) | The MVP is a calculator; persistence can be added later if needed. |

> No database in the MVP. Store definitions are static, verified JSON committed to the repo. On-hand entry and order computation happen in the browser against the loaded store JSON. A persistence layer (SQLite/Postgres) is called out as a future extension, not MVP scope.

---

## 3. Implementation Approach

### 3.1 Data model (the contract everything depends on)

Defined with Zod in `src/lib/schema.ts`; TypeScript types derived via `z.infer`.

```ts
// Unit of measure — shared across all stores.
type Unit = "cs" | "ea" | "lb" | "oz" | "bag" | ...   // finalized from PDFs

interface Category {
  id: string;            // stable slug, e.g. "entree"
  name: string;          // display name, e.g. "Entrees"
}

interface Product {
  id: string;            // stable slug, e.g. "orange-chicken"
  name: string;          // "Orange Chicken"
  categoryId: string;    // FK -> Category.id
  orderUnit: Unit;       // unit the product is ordered in (e.g. "cs")
  // Usage / forecasting inputs. Kept as a flexible, well-named object so the
  // calc formula can consume whatever the verified PDFs actually contain.
  usage: {
    per1k?: number;      // usage per $1,000 sales (the "1k usage" figure), if applicable
    weeklyNeed?: number; // fixed weekly need, if the store works that way
    // additional fields added once real data is inspected
  };
}

interface DeliverySchedule {
  // Days of week the store receives deliveries (0=Sun ... 6=Sat).
  deliveryDays: number[];
}

interface Store {
  id: string;            // slug
  number: string;        // Panda store number
  name: string;          // display name / location
  delivery: DeliverySchedule;
  categories: Category[];
  products: Product[];
}
```

Notes:
- The `usage` shape is intentionally open until the first real store JSON is verified. This is the one place the deferred formula couples to data; keeping it isolated protects the rest of the app.
- All store JSON files validate against the Zod schema at load time; invalid data fails loudly (supports the "no mistakes in data" verification goal).

### 3.2 Calculation engine (pluggable)

`src/lib/ordering/calculate.ts` exposes a **stable interface** independent of the formula:

```ts
interface OrderInput {
  store: Store;
  onHand: Record<string /*productId*/, number>;
  // context the formula may need; finalized with real data:
  context?: {
    forecastSales?: number;      // if sales-driven
    daysToCover?: number;        // derived from delivery schedule
    orderDate?: string;          // ISO date the order is placed
  };
}

interface OrderLine {
  productId: string;
  needed: number;      // computed requirement for the coverage period
  onHand: number;      // manager's count
  orderQty: number;    // max(0, needed - onHand), rounded to whole order units
}

interface OrderResult {
  storeId: string;
  lines: OrderLine[];
  byCategory: Record<string, OrderLine[]>;
}

function calculateOrder(input: OrderInput): OrderResult;
```

- A helper `daysToCover(store, orderDate)` derives coverage days from `delivery.deliveryDays` (days until the next delivery arrives).
- The **body** of `calculateOrder` (the exact arithmetic) is filled in once verified JSON exists. Until then it uses a documented placeholder (`orderQty = max(0, needed - onHand)` where `needed` comes from `usage`), fully covered by unit tests so swapping in the final formula is safe.

### 3.3 PDF → JSON ingestion & verification

- `scripts/ingest/` holds a small Node/TS script that takes a store PDF and produces a draft `data/stores/<store>.json`.
- Extraction library chosen after inspecting a sample PDF (`pdf-parse` for text PDFs, or manual/tabular extraction if the PDFs are scanned). This choice is finalized when the first PDF is provided.
- `scripts/validate-stores.ts` validates every `data/stores/*.json` against the Zod schema and reports errors — this is the automated half of "manually verify each store to make sure there are no mistakes."
- Draft JSON is committed and reviewed in a PR (human verification) before a store is marked verified.

### 3.4 UI / manager workflow

1. **Store selector** — list of stores from `data/stores/`.
2. **Inventory count screen** — products grouped by category; manager enters on-hand per product.
3. **Order results screen** — per product and per category: needed / on hand / **order qty**; totals; printable/exportable view.

Rendering: Server Components load and validate store JSON; a Client Component handles count entry and calls the calc engine.

---

## 4. Source Code Structure (new repository)

```
panda-inventory-lockdown/
├── .gitignore                # node_modules/, .next/, dist/, *.log, .env*
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── .eslintrc / eslint.config.mjs
├── README.md                 # created only if requested / needed to run
├── data/
│   └── stores/
│       └── <store>.json       # verified per-store data (git-tracked)
├── scripts/
│   ├── ingest/                # PDF -> draft JSON
│   └── validate-stores.ts     # schema validation of all stores
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx           # store selector
    │   └── stores/[storeId]/
    │       ├── page.tsx       # inventory count
    │       └── order/page.tsx # order results
    ├── components/            # UI components
    └── lib/
        ├── schema.ts          # Zod schemas + inferred types
        ├── stores.ts          # load + validate store JSON
        └── ordering/
            ├── calculate.ts   # pluggable calc engine
            └── coverage.ts    # daysToCover from delivery schedule
```

> "Brand-new repository": the project is scaffolded as a self-contained directory with its own `package.json`, tooling, and `git` history, independent of the surrounding ORDINA content, so it can be pushed to its own remote. (Exact directory location / remote to be confirmed at implementation start.)

---

## 5. Data Model / API / Interface Changes

- **New Zod schema** (`schema.ts`) is the authoritative contract for store data — see §3.1.
- **Calc engine interface** (`OrderInput` / `OrderResult`) — see §3.2. Stable even though the formula is deferred.
- **API surface (MVP):** none external. Data is read from committed JSON via server components. If future persistence is added, Next.js Route Handlers under `src/app/api/` would expose store/order endpoints (out of MVP scope).

---

## 6. Verification Approach

- **Unit tests (Vitest):**
  - `schema.test.ts` — valid store JSON passes; malformed data fails.
  - `coverage.test.ts` — `daysToCover` correct for various delivery-day sets and order dates.
  - `calculate.test.ts` — order math (needed / on-hand / rounding / never-negative) against fixtures; these tests are the safety net for swapping in the final formula.
  - Component tests for count entry and results rendering.
- **Data validation:** `npm run validate:stores` runs the schema check across all `data/stores/*.json`.
- **Lint / typecheck:** `npm run lint` and `npm run typecheck` (`tsc --noEmit`) must pass.
- **Build:** `npm run build` succeeds.
- **Manual verification:** each store's converted JSON is reviewed against its source PDF before the store is trusted (the user's "manually verify each store" requirement).

---

## 7. Open Items (need user input during implementation)

1. **Sample PDF** for at least one store — required to finalize the `usage` fields, unit list, PDF-extraction library, and the calculation formula.
2. **Coverage period semantics** — is "need" weekly, or driven by forecasted sales × usage-per-1k, and how delivery days set the coverage window.
3. **Repository destination** — where the new repo lives / its git remote.
4. **Persistence** — whether managers need saved history of counts/orders (post-MVP).
