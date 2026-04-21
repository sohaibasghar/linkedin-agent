# Research: LinkedIn AI Content Agent

**Date**: 2026-04-21
**Branch**: `001-linkedin-ai-agent`

---

## Decision: Runtime & Framework

**Decision**: TypeScript on Next.js (App Router) deployed to Vercel
**Rationale**: App Router enables server-side route handlers for cron endpoints and API routes without a separate backend. Vercel natively supports cron triggers via `vercel.json`. TypeScript gives type safety across the full stack.
**Alternatives considered**:
- Express.js standalone — rejected: more ops overhead, no native Vercel cron integration
- Python FastAPI — rejected: ecosystem mismatch with Vercel edge/serverless defaults
- Remix — rejected: smaller ecosystem for this use case

---

## Decision: AI Content Generation

**Decision**: OpenAI `gpt-4o` for topic + post generation; OpenAI DALL·E 3 for image generation
**Rationale**: Single API surface for both text and image generation minimises integration complexity. GPT-4o produces LinkedIn-quality long-form structured text. DALL·E 3 produces clean quote-card visuals.
**Alternatives considered**:
- Anthropic Claude API — viable alternative for text; no native image generation, would require a second provider
- Stable Diffusion (self-hosted) — rejected: ops complexity for image generation at this scale
- Canva API — rejected: template-based, limited AI generation

---

## Decision: LinkedIn Publishing

**Decision**: LinkedIn API (OAuth 2.0 + UGC Posts endpoint) as primary; Playwright browser automation as fallback
**Rationale**: The LinkedIn REST API (`/v2/ugcPosts`) is the supported, least-fragile path. Browser automation via Playwright is kept as a fallback for scenarios where the API is unavailable or rate-limited.
**Alternatives considered**:
- Puppeteer — similar capability to Playwright; Playwright chosen for better TypeScript support and auto-wait
- Third-party services (Buffer, Hootsuite API) — rejected: additional vendor dependency and cost

---

## Decision: Storage

**Decision**: PostgreSQL (Vercel Postgres or Neon) as primary datastore; Vercel KV (Redis) for deduplication / idempotency locks
**Rationale**: Relational storage for posts and logs supports querying by status, date, and ordering. KV store for a lightweight daily idempotency key prevents duplicate posts without adding DB transaction complexity.
**Alternatives considered**:
- SQLite — rejected: not suitable for serverless multi-instance environments
- DynamoDB — rejected: over-engineered for a single-table use case
- Vercel KV only — rejected: lacks relational querying needed for post history

---

## Decision: Scheduling

**Decision**: Vercel Cron Jobs configured in `vercel.json`
**Rationale**: Native to the hosting platform. No additional scheduler service required. Supports standard cron syntax. Triggers a Next.js route handler via HTTP POST at the configured time.
**Alternatives considered**:
- GitHub Actions scheduled workflows — viable but introduces a second platform dependency
- External cron services (cron-job.org, Upstash QStax) — viable backup, unnecessary for MVP
- Vercel Queues — in preview; more appropriate for high-throughput; overkill here

---

## Decision: Testing

**Decision**: Vitest for unit/integration tests; Playwright for end-to-end flows
**Rationale**: Vitest is fast, ESM-native, and integrates well with Next.js. Playwright covers the browser automation fallback path and can simulate the full approval → publish flow.
**Alternatives considered**:
- Jest — heavier config for ESM; Vitest is a direct drop-in with better DX
- Cypress — Playwright preferred for non-browser automation testing scenarios

---

## Decision: Approval Interface

**Decision**: Minimal web UI (Next.js pages) for draft review + approve/reject actions; no external CMS
**Rationale**: MVP scope requires only a simple list + action buttons. Next.js serves this without an additional frontend framework. The approval flow is internal operator tooling, not a public-facing product.
**Alternatives considered**:
- Admin panel (Retool, Adminjs) — rejected: unnecessary dependency for a simple two-action interface
- Email-based approval — rejected: higher latency, harder to build reliably

---

## Decision: Image Generation Output

**Decision**: Quote-card style image: post hook text overlaid on a clean gradient background; stored as PNG in Vercel Blob storage
**Rationale**: Quote cards are the highest-engagement static image format on LinkedIn. Vercel Blob is the natural storage companion to Vercel hosting. Images are generated once per post and referenced by URL.
**Alternatives considered**:
- S3 — viable but adds AWS account dependency
- Base64 inline — rejected: LinkedIn API requires hosted image URL

---

## Resolved Clarifications

All unknowns from the spec are resolved above. No NEEDS CLARIFICATION markers remain.
