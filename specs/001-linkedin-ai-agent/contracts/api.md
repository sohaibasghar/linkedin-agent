# API Contracts: LinkedIn AI Content Agent

**Date**: 2026-04-21
**Branch**: `001-linkedin-ai-agent`
**Base URL**: `/api`

All endpoints accept and return `application/json`. Authentication is via a shared secret header (`X-API-Key`) for internal/cron callers. Operator UI calls use session-based auth.

---

## POST /api/generate

Trigger content generation for a given date. Called by Vercel Cron (or manually).

### Request

```json
{
  "date": "2026-04-21"       // optional; defaults to today (UTC)
}
```

### Response — 201 Created

```json
{
  "postId": "uuid",
  "topic": "string",
  "content": "string",
  "imageUrl": "string | null",
  "status": "DRAFT | PUBLISHED",
  "scheduledFor": "2026-04-21"
}
```

### Response — 409 Conflict (already generated for date)

```json
{
  "error": "DUPLICATE_DATE",
  "message": "A post is already scheduled for 2026-04-21",
  "existingPostId": "uuid"
}
```

### Response — 422 Unprocessable Entity (content generation failed)

```json
{
  "error": "GENERATION_FAILED",
  "message": "string"
}
```

---

## POST /api/approve

Approve or reject a draft post.

### Request

```json
{
  "postId": "uuid",
  "action": "approve | reject"
}
```

### Response — 200 OK (approve)

```json
{
  "postId": "uuid",
  "status": "PUBLISHED",
  "linkedInPostId": "string",
  "publishedAt": "2026-04-21T10:00:00Z"
}
```

### Response — 200 OK (reject)

```json
{
  "postId": "uuid",
  "status": "REJECTED"
}
```

### Response — 404 (approve: post not found)

```json
{
  "error": "POST_NOT_FOUND",
  "message": "No draft post found with id: uuid"
}
```

### Response — 409 (approve: post not in DRAFT status)

```json
{
  "error": "INVALID_STATUS",
  "message": "Post uuid is in status PUBLISHED; approve/reject only allowed on DRAFT",
  "currentStatus": "PUBLISHED"
}
```

### Response — 502 (approve: LinkedIn publish failed)

```json
{
  "error": "PUBLISH_FAILED",
  "message": "string",
  "postId": "uuid",
  "status": "FAILED"
}
```

---

## GET /api/posts

Retrieve post history with optional filtering.

### Query Parameters

| Param    | Type   | Default  | Description                                          |
|----------|--------|----------|------------------------------------------------------|
| status   | string | (all)    | Filter by status: DRAFT, APPROVED, PUBLISHED, FAILED, REJECTED |
| limit    | number | 20       | Max results returned (max 100)                       |
| offset   | number | 0        | Pagination offset                                    |
| from     | date   | (none)   | Filter posts scheduled on or after this date         |
| to       | date   | (none)   | Filter posts scheduled on or before this date        |

### Response — 200 OK

```json
{
  "posts": [
    {
      "postId": "uuid",
      "topic": "string",
      "content": "string",
      "imageUrl": "string | null",
      "status": "PUBLISHED",
      "scheduledFor": "2026-04-21",
      "createdAt": "2026-04-21T06:00:00Z",
      "publishedAt": "2026-04-21T10:00:00Z | null",
      "linkedInPostId": "string | null",
      "errorMessage": "string | null"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

---

## POST /api/post

Publish a specific post immediately (bypasses approval workflow). For manual one-off publishing.

### Request

```json
{
  "postId": "uuid"
}
```

### Response — 200 OK

```json
{
  "postId": "uuid",
  "status": "PUBLISHED",
  "linkedInPostId": "string",
  "publishedAt": "2026-04-21T10:05:00Z"
}
```

### Response — error shapes

Same 404 / 409 / 502 shapes as `/api/approve` equivalents.

---

## Cron Endpoint

### POST /api/cron/daily

Called by Vercel Cron scheduler. Protected by `X-API-Key` header (Vercel injects `CRON_SECRET`).

Internally calls the same logic as `POST /api/generate`. Not intended for direct operator use.

### Response — 200 OK

```json
{
  "triggered": true,
  "date": "2026-04-21",
  "postId": "uuid",
  "status": "DRAFT | PUBLISHED"
}
```

### Response — 409 (already ran today)

```json
{
  "triggered": false,
  "reason": "DUPLICATE_DATE",
  "existingPostId": "uuid"
}
```

---

## Error Shape (standard)

All error responses follow:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```
