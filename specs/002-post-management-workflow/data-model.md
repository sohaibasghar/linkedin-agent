# Data Model: Post Management Workflow

**Feature**: 002-post-management-workflow
**Date**: 2026-04-22

## Entities

### User

Represents an authenticated LinkedIn account holder.

| Field            | Type        | Constraints          | Description                              |
|------------------|-------------|----------------------|------------------------------------------|
| id               | UUID        | PK, default random   | Internal identifier                      |
| linkedin_id      | TEXT        | UNIQUE, NOT NULL     | LinkedIn `sub` claim (person URN base)   |
| email            | TEXT        | nullable             | From LinkedIn userinfo                   |
| name             | TEXT        | nullable             | From LinkedIn userinfo                   |
| avatar_url       | TEXT        | nullable             | From LinkedIn userinfo (`picture`)       |
| access_token     | TEXT        | nullable             | Current LinkedIn OAuth access token      |
| refresh_token    | TEXT        | nullable             | LinkedIn refresh token (if issued)       |
| token_expires_at | TIMESTAMP   | nullable             | Access token expiry                      |
| created_at       | TIMESTAMP   | NOT NULL, default NOW| Row creation time                        |
| updated_at       | TIMESTAMP   | NOT NULL, default NOW| Last upsert time                         |

**Upsert key**: `linkedin_id` — matched on OAuth callback; all token fields updated.

---

### Post

The core content unit. Owned by exactly one User.

| Field            | Type              | Constraints           | Description                                           |
|------------------|-------------------|-----------------------|-------------------------------------------------------|
| id               | UUID              | PK, default random    | Internal identifier                                   |
| user_id          | UUID              | FK → users.id CASCADE | Owner; never changes after creation                   |
| topic            | TEXT              | NOT NULL              | Short subject/headline                                |
| content          | TEXT              | NOT NULL, ≤ 3000 chars| LinkedIn post body                                    |
| image_url        | TEXT              | nullable              | Blob-stored image URL (DALL-E generated)              |
| status           | post_status ENUM  | NOT NULL, default DRAFT| Current lifecycle state                              |
| is_scheduled     | BOOLEAN           | NOT NULL, default FALSE| True when user explicitly scheduled this post        |
| linkedin_post_id | TEXT              | nullable              | LinkedIn UGC post URN (set on successful publish)     |
| error_message    | TEXT              | nullable              | Failure detail (set on FAILED)                        |
| scheduled_for    | DATE              | NOT NULL              | Target publication date (YYYY-MM-DD)                  |
| published_at     | TIMESTAMP         | nullable              | When the post was successfully published              |
| created_at       | TIMESTAMP         | NOT NULL, default NOW | Row creation time                                     |
| updated_at       | TIMESTAMP         | NOT NULL, default NOW | Last modification time                                |

#### Status Enum: `post_status`

```
DRAFT → APPROVED → PUBLISHED
      → REJECTED
      → SCHEDULED (is_scheduled=true, status still DRAFT)
APPROVED → PUBLISHED | FAILED
```

> Note: `SCHEDULED` is represented as `status=DRAFT, is_scheduled=TRUE` — not a separate enum value. This avoids an enum migration when scheduling behaviour changes.

#### Status Transition Rules

| From   | Action         | To        | is_scheduled |
|--------|----------------|-----------|--------------|
| DRAFT  | Edit + Save    | DRAFT     | unchanged    |
| DRAFT  | Publish Now    | PUBLISHED | —            |
| DRAFT  | Schedule       | DRAFT     | → TRUE       |
| DRAFT  | Reject         | REJECTED  | —            |
| DRAFT  | Cron publish   | PUBLISHED | —            |
| DRAFT  | Publish Now (fail) | FAILED | —           |
| APPROVED | Publish      | PUBLISHED | —           |

---

### Publish Log

Audit trail of every publish attempt.

| Field        | Type               | Constraints            | Description                           |
|--------------|--------------------|------------------------|---------------------------------------|
| id           | UUID               | PK, default random     | Internal identifier                   |
| post_id      | UUID               | FK → posts.id CASCADE  | The post that was published           |
| user_id      | UUID               | FK → users.id CASCADE  | The owner at time of publish          |
| outcome      | publish_outcome    | NOT NULL               | SUCCESS or FAILURE                    |
| error_code   | TEXT               | nullable               | Structured error code                 |
| error_detail | TEXT               | nullable               | Full error message                    |
| attempted_at | TIMESTAMP          | NOT NULL, default NOW  | When the publish was attempted        |

---

## Relationships

```
User 1 ──< Post *       (one user owns many posts)
Post 1 ──< PublishLog * (one post can have multiple publish attempts)
User 1 ──< PublishLog * (denormalized for audit queries)
```

## Validation Rules

| Entity | Field     | Rule                                          |
|--------|-----------|-----------------------------------------------|
| Post   | content   | Maximum 3000 characters                       |
| Post   | user_id   | Must match authenticated session's user ID    |
| Post   | status    | Edit only permitted when status = DRAFT        |
| Post   | is_scheduled | Set to TRUE only via explicit Schedule action|

## Migrations (in order)

| File                              | Purpose                                              |
|-----------------------------------|------------------------------------------------------|
| 0000_init.sql                     | Original posts + publish_logs tables                 |
| 0001_drop_scheduled_unique.sql    | Remove unique constraint on scheduled_for            |
| 0002_users_posts_clean.sql        | Full schema reset: add users, FK posts→users, clean  |
| 0003_add_is_scheduled.sql         | Add is_scheduled boolean to posts                    |
