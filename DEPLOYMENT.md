# Deployment Guide for Dentistry Explained

**Current Status**: Live at https://dentistry-explained.vercel.app/ (as of January 15, 2025)

## Vercel Deployment

### Environment Variables
Copy all variables from `.env.local` to Vercel's environment variables:

#### Required Variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET` (see webhook setup below)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_LITELLM_URL` (https://openai-proxy-0l7e.onrender.com)
- `LITELLM_API_KEY`

#### Recommended Variables:
- `PERPLEXITY_API_KEY` (for web search)
- `EXA_API_KEY` (for semantic search)
- `NEXT_PUBLIC_POSTHOG_KEY` (for analytics - installed but not configured)
- `NEXT_PUBLIC_POSTHOG_HOST` (https://app.posthog.com)
- `GA4_PROPERTY_ID` (Google Analytics)
- `GA4_SERVICE_ACCOUNT_KEY`
- `GA4_MEASUREMENT_ID`
- `GA4_API_SECRET`

#### Optional Variables:
- `RESEND_API_KEY` (email service - configured but not actively used)
- `UPSTASH_REDIS_REST_URL` (for rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` (for rate limiting)
- `RESEARCH_SERVICE_URL` (GPT-Researcher integration)
- `RESEARCH_SERVICE_AUTH_TOKEN`

### Clerk Webhook Setup

The Clerk webhook should already be configured to sync users with Supabase:

1. **Production URL**: `https://dentistry-explained.vercel.app`

2. **Verify webhook in Clerk Dashboard**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Navigate to Webhooks
   - Ensure endpoint URL is: `https://dentistry-explained.vercel.app/api/webhooks/clerk`
   - Ensure these events are selected:
     - `user.created`
     - `user.updated`
     - `user.deleted`

3. **Copy the Webhook Secret**:
   - In Clerk webhook settings, copy the "Signing Secret"
   - Add it to Vercel as `CLERK_WEBHOOK_SECRET`

4. **Verify webhook is working**:
   - Check Clerk webhook logs for successful deliveries
   - New user signups should create profiles in Supabase

### Post-Deployment Checklist

- [x] Site is live at https://dentistry-explained.vercel.app/
- [ ] All environment variables set in Vercel
- [ ] Clerk webhook URL confirmed for production
- [ ] Webhook secret added to Vercel environment
- [ ] Test user registration creates Supabase profile
- [ ] Test AI chat functionality with web search integration
- [ ] Verify Supabase RLS policies are working
- [ ] Monitor Vercel analytics for errors
- [ ] Verify security headers (CSP, CORS, etc.) in browser DevTools
- [ ] Test PWA installation and offline functionality
- [ ] Confirm web search caching works (check web_search_cache table)
- [ ] Test glossary system and quiz mode
- [ ] Verify emergency page works offline

### Security Configuration

The application includes comprehensive security headers in `next.config.mjs`:
- Content Security Policy (CSP) with allowed domains
- Strict-Transport-Security (HSTS) with 2-year max-age
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- CORS configuration for API routes

### Progressive Web App (PWA)

The site is configured as a PWA with:
- Service worker for offline support
- Web app manifest for installability
- Offline fallback pages
- Cache strategies for static assets

### Known Issues

- **Missing Database Table**: `web_search_cache` table referenced in code but no migration exists
- **React Version Mismatch**: Using React 19.1.0 but type definitions are for React 18
- **Version Pinning**: Several packages use "latest" instead of specific versions
- **PostHog**: Package installed but requires configuration

### Troubleshooting

**Users can't sign in:**
- Check Clerk environment variables
- Verify webhook is creating profiles
- Check browser console for CSP violations

**AI chat not working:**
- Verify LiteLLM environment variables
- Check API key is valid
- Ensure CORS is configured for the proxy URL

**Profile creation fails:**
- Check webhook logs in Clerk dashboard
- Verify CLERK_WEBHOOK_SECRET matches
- Check Supabase service role key permissions

**Web search not working:**
- Verify PERPLEXITY_API_KEY and EXA_API_KEY are set
- Check if web_search_cache table exists (create migration if missing)

### Missing Features

- **Stripe Payments**: Package not installed
- **Real API Integrations**: GDC and NHS APIs use mock data
- **Testing**: No unit or E2E tests configured