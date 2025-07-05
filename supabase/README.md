# Supabase Database Migrations

This directory contains all database migrations for the Dentistry Explained project.

## Running Migrations

### Local Development

1. Install Supabase CLI:
```bash
brew install supabase/tap/supabase
```

2. Link to your Supabase project:
```bash
supabase link --project-ref dtknwhzmomyalyixgnmr
```

3. Run migrations:
```bash
supabase db push
```

### Production

Migrations need to be run manually in the Supabase dashboard:

1. Go to https://app.supabase.com/project/dtknwhzmomyalyixgnmr/sql
2. Click on "SQL Editor"
3. Copy and paste the migration files in order
4. Click "Run"

## Migration Files

- `20250703234645_extensions.sql` - Enables required PostgreSQL extensions
- `20250703234646_initial_schema.sql` - Core database schema
- `20250703234647_add_role_column.sql` - Adds role column to profiles
- `20250704_130000_update_search_queries_table.sql` - Updates search queries table
- `20250704000000_clerk_auth_integration.sql` - Clerk authentication integration
- `20250704100000_content_management.sql` - Content management tables
- `20250704120000_professional_verifications.sql` - Professional verification system
- `20250704121000_verification_storage.sql` - Storage for verification documents
- `20250704130000_add_full_text_search.sql` - Full-text search functionality
- `20250704140000_fix_search_function.sql` - Fixes for search function
- `20250705000000_reading_history.sql` - Reading history tracking (NEW - NOT YET RUN IN PRODUCTION)

## Important Notes

- Always test migrations locally before running in production
- Migrations should be run in order (by timestamp)
- The reading history feature requires the `20250705000000_reading_history.sql` migration