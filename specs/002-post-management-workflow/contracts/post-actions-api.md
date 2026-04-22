# Contract: Post Actions API

**Auth**: `li_user_id` HttpOnly cookie required on all endpoints. Returns `401` if absent.

---

## POST /api/approve

Approve (publish) or reject a draft post. Only permitted on posts owned by the authenticated user.

### Request Body

```json
{
  "postId": "uuid",
  "action": "approve | reject"
}
```

### Action: `approve`

Transitions post `DRAFT → APPROVED → PUBLISHED` (or `FAILED` if LinkedIn API call fails).

#### Response 200

```json
{
  "postId": "uuid",
  "status": "PUBLISHED",
  "linkedInPostId": "urn:li:ugcPost:...",
  "publishedAt": "ISO-8601"
}
```

#### Response 502 (LinkedIn publish failed)

```json
{
  "error": "PUBLISH_FAILED",
  "message": "string",
  "postId": "uuid",
  "status": "FAILED"
}
```

### Action: `reject`

Transitions post `DRAFT → REJECTED`.

#### Response 200

```json
{
  "postId": "uuid",
  "status": "REJECTED"
}
```

### Error Responses

| Status | Code            | When                                       |
|--------|-----------------|--------------------------------------------|
| 400    | BAD_REQUEST     | Missing postId or action; invalid action value |
| 401    | UNAUTHENTICATED | No li_user_id cookie                       |
| 404    | POST_NOT_FOUND  | Post not found or not owned by this user   |
| 409    | INVALID_STATUS  | Post is not DRAFT                          |
| 500    | INTERNAL_ERROR  | Unexpected server error                    |
| 502    | PUBLISH_FAILED  | LinkedIn API returned an error             |

---

## POST /api/post

Directly publish a draft post to LinkedIn ("Publish Now" from GeneratedPreview).

> Post must be DRAFT and owned by the authenticated user. No approval step — publishes immediately.

### Request Body

```json
{
  "postId": "uuid"
}
```

### Response 200

```json
{
  "postId": "uuid",
  "status": "PUBLISHED",
  "linkedInPostId": "urn:li:ugcPost:...",
  "publishedAt": "ISO-8601"
}
```

### Error Responses

| Status | Code            | When                                       |
|--------|-----------------|--------------------------------------------|
| 400    | BAD_REQUEST     | Missing postId                             |
| 401    | UNAUTHENTICATED | No li_user_id cookie                       |
| 404    | POST_NOT_FOUND  | Post not found or not owned by this user   |
| 409    | INVALID_STATUS  | Post is not DRAFT or APPROVED              |
| 500    | INTERNAL_ERROR  | Unexpected server error                    |
| 502    | PUBLISH_FAILED  | LinkedIn API returned an error             |

---

## POST /api/generate

Generate a new draft post using AI (topic → content → optional image).

### Request Body

```json
{
  "topic": "string",
  "tone": "string (optional)",
  "includeImage": true
}
```

### Response 200

```json
{
  "postId": "uuid",
  "topic": "string",
  "content": "string",
  "imageUrl": "string | null",
  "status": "DRAFT",
  "scheduledFor": "YYYY-MM-DD",
  "isScheduled": false,
  "createdAt": "ISO-8601"
}
```

### Error Responses

| Status | Code            | When                          |
|--------|-----------------|-------------------------------|
| 401    | UNAUTHENTICATED | No li_user_id cookie          |
| 500    | INTERNAL_ERROR  | AI generation or DB insert failed |
