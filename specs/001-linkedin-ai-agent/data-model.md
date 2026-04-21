# Data Model: LinkedIn AI Content Agent

**Date**: 2026-04-21
**Branch**: `001-linkedin-ai-agent`

---

## Entities

### Post

Central entity. One Post is created per daily run.

| Field          | Type        | Description                                          |
|----------------|-------------|------------------------------------------------------|
| id             | UUID        | Primary key                                          |
| topic          | TEXT        | AI-generated topic for the day                       |
| content        | TEXT        | Full post body (hook + paragraphs + CTA)             |
| imageUrl       | TEXT (null) | URL of generated quote-card image; null if skipped   |
| status         | ENUM        | See State Machine below                              |
| approvalMode   | BOOLEAN     | Whether manual approval was required for this post   |
| linkedInPostId | TEXT (null) | ID returned by LinkedIn after successful publish     |
| errorMessage   | TEXT (null) | Last error message; populated on failure             |
| createdAt      | TIMESTAMP   | When the post was generated                          |
| publishedAt    | TIMESTAMP (null) | When the post was successfully published        |
| scheduledFor   | DATE        | Calendar date this post is intended for (unique)     |

**Unique constraint**: `scheduledFor` — enforces one post per calendar day.

#### Post Status State Machine

```
DRAFT → APPROVED → PUBLISHED
DRAFT → REJECTED
DRAFT → PUBLISHED  (auto-publish mode, approval skipped)
PUBLISHED → FAILED (if LinkedIn returns error after initial success is unexpected; log only)
DRAFT → FAILED     (if publish attempt fails before confirmation)
```

| Status    | Meaning                                              |
|-----------|------------------------------------------------------|
| DRAFT     | Generated, not yet published or reviewed             |
| APPROVED  | Operator approved; queued for publish                |
| REJECTED  | Operator rejected; will not be published             |
| PUBLISHED | Successfully posted to LinkedIn                      |
| FAILED    | Publish attempt made but LinkedIn returned an error  |

---

### PublishLog

Audit trail for every publish attempt. A Post may have multiple log entries (e.g., retry after failure).

| Field      | Type      | Description                                     |
|------------|-----------|-------------------------------------------------|
| id         | UUID      | Primary key                                     |
| postId     | UUID      | Foreign key → Post.id                           |
| outcome    | ENUM      | `SUCCESS` or `FAILURE`                          |
| errorCode  | TEXT (null) | LinkedIn API error code or automation error   |
| errorDetail| TEXT (null) | Human-readable error detail                   |
| attemptedAt| TIMESTAMP | When the publish attempt was made               |

---

### DailyLock (KV store)

Lightweight idempotency key in Vercel KV. Prevents duplicate generation runs for the same day.

| Key pattern       | Value       | TTL   |
|-------------------|-------------|-------|
| `lock:YYYY-MM-DD` | `"acquired"` | 25h  |

A run acquires the lock at start. If the lock already exists, the run aborts without generating content.

---

## Relationships

```
Post 1 ──< PublishLog (one post → many log entries)
```

---

## Validation Rules

- `Post.content` must be non-empty and ≤ 3000 characters (LinkedIn limit).
- `Post.scheduledFor` must be unique — enforced at DB level.
- `Post.status` transitions are enforced at application level; invalid transitions raise an error.
- `PublishLog.postId` must reference an existing Post.

---

## Storage Mapping

| Entity      | Storage         | Notes                               |
|-------------|-----------------|-------------------------------------|
| Post        | PostgreSQL      | Primary relational store            |
| PublishLog  | PostgreSQL      | Relational, foreign key to Post     |
| DailyLock   | Vercel KV       | Ephemeral, TTL-based                |
| Image files | Vercel Blob     | Referenced by URL in Post.imageUrl  |
