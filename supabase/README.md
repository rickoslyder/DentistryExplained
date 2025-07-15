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

## Migration Files (as of July 15, 2025)

### Core Infrastructure
- `20250703234645_extensions.sql` - Enables required PostgreSQL extensions
- `20250703234646_initial_schema.sql` - Core database schema
- `20250703234647_add_role_column.sql` - Adds role column to profiles
- `20250704000000_clerk_auth_integration.sql` - Clerk authentication integration

### Content Management
- `20250704100000_content_management.sql` - Content management tables
- `20250704130000_add_full_text_search.sql` - Full-text search functionality
- `20250704130001_update_search_queries_table.sql` - Updates search queries table
- `20250704140000_fix_search_function.sql` - Fixes for search function
- `20250706_create_advanced_search_function.sql` - Advanced search capabilities
- `20250706_create_scheduled_articles.sql` - Article scheduling
- `20250706_enhance_article_revisions.sql` - Enhanced revision tracking
- `20250714_article_drafts_and_research.sql` - Draft and research features

### Professional Features
- `20250704120000_professional_verifications.sql` - Professional verification system
- `20250704121000_verification_storage.sql` - Storage for verification documents
- `20250705100000_professional_downloads.sql` - Professional download tracking

### User Features
- `20250705000000_reading_history.sql` - Reading history tracking
- `20250711_create_comments_system.sql` - Comment system

### Glossary System
- `20250105_add_glossary_enhanced_fields.sql` - Enhanced glossary fields
- `20250105_create_glossary_interactions.sql` - Glossary interaction tracking

### Analytics & Monitoring
- `20250105_create_web_searches.sql` - Web search usage tracking
- `20250105_emergency_audit_logs.sql` - Emergency page audit logs
- `20250107_performance_metrics.sql` - Performance metrics tracking
- `20250706_create_activity_logs.sql` - Activity logging
- `20250706_enhance_activity_logs.sql` - Enhanced activity logs
- `20250713_analytics_performance_functions.sql` - Analytics functions
- `20250714_admin_panel_optimizations.sql` - Admin panel optimizations

### Admin & Configuration
- `20250706_create_dashboard_widgets.sql` - Dashboard widgets
- `20250706_create_email_templates.sql` - Email templates
- `20250706_create_set_config_function.sql` - Configuration functions
- `20250706_create_settings_table.sql` - Settings management
- `20250707_update_email_templates_structure.sql` - Email template updates
- `20250710_create_research_tracking.sql` - Research tracking

### Security & Moderation
- `20250112_moderation_tables.sql` - Content moderation system
- `20250112_security_tables.sql` - Security audit logging

### Chat System
- `20250109_add_chat_title.sql` - Chat title functionality

## Migration Notes

✅ **All Required Tables Exist**: Database validation confirms all tables referenced in the codebase are present in the database, including `web_search_cache` which was created in migration `20250705092738_create_web_search_cache`.

## Important Notes

- Always test migrations locally before running in production
- Migrations should be run in order (by timestamp)
- The `web_search_cache` table is missing and needs a migration
- Total migrations: 35 files covering all major features
- Latest migration: July 14, 2025