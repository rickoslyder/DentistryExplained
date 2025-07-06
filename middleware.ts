import { clerkMiddleware, createRouteMatcher, currentUser } from "@clerk/nextjs/server"

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
  
  // Get the current user to access publicMetadata
  const user = userId ? await currentUser() : null
  const userType = user?.publicMetadata?.userType as string | undefined
  const userRole = user?.publicMetadata?.role as string | undefined
  
  // Debug logging for admin access
  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log('[Middleware Debug] Admin route accessed:', req.nextUrl.pathname)
    console.log('[Middleware Debug] userId:', userId)
    console.log('[Middleware Debug] publicMetadata:', user?.publicMetadata)
    console.log('[Middleware Debug] userType from publicMetadata:', userType)
    console.log('[Middleware Debug] userRole from publicMetadata:', userRole)
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
    if (!userId) {
      return Response.redirect(new URL("/sign-in", req.url))
    }
    
    if (userType !== "professional" || !["admin", "editor"].includes(userRole || "")) {
      return Response.redirect(new URL("/access-denied", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
