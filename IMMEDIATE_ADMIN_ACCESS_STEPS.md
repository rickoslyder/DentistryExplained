# Immediate Steps to Grant Yourself Admin Access

## Manual Steps Required in Clerk Dashboard

### 1. Update JWT Template (CRITICAL)
1. Go to https://dashboard.clerk.com/
2. Select your application
3. Navigate to **JWT Templates** in sidebar
4. Find the "supabase" template
5. Click to edit
6. Replace the entire claims with:

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
7. Save the template

### 2. Update Your User Metadata
1. In Clerk Dashboard, go to **Users**
2. Find your user account
3. Click on your user
4. Scroll to **Public metadata** section
5. Click **Edit**
6. Set this JSON:
```json
{
  "userType": "professional",
  "role": "admin"
}
```
7. Save changes

### 3. Update Supabase (Already Done)
Your Supabase role is already set to 'admin' based on your message.

### 4. Clear Session and Test
1. Sign out from the application completely
2. Clear browser cookies for the domain
3. Sign back in
4. You should now see the "Admin" link in navigation
5. Try accessing /admin

## If It Still Doesn't Work

The issue is that your current session has old JWT claims. You need:
1. A fresh session with the new JWT template
2. Public metadata (not unsafe metadata) set in Clerk

## Alternative Quick Fix

If you have database access, you can also run this SQL to ensure everything is synced:
```sql
UPDATE profiles 
SET 
  user_type = 'professional',
  role = 'admin'
WHERE email = 'your-email@example.com';
```

But you MUST update the Clerk JWT template and publicMetadata for it to work!