# Admin Access Setup Guide

This guide explains how to properly grant admin access to users in Dentistry Explained.

## Understanding the Authentication System

The platform uses:
- **Clerk** for authentication and session management
- **Supabase** for database and user profiles
- **JWT tokens** to connect Clerk sessions with Supabase

Admin access requires synchronization between both systems.

## Prerequisites

1. You must have admin access yourself
2. The target user must have an account
3. Access to Clerk Dashboard (for manual steps)

## Method 1: Automated (For Existing Admins)

If you already have admin access, use the API endpoint:

```bash
curl -X POST https://your-domain.com/api/admin/grant-access \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "role": "admin"}'
```

Or programmatically:
```javascript
const response = await fetch('/api/admin/grant-access', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    role: 'admin' // or 'editor'
  })
})
```

## Method 2: Manual Setup (First Admin)

### Step 1: Update Clerk JWT Template

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **JWT Templates**
3. Find or create the "supabase" template
4. Update the claims to include metadata:

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

### Step 2: Update User in Clerk Dashboard

1. Go to **Users** in Clerk Dashboard
2. Find the user by email
3. Click on the user to view details
4. Scroll to **Public metadata**
5. Click **Edit** and set:
```json
{
  "userType": "professional",
  "role": "admin"
}
```
6. Save changes

### Step 3: Update Supabase Database

Run this SQL in Supabase SQL Editor:

```sql
UPDATE profiles 
SET 
  role = 'admin',
  user_type = 'professional',
  updated_at = NOW()
WHERE email = 'user@example.com';

-- Verify the update
SELECT clerk_id, email, user_type, role 
FROM profiles 
WHERE email = 'user@example.com';
```

### Step 4: Force Session Refresh

The user needs to:
1. Sign out completely
2. Sign back in
3. The new metadata will be included in their session

## Troubleshooting

### "Access Denied" After Setup

1. **Check JWT Template**: Ensure the metadata fields are included
2. **Check Clerk Metadata**: Verify publicMetadata has correct values
3. **Check Supabase**: Verify the profile has role='admin'
4. **Clear Session**: Sign out and sign in again

### Middleware Still Blocking Access

The middleware checks `sessionClaims?.metadata?.userType` and `sessionClaims?.metadata?.role`.

If these are missing:
1. The JWT template might not be updated
2. The user's session might be cached
3. Try clearing browser cookies and signing in again

### Debugging Commands

Check user in Supabase:
```sql
SELECT * FROM profiles WHERE email = 'user@example.com';
```

Check Clerk user via API:
```bash
curl https://api.clerk.com/v1/users \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY" \
  -G -d "email_address=user@example.com"
```

## Role Types

- **user**: Default role, no admin access
- **editor**: Can manage content but not users
- **admin**: Full admin access

## Security Notes

1. Only admins can grant admin access to others
2. All metadata updates are logged
3. publicMetadata is secure (backend-only updates)
4. Regular audits of admin users recommended

## Quick Reference

For existing users who need admin access:

1. **If you're already an admin**: Use `/api/admin/grant-access`
2. **If you're the first admin**:
   - Update Clerk JWT template
   - Set publicMetadata in Clerk Dashboard
   - Update role in Supabase
   - Sign out and sign in