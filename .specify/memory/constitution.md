<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 (template) → 1.0.0 (initial ratification)
Modified principles: N/A (initial fill — no prior principles to diff)
Added sections:
  - Core Principles (5 principles)
  - Technology Standards
  - Development Workflow
  - Governance
Templates checked:
  - .specify/templates/plan-template.md ✅ compatible (Constitution Check gate is dynamic)
  - .specify/templates/spec-template.md ✅ compatible (FR structure aligns with principles)
  - .specify/templates/tasks-template.md ✅ compatible (phase structure supports hook/component task separation)
Follow-up TODOs: none — all placeholders resolved
-->

# LinkedIn Agent Constitution

## Core Principles

### I. Clean Component Architecture (NON-NEGOTIABLE)

Components MUST have a single responsibility. UI components render only — zero business logic,
zero data fetching, zero side effects beyond what the framework requires.

- Server Components are the default; opt into Client Components only when browser APIs,
  event handlers, or stateful hooks are required. Mark with `"use client"` directive.
- Every component file exports exactly one primary component. No barrel-of-helpers files.
- Props MUST be typed with explicit TypeScript interfaces — no `any`, no inlined object literals
  as prop types.
- Components longer than ~150 lines signal a decomposition opportunity; treat as a code smell.

**Rationale**: Uncontrolled component growth is the primary source of merge conflicts,
untestable UI, and onboarding friction in Next.js projects.

### II. Custom Hook Patterns

All stateful logic, derived state, and async side-effects MUST live in custom hooks, not
inside component bodies.

- Hook naming: `use<Domain><Action>` — e.g., `usePostApproval`, `useLinkedInAuth`.
- Hooks MUST be placed in `src/hooks/` (feature-scoped sub-directories allowed).
- A hook MUST NOT import another hook except from `react` or a dedicated composable hook.
  Component → hook → primitive is the allowed dependency direction.
- Hooks MUST return stable references (memoize callbacks with `useCallback`, derived values
  with `useMemo` when referential equality matters downstream).
- Hooks are independently testable via `renderHook` — every hook MUST have unit tests.

**Rationale**: Hooks are the reuse unit in React. Coupling logic to JSX trees makes logic
untestable in isolation and prevents sharing across multiple components.

### III. Type Safety (NON-NEGOTIABLE)

TypeScript strict mode (`"strict": true`) is always on. No build-time type errors permitted.

- `any` is banned. Use `unknown` + type narrowing at system boundaries (API responses,
  external SDKs, JSON parsing).
- Drizzle ORM schema types MUST be the source of truth for database entity shapes.
  Never hand-write duplicated entity interfaces.
- API route request/response shapes MUST be defined as shared types in `src/types/` and
  imported by both the route handler and the calling client code.
- `as` type assertions require an explanatory comment immediately above the cast.

**Rationale**: The project integrates LinkedIn OAuth, AI generation, and KV/blob storage.
Type drift across these boundaries is a runtime bug waiting to happen.

### IV. Server-First Rendering

Next.js App Router Server Components are the default rendering strategy.

- Data fetching happens in Server Components or Route Handlers — never in `useEffect`.
- Client bundle size MUST NOT grow without justification. Every `"use client"` boundary
  requires a comment explaining why client execution is necessary.
- Sensitive credentials and SDK instantiation (OpenAI, LinkedIn API, DB) MUST remain
  server-side only. Never import these into Client Components.
- Route Handlers (`app/api/**/route.ts`) are stateless request handlers. Business logic
  belongs in `src/services/`, not inline in route files.

**Rationale**: Smaller client bundles, better SEO, and credential safety are non-negotiable
for a production LinkedIn automation agent.

### V. Observability & Error Boundaries

Every user-facing async operation MUST have an error state. Silent failures are banned.

- All `fetch` / service calls MUST handle errors explicitly and return typed result objects
  (`{ data, error }` pattern or equivalent) — no raw `throw` propagation to the component layer.
- React Error Boundaries MUST wrap major page sections. `error.tsx` files MUST exist for
  each App Router segment that performs data fetching.
- Structured logging (key-value pairs) MUST be used in all Route Handlers and service
  functions. Log `userId`, `action`, `durationMs`, and `error` (if any) at minimum.
- Cron jobs (`app/api/cron/**`) MUST emit a completion log with success/failure count.

**Rationale**: LinkedIn API calls and AI generation are fallible external dependencies.
Invisible failures destroy user trust and make debugging impossible.

## Technology Standards

- **Framework**: Next.js 14 App Router — no Pages Router patterns.
- **Language**: TypeScript 5 strict mode — `tsconfig.json` `"strict": true` MUST not be
  relaxed.
- **Styling**: Tailwind CSS via `tailwind.config.js`. No inline `style` props except for
  dynamic values impossible to express in Tailwind. shadcn/ui components live in
  `src/components/ui/` and MUST NOT be modified directly; compose them instead.
- **Database**: Drizzle ORM. Schema lives in `src/lib/db/schema.ts`. Migrations MUST be
  reviewed before merge — no destructive schema changes without a migration plan.
- **State**: React Server Components + URL state (searchParams) for shareable state.
  `useState`/`useReducer` for ephemeral UI state only. No global client state store unless
  a future principle explicitly authorises one.
- **AI**: OpenAI SDK via `src/lib/ai/`. Prompt construction is a pure function — testable
  without network calls.
- **Auth**: LinkedIn OAuth. Session management via `src/lib/session.ts`. Middleware at
  `middleware.ts` enforces auth on protected routes.
- **Testing**: `npm test` MUST pass on every commit. Hook unit tests via `renderHook`.
  Integration tests for Route Handlers via mock request helpers.

## Development Workflow

- **PR reviews**: Every PR MUST include a self-review checklist confirming Constitution
  compliance (principle I–V above).
- **Quality gates**: `npm test && npm run lint` MUST be green before merge. No exceptions.
- **File placement**: New files MUST follow the established directory contract:
  - Hooks → `src/hooks/`
  - Services → `src/services/`
  - UI primitives → `src/components/ui/`
  - Feature components → `src/components/<feature>/`
  - DB queries → `src/lib/db/`
  - LinkedIn API wrappers → `src/lib/linkedin/`
- **Complexity justification**: Any deviation from a principle requires a written rationale
  in the PR description AND a `// CONSTITUTION EXCEPTION: <reason>` comment at the
  deviation site.
- **Incremental delivery**: Features MUST be deliverable user-story by user-story. No
  "big bang" merges. Each merged story MUST leave the application in a working state.

## Governance

This constitution supersedes all prior verbal agreements, inline comments, and README
guidance on code organisation. Where conflicts exist, this document wins.

**Amendment procedure**:
1. Author opens a PR modifying this file with version bump and Sync Impact Report.
2. At least one other contributor reviews and approves.
3. Bump follows semantic versioning: MAJOR for principle removal/redefinition,
   MINOR for new principle or material expansion, PATCH for wording/clarification.
4. All template files checked for alignment before merge (plan, spec, tasks templates).

**Compliance review**: Constitution gates MUST be verified at plan creation time
(see `plan-template.md` Constitution Check section) and re-checked after Phase 1 design.

**Version**: 1.0.0 | **Ratified**: 2026-04-22 | **Last Amended**: 2026-04-22
