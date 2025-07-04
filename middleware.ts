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
  const userType = sessionClaims?.metadata?.userType
  const userRole = sessionClaims?.metadata?.role

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
