# Auto

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

**Debug requests, questions, and investigations:** answer or investigate first. Do not create a plan upfront — the user needs an answer, not a plan. A plan may become relevant later once the investigation reveals what needs to change.

**For all other tasks**, before writing any code, assess the scope of the actual change (not the prompt length — a one-sentence prompt can describe a large feature). Scale your approach:

- **Trivial** (typo, config tweak, single obvious change): implement directly, no plan needed.
- **Small** (a few files, clear what to do): write 2–3 sentences in `plan.md` describing what and why, then implement. No substeps.
- **Medium** (multiple components, design decisions, edge cases): write a plan in `plan.md` with requirements, affected files, key decisions, verification. Break into 3–5 steps.
- **Large** (new feature, cross-cutting, unclear scope): gather requirements and write a technical spec first (`requirements.md`, `spec.md` in `{@artifacts_path}/`). Then write `plan.md` with concrete steps referencing the spec.

**Skip planning and implement directly when** the task is trivial, or the user explicitly asks to "just do it" / gives a clear direct instruction.

To reflect the actual purpose of the first step, you can rename it to something more relevant (e.g., Planning, Investigation). Do NOT remove meta information like comments for any step.

Rule of thumb for step size: each step = a coherent unit of work (component, endpoint, test suite). Not too granular (single function), not too broad (entire feature). Unit tests are part of each step, not separate.

Update `{@artifacts_path}/plan.md` if it makes sense to have a plan and task has more than 1 big step.

## Progress

### [x] Step: Infrastructure & stack decisions
Decisions: Proton Business email, Twenty CRM (self-hosted), Next.js portal on DigitalOcean Droplet, Clerk auth, PostgreSQL. Domains: ordina.one (login), app.ordina.one (dashboard), crm.ordina.one (CRM). Total cost ~$26/month.

### [x] Step: Brand identity documentation
Created oc_brand_identity.md with full color palette, typography (Noto Serif Display), design principles, gold treatment rules. Committed and pushed to Ordina-Internals repo.

### [x] Step: Infrastructure documentation
Created oc_infrastructure.md v1.2.0 with domains, Droplet setup, Nginx routing, cost breakdown. Committed and pushed.

### [x] Step: Portal documentation
Created separate GitHub repo ordinacresce/ordina.one. Added docs/: overview.md, auth.md, login.md, dashboard.md, stack.md covering full spec for the portal.

### [x] Step: Scaffold Next.js app with login page
- Created Next.js 16 + TypeScript + Tailwind CSS 4 + App Router
- Noto Serif Display + Noto Sans via next/font/google
- Installed Clerk, Framer Motion, Lucide React
- Brand CSS variables in globals.css
- Login page: dark forest green bg, warm ivory card, antique gold accents, botanical SVG corners, tree mark logo, email + password form, remember me, forgot password, security badge, v1.0.0
- Committed and pushed to ordinacresce/ordina.one

### [x] Step: Login page UI polish + assets
- Replaced SVG placeholder with real logo (public/logo.png, 400×400, transparent bg)
- Added favicon (public/favicon.png + src/app/icon.png, resized to 64×64 via sips)
- Premium CSS border system: .form-card multi-layer box-shadow, .gold-button-frame gradient border wrapper, .sign-button dark inner button
- Security footer: shield icon, "Internal Use Only", "All activity is monitored and logged", "MFA Protected", · v1.0.0 ·
- Dev server managed via screen -dmS ordina — survives shell exit, logs at /tmp/ordina-dev.log
- Helper script: dev.sh — kills any existing process on port 3002 then starts fresh via screen

### [ ] Step: Clerk integration (next)
Wire up Clerk auth — add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY, ClerkProvider in layout, middleware, sign-in action on the form.
