-- Instructions to grant admin access to a user in Dentistry Explained
-- 
-- 1. Go to your Supabase dashboard: https://app.supabase.com
-- 2. Navigate to the SQL Editor
-- 3. Replace 'your-email@example.com' with the actual email address
-- 4. Run this SQL command:

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- To verify the update worked:
SELECT clerk_id, email, user_type, role 
FROM profiles 
WHERE email = 'your-email@example.com';

-- Available roles:
-- 'user' - Default role for all users
-- 'admin' - Full admin access to admin panel
-- 'editor' - Editor access to admin panel (same as admin currently)

-- Note: The user must be a 'professional' user type to access admin features.
-- If needed, you can also update the user_type:
-- UPDATE profiles 
-- SET user_type = 'professional', role = 'admin' 
-- WHERE email = 'your-email@example.com';