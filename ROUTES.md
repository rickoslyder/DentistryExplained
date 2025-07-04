# Routes Documentation

This document outlines all routes in the Dentistry Explained application, their access levels, and intended purposes.

## Route Access Levels

- **Public**: Accessible to everyone (logged in or not)
- **Authenticated**: Requires user to be logged in
- **Professional**: Requires professional account verification
- **Admin**: Requires admin or editor role

## Public Routes

### Content Pages
- `/` - Homepage
- `/topics` - All dental topics overview
- `/topics/*` - Individual topic pages
- `/categories/*` - Category listings
- `/dental-problems/*` - Dental problem articles
- `/treatments/*` - Treatment guides
- `/prevention/*` - Prevention articles
- `/oral-surgery/*` - Oral surgery content
- `/cosmetic-dentistry/*` - Cosmetic procedures
- `/pediatric-dentistry/*` - Children's dentistry
- `/[category]/[slug]` - Individual article pages

### Utility Pages
- `/search` - Search functionality
- `/glossary` - Dental terms glossary
- `/emergency` - Emergency dental guide
- `/find-dentist` - Find dentist directory
- `/find-dentist/[id]` - Individual dentist profiles

### Informational Pages
- `/about` - About the platform
- `/contact` - Contact information
- `/faq` - Frequently asked questions
- `/support` - Support center
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/cookies` - Cookie policy
- `/consent-forms` - Public consent forms library (view only)

### Marketing Pages
- `/professional` - Professional features overview (marketing)
- `/professional/upgrade` - Upgrade to professional account

### Authentication Pages
- `/sign-in` - User login
- `/sign-up` - User registration
- `/access-denied` - Access denied explanation

### API Routes (Public)
- `/api/search` - Search API
- `/api/glossary/*` - Glossary API
- `/api/categories` - Categories API
- `/api/chat` - AI chat API (requires auth for persistence)
- `/api/articles/*/views` - Article view tracking
- `/api/webhooks/*` - External webhooks

## Authenticated Routes

### User Dashboard
- `/dashboard` - User dashboard (redirects based on user type)
- `/dashboard/settings` - Account settings
- `/onboarding` - New user onboarding flow

### User Features
- `/bookmarks` - Saved articles (if separate from dashboard)
- `/reading-history` - User's reading history

## Professional-Only Routes

### Verification
- `/professional/verify` - GDC verification process

### Professional Resources
- `/professional/consent-forms` - Downloadable consent forms
- `/professional/patient-materials` - Patient education downloads
- `/professional/practice` - Practice listing management

### API Routes (Professional)
- `/api/professional/verification` - Verification API
- `/api/professional/verification/upload` - Document upload
- `/api/professional/materials/*` - Material downloads

## Admin/Editor Routes

### Admin Dashboard
- `/admin` - Admin dashboard
- `/admin/articles` - Article management
- `/admin/articles/new` - Create new article
- `/admin/articles/[id]/edit` - Edit article
- `/admin/categories` - Category management
- `/admin/users` - User management
- `/admin/verifications` - Professional verification reviews
- `/admin/analytics` - Platform analytics

### Admin API Routes
- `/api/admin/*` - All admin API endpoints

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

## Future Considerations

1. **API Rate Limiting**: Different limits for different user types
2. **Content Gating**: Some articles may require professional access
3. **Subscription Tiers**: May add paid tiers with different access levels
4. **Regional Restrictions**: May add location-based access control