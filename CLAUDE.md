# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## RULES TO ALWAYS FOLLOW WHEN WORKING ON THIS PROJECT
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the [todo.md](http://todo.md/) file with a summary of the changes you made and any other relevant information.

## Development Best Practices
- Always use the Supabase MCP to check anything DB related
- STOP RELYING ON MIGRATIONS TO KNOW THE CURRENT DB SCHEMA. ALWAYS USE THE SUPABASE CLI AND CHECK THE DB DIRECTLY.

## Project Overview

**Dentistry Explained** is a comprehensive dental education platform designed to be the UK's premier online dental resource. It provides evidence-based dental information to patients, professionals, and the general public through an intuitive, accessible interface with AI-powered assistance.

## Architecture & Tech Stack (Current - July 2025)

- **Frontend**: Next.js 15.3.5 with App Router, TypeScript, Tailwind CSS + Shadcn/ui ✅
- **CMS**: Custom-built content management system with MDX support ✅
- **Authentication**: Clerk (latest) for user management and auth flows ✅
- **Database**: Supabase (PostgreSQL) with Row Level Security ✅
- **AI Integration**: LiteLLM proxy (https://openai-proxy-0l7e.onrender.com) - using o4-mini reasoning model ✅
- **Web Search**: Perplexity API (real-time) and Exa API (semantic search) ✅
- **Payments**: Stripe (not yet implemented) ❌
- **Analytics**: PostHog (not yet implemented) ❌
- **Hosting**: Deployed on Vercel at https://dentistry-explained.vercel.app/ ✅

## Key Features to Implement

### Core Content System
- Hierarchical dental topics (The Mouth, Prevention, Problems, Treatments)
- Dynamic content rendering with MDX support
- Reading level toggles (Basic/Advanced)
- Medical reference citations
- SEO-optimized article pages

### User Types & Authentication
- **Patients**: General public seeking dental information
- **Professionals**: Verified dental practitioners (GDC number validation)
- Professional verification workflow with manual approval
- User onboarding flows differentiated by type

### AI Dental Assistant
- Slide-out chat panel with conversation memory
- Context awareness of current page content
- 180-day chat history retention
- PDF export functionality for conversations
- LiteLLM proxy integration for AI responses

### Professional Features (SaaS)
- Consent form generation and templates
- Patient education materials library
- Practice listing management in directory
- Professional-only content access

### Realtime Features
- Article view counters ("X people reading now")
- Professional online status indicators
- Content update notifications
- Implemented via Supabase presence system

### Find a Dentist Directory
- Location-based practice search
- NHS/Private filtering
- Practice profile management
- Claimed vs unclaimed listings

## Database Schema Key Tables

- `profiles` - User profiles synced from Clerk
- `professional_verifications` - GDC validation and approval status
- `chat_sessions` & `chat_messages` - AI chat persistence with metadata
- `practice_listings` - Dental practice directory
- `article_views` - Analytics and realtime presence
- `bookmarks` - User saved articles
- `glossary_terms` - Comprehensive dental terminology (97 terms)
- `glossary_interactions` - User interaction tracking (views, searches, copies)
- `glossary_quiz_results` - Quiz performance tracking
- `web_searches` - Web search usage analytics
- `web_search_cache` - Database cache for search results

## Development Commands

Working commands:
- `npm run dev` - Start development server ✅
- `npm run build` - Build for production ✅
- `npm run lint` - Run ESLint ✅
- `npm start` - Start production server ✅

Not yet implemented:
- `npm run type-check` - TypeScript validation (use build for now)
- `npm test` - Jest unit tests (not configured)
- `npm run test:e2e` - Playwright E2E tests (not configured)

## Content Management

Content is managed through a custom CMS with:
- MDX editor for rich content creation
- Article status workflow (draft, published, archived)
- SEO metadata management
- Category and tag organization
- Article revision history
- Role-based access control

## Business Context

This is a startup project that passed its MVP deadline (July 1st, 2025). The platform aims to:
- Democratize dental education for UK patients
- Support dental professionals with patient education tools
- Generate revenue through advertising, SaaS subscriptions, and affiliate marketing
- Establish market dominance before competitors enter the space

## Development Priorities (Updated July 4th, 2025)

1. **Current Status**: Core infrastructure complete, awaiting content and API integrations
2. **Immediate Priority**: Get real medical content from Curran and Vimal
3. **Next Phase**: Implement real API integrations (GDC verification, NHS data)
4. **Future**: Payment system, analytics, mobile apps

## Key Considerations

- **GDPR Compliance**: Implement proper data retention and user privacy controls
- **Medical Accuracy**: All content must be evidence-based with proper citations
- **Accessibility**: Design for varying literacy levels and disabilities
- **Performance**: Optimize for mobile users and slower connections
- **SEO**: Critical for organic discovery and market penetration

## Security & Compliance

- Row Level Security (RLS) in Supabase for data protection
- Professional verification via GDC number validation
- Sensitive content warnings and disclaimers
- GDPR-compliant data handling and retention policies
- Rate limiting on AI chat to prevent abuse

## Testing Strategy

- Unit tests for utilities and server actions
- Integration tests for authentication flows
- E2E tests for critical user journeys (registration, search, chat)
- Visual regression tests for component library
- Performance testing for search and AI features

## Current Implementation Status (July 4th, 2025)

### ✅ Completed Features
- **Core Infrastructure**: Next.js 15.3.5, React 19.1.0, TypeScript
- **Authentication**: Clerk integration with user roles (patient/professional)
- **Database**: Supabase with RLS policies and schema
- **UI Components**: Complete Shadcn/ui component library
- **Basic Admin Panel**: Article and user management
- **Search**: Full-text search with PostgreSQL
- **Chat UI**: Streaming chat interface with export functionality
- **Glossary System**: 97 dental terms with quiz mode, AI generation, and interaction tracking
- **Emergency Page**: Enhanced with decision trees, visual guides, and offline support
- **Web Search**: Integrated Perplexity and Exa APIs with caching

### ⚠️ Partially Implemented
- **Professional Verification**: UI complete but using mock GDC validation
- **Content Management**: Custom solution built with admin panel
- **Find Dentist**: UI complete but using mock data (3 hardcoded practices)

### ❌ Not Implemented
- **Real Medical Content**: Only 4 placeholder articles exist
- **Payment System**: Stripe not integrated
- **Analytics**: PostHog not configured
- **Email Notifications**: Resend configured but not actively used
- **Real API Integrations**: No GDC API, NHS API, or practice data
- **Testing**: No unit or E2E tests configured

### 📝 Content Status
- 4 placeholder articles marked with "[PLACEHOLDER]"
- No medical review has been performed
- Waiting for content from medical team (Curran and Vimal)

## Technical Learnings

### Supabase Query Patterns
1. **Nested Relations Filtering**:
   ```javascript
   // CORRECT: Use !inner for filtering parent by child
   const { data } = await supabase
     .from('categories')
     .select(`
       name,
       articles!inner (
         title,
         status
       )
     `)
     .eq('articles.status', 'published')
   
   // INCORRECT: Cannot filter nested relations directly
   // This will cause "e is not a function" error
   .select('id, articles(*)')
   .eq('articles.status', 'published')
   ```

2. **Alternative Pattern for Complex Queries**:
   ```javascript
   // First get parent
   const { data: category } = await supabase
     .from('categories')
     .select('id')
     .eq('slug', 'dental-problems')
     .single()
   
   // Then get filtered children
   const { data: articles } = await supabase
     .from('articles')
     .select('*')
     .eq('category_id', category.id)
     .eq('status', 'published')
   ```

### Next.js App Router Patterns
1. **Client Components**: Must use `'use client'` directive for:
   - Event handlers (onClick, onChange, etc.)
   - Browser APIs (window, document)
   - React hooks (useState, useEffect)
   - Third-party client libraries

2. **Server Components**: Default, good for:
   - Data fetching
   - Async operations
   - Direct database queries
   - Reduced JavaScript bundle

3. **Common Pitfall**: "Event handlers cannot be passed to Client Component props"
   - Solution: Add `'use client'` to components using event handlers
   - Or extract interactive parts into separate client components

### Authentication Flow
1. **Clerk Server-Side**: Use `import { currentUser } from '@clerk/nextjs/server'`
2. **Clerk Client-Side**: Use `import { useUser } from '@clerk/nextjs'`
3. **Supabase RLS**: Pass Clerk JWT token to Supabase for Row Level Security

### Environment Variables
- Required: Clerk keys, Supabase credentials, LiteLLM config
- Optional: Resend API key (gracefully handled if missing)
- Web Search APIs: PERPLEXITY_API_KEY, EXA_API_KEY (optional but recommended)
- Validation utility created at `/lib/env-validation.ts`

### Dependencies Installed
- `use-debounce`: For search input debouncing
- `resend`: Email service (optional, fails gracefully)
- React 19.1.0 with legacy peer deps flag

### API Error Handling (Jan 4, 2025)
Created standardized error handling system:
- **ApiErrors utility**: Consistent error responses with codes, request IDs, and proper HTTP status
- **Error types**: Validation errors, database errors, external service errors, rate limiting
- **Request tracking**: Every error includes a unique request ID for debugging
- **Validation**: Zod schemas for all API inputs with detailed field-level errors

Updated API routes:
- Search API: Input validation, proper error context, request tracking
- Chat API: Message validation, external service error handling
- All routes now return consistent error format

### Security Configuration (Jan 4, 2025)
Added comprehensive security headers in `next.config.mjs`:
- **Content Security Policy (CSP)**: Restricts resource loading to trusted sources
- **Strict-Transport-Security**: Forces HTTPS with 2-year max-age
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer-Policy**: Controls referrer information sent
- **Permissions-Policy**: Disables unused browser features
- **CORS Headers**: Configured for API routes

Allowed CSP domains:
- Clerk authentication: `https://clerk.accounts.dev`, `https://*.clerk.accounts.dev`, `https://actual-feline-35.accounts.dev`
- AI proxy: `https://openai-proxy-0l7e.onrender.com`
- Supabase: `https://*.supabase.co`
- Resend email: `https://api.resend.com`

### Known Issues
1. **React Version Conflicts**: Some packages expect React 18, using `--legacy-peer-deps`
2. **Build Warnings**: Type checking and linting temporarily skipped during build

### Recent Fixes (Jan 4, 2025)
1. **Fixed auth() async calls**: In Next.js 15 with Clerk v6, `auth()` is now async and must be awaited
   - Updated `lib/supabase-auth.ts` to use `await auth()` instead of `auth()`
   - This fixed the "e is not a function" build errors

### Deployment Considerations
- Database migrations in `/supabase/migrations/`
- Environment variables must be set in Vercel
- Edge runtime compatibility for API routes
- Static generation where possible for performance