# LinkedIn AI Content Agent - PRD

## Objective
Build an AI-powered system that generates and posts LinkedIn content daily using Vercel.

## Goals
- Daily automated content generation
- High-quality LinkedIn posts
- Image generation support
- Optional manual approval
- Reliable deployment on Vercel

## Core Features
### Topic Generation
AI generates relevant daily topics.

### Content Generation
- Strong hook
- Short paragraphs
- CTA at end

### Image Generation
- Quote-style images
- Clean visuals

### Scheduling
- Daily cron job via Vercel

### Posting
- LinkedIn API or browser automation

### Approval System
- Draft → Approve → Publish

### Logging
- Success/failure tracking

## User Flow
1. Cron triggers job
2. Generate topic
3. Generate post
4. Generate image
5. Save draft
6. Approve (optional)
7. Publish
8. Log result

## Tech Stack
- Next.js (App Router)
- Vercel (hosting + cron)
- OpenAI API
- PostgreSQL / Vercel KV
- Puppeteer / Playwright

## API Endpoints
- POST /api/generate
- POST /api/post
- GET /api/posts
- POST /api/approve

## Data Model
Post:
- id
- topic
- content
- imageUrl
- status
- createdAt

## Risks
- LinkedIn blocking automation
- Low-quality content
- Posting failures

## Mitigation
- Manual approval
- Retry logic
- Improve prompts

## Success Metrics
- Posting consistency
- Engagement rate
- Approval rate

## MVP Scope
- Content + image generation
- Manual approval
- Basic automation

## Future Scope
- Analytics dashboard
- Multi-account support
- AI optimization
