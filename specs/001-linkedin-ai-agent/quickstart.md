# Quickstart: LinkedIn AI Content Agent

**Date**: 2026-04-21
**Branch**: `001-linkedin-ai-agent`

---

## Prerequisites

- Node.js 20+
- PostgreSQL database (Vercel Postgres, Neon, or local)
- Vercel account (for deployment and KV/Blob)
- OpenAI API key
- LinkedIn Developer App with OAuth 2.0 credentials

---

## Environment Variables

Create `.env.local` (local) or configure in Vercel dashboard (production):

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/linkedin_agent

# Vercel KV (Redis) — for idempotency locks
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Vercel Blob — for image storage
BLOB_READ_WRITE_TOKEN=

# OpenAI
OPENAI_API_KEY=

# LinkedIn OAuth 2.0
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_ACCESS_TOKEN=

# Internal cron protection
CRON_SECRET=

# Feature flags
AUTO_PUBLISH=false        # Set true to skip manual approval
IMAGE_GENERATION=true     # Set false to disable image generation
```

---

## Local Setup

```bash
# Install dependencies
npm install

# Run DB migrations
npm run db:migrate

# Start dev server
npm run dev
```

---

## Trigger Content Generation (manual)

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $CRON_SECRET" \
  -d '{"date": "2026-04-21"}'
```

---

## Approve a Draft

```bash
curl -X POST http://localhost:3000/api/approve \
  -H "Content-Type: application/json" \
  -d '{"postId": "<uuid>", "action": "approve"}'
```

---

## View Post History

```bash
curl http://localhost:3000/api/posts?status=PUBLISHED&limit=10
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel dashboard
3. Set all environment variables
4. Add cron job in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 8 * * *"
    }
  ]
}
```

5. Deploy — the cron will fire daily at 08:00 UTC.

---

## Auto-Publish Mode

Set `AUTO_PUBLISH=true` in environment. Content will be published immediately after generation without waiting for approval. Recommended only after validating content quality manually for several cycles.
