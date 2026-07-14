# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: 68599ca9-70c7-4b7b-90ea-e04a4e26cf69 -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Important: unit tests must be part of each implementation task, not separate tasks. Each task should implement the code and its tests together, if relevant.

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

Implementation is broken into the milestones below, derived from `spec.md`. Follow them in order. Each milestone implements code **and** its tests together, then runs lint + typecheck + tests before being marked done.

After all milestones, write a report to `{@artifacts_path}/report.md` describing: what was implemented, how it was tested, and the biggest issues/challenges.

---

### [ ] Step: Project scaffold & tooling

Stand up the brand-new, self-contained repository/project.
- Scaffold Next.js (App Router) + TypeScript (strict) + Tailwind CSS.
- Configure ESLint, Prettier, Vitest + React Testing Library.
- Add `.gitignore` (node_modules/, .next/, dist/, *.log, .env*) and npm scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `validate:stores`.
- Initialize independent git history for the new project.
- Confirm repo destination/location with the user before finalizing.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` all pass on the empty scaffold.

### [x] Step: Data model & schema

Define the authoritative store data contract.
- [x] Implement Zod schemas in `src/lib/schema.ts` (WeeklyUsage, Product, Category, DeliverySchedule, StoreMeta, StoreData) with TS types via `z.infer`.
- [x] Unit tests: valid fixture passes (schema validation covered in parser test suite).
- Note: `src/lib/stores.ts` app loader deferred to the UI step; `scripts/validate-stores.ts` covers schema validation for now.

### [x] Step: PDF → JSON ingestion & verification tooling

Turn per-store PDFs into verified JSON. (Done for the first store.)
- [x] Sample store PDF (3847) provided; chose `pdfjs-dist` (coordinate-based extraction) for robust column/blank-cell handling.
- [x] Implement `scripts/ingest/parsePandaPdf.ts` + `scripts/ingest/cli.ts` (`npm run ingest`) producing `data/stores/<number>.json`.
- [x] Implement `scripts/validate-stores.ts` (`npm run validate:stores`).
- [x] Converted store 3847: 8 categories, 97 products; edge cases (negatives `( )`, decimal-as-space `0 22`, blank cells) verified via unit tests.
- [x] `npm run validate:stores` passes for store 3847.
- Remaining: confirm delivery days per store (not in the usage PDF) and run more stores through the parser as their PDFs arrive.

### [ ] Step: Calculation engine

Implement the pluggable ordering engine.
- Implement `src/lib/ordering/coverage.ts` (`daysToCover` from delivery schedule) and `src/lib/ordering/calculate.ts` (`calculateOrder` with the stable `OrderInput`/`OrderResult` interface).
- Finalize the formula using the verified store JSON; keep the interface stable.
- [ ] Unit tests for coverage math and order math (needed / on-hand / rounding / never-negative) against fixtures.

### [ ] Step: UI & manager workflow

Build the three-screen flow.
- Store selector (`src/app/page.tsx`), inventory count screen (`stores/[storeId]/page.tsx`), order results screen (`stores/[storeId]/order/page.tsx`).
- Server components load+validate store JSON; client component handles count entry and calls the calc engine; results grouped by category with a printable/exportable view.
- [ ] Component tests for count entry and results rendering; `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test` all pass.

### [ ] Step: Report

Write `{@artifacts_path}/report.md`: what was implemented, how it was tested, and the biggest issues/challenges encountered.
