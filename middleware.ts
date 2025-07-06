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
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/access-denied",
  "/professional/upgrade",
  // Dynamic routes for articles
  "/(.*)/(.*)$", // This allows [category]/[slug] pages
])

// Routes that require professional verification
const isProfessionalOnlyRoute = createRouteMatcher([
  "/professional/consent-forms",
  "/professional/patient-materials",
  "/professional/practice",
  "/professional/verify",
])

// Routes that require admin or editor role
const isAdminRoute = createRouteMatcher([
  "/admin",
  "/admin/(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  
  // Debug logging for admin access
  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log('[Middleware Debug] Admin route accessed:', req.nextUrl.pathname)
    console.log('[Middleware Debug] userId:', userId)
    console.log('[Middleware Debug] Full sessionClaims:', JSON.stringify(sessionClaims, null, 2))
    console.log('[Middleware Debug] sessionClaims keys:', sessionClaims ? Object.keys(sessionClaims) : 'null')
    console.log('[Middleware Debug] metadata:', sessionClaims?.metadata)
  }
  
  const userType = sessionClaims?.metadata?.userType
  const userRole = sessionClaims?.metadata?.role
  
  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log('[Middleware Debug] Extracted userType:', userType)
    console.log('[Middleware Debug] Extracted userRole:', userRole)
  }

  // API routes handle their own authentication
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return
  }

  // Protect non-public routes - require authentication
  if (!isPublicRoute(req)) {
    if (!userId) {
      await auth.protect()
    }
  }

  // Check professional-only routes
  if (isProfessionalOnlyRoute(req)) {
    if (!userId) {
      return Response.redirect(new URL("/sign-in?redirect_url=" + encodeURIComponent(req.url), req.url))
    }
    
    if (userType !== "professional") {
      return Response.redirect(new URL("/professional/upgrade?from=" + encodeURIComponent(req.url), req.url))
    }
  }

  // Check admin routes
  if (isAdminRoute(req)) {
    console.log('[Middleware Debug] isAdminRoute check triggered')
    
    if (!userId) {
      console.log('[Middleware Debug] No userId, redirecting to sign-in')
      return Response.redirect(new URL("/sign-in", req.url))
    }
    
    const adminCheckFailed = userType !== "professional" || !["admin", "editor"].includes(userRole || "")
    console.log('[Middleware Debug] Admin check failed?', adminCheckFailed)
    console.log('[Middleware Debug] userType === "professional"?', userType === "professional")
    console.log('[Middleware Debug] role is admin or editor?', ["admin", "editor"].includes(userRole || ""))
    
    if (adminCheckFailed) {
      console.log('[Middleware Debug] Redirecting to access-denied')
      return Response.redirect(new URL("/access-denied", req.url))
    }
    
    console.log('[Middleware Debug] Admin access granted, proceeding')
  }
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
