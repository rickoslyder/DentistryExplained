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
  "/about",
  "/privacy",
  "/terms",
  "/api/webhooks/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
])

const isProfessionalRoute = createRouteMatcher(["/professional(.*)"])

export default clerkMiddleware((auth, req) => {
  // Protect non-public routes
  if (!isPublicRoute(req)) {
    auth().protect()
  }

  // Check professional routes
  if (isProfessionalRoute(req)) {
    const { sessionClaims } = auth()
    const userType = sessionClaims?.metadata?.userType

    if (userType !== "professional") {
      return Response.redirect(new URL("/dashboard", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
