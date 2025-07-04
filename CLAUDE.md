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

## Project Overview

**Dentistry Explained** is a comprehensive dental education platform designed to be the UK's premier online dental resource. It provides evidence-based dental information to patients, professionals, and the general public through an intuitive, accessible interface with AI-powered assistance.

## Architecture & Tech Stack (Planned)

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS + Shadcn/ui
- **CMS**: Payload CMS (self-hosted) for content management
- **Authentication**: Clerk for user management and auth flows
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **AI Integration**: LiteLLM proxy (https://openai-proxy-0l7e.onrender.com)
- **Payments**: Stripe (test mode for MVP)
- **Analytics**: PostHog for user analytics
- **Hosting**: Vercel for deployment

## Key Features to Implement

### Core Content System
- Hierarchical dental topics (The Mouth, Prevention, Problems, Treatments)
- Dynamic content rendering from Payload CMS
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
- `chat_sessions` & `chat_messages` - AI chat persistence
- `practice_listings` - Dental practice directory
- `article_views` - Analytics and realtime presence
- `bookmarks` - User saved articles

## Development Commands

*Note: Project is in planning phase - these will be implemented once development begins*

Expected commands:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript validation
- `npm test` - Run Jest unit tests
- `npm run test:e2e` - Run Playwright E2E tests

## Content Management

Content will be managed through Payload CMS with:
- Hierarchical article relationships
- Rich text editor with medical formatting
- Media optimization pipeline
- Version control and draft workflow
- Reference management system

## Business Context

This is a startup project with tight MVP deadline (July 1st, 2025). The platform aims to:
- Democratize dental education for UK patients
- Support dental professionals with patient education tools
- Generate revenue through advertising, SaaS subscriptions, and affiliate marketing
- Establish market dominance before competitors enter the space

## Development Priorities

1. **MVP by July 1st**: Basic content hierarchy, user auth, AI chat
2. **CVP by August 1st**: Professional features, payment system, directory
3. **Full Product by September 1st**: Complete content coverage, mobile apps

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

## Current Project Status (Updated Jan 4, 2025)

### Completed Features
1. **Core Infrastructure**
   - Next.js 15.3.5 with App Router
   - Clerk authentication integrated
   - Supabase database connected
   - TypeScript setup with strict mode

2. **AI Chat System**
   - LiteLLM proxy integration (https://openai-proxy-0l7e.onrender.com)
   - Streaming responses implemented
   - Chat history with 180-day retention
   - Context-aware responses based on current page
   - Export to PDF functionality

3. **Professional Verification System**
   - GDC number validation via official API
   - Document upload support
   - Admin review workflow
   - Email notifications (using Resend)

4. **Full-Text Search**
   - PostgreSQL full-text search with tsvector columns
   - Weighted search across articles, glossary, and practice listings
   - Search suggestions and autocomplete
   - Trending searches tracking
   - Search analytics

5. **Content Structure**
   - Categories and articles tables
   - Glossary terms with pronunciations and related terms
   - Practice listings with location data
   - Emergency resources page

### Content Strategy
- **Content creation by medical team**: Curran and Vimal are responsible for writing and medically reviewing all content
- **Placeholder articles remain**: Only 2 example articles (tooth decay, gum disease) exist as templates
- **No need to generate content**: Claude should NOT create medical content

### Technical Learnings

#### Supabase Query Patterns
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

#### Next.js App Router Patterns
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

#### Authentication Flow
1. **Clerk Server-Side**: Use `import { currentUser } from '@clerk/nextjs/server'`
2. **Clerk Client-Side**: Use `import { useUser } from '@clerk/nextjs'`
3. **Supabase RLS**: Pass Clerk JWT token to Supabase for Row Level Security

#### Environment Variables
- Required: Clerk keys, Supabase credentials, LiteLLM config
- Optional: Resend API key (gracefully handled if missing)
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
- Clerk authentication: `https://clerk.accounts.dev`
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