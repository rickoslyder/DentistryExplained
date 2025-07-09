import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Routes accessible to everyone (logged in or not)
const isPublicRoute = createRouteMatcher([
  "/",
  "/topics",
  "/topics/(.*)",
  "/conditions",
  "/dental-problems/(.*)",
  "/treatments/(.*)",
  "/prevention/(.*)",
  "/oral-surgery/(.*)",
  "/cosmetic-dentistry/(.*)",
  "/pediatric-dentistry/(.*)",
  "/find-dentist",
  "/find-dentist/(.*)",
  "/emergency",
  "/glossary",
  "/search",
  "/about",
  "/contact",
  "/faq",
  "/support",
  "/privacy",
  "/terms",
  "/cookies",
  "/consent-forms",
  "/categories/(.*)",
  "/professional", // Marketing page for professional features
  "/api/search",
  "/api/search/(.*)",
  "/api/glossary/(.*)",
  "/api/categories",
  "/api/chat",
  "/api/chat/(.*)",
  "/api/articles/(.*)/views",
  "/api/article-views",
  "/api/webhooks/(.*)",
  "/api/auth/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/access-denied",
  "/professional/upgrade",
  // Test routes during development
  "/test-(.*)",
  // Dynamic routes for articles
  "/(.*)/(.*)$", // This allows [category]/[slug] pages
])

// Routes that require professional verification
const isProfessionalOnlyRoute = createRouteMatcher([
  "/professional/practice",
  "/professional/verify",
  "/professional/resources",
  "/professional/resources/(.*)",
  "/professional/dashboard",
])

// Routes that require admin or editor role
const isAdminRoute = createRouteMatcher([
  "/admin",
  "/admin/(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId, sessionClaims, sessionId } = await auth()
    
    // Skip middleware for Clerk auth endpoints to avoid CORS issues
    const pathname = req.nextUrl.pathname
    if (pathname.includes('clerk.accounts.dev') || 
        pathname.includes('__clerk') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/clerk/')) {
      return
    }
  
  // For now, we'll skip the admin route check in middleware and rely on the layout check
  // This is because sessionClaims doesn't include publicMetadata and currentUser() isn't available in middleware
  
  // Debug logging
  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log('[Middleware Debug] Admin route accessed, userId:', userId)
    console.log('[Middleware Debug] sessionId:', sessionId)
    console.log('[Middleware Debug] Skipping middleware check, will rely on layout check')
  }

  // API routes handle their own authentication
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return
  }

  // Handle RSC requests (React Server Components) differently
  const isRSCRequest = req.headers.get('RSC') === '1' || req.nextUrl.searchParams.has('_rsc')
  
  // Protect non-public routes - require authentication
  if (!isPublicRoute(req)) {
    if (!userId) {
      // For RSC requests, return 401 instead of redirecting to avoid CORS issues
      if (isRSCRequest) {
        return new Response('Unauthorized', { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
          }
        })
      }
      // For regular requests, redirect to sign-in with proper origin
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return Response.redirect(signInUrl)
    }
  }

  // Check professional-only routes
  // NOTE: We can't check userType from publicMetadata in middleware, so these checks are disabled
  // The actual authorization happens in the page layouts
  /*
  if (isProfessionalOnlyRoute(req)) {
    if (!userId) {
      return Response.redirect(new URL("/sign-in?redirect_url=" + encodeURIComponent(req.url), req.url))
    }
  }
  */

  // Check admin routes - only check if user is logged in
  if (isAdminRoute(req)) {
    if (!userId) {
      // For RSC requests, return 401 instead of redirecting
      if (isRSCRequest) {
        return new Response('Unauthorized', { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
          }
        })
      }
      // For regular requests, redirect to sign-in
      return Response.redirect(new URL("/sign-in", req.url))
    }
    // The actual admin check happens in the admin layout
  }
  } catch (error) {
    console.error('[Middleware Error]:', error)
    // If there's an error with auth, treat as unauthenticated
    const pathname = req.nextUrl.pathname
    
    // Allow public routes even if auth fails
    if (isPublicRoute(req)) {
      return
    }
    
    // For protected routes, redirect to sign-in
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return Response.redirect(signInUrl)
  }
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
