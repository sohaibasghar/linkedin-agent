# Tasks: Post Management Workflow

**Feature**: 002-post-management-workflow
**Input**: `specs/002-post-management-workflow/`
**Tests**: Skipped per user directive (plan.md)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no dependency on incomplete task)
- **[US#]**: User story label (maps to spec.md)
- No test tasks generated per plan.md directive

---

## Phase 1: Setup

**Purpose**: Types, schema, migrations — must exist before any story work

- [X] T001 Create `src/types/index.ts` with `PostStatus` enum (`DRAFT | APPROVED | PUBLISHED | FAILED | REJECTED`) and `Post`, `PublishLog` TypeScript interfaces matching data-model.md
- [X] T002 Update `src/lib/db/schema.ts` — ensure `post_status` pgEnum, `users` table (all fields from data-model.md), `posts` table (userId FK, status, isScheduled, scheduledFor, publishedAt, linkedInPostId, errorMessage), `publish_logs` table (postId FK, userId FK, outcome enum, errorCode, errorDetail, attemptedAt)
- [X] T003 Verify all four migrations exist in `src/lib/db/migrations/`: `0000_init.sql`, `0001_drop_scheduled_unique.sql`, `0002_users_posts_clean.sql`, `0003_add_is_scheduled.sql` — create any missing with correct SQL per data-model.md

**Checkpoint**: Schema and types ready. No runtime code needed yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared server utilities used by every API route and service

**⚠️ CRITICAL**: All API routes depend on these. Complete before any user story phase.

- [X] T004 [P] Implement `src/lib/session.ts` — export `getCurrentUserId(request: Request): Promise<string | null>` reading `li_user_id` HttpOnly cookie; return `null` if absent
- [X] T005 [P] Implement `src/lib/db/client.ts` — export Drizzle client using `@neondatabase/serverless` + `DATABASE_URL` env var
- [X] T006 [P] Update `src/lib/linkedin/api.ts` — implement `getAccessToken(userId: string): Promise<string>` with fallback chain: DB `users.access_token` → `li_token` cookie → `LINKEDIN_ACCESS_TOKEN` env; implement `publishToLinkedIn(accessToken, content, imageUrl?)` calling UGC Posts API
- [X] T007 Update `src/services/generate.ts` — `generatePost({ userId, topic, tone?, includeImage? })` inserts DRAFT row with `status=DRAFT, isScheduled=false`, returns shape matching `/api/generate` contract response
- [X] T008 Update `src/services/publish.ts` — `publishPost(postId: string, userId: string)` validates post ownership + status=DRAFT, calls `getAccessToken`, calls LinkedIn UGC API, sets status=PUBLISHED (or FAILED on error), writes `publish_logs` row, returns `{ postId, status, linkedInPostId?, publishedAt?, errorMessage? }`

**Checkpoint**: Session, DB, LinkedIn client, and services ready. User story phases can begin.

---

## Phase 3: User Story 1 — Save Post as Draft (Priority: P1) 🎯 MVP

**Goal**: User generates post, clicks "Save as Draft", post persists with DRAFT status and appears in Draft tab.

**Independent Test**: Generate post → click Save as Draft → verify Draft tab shows post attributed to logged-in user after page refresh.

- [X] T009 [P] [US1] Implement `app/api/generate/route.ts` POST — read `li_user_id` cookie via `getCurrentUserId`, return 401 if absent; call `generatePost({ userId, topic, tone, includeImage })`; return 200 with contract shape `{ postId, topic, content, imageUrl, status, scheduledFor, isScheduled, createdAt }`; return 500 with `INTERNAL_ERROR` on failure
- [X] T010 [P] [US1] Implement `app/api/auth/linkedin/route.ts` GET — redirect to LinkedIn OAuth with `client_id`, `redirect_uri`, `scope=openid profile email w_member_social`, `state` nonce in cookie
- [X] T011 [P] [US1] Implement `app/api/auth/linkedin/callback/route.ts` GET — exchange code for tokens, fetch userinfo, upsert `users` row (match on `linkedin_id`), set `li_user_id` + `li_token` HttpOnly cookies, redirect to `/`
- [X] T012 [US1] Implement `app/api/auth/logout/route.ts` POST — clear `li_user_id` and `li_token` cookies, return 200
- [X] T013 [US1] Implement `app/(ui)/page.tsx` GenerateForm component — topic input, tone select, includeImage toggle; on submit calls `POST /api/generate` via React Query `useMutation`; on success stores result in state for GeneratedPreview
- [X] T014 [US1] Implement GeneratedPreview component in `app/(ui)/page.tsx` — displays topic, content, imageUrl; "Save as Draft" button triggers mutation; on success invalidates `['posts', 'DRAFT']` query; shows sonner toast on success/error

**Checkpoint**: User can authenticate, generate, and save a draft. Draft tab shows it after save.

---

## Phase 4: User Story 6 — View Posts by Tab (Priority: P1)

**Goal**: Authenticated user views Draft, Scheduled, Published tabs — each shows only their posts with correct status.

**Independent Test**: Create posts with different statuses; verify each tab shows only matching posts; verify other user's posts don't appear.

- [X] T015 [US6] Implement `app/api/posts/route.ts` GET — `getCurrentUserId` (401 if absent); validate `status` query param (400 `BAD_REQUEST` if invalid); query posts WHERE `userId = ?` AND optional `status` filter AND optional `isScheduled` filter; support `limit` (default 20, max 200) + `offset` pagination; return `{ posts: [...], total, limit, offset }` matching contract
- [X] T016 [US6] Implement Tabs UI in `app/(ui)/page.tsx` — shadcn/ui `Tabs` with three tabs: **Drafts** (`GET /api/posts?status=DRAFT&isScheduled=false`), **Scheduled** (`GET /api/posts?status=DRAFT&isScheduled=true`), **Published** (`GET /api/posts?status=PUBLISHED` merged with `?status=FAILED`); each tab uses `useQuery` with React Query v5; show post cards with topic, content preview, scheduledFor, status badge
- [X] T017 [US6] Implement pagination controls in `app/(ui)/page.tsx` — offset-based prev/next buttons per tab; update `offset` query param in React Query key; disable prev at offset=0, disable next when `offset + limit >= total`
- [X] T018 [US6] Implement `middleware.ts` — redirect unauthenticated requests (no `li_user_id` cookie) on `/(ui)` routes to `/auth`; allow `/api/auth/**` and `/auth` to pass through

**Checkpoint**: All three tabs render, paginate, and show only the current user's posts.

---

## Phase 5: User Story 2 — Edit a Draft Post (Priority: P2)

**Goal**: User edits topic/content of a draft, saves; status stays DRAFT, content updated, 3000-char limit enforced.

**Independent Test**: Edit draft content, save, verify status=DRAFT and changes persist on refresh; try >3000 chars, verify error shown.

- [X] T019 [US2] Implement `app/api/posts/[id]/route.ts` PATCH — `getCurrentUserId` (401 if absent); fetch post WHERE `id = ? AND userId = ?` (404 `POST_NOT_FOUND` if not found); reject if `status !== DRAFT` → 409 `INVALID_STATUS`; reject if `content.length > 3000` → 422 `CONTENT_TOO_LONG`; update only provided fields (`topic`, `content`, `scheduledFor`, `isScheduled`); return 200 with updated post matching contract
- [X] T020 [US2] Implement inline edit UI in `app/(ui)/page.tsx` DraftCard — "Edit" button toggles edit mode showing topic input + content textarea + save/cancel; on save calls `PATCH /api/posts/:id` via `useMutation`; on success updates React Query cache for `['posts', 'DRAFT']`; shows 422 error message if content too long; shows sonner toast on success/error

**Checkpoint**: Drafts are editable with content validation and status preserved.

---

## Phase 6: User Story 3 — Publish a Draft Post Immediately (Priority: P2)

**Goal**: "Publish Now" on a draft → LinkedIn post created → status=PUBLISHED → post moves to Published tab in real time.

**Independent Test**: Click "Publish Now" on draft → verify removed from Draft tab immediately (optimistic) → appears in Published tab → LinkedIn post created.

- [X] T021 [US3] Implement `app/api/post/route.ts` POST — `getCurrentUserId` (401 if absent); validate `postId` present (400 `BAD_REQUEST`); fetch post with ownership check (404 if not found); reject if `status !== DRAFT && status !== APPROVED` → 409 `INVALID_STATUS`; call `publishPost(postId, userId)`; return 200 `{ postId, status, linkedInPostId, publishedAt }` on success, 502 `PUBLISH_FAILED` on LinkedIn error
- [X] T022 [US3] Implement `app/api/approve/route.ts` POST approve action — `getCurrentUserId` (401); validate `postId` + `action` (400 if missing/invalid); for `action=approve`: fetch post (404 if not owned), reject non-DRAFT → 409, set status=APPROVED, call `publishPost`, return 200 or 502 per contract
- [X] T023 [US3] Add "Publish Now" button to DraftCard in `app/(ui)/page.tsx` — `useMutation` calling `POST /api/post`; `onMutate`: cancel `['posts', 'DRAFT']` queries, snapshot cache, remove post from DRAFT cache (optimistic); `onSuccess`: sonner success toast + `invalidateQueries(['posts'])`; `onError`: rollback snapshot + sonner error toast

**Checkpoint**: Publish Now works with optimistic UI removal and Published tab reflects new post.

---

## Phase 7: User Story 4 — Schedule a Draft Post (Priority: P2)

**Goal**: User picks future date, confirms Schedule → post moves to Scheduled tab immediately; cron publishes at 08:00 UTC on that date.

**Independent Test**: Schedule draft for tomorrow → verify moves to Scheduled tab with correct date → verify no longer in Drafts tab.

- [X] T024 [US4] Extend `app/api/posts/[id]/route.ts` PATCH (already implemented in T019) — ensure `isScheduled: true` + `scheduledFor` update path works correctly; `isScheduled` only settable to `true` via explicit schedule action (not edit)
- [X] T025 [US4] Implement `app/api/cron/daily/route.ts` GET — verify `CRON_SECRET` header (401 if absent/mismatch); find all users with `is_scheduled=true` posts where `scheduled_for <= today`; for each, call `publishPost(postId, userId)`; return summary `{ published: n, failed: m }`
- [X] T026 [US4] Add "Schedule" action to DraftCard in `app/(ui)/page.tsx` — date picker input (shadcn/ui or native date input); on confirm calls `PATCH /api/posts/:id` with `{ scheduledFor, isScheduled: true }`; `onMutate` optimistically removes post from `['posts', 'DRAFT', { isScheduled: false }]` cache; `onSuccess`: invalidate all `['posts']` queries + sonner toast; `onError`: rollback + error toast

**Checkpoint**: Scheduling moves post to Scheduled tab instantly; cron can auto-publish.

---

## Phase 8: User Story 5 — Reject a Draft Post (Priority: P3)

**Goal**: "Reject" on a draft → status=REJECTED → removed from Draft tab immediately; not visible in any active tab.

**Independent Test**: Click Reject → verify post disappears from Draft tab immediately → not in Scheduled or Published tabs.

- [X] T027 [US5] Implement reject action in `app/api/approve/route.ts` POST — for `action=reject`: fetch post with ownership check (404 if not owned); reject if `status !== DRAFT` → 409 `INVALID_STATUS`; set `status=REJECTED`; return 200 `{ postId, status: "REJECTED" }` (already partially handled in T022 — ensure reject branch complete)
- [X] T028 [US5] Add "Reject" button to DraftCard in `app/(ui)/page.tsx` — `useMutation` calling `POST /api/approve` with `{ postId, action: "reject" }`; `onMutate` optimistically removes post from DRAFT cache; `onSuccess`: sonner confirmation toast ("Post rejected") + `invalidateQueries(['posts'])`; `onError`: rollback snapshot + error toast

**Checkpoint**: All five draft actions (Edit, Schedule, Publish Now, Approve, Reject) functional. Full state machine implemented.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T029 [P] Wire up `app/layout.tsx` — wrap app in React Query `QueryClientProvider` and sonner `Toaster` (from `src/components/providers.tsx`)
- [X] T030 [P] Implement `app/auth/page.tsx` — "Connect LinkedIn" button linking to `GET /api/auth/linkedin`; show if unauthenticated
- [X] T031 [P] Add status badges to PostCards in `app/(ui)/page.tsx` using shadcn/ui `Badge` — color-coded: DRAFT=gray, SCHEDULED=blue, PUBLISHED=green, FAILED=red, REJECTED=muted
- [X] T032 Validate edge cases in API routes — block publish/schedule/reject on already-PUBLISHED or REJECTED posts (409 INVALID_STATUS); block edit on SCHEDULED posts; ensure cross-user 404 (not 403) on all routes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (US1)**: Depends on Phase 2 — can start as soon as Phase 2 done
- **Phase 4 (US6)**: Depends on Phase 2 — can run in parallel with Phase 3
- **Phase 5 (US2)**: Depends on Phase 2, benefits from Phase 3/4 for UI context
- **Phase 6 (US3)**: Depends on Phase 2, requires `publishPost` service from T008
- **Phase 7 (US4)**: Depends on T019 (PATCH route); T025 cron is independent of UI
- **Phase 8 (US5)**: Depends on T022 (approve route shell); T027 completes it
- **Final Phase**: Depends on all user story phases complete

### Within Each Phase

- Tasks marked [P] → different files, no inter-task dependency, run in parallel
- Models/services before routes; routes before UI mutations
- Optimistic update logic requires the `useMutation` + `useQuery` keys to be consistent

### Parallel Opportunities

```
Phase 2 parallel group: T004, T005, T006 (session, DB client, LinkedIn API)

Phase 3 parallel group: T009, T010, T011 (generate route, OAuth routes)

Phase 4 parallel group: T015 then T016, T017, T018

Final Phase parallel group: T029, T030, T031
```

---

## Implementation Strategy

### MVP (User Stories 1 + 6 only)

1. Phase 1: Setup (schema, types, migrations)
2. Phase 2: Foundational (session, DB client, services)
3. Phase 3: US1 (generate + save draft)
4. Phase 4: US6 (list by tab)
5. **STOP and VALIDATE**: Can generate, save, and view drafts end-to-end

### Incremental Delivery

1. MVP above → working Draft tab with new posts
2. Phase 5 (US2) → editable drafts
3. Phase 6 (US3) → publish immediately
4. Phase 7 (US4) → scheduling + cron
5. Phase 8 (US5) → reject action
6. Final Phase → polish

### Suggested Execution Order (single developer)

T001 → T002 → T003 → [T004, T005, T006 parallel] → T007 → T008 → [T009, T010, T011 parallel] → T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T027 → T028 → [T029, T030, T031 parallel] → T032
