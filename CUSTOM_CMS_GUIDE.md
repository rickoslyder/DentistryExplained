# Custom CMS Guide - Dentistry Explained

**Last Updated**: July 6, 2025

This guide documents the custom-built content management system for Dentistry Explained, including its features, architecture, and enhancement roadmap.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Current Features](#current-features)
- [Admin Panel Guide](#admin-panel-guide)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Security & Permissions](#security--permissions)
- [Missing Features & Roadmap](#missing-features--roadmap)
- [Recommended Enhancements](#recommended-enhancements)

## Overview

The Dentistry Explained custom CMS is a purpose-built content management system designed specifically for dental educational content. It integrates seamlessly with Clerk authentication, uses MDX for rich content authoring, and provides role-based access control through Supabase RLS policies.

### Key Advantages
- **Tailored to project needs** - No unnecessary complexity from generic CMS features
- **Integrated authentication** - Works seamlessly with Clerk user management
- **MDX support** - Rich content with React components
- **Type-safe** - Full TypeScript support throughout
- **Performance optimized** - Direct database queries without middleware

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Admin Panel   │────▶│   API Routes    │────▶│    Supabase     │
│   (/admin/*)    │     │   (Next.js)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                        │
         └──────────────────────┴────────────────────────┘
                         Protected by
                     Clerk Auth & RLS
```

## Current Features

### 1. Article Management
- **Full CRUD Operations**
  - Create, read, update, delete articles
  - Rich MDX editor for content
  - Live preview capability
  
- **Article Metadata**
  - SEO title, description, keywords
  - Featured image URL
  - Author attribution
  - Publication date
  - Read time calculation
  
- **Content Organization**
  - Categories with hierarchical structure
  - Tags for cross-categorization
  - Related articles linking
  - Article ordering

- **Workflow States**
  - Draft - Work in progress
  - Published - Live on site
  - Archived - Hidden from public

### 2. User Management
- **Role-Based Access Control**
  - Admin - Full system access
  - Editor - Content management
  - Author - Own content only
  - Member - Read-only access
  
- **Clerk Integration**
  - Automatic profile sync
  - JWT-based authentication
  - Metadata for roles

### 3. Content Features
- **MDX Support**
  - Rich text with React components
  - Code syntax highlighting
  - Custom components (callouts, FAQs, etc.)
  
- **SEO Optimization**
  - Meta tag management
  - Structured data support
  - URL slug generation
  
- **Media Handling**
  - Image URL storage
  - Alt text management
  - Caption support

### 4. Admin Dashboard
- **Statistics Overview**
  - Total articles, views, users
  - Category distribution
  - Recent activity
  
- **Quick Actions**
  - Create new article
  - View pending reviews
  - Access user management

### 5. Professional Features
- **Verification System**
  - GDC number validation (mock)
  - Document upload support
  - Approval workflow
  
- **Resource Management**
  - Consent forms
  - Patient materials
  - Professional-only content

### 6. Search & Discovery
- **Full-Text Search**
  - PostgreSQL tsvector
  - Weighted results
  - Search suggestions
  
- **Trending Content**
  - View analytics
  - Popular searches
  - Related content

### 7. Glossary System
- **Term Management**
  - 97 dental terms
  - Categories and tags
  - Pronunciations
  
- **User Interactions**
  - View tracking
  - Copy tracking
  - Quiz results
  
- **AI Integration**
  - Term generation
  - Definition suggestions

## Admin Panel Guide

### Accessing the Admin Panel
Navigate to `/admin` - requires admin or editor role.

### Main Sections

#### Articles (`/admin/articles`)
- View all articles with filters
- Create new articles
- Edit existing content
- Manage publication status

#### Glossary (`/admin/glossary`)
- Manage dental terms
- View interaction analytics
- Generate new terms with AI

#### Verifications (`/admin/verifications`)
- Review professional applications
- Approve/reject verifications
- View uploaded documents

### Common Tasks

#### Creating an Article
1. Navigate to `/admin/articles/new`
2. Fill in metadata (title, description, category)
3. Write content in MDX format
4. Preview the article
5. Save as draft or publish

#### Managing Categories
Categories are managed through the database directly. Each category has:
- Name and slug
- Parent category (optional)
- Description
- Display order

## Database Schema

### Core Tables

#### `articles`
- `id` - UUID primary key
- `title` - Article title
- `slug` - URL-friendly identifier
- `content` - MDX content
- `excerpt` - Short description
- `status` - draft/published/archived
- `author_id` - References profiles
- `category_id` - References categories
- `featured_image` - Image URL
- `seo_title` - SEO meta title
- `seo_description` - SEO meta description
- `keywords` - Array of keywords
- `reading_time` - Calculated minutes
- `published_at` - Publication timestamp
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

#### `categories`
- `id` - UUID primary key
- `name` - Display name
- `slug` - URL-friendly identifier
- `description` - Category description
- `parent_id` - Self-reference for hierarchy
- `display_order` - Sorting order

#### `profiles`
- `id` - UUID (matches Clerk user ID)
- `email` - User email
- `first_name` - Given name
- `last_name` - Family name
- `role` - admin/editor/author/member
- `user_type` - patient/professional
- `avatar_url` - Profile picture

#### `article_revisions`
- Tracks all changes to articles
- Enables version history
- Stores content diffs

## API Endpoints

### Admin API Routes

#### Articles
- `GET /api/admin/articles` - List all articles
- `POST /api/admin/articles` - Create article
- `PUT /api/admin/articles/[id]` - Update article
- `DELETE /api/admin/articles/[id]` - Delete article

#### Glossary
- `GET /api/admin/glossary` - List terms
- `POST /api/admin/glossary` - Create term
- `PUT /api/admin/glossary/[id]` - Update term
- `DELETE /api/admin/glossary/[id]` - Delete term

#### Verifications
- `GET /api/admin/verifications` - List applications
- `POST /api/admin/verifications/[id]/review` - Approve/reject

### Public API Routes
- `GET /api/articles` - Published articles
- `GET /api/categories` - All categories
- `GET /api/search` - Search content
- `GET /api/glossary` - Public terms

## Security & Permissions

### Row Level Security (RLS)
All database access is protected by Supabase RLS policies:

```sql
-- Example: Only admins and editors can modify articles
CREATE POLICY "Admins and editors can modify articles"
ON articles FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'editor')
  )
);
```

### Authentication Flow
1. User signs in via Clerk
2. Clerk webhook syncs to Supabase
3. JWT token includes user metadata
4. RLS policies check permissions

## Missing Features & Roadmap

### High Priority
1. **Media Management**
   - No dedicated media library
   - No image optimization
   - No CDN integration

2. **Content Workflow**
   - No scheduled publishing
   - No approval workflow
   - No draft preview links

3. **Auto-save**
   - Content can be lost if not manually saved
   - No recovery for abandoned edits

### Medium Priority
4. **Advanced SEO**
   - No automatic sitemap
   - No structured data
   - No redirect management

5. **Analytics Dashboard**
   - Limited to basic view counts
   - No content performance metrics
   - No user behavior insights

6. **Bulk Operations**
   - No bulk publish/unpublish
   - No bulk category changes
   - No content import/export

### Low Priority
7. **Content Templates**
   - No reusable templates
   - Manual formatting required

8. **API Development**
   - No public API for integrations
   - No webhook system

## Recommended Enhancements

### Phase 1: Quick Wins (1-2 weeks)
1. **Implement Auto-save**
   ```bash
   npm install react-autosave
   ```
   - Add to article editor
   - 2-second debounce
   - Local storage backup

2. **Add Media Upload**
   ```bash
   npm install next-cloudinary
   ```
   - Cloudinary integration
   - Drag-and-drop upload
   - Automatic optimization

3. **SEO Improvements**
   ```bash
   npm install next-seo next-sitemap
   ```
   - Automatic sitemap generation
   - Structured data support
   - Meta tag management

### Phase 2: Core Features (2-3 weeks)
4. **Scheduled Publishing**
   - Add `scheduled_for` field
   - Cron job to publish
   - Calendar view

5. **Content Templates**
   - Template storage system
   - Quick-start options
   - Custom components

6. **Enhanced Editor**
   - Better MDX preview
   - Component picker
   - Formatting toolbar

### Phase 3: Advanced Features (3-4 weeks)
7. **Approval Workflow**
   - Submission queue
   - Review assignments
   - Email notifications

8. **Analytics Integration**
   - GA4 data import
   - Performance dashboards
   - Content insights

9. **API Development**
   - RESTful endpoints
   - GraphQL option
   - Webhook system

## Development Guidelines

### Adding New Features
1. Check existing patterns in `/app/admin`
2. Use server actions for data mutations
3. Implement proper error handling
4. Add loading states
5. Update TypeScript types

### Testing
```bash
# Run type checking
npm run build

# Test admin routes
npm run dev
# Navigate to /admin
```

### Common Patterns

#### Server Actions
```typescript
'use server'

export async function updateArticle(id: string, data: ArticleUpdate) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('articles')
    .update(data)
    .eq('id', id)
    
  if (error) throw error
  revalidatePath('/admin/articles')
}
```

#### Data Fetching
```typescript
async function getArticles() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('articles')
    .select('*, category:categories(*), author:profiles(*)')
    .order('created_at', { ascending: false })
    
  if (error) throw error
  return data
}
```

## Conclusion

The custom CMS provides a solid foundation for content management with room for growth. By focusing on the recommended enhancements, particularly media management and auto-save functionality, the system can match or exceed the capabilities of off-the-shelf solutions while maintaining its tailored approach to dental education content.