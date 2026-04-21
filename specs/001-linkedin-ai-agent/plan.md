# Implementation Plan: LinkedIn AI Content Agent

**Branch**: `001-linkedin-ai-agent` | **Date**: 2026-04-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-linkedin-ai-agent/spec.md`

---

## Summary

Build an AI-powered system that generates, optionally approves, and publishes one LinkedIn post per day. Content (text + quote-card image) is generated via OpenAI. Posts are stored in PostgreSQL, deduplicated via a KV lock, and published to LinkedIn through the official API. A minimal web UI allows operators to review drafts and approve or reject them. The system is hosted on Vercel with a native daily cron trigger.

---

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20
**Primary Dependencies**: Next.js 14 (App Router), OpenAI SDK, Drizzle ORM, `@vercel/kv`, `@vercel/blob`, Playwright
**Storage**: PostgreSQL (Vercel Postgres / Neon) + Vercel KV (idempotency) + Vercel Blob (images)
**Testing**: Vitest (unit/integration), Playwright (end-to-end)
**Target Platform**: Vercel (serverless functions + edge cron)
**Project Type**: web-service
**Performance Goals**: Daily generation completes within 60 seconds; post history page loads in under 2 seconds
**Constraints**: LinkedIn post content ≤ 3000 characters; one post per calendar day; OpenAI rate limits accommodated
**Scale/Scope**: Single LinkedIn account, single operator, ~365 posts/year

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is a blank template — no project-specific gates are defined. No violations to evaluate. All architectural decisions are documented in [research.md](./research.md) with rationale and alternatives considered.

**Post-design re-check**: No new violations introduced. The design uses a single Next.js project (no unnecessary projects), a direct ORM pattern (no repository abstraction layer added), and standard REST contracts.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-linkedin-ai-agent/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── generate/
│   │   └── route.ts          # POST /api/generate
│   ├── approve/
│   │   └── route.ts          # POST /api/approve
│   ├── post/
│   │   └── route.ts          # POST /api/post
│   ├── posts/
│   │   └── route.ts          # GET /api/posts
│   └── cron/
│       └── daily/
│           └── route.ts      # POST /api/cron/daily (Vercel Cron)
├── (ui)/
│   ├── page.tsx              # Post history dashboard
│   └── layout.tsx
└── layout.tsx

src/
├── lib/
│   ├── ai/
│   │   ├── topic.ts          # Topic generation
│   │   ├── content.ts        # Post content generation
│   │   └── image.ts          # Quote-card image generation
│   ├── linkedin/
│   │   ├── api.ts            # LinkedIn REST API client
│   │   └── automation.ts     # Playwright fallback
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema (Post, PublishLog)
│   │   ├── migrations/       # SQL migrations
│   │   └── client.ts         # DB connection
│   ├── kv/
│   │   └── lock.ts           # Daily idempotency lock
│   └── storage/
│       └── blob.ts           # Vercel Blob image upload
├── services/
│   ├── generate.ts           # Orchestrates topic → content → image → save
│   └── publish.ts            # Orchestrates approve → LinkedIn publish → log
└── types/
    └── index.ts              # Shared TypeScript types

tests/
├── unit/
│   ├── ai/
│   ├── services/
│   └── lib/
├── integration/
│   └── api/
└── e2e/
    └── approval-flow.spec.ts

vercel.json                   # Cron schedule config
drizzle.config.ts
```

**Structure Decision**: Single Next.js project. API routes live in `app/api/`. Business logic is in `src/` and imported by route handlers. Keeps framework glue separate from domain logic.

---

## Complexity Tracking

No constitution violations. No complexity justification required.
