# Routes Documentation

**Last Updated**: July 4, 2025

This document outlines all routes in the Dentistry Explained application, their access levels, and intended purposes.

## Implementation Status
✅ = Implemented and working  
⚠️ = Partially implemented or needs work  
❌ = Documented but not yet built

## Route Access Levels

- **Public**: Accessible to everyone (logged in or not)
- **Authenticated**: Requires user to be logged in
- **Professional**: Requires professional account verification
- **Admin**: Requires admin or editor role

## Public Routes

### Content Pages
- ✅ `/` - Homepage
- ✅ `/topics` - All dental topics overview
- ❌ `/topics/*` - Individual topic pages (use categories instead)
- ✅ `/categories/[slug]` - Category listing pages
- ✅ `/dental-problems` - Problems overview
- ✅ `/dental-problems/gum-disease` - Specific problem
- ✅ `/dental-problems/tooth-decay` - Specific problem
- ✅ `/treatments` - Treatments overview
- ✅ `/treatments/dental-implants` - Specific treatment
- ✅ `/treatments/dental-fillings` - Specific treatment
- ✅ `/prevention` - Prevention overview
- ✅ `/prevention/daily-oral-hygiene` - Specific guide
- ❌ `/oral-surgery/*` - Not implemented
- ❌ `/cosmetic-dentistry/*` - Not implemented
- ❌ `/pediatric-dentistry/*` - Not implemented
- ✅ `/[category]/[slug]` - Dynamic article routing
- ✅ `/conditions` - Conditions overview

### Utility Pages
- ✅ `/resources` - Resources hub for all utility pages
- ✅ `/search` - Search functionality
- ✅ `/glossary` - Dental terms glossary
- ✅ `/emergency` - Emergency dental guide
- ✅ `/find-dentist` - Find dentist directory
- ✅ `/find-dentist/[id]` - Individual dentist profiles

### Informational Pages
- ✅ `/about` - About the platform
- ✅ `/contact` - Contact information
- ✅ `/faq` - Frequently asked questions
- ✅ `/support` - Support center
- ✅ `/privacy` - Privacy policy
- ✅ `/terms` - Terms of service
- ✅ `/cookies` - Cookie policy
- ✅ `/consent-forms` - Public consent forms library (view only)

### Marketing Pages
- ✅ `/professional` - Professional features overview (marketing)
- ✅ `/professional/upgrade` - Upgrade to professional account

### Authentication Pages
- ✅ `/sign-in/[[...sign-in]]` - Clerk sign in
- ✅ `/sign-up/[[...sign-up]]` - Clerk sign up
- ✅ `/access-denied` - Access denied explanation

### API Routes (Public)
- ✅ `/api/search` - Search API
- ⚠️ `/api/glossary/*` - Glossary API (basic implementation)
- ⚠️ `/api/categories` - Categories API (basic implementation)
- ✅ `/api/chat` - AI chat API (requires auth for persistence)
- ⚠️ `/api/articles/*/views` - Article view tracking
- ✅ `/api/webhooks/clerk` - Clerk webhook

## Authenticated Routes

### User Dashboard
- ✅ `/dashboard` - User dashboard (redirects based on user type)
- ✅ `/dashboard/settings` - Account settings
- ✅ `/onboarding` - New user onboarding flow

### User Features
- ❌ `/bookmarks` - Integrated into dashboard instead
- ❌ `/reading-history` - Integrated into dashboard instead

## Professional-Only Routes

### Verification
- ✅ `/professional/verify` - GDC verification process
- ✅ `/professional/dashboard` - Professional dashboard

### Professional Resources
- ✅ `/professional/consent-forms` - Downloadable consent forms
- ✅ `/professional/patient-materials` - Patient education downloads
- ✅ `/professional/practice` - Practice listing management
- ✅ `/professional/resources` - Resources hub
- ✅ `/professional/resources/consent-forms` - Nested consent forms
- ✅ `/professional/resources/patient-education` - Nested patient education

### API Routes (Professional)
- ✅ `/api/professional/verification` - Verification API
- ✅ `/api/professional/verification/upload` - Document upload
- ⚠️ `/api/professional/materials/*` - Material downloads (no real files)

## Admin/Editor Routes

### Admin Dashboard
- ✅ `/admin` - Admin dashboard
- ✅ `/admin/articles` - Article management
- ✅ `/admin/articles/new` - Create new article
- ❌ `/admin/articles/[id]/edit` - Edit article (not implemented)
- ❌ `/admin/categories` - Category management (not implemented)
- ❌ `/admin/users` - User management (not implemented)
- ✅ `/admin/verifications` - Professional verification reviews
- ❌ `/admin/analytics` - Platform analytics (not implemented)

### Admin API Routes
- ✅ `/api/admin/*` - Admin API endpoints (basic implementation)

## Route Behaviors

### Redirect Logic

1. **Unauthenticated users accessing protected routes**:
   - Redirected to `/sign-in` with `redirect_url` parameter

2. **Patients accessing professional routes**:
   - Redirected to `/professional/upgrade` with `from` parameter
   - Shows explanation and upgrade options

3. **Non-admin users accessing admin routes**:
   - Redirected to `/access-denied`
   - Shows clear explanation of access requirements

4. **Authenticated users accessing public marketing pages**:
   - No redirect, can still view marketing content
   - May show different CTAs based on user type

### Special Cases

1. **Professional Page (`/professional`)**:
   - Public for all users (marketing purposes)
   - Shows different content/CTAs based on user type
   - Patients see upgrade options
   - Professionals see access buttons

2. **Consent Forms**:
   - `/consent-forms` - Public viewing (no downloads)
   - `/professional/consent-forms` - Professional downloads

3. **Dashboard**:
   - Shows different content based on user type
   - Patients see reading history and bookmarks
   - Professionals see additional professional tools tab

## User Type Detection

User type is stored in Clerk metadata:
```javascript
sessionClaims?.metadata?.userType // "patient" | "professional"
sessionClaims?.metadata?.role // "admin" | "editor" | null
```

## Development/Test Routes

- ✅ `/test-chat` - AI chat testing interface

## Future Considerations

1. **API Rate Limiting**: Different limits for different user types
2. **Content Gating**: Some articles may require professional access
3. **Subscription Tiers**: May add paid tiers with different access levels
4. **Regional Restrictions**: May add location-based access control

## Routes Summary (July 2025)

- **Total Documented Routes**: ~60
- **Actually Implemented**: ~45 (75%)
- **Partially Implemented**: ~5 (8%)
- **Not Yet Built**: ~10 (17%)

The core routing infrastructure is complete with most essential pages implemented. Missing routes are primarily advanced admin features and additional content categories that can be added as content is created.