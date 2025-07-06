# Clerk JWT Template Setup for Supabase Integration

This guide explains how to configure the Clerk JWT template required for authentication with Supabase.

## Why This Is Required

The application uses Clerk for authentication and Supabase for the database. To connect these services, Clerk needs to generate JWT tokens that Supabase can verify. This requires configuring a JWT template in Clerk.

## Setup Instructions

### 1. Access Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **JWT Templates** in the sidebar

### 2. Create Supabase JWT Template

1. Click **"New template"**
2. Set the following configuration:

**Name**: `supabase`  
**Claims**:
```json
{
  "email": "{{user.primary_email_address.email_address}}",
  "user_metadata": {
    "full_name": "{{user.full_name}}"
  },
  "metadata": {
    "userType": "{{user.public_metadata.userType}}",
    "role": "{{user.public_metadata.role}}"
  }
}
```

**Lifetime**: 3600 (1 hour)

### 3. Get Your Supabase JWT Secret

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the **JWT Secret**

### 4. Configure the JWT Template Signing Key

1. Back in Clerk JWT Templates
2. Under **Signing algorithm**, select **HS256**
3. Under **Signing key**, paste your Supabase JWT Secret
4. Click **Save**

### 5. Configure Supabase to Accept Clerk JWTs

In your Supabase SQL Editor, run:

```sql
-- Enable the JWT hook to extract the Clerk user ID
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT 
    COALESCE(
      current_setting('request.jwt.claim', true)::jsonb,
      current_setting('request.jwt.claims', true)::jsonb,
      '{}'::jsonb
    )
$$;
```

## Verifying the Setup

1. Check the browser console for errors like:
   - `[createServerSupabaseClient] Failed to get Clerk JWT token`
   - `[withAuth] No userId from Clerk auth`

2. If you see these errors, the JWT template is not configured correctly.

3. Once configured correctly, you should see:
   - `[withAuth] Authenticated userId: user_xxx`
   - `[getCurrentUserProfile] Successfully fetched profile: xxx`

## Common Issues

### "Failed to get Clerk JWT token"
- The JWT template doesn't exist or is named incorrectly (must be exactly "supabase")
- The signing key doesn't match your Supabase JWT secret

### "User profile not found"
- The JWT is generated but the user profile hasn't been created in Supabase
- Check that the webhook for user creation is working

### "Row Level Security policy violation"
- The JWT claims don't match what your RLS policies expect
- Verify the claims structure matches the example above

## Environment Variables

Ensure these are set in your `.env.local` and production environment:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```