import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public: marketing pages, the free quiz and film funnels (both gate inline
// with sign-up), and incoming webhooks. Everything else requires a session.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/program(.*)",
  "/build(.*)",
  "/film(.*)",
  "/profile(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk auto-proxy path
    "/__clerk/:path*",
  ],
};
