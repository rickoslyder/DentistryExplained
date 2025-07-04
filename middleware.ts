import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/topics",
  "/topics/(.*)",
  "/dental-problems/(.*)",
  "/treatments/(.*)",
  "/prevention/(.*)",
  "/oral-surgery/(.*)",
  "/cosmetic-dentistry/(.*)",
  "/pediatric-dentistry/(.*)",
  "/find-dentist",
  "/emergency",
  "/glossary",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/api/search",
  "/api/search/(.*)",
  "/api/chat",
  "/api/chat/(.*)",
  "/api/webhooks/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
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
