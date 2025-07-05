# Deployment Guide for Dentistry Explained

**Current Status**: Live at https://dentistry-explained.vercel.app/ (as of July 4, 2025)

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
- `LITELLM_PROXY_URL`
- `LITELLM_API_KEY`

#### Optional Variables:
- `RESEND_API_KEY` (for email notifications)
- `NEXT_PUBLIC_POSTHOG_KEY` (for analytics)
- `UPSTASH_REDIS_REST_URL` (for rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` (for rate limiting)

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
- [ ] Test AI chat functionality (currently using fallback)
- [ ] Verify Supabase RLS policies are working
- [ ] Monitor Vercel analytics for errors

### Troubleshooting

**Users can't sign in:**
- Check Clerk environment variables
- Verify webhook is creating profiles

**AI chat not working:**
- Verify LiteLLM environment variables
- Check API key is valid

**Profile creation fails:**
- Check webhook logs in Clerk dashboard
- Verify CLERK_WEBHOOK_SECRET matches
- Check Supabase service role key permissions