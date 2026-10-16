import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;
    const roles = token?.roles as string[] | undefined;

    // Allow the exact /admin route to pass through (it is the Admin login page)
    if (pathname === "/admin") {
      return NextResponse.next();
    }

    // Check Admin routes (e.g. /admin/dashboard)
    if (pathname.startsWith("/admin/") && !roles?.includes("ADMIN")) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // Check Editor routes
    if (pathname.startsWith("/editor") && !roles?.some(r => ["ADMIN", "EDITOR", "SECTION_EDITOR"].includes(r))) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // Check Author routes
    if (pathname.startsWith("/author") && !roles?.includes("AUTHOR")) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // Check Reviewer routes
    if (pathname.startsWith("/reviewer") && !roles?.includes("REVIEWER")) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // Check Production Editor routes
    if (pathname.startsWith("/production") && !roles?.some(r => ["ADMIN", "PRODUCTION_EDITOR"].includes(r))) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // If all checks pass, it's an authorized route.
    const isRsc = req.headers.get("rsc") === "1" || req.nextUrl.searchParams.has("_rsc");
    const response = NextResponse.next();

    // Only apply strict no-cache headers to full document navigations (for bfcache back-button security after logout).
    // Do not attach no-store to Next.js RSC payloads so router cache and prefetching can function smoothly.
    if (!isRsc) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/dashboard/:path*", 
    "/author/:path*", 
    "/editor/:path*", 
    "/reviewer/:path*", 
    "/copyeditor/:path*", 
    "/production/:path*"
  ],
};
