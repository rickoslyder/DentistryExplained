import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

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
  // Dynamic routes for articles
  "/(.*)/(.*)$", // This allows [category]/[slug] pages
])

const isProfessionalRoute = createRouteMatcher(["/professional(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Check professional routes
  if (isProfessionalRoute(req)) {
    const { sessionClaims } = await auth()
    const userType = sessionClaims?.metadata?.userType

    if (userType !== "professional") {
      return Response.redirect(new URL("/dashboard", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
