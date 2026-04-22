# Research: Post Management Workflow

**Feature**: 002-post-management-workflow
**Date**: 2026-04-22

## Decision Log

### D-001: Explicit `isScheduled` Flag vs Date Comparison

**Decision**: Use `is_scheduled BOOLEAN DEFAULT FALSE` on the posts table.

**Rationale**: Comparing `scheduled_for` against "today" client-side is fragile — different timezones between user browser and server produce inconsistent results (e.g., UTC-5 user at 11 PM generates a post with a UTC tomorrow date, which never appears in either Draft or Scheduled tab). An explicit boolean is unambiguous and controlled entirely by user intent.

**Alternatives considered**:
- Server-side `WHERE scheduled_for > CURRENT_DATE` — still timezone-dependent on DB server timezone; adds query complexity.
- Separate `scheduled_posts` table — over-engineering; posts are the same entity in a different state.

**Status**: Implemented in migration `0003_add_is_scheduled.sql`.

---

### D-002: Optimistic Updates via React Query `onMutate`

**Decision**: Use React Query v5 `onMutate` to remove a post from the DRAFT cache immediately on "Publish Now", "Schedule", or "Reject" — before the API response arrives.

**Rationale**: Without optimistic updates, the post remains visible in the Draft tab during the round-trip (typically 500–2000ms for a LinkedIn API call), giving the impression that the action didn't work.

**Pattern**:
1. `onMutate` — cancel in-flight DRAFT queries, snapshot cache, remove post from all DRAFT caches.
2. API call runs.
3. `onSuccess` — toast notification + `invalidateQueries(['posts'])` to sync server state.
4. `onError` — rollback to snapshot + toast error.

**Alternatives considered**:
- `refetchQueries` only — too slow; user sees stale state during API latency.
- Local state management (useState) — duplicates server state; causes sync bugs.

**Status**: Implemented in `app/(ui)/page.tsx` for DraftsTab and ScheduledTab.

---

### D-003: User Ownership Enforcement at API Layer

**Decision**: All post-related API routes (`/api/posts`, `/api/posts/[id]`, `/api/approve`, `/api/post`) read `li_user_id` from the request cookie via `getCurrentUserId(request)` and filter/verify all DB operations against `posts.userId`.

**Rationale**: Client-side filtering is insufficient for security. The API must be the authoritative gate. A user who crafts a direct API request with another post's ID must receive a 404 (not a 403, to avoid leaking post existence).

**Alternatives considered**:
- Middleware-level ownership check — requires post lookup in middleware, adds latency to every request.
- Session-level token validation only — doesn't prevent cross-user post access.

**Status**: Implemented across all API routes.

---

### D-004: Token Storage in DB vs Cookie Only

**Decision**: LinkedIn access token is stored in `users.access_token` (DB) and also in the `li_token` HttpOnly cookie as a fallback.

**Rationale**: Cookie-only storage means the token is lost if cookies are cleared. DB storage allows the cron job (which has no cookie context) to retrieve the token, and allows the session to be restored from `li_user_id` cookie without re-authenticating.

**Alternatives considered**:
- KV store only (`@vercel/kv`) — optional dependency, breaks local dev without KV config.
- Cookie only — token lost on cookie clear; cron can't access it.

**Status**: Implemented in OAuth callback (`/api/auth/linkedin/callback/route.ts`) and `getAccessToken()` in `src/lib/linkedin/api.ts`.

---

### D-005: Scheduled Tab Populated by Cron at 08:00 UTC

**Decision**: Scheduled posts are auto-published by a Vercel Cron at `0 8 * * *`. The cron finds the first registered user and publishes their oldest scheduled draft for today.

**Rationale**: Vercel Cron is the simplest serverless scheduler; no additional infrastructure needed.

**Known limitation**: With multiple users, the cron only processes the first user. For a personal-use single-user agent this is acceptable.

**Status**: Implemented in `/api/cron/daily/route.ts`.

---

## Summary of NEEDS CLARIFICATION Resolutions

| # | Question | Resolution |
|---|----------|------------|
| 1 | Rejected posts: separate tab or hidden? | Hidden from active tabs in v1; no Rejected tab required. |
| 2 | Timezone handling for scheduled_for date? | Resolved via `isScheduled` boolean — no date comparison needed. |
| 3 | Multi-user cron? | Out of scope; personal tool, first user only. |
