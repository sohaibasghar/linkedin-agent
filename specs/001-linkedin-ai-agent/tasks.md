# Tasks: LinkedIn AI Content Agent

**Input**: Design documents from `/specs/001-linkedin-ai-agent/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓, quickstart.md ✓

**Tests**: Not included (not requested).

**Organization**: Tasks grouped by user story. Each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US4)
- All file paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and base configuration

- [X] T001 Initialize Next.js 14 App Router project with TypeScript 5 and Node.js 20; configure package.json with all dependencies (openai, drizzle-orm, @neondatabase/serverless, @vercel/kv, @vercel/blob, playwright) in package.json
- [X] T002 [P] Configure TypeScript strict mode and path aliases in tsconfig.json
- [X] T003 [P] Configure ESLint with Next.js rules in .eslintrc.json and Prettier in .prettierrc
- [X] T004 [P] Create all source directory structure: app/api/generate/, app/api/approve/, app/api/post/, app/api/posts/, app/api/cron/daily/, app/(ui)/, src/lib/ai/, src/lib/linkedin/, src/lib/db/migrations/, src/lib/kv/, src/lib/storage/, src/services/, src/types/
- [X] T005 [P] Create .env.example with all required variables: DATABASE_URL, KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN, BLOB_READ_WRITE_TOKEN, OPENAI_API_KEY, LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN, CRON_SECRET, AUTO_PUBLISH, IMAGE_GENERATION
- [X] T006 [P] Configure vercel.json with daily cron trigger at 08:00 UTC for POST /api/cron/daily
- [X] T007 Configure drizzle.config.ts with DATABASE_URL, schema path src/lib/db/schema.ts, and migrations output src/lib/db/migrations/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before ANY user story work can begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Define PostStatus enum (DRAFT, APPROVED, REJECTED, PUBLISHED, FAILED) and all shared TypeScript interfaces (Post, PublishLog, GenerateResult, PublishResult, DailyLockResult) in src/types/index.ts
- [X] T009 [P] Implement Drizzle PostgreSQL connection client using @neondatabase/serverless with connection pooling in src/lib/db/client.ts
- [X] T010 Define Drizzle ORM schema for `posts` table (id UUID PK, topic TEXT, content TEXT, imageUrl TEXT nullable, status PostStatus enum, approvalMode BOOLEAN, linkedInPostId TEXT nullable, errorMessage TEXT nullable, createdAt TIMESTAMP, publishedAt TIMESTAMP nullable, scheduledFor DATE UNIQUE) and `publish_logs` table (id UUID PK, postId UUID FK→posts.id, outcome ENUM SUCCESS/FAILURE, errorCode TEXT nullable, errorDetail TEXT nullable, attemptedAt TIMESTAMP) in src/lib/db/schema.ts
- [X] T011 Run `npx drizzle-kit generate` to produce initial SQL migration file in src/lib/db/migrations/ and add `db:migrate` script to package.json using `drizzle-kit migrate`
- [X] T012 [P] Implement DailyLock with acquire (SET NX with 25h TTL using lock:YYYY-MM-DD key), check (EXISTS), and release operations using @vercel/kv in src/lib/kv/lock.ts
- [X] T013 Create root app/layout.tsx with HTML shell, metadata, and viewport configuration

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Daily Content Auto-Published (Priority: P1) 🎯 MVP

**Goal**: Vercel Cron triggers daily content generation; system generates topic + post text and publishes to LinkedIn automatically (when AUTO_PUBLISH=true) or saves as DRAFT (when AUTO_PUBLISH=false).

**Independent Test**: `curl -X POST /api/cron/daily -H "X-API-Key: $CRON_SECRET"` → post appears in DB with status DRAFT or PUBLISHED; second call same day returns 409.

### Implementation

- [X] T014 [P] [US1] Implement OpenAI GPT-4o topic generation (returns a single relevant daily topic string) in src/lib/ai/topic.ts
- [X] T015 [P] [US1] Implement OpenAI GPT-4o post content generation (structured prompt producing hook + 3 body paragraphs + CTA, enforced ≤ 3000 chars with retry on overflow) in src/lib/ai/content.ts
- [X] T016 [P] [US1] Implement LinkedIn REST API client with OAuth 2.0 access token usage and UGC Posts endpoint (POST /v2/ugcPosts) for text and image+text post creation in src/lib/linkedin/api.ts
- [X] T017 [US1] Implement generate service orchestrating: acquire DailyLock → generate topic → generate content → insert Post as DRAFT → return result; if AUTO_PUBLISH=true call publish service immediately in src/services/generate.ts (depends on T014, T015, T012)
- [X] T018 [US1] Implement publish service orchestrating: call LinkedIn API client → on success update Post status to PUBLISHED and set linkedInPostId and publishedAt → insert PublishLog SUCCESS entry; on failure update Post status to FAILED and set errorMessage → insert PublishLog FAILURE entry in src/services/publish.ts (depends on T016)
- [X] T019 [US1] Implement POST /api/generate route handler: validate optional date body param, call generate service, return 201 with post data on success, 409 DUPLICATE_DATE if lock exists, 422 GENERATION_FAILED on AI error in app/api/generate/route.ts
- [X] T020 [US1] Implement POST /api/cron/daily route handler: validate X-API-Key header against CRON_SECRET env var, call generate service for today's date, return 200 with triggered/date/postId/status or 409 if already ran today in app/api/cron/daily/route.ts

**Checkpoint**: User Story 1 fully functional — daily cron generates and auto-publishes or saves as DRAFT

---

## Phase 4: User Story 2 — Manual Approval Before Publishing (Priority: P2)

**Goal**: When AUTO_PUBLISH=false, operator approves or rejects drafts via API or UI before any LinkedIn publish occurs.

**Independent Test**: Generate draft → GET /api/posts returns it with status DRAFT → POST /api/approve with action=approve → status becomes PUBLISHED on LinkedIn; POST /api/approve with action=reject → status becomes REJECTED, no LinkedIn call made.

### Implementation

- [X] T021 [US2] Implement POST /api/approve route handler: parse postId and action (approve|reject); on approve call publish service and return 200 with PUBLISHED status and linkedInPostId; on reject update Post status to REJECTED and return 200; return 404 if post not found, 409 if post not in DRAFT status, 502 if LinkedIn publish fails in app/api/approve/route.ts
- [X] T022 [US2] Implement POST /api/post route handler: parse postId, call publish service directly (bypasses approval), return 200 with PUBLISHED status; same 404/409/502 error shapes as /api/approve in app/api/post/route.ts
- [X] T023 [P] [US2] Implement Playwright LinkedIn browser automation fallback: launch headless Chromium, authenticate with stored session, navigate to LinkedIn post composer, fill content, submit; return linkedInPostId from URL in src/lib/linkedin/automation.ts
- [X] T024 [US2] Extend publish service to catch LinkedIn API errors and retry via Playwright automation fallback (src/lib/linkedin/automation.ts); log both attempts in PublishLog in src/services/publish.ts (depends on T023)
- [X] T025 [P] [US2] Build operator approval UI: server component listing all DRAFT posts with topic, content preview, createdAt; approve and reject form actions calling /api/approve; show confirmation state in app/(ui)/page.tsx
- [X] T026 [P] [US2] Create app/(ui)/layout.tsx with nav header and container styling

**Checkpoint**: User Stories 1 and 2 independently functional — approval workflow complete

---

## Phase 5: User Story 3 — View Post History (Priority: P3)

**Goal**: Operator views all past posts (published, failed, rejected, draft) with status and timestamps via API and UI.

**Independent Test**: After generating several posts with different statuses, `GET /api/posts?status=PUBLISHED&limit=10` returns only PUBLISHED posts with correct fields; UI displays all posts in a table with accurate status labels.

### Implementation

- [X] T027 [US3] Implement GET /api/posts route handler: parse query params (status, limit max 100 default 20, offset, from date, to date), query posts table with Drizzle filters and ORDER BY scheduledFor DESC, return paginated JSON with posts array and total/limit/offset in app/api/posts/route.ts
- [X] T028 [US3] Extend operator UI to include post history table showing all posts (topic, status badge, scheduledFor, publishedAt, errorMessage if failed) below the drafts section; fetch from /api/posts on page load in app/(ui)/page.tsx

**Checkpoint**: User Stories 1, 2, and 3 independently functional — full history visible

---

## Phase 6: User Story 4 — Image Attached to Post (Priority: P4)

**Goal**: Each generated post includes a DALL·E 3 quote-card image (hook text on gradient background); if image generation fails, post publishes as text-only without blocking.

**Independent Test**: Trigger generation with IMAGE_GENERATION=true → Post.imageUrl is non-null and points to Vercel Blob URL; trigger with IMAGE_GENERATION=false or simulate DALL·E failure → post still publishes as text-only, PublishLog has no image error.

### Implementation

- [X] T029 [P] [US4] Implement DALL·E 3 image generation: build prompt placing post hook text on a clean gradient background, call OpenAI images.generate with model dall-e-3 and size 1024x1024, return PNG buffer in src/lib/ai/image.ts
- [X] T030 [P] [US4] Implement Vercel Blob PNG upload: accept buffer and filename, call @vercel/blob put() with public access, return blob URL in src/lib/storage/blob.ts
- [X] T031 [US4] Integrate image generation into generate service: if IMAGE_GENERATION env var is true, call src/lib/ai/image.ts then src/lib/storage/blob.ts after content generation, set Post.imageUrl to blob URL; if image generation throws, log error and continue with imageUrl=null (text-only fallback) in src/services/generate.ts (depends on T029, T030)

**Checkpoint**: All four user stories independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, error hardening, and operational readiness across all stories

- [X] T032 [P] Add Post.content length validation in src/lib/ai/content.ts: after generation, if content exceeds 3000 chars, retry with explicit truncation instruction; throw if still over limit after one retry
- [X] T033 [P] Add draft expiry: query posts with status=DRAFT and createdAt older than 7 days, update status to REJECTED with errorMessage "Expired: no approval received within 7 days"; expose as a utility callable from cron or admin in src/services/generate.ts
- [X] T034 [P] Add npm scripts to package.json: `db:migrate` (drizzle-kit migrate), `db:generate` (drizzle-kit generate), `db:studio` (drizzle-kit studio), `lint` (eslint), `build` (next build)
- [X] T035 Validate all quickstart.md scenarios end-to-end in local dev environment: generate → approve → view history → confirm LinkedIn post visible

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; all [P] tasks run in parallel
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — no other story dependency
- **US2 (Phase 4)**: Depends on Phase 2 + Phase 3 (reuses generate/publish services)
- **US3 (Phase 5)**: Depends on Phase 2 — independently queryable; integrates into US2 UI
- **US4 (Phase 6)**: Depends on Phase 3 (extends generate service)
- **Polish (Phase 7)**: Depends on all desired stories complete

### Within-Story Dependencies

```
T014 [topic.ts]     ─┐
T015 [content.ts]   ─┼─→ T017 [generate.ts] → T019 [/api/generate] → T020 [/api/cron/daily]
T012 [lock.ts]      ─┘

T016 [api.ts] → T018 [publish.ts] → T021 [/api/approve] → T022 [/api/post]

T023 [automation.ts] → T024 [extend publish.ts]

T029 [image.ts] ─┐
T030 [blob.ts]  ─┴─→ T031 [extend generate.ts]
```

---

## Parallel Execution Examples

### Phase 1 — all [P] tasks together
```
T002 tsconfig.json
T003 .eslintrc.json + .prettierrc
T004 directory structure
T005 .env.example
T006 vercel.json
T007 drizzle.config.ts  ← sequential after T002
```

### Phase 3 — US1 parallel start
```
T014 src/lib/ai/topic.ts
T015 src/lib/ai/content.ts
T016 src/lib/linkedin/api.ts
```
Then sequentially: T017 → T018 → T019 → T020

### Phase 4 — US2 parallel start
```
T023 src/lib/linkedin/automation.ts
T025 app/(ui)/page.tsx
T026 app/(ui)/layout.tsx
```
Then sequentially: T021 → T022 → T024

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL — blocks all stories**)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: trigger cron manually, confirm post in DB
5. Deploy to Vercel, confirm cron fires and LinkedIn post appears

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → auto-publish working → **deploy MVP**
3. US2 → approval workflow + UI → **deploy**
4. US3 → post history visible → **deploy**
5. US4 → images attached → **deploy**

---

## Summary

| Phase | Story | Tasks | Parallel Opportunities |
|-------|-------|-------|----------------------|
| Phase 1: Setup | — | T001–T007 (7) | T002–T006 all parallel |
| Phase 2: Foundational | — | T008–T013 (6) | T009, T012 parallel |
| Phase 3 | US1 (P1) | T014–T020 (7) | T014, T015, T016 parallel |
| Phase 4 | US2 (P2) | T021–T026 (6) | T023, T025, T026 parallel |
| Phase 5 | US3 (P3) | T027–T028 (2) | — |
| Phase 6 | US4 (P4) | T029–T031 (3) | T029, T030 parallel |
| Phase 7: Polish | — | T032–T035 (4) | T032, T033, T034 parallel |
| **Total** | | **35 tasks** | |

**MVP scope**: Phases 1–3 (20 tasks) → fully working auto-publish pipeline
