# Documentation Rules

## Language

All documents are written in English only.

## Style

Write in information style (after Maxim Ilyakhov):

- No filler words, no bureaucratic language.
- Concrete and specific. Facts over adjectives.
- Short sentences. One idea per sentence.
- No passive voice when active is possible.
- If you can cut a word without losing meaning — cut it.

## File Naming

Use `snake_case` for all files and folders.

- Correct: `operational_standards.md`
- Wrong: `Operational Standards.md`, `operational-standards.md`, `OperationalStandards.md`

## Template vs. Client Files

Files are prefixed to distinguish company templates from client-adapted versions.

**Company template** — not yet adapted for any specific client:

```
cf_cash_handling_policy.md
```

`cf` stands for "consulting firm" — placeholder until the company name is finalized. When the name is confirmed, all `cf_` prefixes will be updated.

**Client-adapted file** — customized for a specific business:

```
cookie_cash_handling_policy.md
```

The prefix is the client's name or abbreviation. One file per client per document.

**Rule:** never mix template and client content in the same file.

## File Format

All documents are Markdown (`.md`).

## Document Structure

Every document must have:

1. A top-level heading (`#`) that matches the topic.
2. Clear sections with `##` subheadings.
3. No metadata block — do not put Author, Status, or Date inside the document.

Changes and ownership are tracked in `release_memo.md`.

## Abbreviations

On first use, write the full term followed by the abbreviation in parentheses: `Accounts Payable (AP)`. After that, use the abbreviation only.

## Dates

Always use `YYYY-MM-DD` format. No exceptions.

- Correct: `2026-06-21`
- Wrong: `Jun 21`, `21/06/2026`, `June 21st`

## Links Between Documents

Link to other documents using relative paths:

- Correct: `[Operational Standards](./operational_standards.md)`
- Wrong: full URLs or file names without `./`

## Images and Diagrams

Images are allowed. PNG format only.

Naming: `snake_case`, descriptive. Example: `ap_workflow_diagram.png`.

Place images in the same folder as the document that uses them.

## Tracking Changes

All changes to any document are logged in `release_memo.md` at the repo root.

`release_memo.md` columns: `Date | Author | Document | Version | Status | Changes`

- **Date**: `YYYY-MM-DD`
- **Author**: full name. Default is **Oleg Kuftyrev**.
- **Version**: three-part semantic version `vMAJOR.MINOR.PATCH`.
  - `PATCH` — small fix: wording, typo, single sentence
  - `MINOR` — new section, rewritten block, structural change
  - `MAJOR` — status change (e.g. Draft → Approved) or full document rewrite
- **Status**: `Draft`, `Review`, or `Approved`.

When you update a document — add a row. Do not edit existing rows.

## Deprecation

When a document is no longer valid:

1. Move it to the `archive/` folder.
2. Add a note at the top of the file: `> Deprecated on YYYY-MM-DD. Reason: [reason].`
3. Log the change in `release_memo.md` with status `Deprecated`.

## Folders

No empty folders. Create a folder only when there are files to put in it.
