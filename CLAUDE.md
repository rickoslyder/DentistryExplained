# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dentistry Explained is a UK dental education platform built with Next.js 15.3.5 (App Router), React 19, TypeScript, and Supabase. It provides evidence-based dental information to patients, professionals, and the general public with AI-powered assistance.

**Live**: https://dentistry-explained.vercel.app/

## Development Commands

```bash
npm install --legacy-peer-deps  # Required due to peer dependency conflicts
npm run dev                     # Start dev server (port 3000)
npm run build                   # Build for production
npm run lint                    # Run ESLint
npm run type-check              # TypeScript type checking
```

Note: Build currently ignores ESLint and TypeScript errors (`ignoreDuringBuilds: true`).

## Technology Stack

- **Framework**: Next.js 15.3.5 with App Router (Server Components by default)
- **Authentication**: Clerk with Supabase profile sync via webhook
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS)
- **AI**: LiteLLM proxy (https://openai-proxy-0l7e.onrender.com), default model Gemini 2.5 Flash
- **UI**: Tailwind CSS + Shadcn/ui (40+ components) + Radix UI primitives
- **Caching**: Upstash Redis for rate limiting and web search caching
- **PWA**: Offline support with service worker caching strategies

## Architecture

### Route Structure
- `app/(auth)/` - Authentication pages (sign-in, sign-up)
- `app/(platform)/` - Main platform pages
- `app/admin/` - Admin dashboard (protected, role checked in layout)
- `app/api/` - API routes (116+ endpoints)
- `app/professional/` - Professional verification and resources

### API Middleware Pattern
API routes use a functional composition pattern for middleware:

```typescript
import { withAuth, withBodyLimit, withCORS, compose } from '@/lib/api-middleware'

const handler = compose(
  withBodyLimit(1024 * 50),  // 50KB limit
  withCORS(),
  withAuth
)(async (request: NextRequest, context: ApiContext) => {
  const { userProfile, supabase, requestId } = context
  // Handler logic
})

export const POST = handler
```

Available middleware: `withAuth`, `withOptionalAuth`, `withBodyLimit`, `withCORS`, `withCSRF`, `withRateLimit`, `withAudit`

### Authentication Flow
1. Clerk handles user authentication
2. Clerk webhook (`/api/webhooks/clerk`) syncs users to Supabase `profiles` table
3. Middleware (`middleware.ts`) protects routes but defers role checks to layouts
4. API routes use `withAuth` middleware which provides `ApiContext` with user profile

### Key Patterns
- **Client Components**: Must be marked with `'use client'` directive
- **Database Access**: Use `supabaseAdmin` for operations that bypass RLS
- **Rate Limiting**: Configured per-endpoint via `rateLimiters` (chat: 10/min, search: 30/min)
- **Error Handling**: Use `ApiErrors` from `lib/api-errors.ts` for consistent responses

## Database

Migrations are in `supabase/migrations/`. Key tables:
- `profiles` - User profiles synced from Clerk
- `chat_sessions` / `chat_messages` - AI chat history
- `articles` - Content with versions and scheduling
- `professional_verifications` - GDC verification status
- `web_search_cache` - Cached external API results

Run migrations: `npx supabase db push`

## Environment Variables

Required:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- `NEXT_PUBLIC_LITELLM_URL`, `LITELLM_API_KEY`

Optional: `PERPLEXITY_API_KEY`, `EXA_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Key Directories

- `lib/api-middleware.ts` - API middleware composition utilities
- `lib/litellm.ts` - AI response generation with streaming support
- `lib/rate-limiter.ts` - Rate limiting configuration
- `lib/supabase.ts` - Supabase client initialization
- `lib/web-search.ts` - Perplexity/Exa API integration
- `components/ui/` - Shadcn/ui components
- `hooks/` - Custom React hooks (19 files)

## Known Limitations

- Middleware cannot access `publicMetadata` for user type - role checks happen in layouts
- Some professional features use mock data (GDC API, NHS API)
- No test suite configured
- React 19 used but some type definitions are for React 18
