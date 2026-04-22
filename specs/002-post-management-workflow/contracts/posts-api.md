# Contract: Posts API

**Base path**: `/api/posts`
**Auth**: `li_user_id` HttpOnly cookie required on all endpoints. Returns `401` if absent.

---

## GET /api/posts

Retrieve a paginated list of the authenticated user's posts.

### Query Parameters

| Parameter   | Type    | Required | Description                                    |
|-------------|---------|----------|------------------------------------------------|
| status      | string  | No       | Filter by status: DRAFT, PUBLISHED, FAILED, REJECTED |
| isScheduled | boolean | No       | `true` = scheduled drafts only; `false` = unscheduled drafts only |
| limit       | integer | No       | Page size (default 20, max 200)               |
| offset      | integer | No       | Pagination offset (default 0)                 |
| from        | date    | No       | Filter scheduled_for ≥ this date (YYYY-MM-DD) |
| to          | date    | No       | Filter scheduled_for ≤ this date (YYYY-MM-DD) |

### Response 200

```json
{
  "posts": [
    {
      "postId": "uuid",
      "topic": "string",
      "content": "string",
      "imageUrl": "string | null",
      "status": "DRAFT | APPROVED | PUBLISHED | FAILED | REJECTED",
      "isScheduled": false,
      "scheduledFor": "YYYY-MM-DD",
      "createdAt": "ISO-8601",
      "publishedAt": "ISO-8601 | null",
      "linkedInPostId": "string | null",
      "errorMessage": "string | null"
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

### Error Responses

| Status | Code            | When                          |
|--------|-----------------|-------------------------------|
| 400    | BAD_REQUEST     | Invalid status value          |
| 401    | UNAUTHENTICATED | No li_user_id cookie          |

---

## PATCH /api/posts/:id

Update a draft post's topic, content, scheduled date, or isScheduled flag.

> Only permitted when post status = `DRAFT` and post is owned by the authenticated user.

### Request Body

```json
{
  "topic": "string (optional)",
  "content": "string (optional, ≤ 3000 chars)",
  "scheduledFor": "YYYY-MM-DD (optional)",
  "isScheduled": true
}
```

### Response 200

```json
{
  "postId": "uuid",
  "topic": "string",
  "content": "string",
  "scheduledFor": "YYYY-MM-DD",
  "isScheduled": true,
  "status": "DRAFT"
}
```

### Error Responses

| Status | Code            | When                                     |
|--------|-----------------|------------------------------------------|
| 401    | UNAUTHENTICATED | No li_user_id cookie                     |
| 404    | POST_NOT_FOUND  | Post not found or not owned by this user |
| 409    | INVALID_STATUS  | Post is not DRAFT                        |
| 422    | CONTENT_TOO_LONG| content > 3000 characters               |
