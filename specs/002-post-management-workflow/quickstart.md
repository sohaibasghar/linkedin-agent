# Quickstart: Post Management Workflow

**Feature**: 002-post-management-workflow

## Overview

End-to-end flow from post generation to LinkedIn publication. Every action is scoped to the authenticated user via `li_user_id` cookie.

## Prerequisites

1. LinkedIn OAuth connected → `li_user_id` cookie set (UUID referencing `users.id`)
2. Database migrations applied in order:
   ```
   0000_init.sql
   0001_drop_scheduled_unique.sql
   0002_users_posts_clean.sql
   0003_add_is_scheduled.sql
   ```
3. Env vars: `DATABASE_URL`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `OPENAI_API_KEY`, `BLOB_READ_WRITE_TOKEN`

## Core Flows

### 1. Generate → Save as Draft

```
POST /api/generate
  body: { subject: "AI in product design", withImage: true }
  → 200: { postId, topic, content, imageUrl, status: "DRAFT", scheduledFor }

Result: Post row in DB with status=DRAFT, is_scheduled=FALSE
UI: Post appears in Draft tab immediately (React Query cache invalidated)
```

### 2. Schedule a Draft

```
PATCH /api/posts/:id
  body: { scheduledFor: "2026-04-25", isScheduled: true }
  → 200: { postId, status: "DRAFT", isScheduled: true, scheduledFor }

Result: is_scheduled flipped to TRUE
UI: Post moves from Draft tab → Scheduled tab (optimistic update removes from Draft cache)
Cron: /api/cron/daily picks it up at 08:00 UTC on scheduledFor date
```

### 3. Publish Now (from GeneratedPreview)

```
POST /api/post
  body: { postId: "uuid" }
  → 200: { postId, status: "PUBLISHED", linkedInPostId, publishedAt }

Result: LinkedIn UGC post created; DB status=PUBLISHED
UI: Post removed from Draft tab immediately (optimistic); appears in Published tab on refetch
```

### 4. Approve → Publish (from Draft tab)

```
POST /api/approve
  body: { postId: "uuid", action: "approve" }
  → 200: { postId, status: "PUBLISHED", linkedInPostId, publishedAt }
  or 502: { error: "PUBLISH_FAILED", status: "FAILED" }

Intermediate: status briefly = APPROVED before publishPost() runs
Result: status=PUBLISHED or status=FAILED (with errorMessage)
```

### 5. Reject a Draft

```
POST /api/approve
  body: { postId: "uuid", action: "reject" }
  → 200: { postId, status: "REJECTED" }

Result: Post hidden from Draft and Scheduled tabs; not shown in UI
```

### 6. Edit a Draft

```
PATCH /api/posts/:id
  body: { content: "updated text" }   ← only changed fields needed
  → 200: { postId, topic, content, scheduledFor, isScheduled, status: "DRAFT" }

Constraint: only allowed when status=DRAFT; content ≤ 3000 chars
```

## Tab Queries

| Tab       | API call                                    | Shows                          |
|-----------|---------------------------------------------|--------------------------------|
| Drafts    | `GET /api/posts?status=DRAFT&isScheduled=false` | Unscheduled drafts          |
| Scheduled | `GET /api/posts?status=DRAFT&isScheduled=true`  | Explicitly scheduled drafts |
| Published | `GET /api/posts?status=PUBLISHED` + `?status=FAILED` | Published + failed posts |

## Status Machine

```
DRAFT (is_scheduled=false)
  ├─ Schedule   → DRAFT (is_scheduled=true)
  ├─ Publish Now → PUBLISHED
  ├─ Approve    → APPROVED → PUBLISHED | FAILED
  └─ Reject     → REJECTED

DRAFT (is_scheduled=true)
  └─ Cron 08:00 UTC → PUBLISHED | FAILED
```

## Cron Job

`/api/cron/daily` — runs daily at `0 8 * * *` (Vercel Cron).

Finds first registered user → publishes oldest `is_scheduled=true` draft where `scheduled_for <= today`.

**Limitation**: single-user only. Multi-user cron is out of scope.

## Key Implementation Notes

- **Optimistic updates**: `onMutate` snapshots DRAFT query cache, removes post immediately. `onError` restores snapshot. `onSuccess` calls `invalidateQueries(['posts'])`.
- **Ownership**: every API route reads `li_user_id` cookie and filters `WHERE user_id = ?`. Returns 404 (not 403) on cross-user access to avoid leaking post existence.
- **Token retrieval**: `getAccessToken()` → DB `users.access_token` first → `li_token` cookie fallback → `LINKEDIN_ACCESS_TOKEN` env fallback.
- **Content limit**: `PATCH /api/posts/:id` returns 422 `CONTENT_TOO_LONG` if content > 3000 chars.
