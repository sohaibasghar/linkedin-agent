# Implementation Plan: Post Management Workflow

**Branch**: `002-post-management-workflow` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)

> **User directive**: Skip tests — no test tasks or test files will be generated.

## Summary

Refine the existing post management system to enforce a clean, explicit state machine for post lifecycle: `Draft → Scheduled | Published | Rejected`. Every post is user-scoped. The four draft actions (Edit, Schedule, Publish Now, Reject) each produce a deterministic status transition that updates the UI in real time via React Query optimistic updates. The `isScheduled` boolean (already added) cleanly separates the Draft and Scheduled tabs without timezone ambiguity.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20
**Primary Dependencies**: Next.js 14 (App Router), Drizzle ORM, @tanstack/react-query v5, shadcn/ui + Tailwind CSS v3, sonner (toasts)
**Storage**: PostgreSQL via Neon serverless (`@neondatabase/serverless`)
**Testing**: Skipped per user directive
**Target Platform**: Web (Vercel Edge-compatible Next.js deployment)
**Project Type**: Full-stack web application (App Router API routes + React client)
**Performance Goals**: Tab updates within 1 second of action; optimistic UI removes latency perception
**Constraints**: LinkedIn post content ≤ 3000 chars; posts are user-scoped (userId FK enforced at DB + API layer)
**Scale/Scope**: Single authenticated user per session; personal LinkedIn account

## Constitution Check

Constitution file is a placeholder template — no enforced gates apply. Proceeding without gate violations.

> **User directive respected**: No test gates evaluated.

## Project Structure

### Documentation (this feature)

```text
specs/002-post-management-workflow/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   ├── posts-api.md
│   └── post-actions-api.md
└── quickstart.md        ← Phase 1 output
```

### Source Code (relevant paths)

```text
app/
├── (ui)/
│   └── page.tsx                  # Dashboard: GenerateForm, GeneratedPreview, Tabs
└── api/
    ├── generate/route.ts         # POST — create draft post
    ├── posts/
    │   ├── route.ts              # GET  — list posts (status + isScheduled filters)
    │   └── [id]/route.ts         # PATCH — edit draft (topic, content, scheduledFor, isScheduled)
    ├── approve/route.ts          # POST — approve (publish) or reject a draft
    ├── post/route.ts             # POST — direct publish (GeneratedPreview "Post Now")
    └── auth/
        ├── linkedin/
        │   ├── route.ts          # GET  — OAuth redirect
        │   └── callback/route.ts # GET  — OAuth callback, upsert user
        └── logout/route.ts       # POST — clear session cookies

src/
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema: users, posts, publish_logs
│   │   ├── client.ts             # Neon + Drizzle client
│   │   └── migrations/           # SQL migration files
│   ├── linkedin/api.ts           # LinkedIn UGC Posts API client
│   ├── ai/                       # topic.ts, content.ts, image.ts
│   ├── storage/blob.ts           # @vercel/blob image upload
│   └── session.ts                # getCurrentUserId(request)
├── services/
│   ├── generate.ts               # generatePost(options) → DRAFT row
│   └── publish.ts                # publishPost(postId) → PUBLISHED | FAILED
└── types/index.ts                # PostStatus enum, shared interfaces
```

**Structure Decision**: Existing App Router monorepo structure retained. No new top-level directories needed.

## Phase 0: Research

*Research is minimal — tech stack is fixed and existing. Key decisions documented.*
