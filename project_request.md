# Dentistry Explained MVP
## Project Description
A Next.js-based dental education platform using Payload CMS for content management, Clerk for authentication, and Supabase for data persistence with realtime features. Built with scalability for future mobile apps and expanded functionality.

## Target Audience
- Primary: UK dental patients seeking reliable dental information
- Secondary: Dental professionals (dentists, hygienists, therapists)
- Tertiary: General public interested in oral health
- Initial focus: UK market with international expansion capability

## Desired Features
### Technical Stack
- [ ] Next.js 14+ with App Router
    - [ ] TypeScript for type safety
    - [ ] Tailwind CSS + Shadcn/ui
    - [ ] Framer Motion for animations
- [ ] Payload CMS
    - [ ] Self-hosted on same Vercel deployment
    - [ ] Custom collections for dental content types
    - [ ] Rich text with medical formatting support
    - [ ] Media library with auto-optimization
    - [ ] Version control and drafts
- [ ] Supabase Backend
    - [ ] PostgreSQL database
    - [ ] Row Level Security (RLS) policies
    - [ ] Realtime subscriptions for live features
    - [ ] Storage bucket for user uploads
- [ ] Clerk Authentication
    - [ ] Custom sign-up flow with user types
    - [ ] Metadata for professional verification
    - [ ] Webhook integration with Supabase

### Core Website Structure
- [ ] Dynamic content rendering
    - [ ] Payload CMS → Next.js pages
    - [ ] Dynamic routing for dental topics
    - [ ] SEO-optimized URLs (e.g., /dental-problems/tooth-decay)
    - [ ] Automatic breadcrumbs from content hierarchy
- [ ] Content collections in Payload
    - [ ] Main Topics (The Mouth, Prevention, etc.)
    - [ ] Articles (with parent-child relationships)
    - [ ] Procedures (treatment pages)
    - [ ] Glossary terms (with tooltips)
    - [ ] FAQs (categorized)
    - [ ] Professional resources
- [ ] Smart content features
    - [ ] Reading level toggle (stored in localStorage)
    - [ ] Expandable medical references
    - [ ] Image galleries with zoom
    - [ ] Video embed support
    - [ ] PDF generation for articles

### Search & AI Features
- [ ] Hybrid search system
    - [ ] Payload CMS search API
    - [ ] Supabase full-text search
    - [ ] Weighted results (title > content)
    - [ ] Search analytics tracking
- [ ] AI Dental Assistant
    - [ ] Sleek slide-out panel from right
    - [ ] Floating action button with pulse animation
    - [ ] Chat interface with markdown rendering
    - [ ] Per-session conversation memory
        - [ ] Stored in Supabase with user_id + session_id
        - [ ] 180-day retention period
        - [ ] Auto-cleanup job for expired conversations
    - [ ] Context awareness of current page
    - [ ] Suggested questions based on current page
    - [ ] Copy response functionality
    - [ ] Export conversation as PDF
    - [ ] LiteLLM proxy integration (https://openai-proxy-0l7e.onrender.com)
    - [ ] Fallback responses for out-of-scope

### User & Professional Features
- [ ] User onboarding flow
    - [ ] User type selection (Patient/Professional)
    - [ ] Personalized dashboard based on type
    - [ ] Onboarding tooltips
- [ ] Patient features
    - [ ] Bookmark articles
    - [ ] Personal dental diary (future)
    - [ ] Treatment cost calculator
    - [ ] Symptom checker (basic)
- [ ] Professional verification
    - [ ] GDC number regex validation (7 digits)
    - [ ] Manual verification badge (admin panel)
    - [ ] Professional-only content access
    - [ ] Note: Future integration with official GDC API
- [ ] Professional dashboard
    - [ ] Patient education materials library
    - [ ] Downloadable consent forms (PDF)
    - [ ] Customizable patient handouts
    - [ ] CPD content tracking (future)
    - [ ] Practice listing management
- [ ] Mock subscription system
    - [ ] Three tiers (Basic/Pro/Practice)
    - [ ] Stripe checkout (test mode)
    - [ ] Subscription status in Clerk metadata

### Find a Dentist Directory
- [ ] Advanced directory features
    - [ ] Mapbox/Google Maps integration
    - [ ] Distance-based search
    - [ ] Real-time availability status
    - [ ] NHS/Private filters
    - [ ] Accessibility features filter
- [ ] Practice profiles
    - [ ] Claimed vs unclaimed status
    - [ ] Photo galleries
    - [ ] Services offered
    - [ ] Team member listings
    - [ ] Opening hours with bank holidays

### Realtime Features (Supabase)
- [ ] Live article engagement metrics
    - [ ] "X people reading now" counter per article
    - [ ] Implemented via Supabase presence
    - [ ] Debounced updates to prevent flashing
    - [ ] Trending articles widget on homepage
- [ ] Professional online status
    - [ ] Green dot for online professionals
    - [ ] "Last seen" for offline users
    - [ ] Opt-in/out privacy setting
    - [ ] Foundation for future networking features
- [ ] Content update notifications
    - [ ] Toast notifications for new articles
    - [ ] "New content in [category]" alerts
    - [ ] User preference for notification types
    - [ ] Mark as read functionality

### Analytics & Monitoring
- [ ] Comprehensive tracking
    - [ ] Vercel Analytics + Google Analytics 4
    - [ ] Custom events for key actions
    - [ ] Heatmap integration (Hotjar/Clarity)
    - [ ] A/B testing framework (GrowthBook)
- [ ] Performance monitoring
    - [ ] Core Web Vitals tracking
    - [ ] Sentry error reporting
    - [ ] Uptime monitoring (Better Uptime)

### Infrastructure & DevOps
- [ ] Development workflow
    - [ ] Turborepo for monorepo (if needed)
    - [ ] Husky + lint-staged for code quality
    - [ ] Conventional commits
    - [ ] Automated changelog generation
- [ ] Testing strategy
    - [ ] Jest for unit tests
    - [ ] React Testing Library
    - [ ] Playwright for E2E (critical paths)
    - [ ] Visual regression tests (Percy)
- [ ] Deployment pipeline
    - [ ] Preview deployments on PRs
    - [ ] Staging environment
    - [ ] Production deployment approval
    - [ ] Database migration strategy

## Design Requests
- [ ] Design system implementation
    - [ ] NHS-inspired but modern aesthetic
    - [ ] Blue (#005EB8) + clean whites
    - [ ] Accessible color contrast
    - [ ] Custom icon set for dental topics
- [ ] Component library
    - [ ] Article cards with hover effects
    - [ ] Procedure comparison tables
    - [ ] Before/after image sliders
    - [ ] Interactive tooth diagrams
    - [ ] Appointment booking widgets (future)
- [ ] Micro-interactions
    - [ ] Smooth page transitions
    - [ ] Skeleton loaders
    - [ ] Success animations (Lottie)
    - [ ] Haptic feedback prep for mobile
- [ ] Trust & credibility design
    - [ ] NHS/GDC logos (where appropriate)
    - [ ] Expert reviewer badges
    - [ ] Last medically reviewed dates
    - [ ] Source citations with hover previews

## Other Notes
- Implement feature flags using Vercel Edge Config
- Prepare for GDPR compliance (cookie consent, data export)
- Set up Plausible/Fathom for privacy-friendly analytics
- Create Storybook for component documentation
- Plan for progressive web app (PWA) capabilities
- Implement OpenGraph image generation for social sharing
- Set up GitHub Issues templates for content requests
- Consider implementing Algolia DocSearch for future
- Prepare webhook infrastructure for third-party integrations
- Design with future React Native app in mind
- Create data retention policies (180 days for chat, GDPR compliance for user data)
- Set up automated database backups with point-in-time recovery